import { acquirePage, releasePage } from '../browser/pool';
import { extractGeneratedImages } from './extractor';
import { applyGeminiModel } from './mode-switcher';
import type { GeneratedImage } from '$lib/types';

export function formatGeneratePrompt(prompt: string, aspectRatio?: string): string {
  const p = prompt.trim();
  const ratioSpec = aspectRatio && aspectRatio !== 'Auto' ? ` dalam rasio aspek ${aspectRatio} (${aspectRatio} aspect ratio)` : '';
  return `Buatkan dan hasilkan gambar visual baru secara langsung: "${p}"${ratioSpec}. Generate Imagen image.`;
}

export async function runGenerateTask(rawPrompt: string, aspectRatio?: string, modelId?: string): Promise<GeneratedImage[]> {
  const prompt = formatGeneratePrompt(rawPrompt, aspectRatio);
  const page = await acquirePage();
  const taskId = Math.random().toString(36).slice(2, 7);

  try {
    console.log(`[GEN:${taskId}] Navigating to Gemini App...`);
    await page.goto('https://gemini.google.com/app', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(800);

    if (page.url().includes('google.com/sorry')) {
      throw new Error('Google mendeteksi aktivitas otomatis (google.com/sorry captcha). Silakan buka terminal dan jalankan "bun run login" untuk verifikasi.');
    }
    if (page.url().includes('accounts.google.com')) {
      throw new Error('Sesi Google telah kedaluwarsa. Silakan buka terminal dan jalankan "bun run login" untuk login ulang.');
    }

    await page.keyboard.press('Escape').catch(() => {});

    // Switch model if specified
    if (modelId) {
      console.log(`[GEN:${taskId}] Applying model "${modelId}"...`);
      await applyGeminiModel(page, modelId);
    }

    const existingImages = await page.evaluate(() => [...document.querySelectorAll('img')].map((i) => i.src)).catch(() => []);

    const input = page.locator('rich-textarea div[contenteditable="true"], div.ql-editor[contenteditable="true"], div[role="textbox"]').first();
    await input.waitFor({ state: 'visible', timeout: 20000 });
    await input.click({ force: true });
    await page.waitForTimeout(200);
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.keyboard.type(prompt, { delay: 8 });
    await page.waitForTimeout(400);

    const sendBtn = page.locator('button[aria-label*="Kirim" i], button[aria-label*="Send" i], button.send-button, [data-test-id="send-button"]').first();
    if (await sendBtn.count() && (await sendBtn.isVisible().catch(() => false))) {
      await sendBtn.click().catch(() => page.keyboard.press('Enter'));
    } else {
      await page.keyboard.press('Enter');
    }

    console.log(`[GEN:${taskId}] Prompt sent. Waiting for generated output from Gemini...`);
    const results = await extractGeneratedImages(page, existingImages, 'gen', 120000);
    console.log(`[GEN:${taskId}] Task completed successfully with ${results.length} image(s)!`);
    return results;
  } finally {
    releasePage(page);
  }
}
