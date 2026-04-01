import { Page } from 'playwright-core';

type CaptchaType = 'recaptcha' | 'hcaptcha' | 'turnstile' | null;

const CAPTCHA_API_KEY = process.env.CAPTCHA_API_KEY || '';
const TWO_CAPTCHA_URL = 'https://2captcha.com';

/**
 * Detect if a CAPTCHA is present on the page.
 */
export async function detectCaptcha(page: Page): Promise<CaptchaType> {
  // Check for reCAPTCHA
  const recaptcha = await page.$('iframe[src*="recaptcha"], .g-recaptcha, #g-recaptcha');
  if (recaptcha) return 'recaptcha';

  // Check for hCaptcha
  const hcaptcha = await page.$('iframe[src*="hcaptcha"], .h-captcha');
  if (hcaptcha) return 'hcaptcha';

  // Check for Cloudflare Turnstile
  const turnstile = await page.$('iframe[src*="challenges.cloudflare"], .cf-turnstile');
  if (turnstile) return 'turnstile';

  return null;
}

/**
 * Solve a CAPTCHA using the 2Captcha service.
 * Returns true if successfully solved, false otherwise.
 */
export async function solveCaptcha(
  page: Page,
  type: CaptchaType
): Promise<boolean> {
  if (!type) return true; // No captcha to solve
  if (!CAPTCHA_API_KEY) {
    console.error('CAPTCHA detected but no CAPTCHA_API_KEY configured');
    return false;
  }

  try {
    const pageUrl = page.url();

    switch (type) {
      case 'recaptcha':
        return await solveRecaptcha(page, pageUrl);
      case 'hcaptcha':
        return await solveHCaptcha(page, pageUrl);
      case 'turnstile':
        return await solveTurnstile(page, pageUrl);
      default:
        return false;
    }
  } catch (error) {
    console.error(`CAPTCHA solving failed for ${type}:`, error);
    return false;
  }
}

async function getSiteKey(
  page: Page,
  selectors: string[]
): Promise<string | null> {
  for (const selector of selectors) {
    const element = await page.$(selector);
    if (element) {
      const siteKey =
        (await element.getAttribute('data-sitekey')) ||
        (await element.getAttribute('data-siteKey'));
      if (siteKey) return siteKey;
    }
  }

  // Try to extract from iframe src
  const iframe = await page.$('iframe[src*="sitekey="]');
  if (iframe) {
    const src = await iframe.getAttribute('src');
    if (src) {
      const match = src.match(/sitekey=([^&]+)/);
      if (match) return match[1];
    }
  }

  return null;
}

async function solveRecaptcha(page: Page, pageUrl: string): Promise<boolean> {
  const siteKey = await getSiteKey(page, ['.g-recaptcha', '#g-recaptcha', '[data-sitekey]']);
  if (!siteKey) {
    console.error('Could not find reCAPTCHA site key');
    return false;
  }

  console.log('Submitting reCAPTCHA to 2Captcha...');
  const createResponse = await fetch(
    `${TWO_CAPTCHA_URL}/in.php?key=${CAPTCHA_API_KEY}&method=userrecaptcha&googlekey=${siteKey}&pageurl=${encodeURIComponent(pageUrl)}&json=1`
  );
  const createData = await createResponse.json();

  if (createData.status !== 1) {
    console.error('2Captcha submission failed:', createData);
    return false;
  }

  const taskId = createData.request;
  return await pollAndInjectSolution(page, taskId, 'recaptcha');
}

async function solveHCaptcha(page: Page, pageUrl: string): Promise<boolean> {
  const siteKey = await getSiteKey(page, ['.h-captcha', '[data-sitekey]']);
  if (!siteKey) {
    console.error('Could not find hCaptcha site key');
    return false;
  }

  console.log('Submitting hCaptcha to 2Captcha...');
  const createResponse = await fetch(
    `${TWO_CAPTCHA_URL}/in.php?key=${CAPTCHA_API_KEY}&method=hcaptcha&sitekey=${siteKey}&pageurl=${encodeURIComponent(pageUrl)}&json=1`
  );
  const createData = await createResponse.json();

  if (createData.status !== 1) {
    console.error('2Captcha submission failed:', createData);
    return false;
  }

  const taskId = createData.request;
  return await pollAndInjectSolution(page, taskId, 'hcaptcha');
}

async function solveTurnstile(page: Page, pageUrl: string): Promise<boolean> {
  const siteKey = await getSiteKey(page, ['.cf-turnstile', '[data-sitekey]']);
  if (!siteKey) {
    console.error('Could not find Turnstile site key');
    return false;
  }

  console.log('Submitting Turnstile to 2Captcha...');
  const createResponse = await fetch(
    `${TWO_CAPTCHA_URL}/in.php?key=${CAPTCHA_API_KEY}&method=turnstile&sitekey=${siteKey}&pageurl=${encodeURIComponent(pageUrl)}&json=1`
  );
  const createData = await createResponse.json();

  if (createData.status !== 1) {
    console.error('2Captcha submission failed:', createData);
    return false;
  }

  const taskId = createData.request;
  return await pollAndInjectSolution(page, taskId, 'turnstile');
}

async function pollAndInjectSolution(
  page: Page,
  taskId: string,
  type: 'recaptcha' | 'hcaptcha' | 'turnstile'
): Promise<boolean> {
  const maxAttempts = 30;
  const pollInterval = 5000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, pollInterval));

    const resultResponse = await fetch(
      `${TWO_CAPTCHA_URL}/res.php?key=${CAPTCHA_API_KEY}&action=get&id=${taskId}&json=1`
    );
    const resultData = await resultResponse.json();

    if (resultData.status === 1) {
      const token = resultData.request;
      console.log(`CAPTCHA solved, injecting ${type} token...`);

      if (type === 'recaptcha') {
        await page.evaluate((tok: string) => {
          const textarea = document.getElementById('g-recaptcha-response') as HTMLTextAreaElement;
          if (textarea) {
            textarea.style.display = 'block';
            textarea.value = tok;
          }
          // Try calling the callback
          const widgetId = 0;
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).___grecaptcha_cfg?.clients?.[widgetId]?.callback?.(tok);
          } catch {
            // callback may not exist
          }
        }, token);
      } else if (type === 'hcaptcha') {
        await page.evaluate((tok: string) => {
          const textarea = document.querySelector('[name="h-captcha-response"]') as HTMLTextAreaElement;
          if (textarea) {
            textarea.value = tok;
          }
          const iframe = document.querySelector('iframe[src*="hcaptcha"]');
          if (iframe) {
            iframe.setAttribute('data-hcaptcha-response', tok);
          }
        }, token);
      } else if (type === 'turnstile') {
        await page.evaluate((tok: string) => {
          const input = document.querySelector('[name="cf-turnstile-response"]') as HTMLInputElement;
          if (input) {
            input.value = tok;
          }
        }, token);
      }

      return true;
    }

    if (resultData.request !== 'CAPCHA_NOT_READY') {
      console.error('2Captcha error:', resultData);
      return false;
    }
  }

  console.error('CAPTCHA solving timed out');
  return false;
}
