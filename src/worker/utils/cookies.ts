import { BrowserContext } from 'playwright-core';
import * as fs from 'fs';
import * as path from 'path';

const COOKIES_DIR = '/tmp/jobright-cookies';

/**
 * Save browser cookies for a domain to Supabase Storage or local file.
 */
export async function saveCookies(
  context: BrowserContext,
  domain: string
): Promise<void> {
  try {
    const cookies = await context.cookies();
    const domainCookies = cookies.filter(
      (c) => c.domain.includes(domain) || domain.includes(c.domain.replace(/^\./, ''))
    );

    if (domainCookies.length === 0) return;

    const serialized = JSON.stringify(domainCookies, null, 2);

    // Try Supabase Storage first
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
      try {
        const { getServiceClient } = await import('@/lib/supabase');
        const supabase = getServiceClient();
        const fileName = `cookies/${sanitizeDomain(domain)}.json`;

        await supabase.storage
          .from('worker-data')
          .upload(fileName, serialized, {
            contentType: 'application/json',
            upsert: true,
          });

        console.log(`Cookies saved to Supabase Storage for ${domain}`);
        return;
      } catch {
        // Fall through to local file
      }
    }

    // Fallback: save to local file
    if (!fs.existsSync(COOKIES_DIR)) {
      fs.mkdirSync(COOKIES_DIR, { recursive: true });
    }

    const filePath = path.join(COOKIES_DIR, `${sanitizeDomain(domain)}.json`);
    fs.writeFileSync(filePath, serialized, 'utf-8');
    console.log(`Cookies saved locally for ${domain}`);
  } catch (error) {
    console.error(`Failed to save cookies for ${domain}:`, error);
  }
}

/**
 * Restore cookies for a domain from Supabase Storage or local file.
 */
export async function loadCookies(
  context: BrowserContext,
  domain: string
): Promise<void> {
  try {
    let cookiesJson: string | null = null;

    // Try Supabase Storage first
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
      try {
        const { getServiceClient } = await import('@/lib/supabase');
        const supabase = getServiceClient();
        const fileName = `cookies/${sanitizeDomain(domain)}.json`;

        const { data, error } = await supabase.storage
          .from('worker-data')
          .download(fileName);

        if (!error && data) {
          cookiesJson = await data.text();
        }
      } catch {
        // Fall through to local file
      }
    }

    // Fallback: load from local file
    if (!cookiesJson) {
      const filePath = path.join(COOKIES_DIR, `${sanitizeDomain(domain)}.json`);
      if (fs.existsSync(filePath)) {
        cookiesJson = fs.readFileSync(filePath, 'utf-8');
      }
    }

    if (cookiesJson) {
      const cookies = JSON.parse(cookiesJson);
      if (Array.isArray(cookies) && cookies.length > 0) {
        await context.addCookies(cookies);
        console.log(`Loaded ${cookies.length} cookies for ${domain}`);
      }
    }
  } catch (error) {
    console.error(`Failed to load cookies for ${domain}:`, error);
  }
}

function sanitizeDomain(domain: string): string {
  return domain.replace(/[^a-zA-Z0-9.-]/g, '_');
}
