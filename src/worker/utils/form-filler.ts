import { Page, ElementHandle } from 'playwright-core';
import { humanType, humanClick, humanWait } from './human-like';

/**
 * Fill a text input field using human-like typing.
 */
export async function fillField(
  page: Page,
  selector: string,
  value: string
): Promise<void> {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
    // Clear existing value first
    await page.click(selector, { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await humanWait(100, 300);
    await humanType(page, selector, value);
  } catch (error) {
    console.error(`Failed to fill field ${selector}:`, error);
    throw error;
  }
}

/**
 * Select an option from a dropdown.
 * Tries to match by value first, then by visible text (case-insensitive).
 */
export async function selectOption(
  page: Page,
  selector: string,
  value: string
): Promise<void> {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });

    // Try selecting by value
    try {
      await page.selectOption(selector, { value });
      return;
    } catch {
      // Try by label
    }

    // Try selecting by label (case-insensitive)
    try {
      await page.selectOption(selector, { label: value });
      return;
    } catch {
      // Try partial match
    }

    // Fallback: find the closest matching option
    const options = await page.$$eval(`${selector} option`, (opts) =>
      opts.map((o) => ({
        value: (o as HTMLOptionElement).value,
        text: (o as HTMLOptionElement).textContent?.trim() || '',
      }))
    );

    const lowerValue = value.toLowerCase();
    const match = options.find(
      (o) =>
        o.text.toLowerCase().includes(lowerValue) ||
        o.value.toLowerCase().includes(lowerValue)
    );

    if (match) {
      await page.selectOption(selector, { value: match.value });
    } else {
      console.warn(`No matching option found for "${value}" in ${selector}`);
    }
  } catch (error) {
    console.error(`Failed to select option in ${selector}:`, error);
    throw error;
  }
}

/**
 * Upload a file to a file input element.
 */
export async function uploadFile(
  page: Page,
  selector: string,
  filePath: string
): Promise<void> {
  try {
    const fileInput = await page.waitForSelector(selector, { timeout: 5000 });
    if (fileInput) {
      await fileInput.setInputFiles(filePath);
      await humanWait(500, 1000);
      console.log(`File uploaded to ${selector}`);
    }
  } catch (error) {
    console.error(`Failed to upload file to ${selector}:`, error);
    throw error;
  }
}

/**
 * Find an input element near a given label text.
 * Returns the CSS selector or null if not found.
 */
export async function findFieldByLabel(
  page: Page,
  label: string
): Promise<string | null> {
  // Strategy 1: Find <label> with matching text and follow its "for" attribute
  const forId = await page.evaluate((labelText: string) => {
    const labels = Array.from(document.querySelectorAll('label'));
    const match = labels.find((l) =>
      l.textContent?.toLowerCase().includes(labelText.toLowerCase())
    );
    return match?.getAttribute('for') || null;
  }, label);

  if (forId) {
    const exists = await page.$(`#${CSS.escape(forId)}`);
    if (exists) return `#${forId}`;
  }

  // Strategy 2: Find label and look for input inside it
  const insideLabel = await page.evaluate((labelText: string) => {
    const labels = Array.from(document.querySelectorAll('label'));
    const match = labels.find((l) =>
      l.textContent?.toLowerCase().includes(labelText.toLowerCase())
    );
    if (!match) return null;

    const input = match.querySelector('input, textarea, select');
    if (input) {
      if (input.id) return `#${input.id}`;
      if (input.getAttribute('name')) return `[name="${input.getAttribute('name')}"]`;
    }
    return null;
  }, label);

  if (insideLabel) return insideLabel;

  // Strategy 3: Look for placeholder text
  const placeholder = await page.$(`input[placeholder*="${label}" i], textarea[placeholder*="${label}" i]`);
  if (placeholder) {
    const id = await placeholder.getAttribute('id');
    if (id) return `#${id}`;
    const name = await placeholder.getAttribute('name');
    if (name) return `[name="${name}"]`;
  }

  // Strategy 4: Look for aria-label
  const ariaLabel = await page.$(`input[aria-label*="${label}" i], textarea[aria-label*="${label}" i]`);
  if (ariaLabel) {
    const id = await ariaLabel.getAttribute('id');
    if (id) return `#${id}`;
    const name = await ariaLabel.getAttribute('name');
    if (name) return `[name="${name}"]`;
  }

  return null;
}

/**
 * Extract all visible form fields with their labels from the page.
 */
export async function getFormFields(
  page: Page
): Promise<
  Array<{
    selector: string;
    type: string;
    label: string;
    required: boolean;
    value: string;
  }>
> {
  return page.evaluate(() => {
    const fields: Array<{
      selector: string;
      type: string;
      label: string;
      required: boolean;
      value: string;
    }> = [];

    const inputs = document.querySelectorAll(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select'
    );

    inputs.forEach((input) => {
      const el = input as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

      // Skip invisible elements
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return;

      // Build selector
      let selector = '';
      if (el.id) {
        selector = `#${el.id}`;
      } else if (el.getAttribute('name')) {
        selector = `[name="${el.getAttribute('name')}"]`;
      } else {
        return; // Skip fields we can't target
      }

      // Find label
      let label = '';
      if (el.id) {
        const labelEl = document.querySelector(`label[for="${el.id}"]`);
        if (labelEl) label = labelEl.textContent?.trim() || '';
      }
      if (!label) {
        const parent = el.closest('label');
        if (parent) label = parent.textContent?.trim() || '';
      }
      if (!label) {
        label =
          el.getAttribute('placeholder') ||
          el.getAttribute('aria-label') ||
          el.getAttribute('name') ||
          '';
      }

      fields.push({
        selector,
        type: el.type || el.tagName.toLowerCase(),
        label,
        required: el.hasAttribute('required') || el.getAttribute('aria-required') === 'true',
        value: el.value || '',
      });
    });

    return fields;
  });
}
