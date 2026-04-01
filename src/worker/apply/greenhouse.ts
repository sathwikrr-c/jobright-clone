import { Page } from 'playwright-core';
import { Job, Profile } from '@/types';
import { generateFormAnswer } from '@/lib/claude';
import { createStealthBrowser } from '../utils/stealth';
import { humanType, humanClick, humanWait, humanScroll } from '../utils/human-like';
import { fillField, uploadFile, findFieldByLabel, selectOption } from '../utils/form-filler';
import { takeScreenshot } from '../utils/screenshot';
import { saveCookies } from '../utils/cookies';
import { detectCaptcha, solveCaptcha } from '../utils/captcha';

export interface ApplyResult {
  success: boolean;
  screenshotPath?: string;
  error?: string;
}

export async function applyGreenhouse(
  job: Job,
  profile: Profile,
  portalUrl: string
): Promise<ApplyResult> {
  const { browser, context, page } = await createStealthBrowser('greenhouse.io');

  try {
    console.log(`[Greenhouse] Navigating to ${portalUrl}`);
    await page.goto(portalUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await humanWait(2000, 4000);

    // Check if we're on the right page
    const applyButton = await page.$('#submit_app, button[type="submit"], input[type="submit"]');
    if (!applyButton) {
      // Might need to click an "Apply" button first
      const applyLink = await page.$('a[href*="apply"], button:has-text("Apply")');
      if (applyLink) {
        await humanClick(page, 'a[href*="apply"], button:has-text("Apply")');
        await humanWait(2000, 3000);
      }
    }

    // Fill in standard fields
    await fillStandardFields(page, profile);

    // Upload resume
    await uploadResume(page, profile);

    // Handle custom questions
    await handleCustomQuestions(page, job, profile);

    // Check for CAPTCHA
    const captchaType = await detectCaptcha(page);
    if (captchaType) {
      console.log(`[Greenhouse] CAPTCHA detected: ${captchaType}`);
      const solved = await solveCaptcha(page, captchaType);
      if (!solved) {
        const screenshotPath = await takeScreenshot(page, job.id);
        return { success: false, screenshotPath, error: 'CAPTCHA solving failed' };
      }
    }

    // Take pre-submit screenshot
    await humanScroll(page, -500);
    const preSubmitScreenshot = await takeScreenshot(page, `${job.id}-pre-submit`);
    console.log(`[Greenhouse] Pre-submit screenshot: ${preSubmitScreenshot}`);

    // Submit the form
    const submitSelector = '#submit_app, button[type="submit"], input[type="submit"]';
    await humanClick(page, submitSelector);
    await humanWait(3000, 5000);

    // Check for success
    const success = await checkSubmissionSuccess(page);
    const screenshotPath = await takeScreenshot(page, job.id);

    // Save cookies for future use
    await saveCookies(context, 'greenhouse.io');

    return { success, screenshotPath };
  } catch (error) {
    const screenshotPath = await takeScreenshot(page, `${job.id}-error`);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Greenhouse] Application failed:`, errorMsg);
    return { success: false, screenshotPath, error: errorMsg };
  } finally {
    await browser.close();
  }
}

async function fillStandardFields(page: Page, profile: Profile): Promise<void> {
  const [firstName, ...lastParts] = profile.fullName.split(' ');
  const lastName = lastParts.join(' ');

  // First name
  const firstNameSelector =
    (await findFieldByLabel(page, 'first name')) ||
    '#first_name, [name="job_application[first_name]"], [autocomplete="given-name"]';
  try {
    await fillField(page, firstNameSelector, firstName);
    await humanWait(300, 600);
  } catch {
    console.warn('[Greenhouse] Could not fill first name');
  }

  // Last name
  const lastNameSelector =
    (await findFieldByLabel(page, 'last name')) ||
    '#last_name, [name="job_application[last_name]"], [autocomplete="family-name"]';
  try {
    await fillField(page, lastNameSelector, lastName);
    await humanWait(300, 600);
  } catch {
    console.warn('[Greenhouse] Could not fill last name');
  }

  // Email
  const emailSelector =
    (await findFieldByLabel(page, 'email')) ||
    '#email, [name="job_application[email]"], [type="email"]';
  try {
    await fillField(page, emailSelector, profile.email);
    await humanWait(300, 600);
  } catch {
    console.warn('[Greenhouse] Could not fill email');
  }

  // Phone
  const phoneSelector =
    (await findFieldByLabel(page, 'phone')) ||
    '#phone, [name="job_application[phone]"], [type="tel"]';
  try {
    await fillField(page, phoneSelector, profile.phone);
    await humanWait(300, 600);
  } catch {
    console.warn('[Greenhouse] Could not fill phone');
  }

  // LinkedIn URL
  const linkedinSelector = await findFieldByLabel(page, 'linkedin');
  if (linkedinSelector) {
    try {
      await fillField(page, linkedinSelector, profile.linkedinUrl);
      await humanWait(300, 600);
    } catch {
      console.warn('[Greenhouse] Could not fill LinkedIn');
    }
  }

  // Location
  const locationSelector = await findFieldByLabel(page, 'location');
  if (locationSelector) {
    try {
      await fillField(page, locationSelector, profile.location);
      await humanWait(300, 600);
    } catch {
      console.warn('[Greenhouse] Could not fill location');
    }
  }

  await humanScroll(page, 300);
}

async function uploadResume(page: Page, profile: Profile): Promise<void> {
  if (!profile.resumePdfUrl) {
    console.warn('[Greenhouse] No resume PDF available');
    return;
  }

  // Greenhouse typically uses data-field="resume" or similar
  const resumeSelectors = [
    'input[type="file"][name*="resume"]',
    'input[type="file"][data-field="resume"]',
    '#resume_input input[type="file"]',
    '.field--resume input[type="file"]',
    'input[type="file"]', // Last resort: first file input
  ];

  for (const selector of resumeSelectors) {
    try {
      const fileInput = await page.$(selector);
      if (fileInput) {
        await uploadFile(page, selector, profile.resumePdfUrl);
        await humanWait(1000, 2000);
        console.log('[Greenhouse] Resume uploaded');
        return;
      }
    } catch {
      continue;
    }
  }

  console.warn('[Greenhouse] Could not find resume upload field');
}

async function handleCustomQuestions(
  page: Page,
  job: Job,
  profile: Profile
): Promise<void> {
  // Greenhouse custom questions are typically in #custom_fields or similar
  const customFields = await page.$$('.field:not(.field--first-name):not(.field--last-name):not(.field--email):not(.field--phone):not(.field--resume)');

  for (const field of customFields) {
    try {
      const label = await field.$eval('label', (el) => el.textContent?.trim() || '').catch(() => '');
      if (!label) continue;

      const input = await field.$('input[type="text"], textarea');
      const select = await field.$('select');

      if (input) {
        const currentValue = await input.evaluate((el) => (el as HTMLInputElement).value);
        if (currentValue) continue; // Already filled

        const answer = await generateFormAnswer(
          label,
          job.description,
          profile.resumeText
        );

        if (answer) {
          const inputId = await input.evaluate((el) => el.id);
          const selector = inputId ? `#${inputId}` : `[name="${await input.evaluate((el) => el.getAttribute('name'))}"]`;
          await fillField(page, selector, answer);
          await humanWait(300, 600);
        }
      } else if (select) {
        const selectId = await select.evaluate((el) => el.id);
        if (selectId) {
          const answer = await generateFormAnswer(
            label,
            job.description,
            profile.resumeText
          );
          if (answer) {
            await selectOption(page, `#${selectId}`, answer);
            await humanWait(300, 600);
          }
        }
      }
    } catch (error) {
      console.warn('[Greenhouse] Error handling custom field:', error);
    }
  }
}

async function checkSubmissionSuccess(page: Page): Promise<boolean> {
  // Check for common Greenhouse success indicators
  const successIndicators = [
    'text=Application submitted',
    'text=Thank you for applying',
    'text=Your application has been submitted',
    'text=Thanks for applying',
    '.flash--success',
    '#application_confirmation',
  ];

  for (const indicator of successIndicators) {
    try {
      const el = await page.$(indicator);
      if (el) return true;
    } catch {
      continue;
    }
  }

  // Check if URL changed to a confirmation page
  const currentUrl = page.url();
  if (currentUrl.includes('confirmation') || currentUrl.includes('thank')) {
    return true;
  }

  return false;
}
