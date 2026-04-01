import { Page } from 'playwright-core';
import { Job, Profile } from '@/types';
import { generateFormAnswer } from '@/lib/claude';
import { createStealthBrowser } from '../utils/stealth';
import { humanClick, humanWait, humanScroll } from '../utils/human-like';
import { fillField, uploadFile, findFieldByLabel, selectOption } from '../utils/form-filler';
import { takeScreenshot } from '../utils/screenshot';
import { saveCookies } from '../utils/cookies';
import { detectCaptcha, solveCaptcha } from '../utils/captcha';

export interface ApplyResult {
  success: boolean;
  screenshotPath?: string;
  error?: string;
}

export async function applyAshby(
  job: Job,
  profile: Profile,
  portalUrl: string
): Promise<ApplyResult> {
  const { browser, context, page } = await createStealthBrowser('ashbyhq.com');

  try {
    console.log(`[Ashby] Navigating to ${portalUrl}`);
    await page.goto(portalUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await humanWait(2000, 4000);

    // Ashby typically has a clean single-page application form
    // Check if we need to click "Apply" first
    const applyButton = await page.$('button:has-text("Apply"), a:has-text("Apply for this job")');
    if (applyButton && !page.url().includes('/application')) {
      await humanClick(page, 'button:has-text("Apply"), a:has-text("Apply for this job")');
      await humanWait(2000, 3000);
    }

    // Fill standard fields
    await fillStandardFields(page, profile);

    // Upload resume
    await uploadResume(page, profile);

    // Handle additional/custom questions
    await handleCustomQuestions(page, job, profile);

    // Handle CAPTCHA
    const captchaType = await detectCaptcha(page);
    if (captchaType) {
      console.log(`[Ashby] CAPTCHA detected: ${captchaType}`);
      const solved = await solveCaptcha(page, captchaType);
      if (!solved) {
        const screenshotPath = await takeScreenshot(page, job.id);
        return { success: false, screenshotPath, error: 'CAPTCHA solving failed' };
      }
    }

    // Pre-submit screenshot
    await humanScroll(page, -500);
    await takeScreenshot(page, `${job.id}-pre-submit`);

    // Submit
    const submitSelector =
      'button[type="submit"], button:has-text("Submit Application"), button:has-text("Submit")';
    await humanClick(page, submitSelector);
    await humanWait(3000, 5000);

    const success = await checkSubmissionSuccess(page);
    const screenshotPath = await takeScreenshot(page, job.id);

    await saveCookies(context, 'ashbyhq.com');

    return { success, screenshotPath };
  } catch (error) {
    const screenshotPath = await takeScreenshot(page, `${job.id}-error`);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Ashby] Application failed:`, errorMsg);
    return { success: false, screenshotPath, error: errorMsg };
  } finally {
    await browser.close();
  }
}

async function fillStandardFields(page: Page, profile: Profile): Promise<void> {
  const [firstName, ...lastParts] = profile.fullName.split(' ');
  const lastName = lastParts.join(' ');

  // Ashby uses clean form fields with clear labels
  const fields: Array<{ labels: string[]; value: string }> = [
    { labels: ['first name'], value: firstName },
    { labels: ['last name'], value: lastName },
    { labels: ['email'], value: profile.email },
    { labels: ['phone', 'phone number'], value: profile.phone },
    { labels: ['linkedin', 'linkedin url', 'linkedin profile'], value: profile.linkedinUrl },
    { labels: ['location', 'city', 'current location'], value: profile.location },
  ];

  for (const { labels, value } of fields) {
    let filled = false;

    for (const label of labels) {
      const selector = await findFieldByLabel(page, label);
      if (selector) {
        try {
          await fillField(page, selector, value);
          await humanWait(300, 600);
          filled = true;
          break;
        } catch {
          continue;
        }
      }
    }

    if (!filled) {
      // Try common Ashby-specific selectors
      const ashbySelectors: Record<string, string[]> = {
        'first name': ['input[name="firstName"], input[name="_systemfield_name"]'],
        'last name': ['input[name="lastName"]'],
        'email': ['input[name="email"], input[type="email"]'],
        'phone': ['input[name="phone"], input[type="tel"]'],
        'linkedin': ['input[name="linkedInUrl"], input[name*="linkedin" i]'],
      };

      const selectorList = ashbySelectors[labels[0]] || [];
      for (const sel of selectorList) {
        try {
          const el = await page.$(sel);
          if (el) {
            await fillField(page, sel, value);
            await humanWait(300, 600);
            break;
          }
        } catch {
          continue;
        }
      }
    }
  }

  await humanScroll(page, 300);
}

async function uploadResume(page: Page, profile: Profile): Promise<void> {
  if (!profile.resumePdfUrl) {
    console.warn('[Ashby] No resume PDF available');
    return;
  }

  const resumeSelectors = [
    'input[type="file"][name*="resume" i]',
    'input[type="file"][accept*="pdf"]',
    'input[type="file"]',
  ];

  for (const selector of resumeSelectors) {
    try {
      const fileInput = await page.$(selector);
      if (fileInput) {
        await uploadFile(page, selector, profile.resumePdfUrl);
        await humanWait(1000, 2000);
        console.log('[Ashby] Resume uploaded');
        return;
      }
    } catch {
      continue;
    }
  }

  // Ashby sometimes uses a drag-and-drop area with a hidden input
  const dropzone = await page.$('[data-testid="resume-dropzone"], .dropzone, [class*="upload"]');
  if (dropzone) {
    const hiddenInput = await page.$('input[type="file"]');
    if (hiddenInput) {
      await hiddenInput.setInputFiles(profile.resumePdfUrl);
      await humanWait(1000, 2000);
      console.log('[Ashby] Resume uploaded via dropzone');
      return;
    }
  }

  console.warn('[Ashby] Could not find resume upload field');
}

async function handleCustomQuestions(
  page: Page,
  job: Job,
  profile: Profile
): Promise<void> {
  // Ashby custom questions are usually in clearly labeled form groups
  const formGroups = await page.$$('.form-group, [class*="FormField"], [class*="question"]');

  for (const group of formGroups) {
    try {
      const label = await group.$eval(
        'label, [class*="label"]',
        (el) => el.textContent?.trim() || ''
      ).catch(() => '');
      if (!label) continue;

      // Skip standard fields we already filled
      const standardLabels = ['first name', 'last name', 'email', 'phone', 'resume', 'linkedin', 'location'];
      if (standardLabels.some((sl) => label.toLowerCase().includes(sl))) continue;

      const textInput = await group.$('input[type="text"], textarea');
      const selectInput = await group.$('select');
      const radioInputs = await group.$$('input[type="radio"]');
      const checkboxInputs = await group.$$('input[type="checkbox"]');

      if (textInput) {
        const currentValue = await textInput.evaluate((el) => (el as HTMLInputElement).value);
        if (currentValue) continue;

        const answer = await generateFormAnswer(label, job.description, profile.resumeText);
        if (answer) {
          await textInput.click();
          await textInput.type(answer, { delay: 80 });
          await humanWait(300, 600);
        }
      } else if (selectInput) {
        const answer = await generateFormAnswer(label, job.description, profile.resumeText);
        if (answer) {
          const selectId = await selectInput.evaluate((el) => el.id || el.getAttribute('name'));
          if (selectId) {
            await selectOption(page, selectId.startsWith('#') ? selectId : `#${selectId}`, answer);
          }
          await humanWait(300, 600);
        }
      } else if (radioInputs.length > 0) {
        const answer = await generateFormAnswer(label, job.description, profile.resumeText);
        if (answer) {
          const lowerAnswer = answer.toLowerCase();
          for (const radio of radioInputs) {
            const radioLabel = await radio.evaluate((el) => {
              const parent = el.closest('label') || el.parentElement;
              return parent?.textContent?.trim() || '';
            });
            if (radioLabel.toLowerCase().includes(lowerAnswer) || lowerAnswer.includes(radioLabel.toLowerCase())) {
              await radio.click();
              await humanWait(200, 400);
              break;
            }
          }
        }
      } else if (checkboxInputs.length > 0) {
        // For checkboxes, typically just check if required
        const isRequired = await group.$('[required], [aria-required="true"]');
        if (isRequired) {
          for (const checkbox of checkboxInputs) {
            const isChecked = await checkbox.evaluate((el) => (el as HTMLInputElement).checked);
            if (!isChecked) {
              await checkbox.click();
              await humanWait(200, 400);
            }
          }
        }
      }
    } catch (error) {
      console.warn('[Ashby] Error handling custom question:', error);
    }
  }
}

async function checkSubmissionSuccess(page: Page): Promise<boolean> {
  const successIndicators = [
    'text=Application submitted',
    'text=Thank you for applying',
    'text=Your application has been received',
    'text=Thanks for applying',
    'text=Successfully submitted',
    '[class*="success"]',
    '[class*="confirmation"]',
  ];

  for (const indicator of successIndicators) {
    try {
      const el = await page.$(indicator);
      if (el) return true;
    } catch {
      continue;
    }
  }

  const currentUrl = page.url();
  if (currentUrl.includes('confirmation') || currentUrl.includes('thank') || currentUrl.includes('success')) {
    return true;
  }

  return false;
}
