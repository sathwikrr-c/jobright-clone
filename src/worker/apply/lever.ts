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

export async function applyLever(
  job: Job,
  profile: Profile,
  portalUrl: string
): Promise<ApplyResult> {
  const { browser, context, page } = await createStealthBrowser('lever.co');

  try {
    console.log(`[Lever] Navigating to ${portalUrl}`);
    await page.goto(portalUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await humanWait(2000, 4000);

    // Lever might show a job description page first; click "Apply" if needed
    const applyButton = await page.$('.postings-btn-wrapper a, a[href*="/apply"], button:has-text("Apply")');
    if (applyButton) {
      const href = await applyButton.getAttribute('href');
      if (href && !page.url().includes('/apply')) {
        await humanClick(page, '.postings-btn-wrapper a, a[href*="/apply"], button:has-text("Apply")');
        await humanWait(2000, 3000);
      }
    }

    // Fill standard fields
    await fillStandardFields(page, profile);

    // Upload resume
    await uploadResume(page, profile);

    // Handle additional questions
    await handleAdditionalQuestions(page, job, profile);

    // Handle CAPTCHA
    const captchaType = await detectCaptcha(page);
    if (captchaType) {
      console.log(`[Lever] CAPTCHA detected: ${captchaType}`);
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
      'button[type="submit"], .template-btn-submit, input[type="submit"], button:has-text("Submit application")';
    await humanClick(page, submitSelector);
    await humanWait(3000, 5000);

    const success = await checkSubmissionSuccess(page);
    const screenshotPath = await takeScreenshot(page, job.id);

    await saveCookies(context, 'lever.co');

    return { success, screenshotPath };
  } catch (error) {
    const screenshotPath = await takeScreenshot(page, `${job.id}-error`);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Lever] Application failed:`, errorMsg);
    return { success: false, screenshotPath, error: errorMsg };
  } finally {
    await browser.close();
  }
}

async function fillStandardFields(page: Page, profile: Profile): Promise<void> {
  const [firstName, ...lastParts] = profile.fullName.split(' ');
  const lastName = lastParts.join(' ');
  const fullName = profile.fullName;

  // Lever sometimes uses a single "name" field or separate first/last
  const nameSelector = await findFieldByLabel(page, 'full name');
  const firstNameSelector = await findFieldByLabel(page, 'first name');

  if (nameSelector) {
    await fillField(page, nameSelector, fullName);
    await humanWait(300, 600);
  } else if (firstNameSelector) {
    await fillField(page, firstNameSelector, firstName);
    await humanWait(300, 600);

    const lastNameSelector = await findFieldByLabel(page, 'last name');
    if (lastNameSelector) {
      await fillField(page, lastNameSelector, lastName);
      await humanWait(300, 600);
    }
  } else {
    // Try common Lever selectors
    try {
      await fillField(page, 'input[name="name"]', fullName);
      await humanWait(300, 600);
    } catch {
      console.warn('[Lever] Could not fill name field');
    }
  }

  // Email
  const emailSelector =
    (await findFieldByLabel(page, 'email')) ||
    'input[name="email"], input[type="email"]';
  try {
    await fillField(page, emailSelector, profile.email);
    await humanWait(300, 600);
  } catch {
    console.warn('[Lever] Could not fill email');
  }

  // Phone
  const phoneSelector =
    (await findFieldByLabel(page, 'phone')) ||
    'input[name="phone"], input[type="tel"]';
  try {
    await fillField(page, phoneSelector, profile.phone);
    await humanWait(300, 600);
  } catch {
    console.warn('[Lever] Could not fill phone');
  }

  // LinkedIn (Lever often has a "urls" section)
  const linkedinSelector =
    (await findFieldByLabel(page, 'linkedin')) ||
    'input[name="urls[LinkedIn]"], input[name*="linkedin" i]';
  try {
    await fillField(page, linkedinSelector, profile.linkedinUrl);
    await humanWait(300, 600);
  } catch {
    console.warn('[Lever] Could not fill LinkedIn');
  }

  // Location / Current company / etc. (optional fields)
  const locationSelector = await findFieldByLabel(page, 'location');
  if (locationSelector) {
    try {
      await fillField(page, locationSelector, profile.location);
      await humanWait(300, 600);
    } catch {
      console.warn('[Lever] Could not fill location');
    }
  }

  await humanScroll(page, 300);
}

async function uploadResume(page: Page, profile: Profile): Promise<void> {
  if (!profile.resumePdfUrl) {
    console.warn('[Lever] No resume PDF available');
    return;
  }

  const resumeSelectors = [
    'input[type="file"][name="resume"]',
    'input[type="file"][name*="resume"]',
    '.application-upload input[type="file"]',
    '#resume-upload input[type="file"]',
    'input[type="file"]',
  ];

  for (const selector of resumeSelectors) {
    try {
      const fileInput = await page.$(selector);
      if (fileInput) {
        await uploadFile(page, selector, profile.resumePdfUrl);
        await humanWait(1000, 2000);
        console.log('[Lever] Resume uploaded');
        return;
      }
    } catch {
      continue;
    }
  }

  console.warn('[Lever] Could not find resume upload field');
}

async function handleAdditionalQuestions(
  page: Page,
  job: Job,
  profile: Profile
): Promise<void> {
  // Lever additional questions are usually in a section after the main fields
  const questionCards = await page.$$('.application-question, .additional-fields .field, .custom-question');

  for (const card of questionCards) {
    try {
      const label = await card.$eval(
        'label, .question-label, .field-label',
        (el) => el.textContent?.trim() || ''
      ).catch(() => '');
      if (!label) continue;

      const textInput = await card.$('input[type="text"], textarea');
      const selectInput = await card.$('select');

      if (textInput) {
        const currentValue = await textInput.evaluate((el) => (el as HTMLInputElement).value);
        if (currentValue) continue;

        const answer = await generateFormAnswer(label, job.description, profile.resumeText);
        if (answer) {
          const inputName = await textInput.evaluate((el) => el.getAttribute('name') || el.id);
          const selector = inputName?.startsWith('#') ? inputName : `[name="${inputName}"]`;
          try {
            await fillField(page, selector, answer);
          } catch {
            // Try direct typing as fallback
            await textInput.click();
            await textInput.type(answer, { delay: 80 });
          }
          await humanWait(300, 600);
        }
      } else if (selectInput) {
        const answer = await generateFormAnswer(label, job.description, profile.resumeText);
        if (answer) {
          const selectName = await selectInput.evaluate((el) => el.getAttribute('name') || el.id);
          const selector = selectName?.startsWith('#') ? selectName : `[name="${selectName}"]`;
          try {
            await selectOption(page, selector, answer);
          } catch {
            console.warn(`[Lever] Could not select option for: ${label}`);
          }
          await humanWait(300, 600);
        }
      }
    } catch (error) {
      console.warn('[Lever] Error handling question:', error);
    }
  }
}

async function checkSubmissionSuccess(page: Page): Promise<boolean> {
  const successIndicators = [
    'text=Application submitted',
    'text=Thank you for applying',
    'text=Your application has been received',
    'text=Thanks for applying',
    '.application-confirmation',
    '.success-message',
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
  if (currentUrl.includes('confirmation') || currentUrl.includes('thank')) {
    return true;
  }

  return false;
}
