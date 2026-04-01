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

export async function applyWorkday(
  job: Job,
  profile: Profile,
  portalUrl: string
): Promise<ApplyResult> {
  const domain = new URL(portalUrl).hostname;
  const { browser, context, page } = await createStealthBrowser(domain);

  try {
    console.log(`[Workday] Navigating to ${portalUrl}`);
    await page.goto(portalUrl, { waitUntil: 'networkidle', timeout: 45000 });
    await humanWait(3000, 5000);

    // Handle "Sign In" vs "Apply" flow
    await handleSignInOrApply(page);

    // Step 1: My Information
    await fillMyInformation(page, profile);

    // Step 2: My Experience (resume upload)
    await fillMyExperience(page, profile);

    // Step 3: Application Questions (if present)
    await fillApplicationQuestions(page, job, profile);

    // Step 4: Voluntary Disclosures (if present)
    await handleVoluntaryDisclosures(page);

    // Step 5: Review and Submit
    await handleReviewAndSubmit(page, job);

    // Check for CAPTCHA before final submit
    const captchaType = await detectCaptcha(page);
    if (captchaType) {
      console.log(`[Workday] CAPTCHA detected: ${captchaType}`);
      const solved = await solveCaptcha(page, captchaType);
      if (!solved) {
        const screenshotPath = await takeScreenshot(page, job.id);
        return { success: false, screenshotPath, error: 'CAPTCHA solving failed' };
      }
    }

    const success = await checkSubmissionSuccess(page);
    const screenshotPath = await takeScreenshot(page, job.id);

    await saveCookies(context, domain);

    return { success, screenshotPath };
  } catch (error) {
    const screenshotPath = await takeScreenshot(page, `${job.id}-error`);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Workday] Application failed:`, errorMsg);
    return { success: false, screenshotPath, error: errorMsg };
  } finally {
    await browser.close();
  }
}

async function handleSignInOrApply(page: Page): Promise<void> {
  // Look for "Apply Manually" or "Apply without account" options
  const manualApplySelectors = [
    'button:has-text("Apply Manually")',
    'a:has-text("Apply Manually")',
    'button:has-text("Apply")',
    '[data-automation-id="applyManually"]',
    'a:has-text("apply without")',
  ];

  for (const selector of manualApplySelectors) {
    try {
      const el = await page.$(selector);
      if (el) {
        await humanClick(page, selector);
        await humanWait(2000, 4000);
        return;
      }
    } catch {
      continue;
    }
  }

  // Check for "Use my last application" prompt and dismiss
  const useLastApp = await page.$('button:has-text("Use My Last Application")');
  if (useLastApp) {
    // Click "Start from Scratch" or equivalent
    const startFresh = await page.$('button:has-text("Start from Scratch"), button:has-text("No")');
    if (startFresh) {
      await humanClick(page, 'button:has-text("Start from Scratch"), button:has-text("No")');
      await humanWait(1000, 2000);
    }
  }

  // If we see a "Create Account" form, fill it
  const createAccountButton = await page.$('button:has-text("Create Account")');
  if (createAccountButton) {
    console.log('[Workday] Account creation may be required - proceeding as guest if possible');
  }
}

async function fillMyInformation(page: Page, profile: Profile): Promise<void> {
  console.log('[Workday] Step: My Information');

  const [firstName, ...lastParts] = profile.fullName.split(' ');
  const lastName = lastParts.join(' ');

  // Workday uses data-automation-id attributes extensively
  const fieldMappings: Array<{ automationId: string; fallbackLabel: string; value: string }> = [
    { automationId: 'legalNameSection_firstName', fallbackLabel: 'first name', value: firstName },
    { automationId: 'legalNameSection_lastName', fallbackLabel: 'last name', value: lastName },
    { automationId: 'email', fallbackLabel: 'email', value: profile.email },
    { automationId: 'phone-number', fallbackLabel: 'phone', value: profile.phone },
    { automationId: 'addressSection_addressLine1', fallbackLabel: 'address', value: profile.location },
  ];

  for (const { automationId, fallbackLabel, value } of fieldMappings) {
    const selector = `[data-automation-id="${automationId}"] input, [data-automation-id="${automationId}"]`;
    try {
      const el = await page.$(selector);
      if (el) {
        await fillField(page, selector, value);
        await humanWait(300, 600);
        continue;
      }
    } catch {
      // Try fallback
    }

    const fallbackSelector = await findFieldByLabel(page, fallbackLabel);
    if (fallbackSelector) {
      try {
        await fillField(page, fallbackSelector, value);
        await humanWait(300, 600);
      } catch {
        console.warn(`[Workday] Could not fill ${fallbackLabel}`);
      }
    }
  }

  await humanScroll(page, 300);

  // Click Next/Continue if present
  await clickNextButton(page);
}

async function fillMyExperience(page: Page, profile: Profile): Promise<void> {
  console.log('[Workday] Step: My Experience');
  await humanWait(1000, 2000);

  if (!profile.resumePdfUrl) {
    console.warn('[Workday] No resume PDF available');
    await clickNextButton(page);
    return;
  }

  // Workday resume upload
  const uploadSelectors = [
    '[data-automation-id="file-upload-input-ref"] input[type="file"]',
    'input[data-automation-id="file-upload-input-ref"]',
    '[data-automation-id="resumeSection"] input[type="file"]',
    'input[type="file"]',
  ];

  for (const selector of uploadSelectors) {
    try {
      const fileInput = await page.$(selector);
      if (fileInput) {
        await uploadFile(page, selector, profile.resumePdfUrl);
        await humanWait(2000, 4000);
        console.log('[Workday] Resume uploaded');

        // Wait for parsing to complete
        await page.waitForTimeout(3000);
        break;
      }
    } catch {
      continue;
    }
  }

  await humanScroll(page, 300);
  await clickNextButton(page);
}

async function fillApplicationQuestions(
  page: Page,
  job: Job,
  profile: Profile
): Promise<void> {
  console.log('[Workday] Step: Application Questions');
  await humanWait(1000, 2000);

  // Check if this step exists
  const questionSections = await page.$$('[data-automation-id*="question"], .questionnaire-question');
  if (questionSections.length === 0) {
    // May not have this step
    return;
  }

  for (const section of questionSections) {
    try {
      const label = await section.$eval(
        'label, [data-automation-id*="label"], .question-text',
        (el) => el.textContent?.trim() || ''
      ).catch(() => '');
      if (!label) continue;

      const textInput = await section.$('input[type="text"], textarea');
      const selectInput = await section.$('select, [data-automation-id*="dropdown"]');
      const radioInputs = await section.$$('input[type="radio"]');

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
          try {
            await selectInput.click();
            await humanWait(300, 500);
            // Workday dropdowns often use custom components
            const option = await page.$(`li:has-text("${answer}"), [data-automation-id*="option"]:has-text("${answer}")`);
            if (option) {
              await option.click();
            }
          } catch {
            console.warn(`[Workday] Could not select option for: ${label}`);
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
      }
    } catch (error) {
      console.warn('[Workday] Error handling question:', error);
    }
  }

  await clickNextButton(page);
}

async function handleVoluntaryDisclosures(page: Page): Promise<void> {
  console.log('[Workday] Step: Voluntary Disclosures (if present)');
  await humanWait(1000, 2000);

  // Look for "I decline to self-identify" options in EEO sections
  const declineSelectors = [
    'input[value*="decline" i]',
    'label:has-text("I decline") input[type="radio"]',
    'label:has-text("Prefer not") input[type="radio"]',
    '[data-automation-id*="decline"]',
  ];

  for (const selector of declineSelectors) {
    try {
      const el = await page.$(selector);
      if (el) {
        await el.click();
        await humanWait(300, 500);
      }
    } catch {
      continue;
    }
  }

  await clickNextButton(page);
}

async function handleReviewAndSubmit(page: Page, job: Job): Promise<void> {
  console.log('[Workday] Step: Review and Submit');
  await humanWait(1000, 2000);

  // Take pre-submit screenshot
  await takeScreenshot(page, `${job.id}-pre-submit`);

  // Look for a submit/accept button
  const submitSelectors = [
    'button[data-automation-id="bottom-navigation-next-button"]:has-text("Submit")',
    'button:has-text("Submit Application")',
    'button:has-text("Submit")',
    '[data-automation-id="submit"]',
    'input[type="submit"]',
  ];

  for (const selector of submitSelectors) {
    try {
      const el = await page.$(selector);
      if (el) {
        await humanClick(page, selector);
        await humanWait(3000, 5000);
        return;
      }
    } catch {
      continue;
    }
  }
}

async function clickNextButton(page: Page): Promise<void> {
  const nextSelectors = [
    'button[data-automation-id="bottom-navigation-next-button"]',
    'button:has-text("Next")',
    'button:has-text("Continue")',
    'button:has-text("Save and Continue")',
  ];

  for (const selector of nextSelectors) {
    try {
      const el = await page.$(selector);
      if (el) {
        await humanClick(page, selector);
        await humanWait(2000, 4000);
        return;
      }
    } catch {
      continue;
    }
  }
}

async function checkSubmissionSuccess(page: Page): Promise<boolean> {
  const successIndicators = [
    'text=Application submitted',
    'text=Thank you for applying',
    'text=Successfully submitted',
    'text=Your application has been received',
    '[data-automation-id="confirmationMessage"]',
    '.confirmation-message',
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
