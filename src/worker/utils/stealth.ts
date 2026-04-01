import { chromium } from 'playwright-extra';
import type { Browser, BrowserContext, Page } from 'playwright-core';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { getProxyConfig } from './proxy';
import { loadCookies } from './cookies';

chromium.use(StealthPlugin());

const VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 1366, height: 768 },
  { width: 1536, height: 864 },
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
  { width: 1600, height: 900 },
  { width: 1280, height: 800 },
];

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
];

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
];

const LOCALES = ['en-US', 'en-GB', 'en-CA'];

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export interface StealthBrowser {
  browser: Browser;
  context: BrowserContext;
  page: Page;
}

export async function createStealthBrowser(
  domain?: string
): Promise<StealthBrowser> {
  const viewport = randomPick(VIEWPORTS);
  const userAgent = randomPick(USER_AGENTS);
  const timezone = randomPick(TIMEZONES);
  const locale = randomPick(LOCALES);

  const proxy = getProxyConfig();

  const launchOptions: Record<string, unknown> = {
    headless: true,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  };

  if (proxy) {
    launchOptions.proxy = proxy;
  }

  const browser = await chromium.launch(launchOptions as Parameters<typeof chromium.launch>[0]);

  const context = await browser.newContext({
    viewport,
    userAgent,
    timezoneId: timezone,
    locale,
    permissions: ['geolocation'],
    geolocation: { latitude: 37.7749, longitude: -122.4194 },
    colorScheme: 'light',
    deviceScaleFactor: randomPick([1, 1.25, 1.5, 2]),
    hasTouch: false,
    javaScriptEnabled: true,
  });

  // Restore cookies if a domain is provided
  if (domain) {
    await loadCookies(context, domain);
  }

  // Add extra stealth scripts
  await context.addInitScript(() => {
    // Override navigator.webdriver
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });

    // Override chrome runtime
    (window as unknown as Record<string, unknown>).chrome = {
      runtime: {},
    };

    // Override permissions query
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters: PermissionDescriptor) =>
      parameters.name === 'notifications'
        ? Promise.resolve({ state: 'denied' } as PermissionStatus)
        : originalQuery(parameters);

    // Override plugins length
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });

    // Override languages
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    });
  });

  const page = await context.newPage();

  return { browser, context, page };
}
