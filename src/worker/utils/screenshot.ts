import { Page } from 'playwright-core';
import * as path from 'path';
import * as fs from 'fs';

const SCREENSHOTS_DIR = '/tmp/jobright-screenshots';

/**
 * Take a full-page screenshot and save it.
 * Attempts Supabase Storage first, falls back to local /tmp directory.
 * Returns the screenshot path or URL.
 */
export async function takeScreenshot(
  page: Page,
  jobId: string
): Promise<string> {
  const timestamp = Date.now();
  const filename = `${jobId}-${timestamp}.png`;

  try {
    const buffer = await page.screenshot({ fullPage: true });

    // Try Supabase Storage first
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
      try {
        const { getServiceClient } = await import('@/lib/supabase');
        const supabase = getServiceClient();
        const storagePath = `screenshots/${filename}`;

        const { error } = await supabase.storage
          .from('worker-data')
          .upload(storagePath, buffer, {
            contentType: 'image/png',
            upsert: true,
          });

        if (!error) {
          const { data: urlData } = supabase.storage
            .from('worker-data')
            .getPublicUrl(storagePath);

          console.log(`Screenshot saved to Supabase: ${storagePath}`);
          return urlData.publicUrl;
        }
      } catch {
        // Fall through to local file
      }
    }

    // Fallback: save locally
    if (!fs.existsSync(SCREENSHOTS_DIR)) {
      fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    }

    const filePath = path.join(SCREENSHOTS_DIR, filename);
    fs.writeFileSync(filePath, buffer);
    console.log(`Screenshot saved locally: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error(`Failed to take screenshot for job ${jobId}:`, error);
    return '';
  }
}
