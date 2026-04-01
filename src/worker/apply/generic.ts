import { Page } from 'playwright-core';
import { Job, Profile } from '@/types';
import { analyzeFormFields, generateFormAnswer } from '@/lib/claude';
import { createStealthBrowser } from '../utils/stealth';
import { humanClick, humanWait, humanScroll } from '../utils/human-like';
import { fillField, uploadFile, selectOption, getFormFields } from '../utils/form-filler';
import { takeScreenshot } from '../utils/screenshot';
import { saveCookies } from '../utils/cookies';
import { detectCaptcha, solveCaptcha } from '../utils/captcha';

export interface ApplyResult {
  success: boolean;
  screenshotPath?: string;
  error?: string;
}

/**
 * Generic handler for unknown ATS types.
 * Uses Claude's analyzeFormFields() to understand the page and fill fields.
 * Always marks as needs_review since we can't guarantee correctness.
 */
export async function applyGeneric(
  job: Job,
  profile: Profile,
  portalUrl: string
): Promise<ApplyResult> {
  const domain = new URL(portalUrl).hostname;
  const { browser, context, page } = await createStealthBrowser(domain);

  try {
    console.log(`[Generic] Navigating to ${portalUrl}`);
    await page.goto(portalUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await humanWait(2000, 4000);

    // Get the page HTML for Claude analysis
    const pageHtml = await page.content();

    // Use Claude to analyze the form fields
    const analyzedFields = await analyzeFormFields(pageHtml);
    console.log(`[Generic] Claude identified ${analyzedFields.length} form fields`);

    // Also get form fields via our own extraction
    const extractedFields = await getFormFields(page);
    console.log(`[Generic] Extracted ${extractedFields.length} visible form fields`);

    // Build a profile value map for common field types
    const [firstName, ...lastParts] = profile.fullName.split(' ');
    const lastName = lastParts.join(' ');

    const valueMap: Record<string, string> = {
      'first_name': firstName,
      'firstname': firstName,
      'first name': firstName,
      'given_name': firstName,
      'last_name': lastName,
      'lastname': lastName,
      'last name': lastName,
      'family_name': lastName,
      'name': profile.fullName,
      'full_name': profile.fullName,
      'fullname': profile.fullName,
      'email': profile.email,
      'email_address': profile.email,
      'phone': profile.phone,
      'phone_number': profile.phone,
      'telephone': profile.phone,
      'linkedin': profile.linkedinUrl,
      'linkedin_url': profile.linkedinUrl,
      'linkedin_profile': profile.linkedinUrl,
      'location': profile.location,
      'city': profile.location,
      'address': profile.location,
    };

    // Fill fields from Claude's analysis
    for (const field of analyzedFields) {
      try {
        if (field.fieldType === 'file') {
          if (profile.resumePdfUrl) {
            await uploadFile(page, field.selector, profile.resumePdfUrl);
            await humanWait(500, 1000);
          }
          continue;
        }

        // Determine value: check if Claude suggested one, or match from profile
        let value = field.value;
        if (!value) {
          // Try to match by selector name
          const selectorLower = field.selector.toLowerCase();
          for (const [key, val] of Object.entries(valueMap)) {
            if (selectorLower.includes(key)) {
              value = val;
              break;
            }
          }
        }

        if (!value) continue;

        if (field.fieldType === 'select') {
          await selectOption(page, field.selector, value);
        } else if (field.fieldType === 'text' || field.fieldType === 'textarea') {
          await fillField(page, field.selector, value);
        }
        await humanWait(300, 600);
      } catch (error) {
        console.warn(`[Generic] Could not fill field ${field.selector}:`, error);
      }
    }

    // Fill remaining extracted fields that weren't covered by Claude
    for (const field of extractedFields) {
      if (field.value) continue; // Already has a value

      const labelLower = field.label.toLowerCase();
      let value: string | null = null;

      // Match by label
      for (const [key, val] of Object.entries(valueMap)) {
        if (labelLower.includes(key)) {
          value = val;
          break;
        }
      }

      // For unknown required fields, use Claude to generate an answer
      if (!value && field.required) {
        value = await generateFormAnswer(
          field.label,
          job.description,
          profile.resumeText
        );
      }

      if (value) {
        try {
          if (field.type === 'select-one' || field.type === 'select') {
            await selectOption(page, field.selector, value);
          } else {
            await fillField(page, field.selector, value);
          }
          await humanWait(300, 600);
        } catch {
          console.warn(`[Generic] Could not fill extracted field: ${field.label}`);
        }
      }
    }

    // Try to find and upload resume if not done yet
    if (profile.resumePdfUrl) {
      const fileInputs = await page.$$('input[type="file"]');
      for (const input of fileInputs) {
        try {
          const hasFile = await input.evaluate((el: Element) => (el as HTMLInputElement).files?.length || 0);
          if (hasFile === 0) {
            await input.setInputFiles(profile.resumePdfUrl);
            await humanWait(500, 1000);
            break;
          }
        } catch {
          continue;
        }
      }
    }

    // Handle CAPTCHA
    const captchaType = await detectCaptcha(page);
    if (captchaType) {
      console.log(`[Generic] CAPTCHA detected: ${captchaType}`);
      const solved = await solveCaptcha(page, captchaType);
      if (!solved) {
        const screenshotPath = await takeScreenshot(page, job.id);
        return { success: false, screenshotPath, error: 'CAPTCHA solving failed' };
      }
    }

    // Take pre-submit screenshot
    await humanScroll(page, -500);
    const preSubmitScreenshot = await takeScreenshot(page, `${job.id}-pre-submit`);
    console.log(`[Generic] Pre-submit screenshot: ${preSubmitScreenshot}`);

    // Try to submit
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Submit")',
      'button:has-text("Apply")',
      'button:has-text("Send Application")',
    ];

    let submitted = false;
    for (const selector of submitSelectors) {
      try {
        const el = await page.$(selector);
        if (el) {
          await humanClick(page, selector);
          submitted = true;
          await humanWait(3000, 5000);
          break;
        }
      } catch {
        continue;
      }
    }

    const screenshotPath = await takeScreenshot(page, job.id);
    await saveCookies(context, domain);

    if (!submitted) {
      return {
        success: false,
        screenshotPath,
        error: 'Could not find submit button - marked as needs_review',
      };
    }

    // Generic handler always returns needs_review-ish result
    // The caller will set status to needs_review
    return { success: true, screenshotPath };
  } catch (error) {
    const screenshotPath = await takeScreenshot(page, `${job.id}-error`);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Generic] Application failed:`, errorMsg);
    return { success: false, screenshotPath, error: errorMsg };
  } finally {
    await browser.close();
  }
}
