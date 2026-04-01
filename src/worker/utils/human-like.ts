import { Page } from 'playwright-core';

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Type text character-by-character with random delays, occasional pauses,
 * and a 5% chance of typo + correction per character.
 */
export async function humanType(
  page: Page,
  selector: string,
  text: string
): Promise<void> {
  await page.click(selector);
  await sleep(randomBetween(100, 300));

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    // 5% chance of making a typo
    if (Math.random() < 0.05 && char.match(/[a-zA-Z]/)) {
      const typoChar = String.fromCharCode(
        char.charCodeAt(0) + randomBetween(-2, 2)
      );
      await page.keyboard.type(typoChar, { delay: randomBetween(50, 100) });
      await sleep(randomBetween(100, 300));
      await page.keyboard.press('Backspace');
      await sleep(randomBetween(50, 150));
    }

    await page.keyboard.type(char, { delay: randomBetween(50, 150) });

    // Occasional longer pause (simulate thinking)
    if (Math.random() < 0.08) {
      await sleep(randomBetween(200, 400));
    }
  }
}

/**
 * Move mouse with a bezier-like path to the element, wait, then click.
 */
export async function humanClick(
  page: Page,
  selector: string
): Promise<void> {
  const element = await page.waitForSelector(selector, { timeout: 10000 });
  if (!element) throw new Error(`Element not found: ${selector}`);

  const box = await element.boundingBox();
  if (!box) throw new Error(`Element has no bounding box: ${selector}`);

  // Calculate a random point within the element
  const targetX = box.x + randomBetween(5, Math.max(6, box.width - 5));
  const targetY = box.y + randomBetween(3, Math.max(4, box.height - 3));

  // Get current mouse position (default to random starting point)
  const startX = randomBetween(100, 500);
  const startY = randomBetween(100, 400);

  // Move mouse in steps (simulating bezier curve)
  const steps = randomBetween(10, 25);
  for (let step = 0; step <= steps; step++) {
    const t = step / steps;
    // Quadratic bezier with random control point
    const cpX = (startX + targetX) / 2 + randomBetween(-50, 50);
    const cpY = (startY + targetY) / 2 + randomBetween(-30, 30);
    const x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * cpX + t * t * targetX;
    const y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * cpY + t * t * targetY;
    await page.mouse.move(x, y);
    await sleep(randomBetween(5, 20));
  }

  // Random pre-click delay
  await sleep(randomBetween(200, 800));
  await page.mouse.click(targetX, targetY);
  await sleep(randomBetween(100, 300));
}

/**
 * Smooth scroll the page by the given amount (or a random amount).
 */
export async function humanScroll(
  page: Page,
  amount?: number
): Promise<void> {
  const scrollAmount = amount ?? randomBetween(200, 600);
  const steps = randomBetween(5, 15);
  const stepAmount = scrollAmount / steps;

  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, stepAmount);
    await sleep(randomBetween(30, 80));
  }

  await sleep(randomBetween(200, 500));
}

/**
 * Random idle pause between min and max milliseconds.
 */
export async function humanWait(
  min: number = 1000,
  max: number = 3000
): Promise<void> {
  await sleep(randomBetween(min, max));
}

/**
 * Press Tab key to move between form fields.
 */
export async function humanTab(page: Page): Promise<void> {
  await sleep(randomBetween(100, 300));
  await page.keyboard.press('Tab');
  await sleep(randomBetween(200, 500));
}
