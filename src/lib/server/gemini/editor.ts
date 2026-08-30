import { acquirePage, releasePage } from '../browser/pool';
import { extractGeneratedImages } from './extractor';
import { applyGeminiModel } from './mode-switcher';
import path from 'node:path';
import fs from 'node:fs';
import type { GeneratedImage } from '$lib/types';

const TEMP_DIR = path.resolve('data/temp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

async function resolveAttachment(imageInput: string): Promise<string> {
  const tempPath = path.join(TEMP_DIR, `upload_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.png`);

  // 1. Direct local output file match
  if (imageInput.includes('/output/')) {
    const filename = path.basename(imageInput.split('?')[0]);
    const local = path.join(path.resolve('output'), filename);
    if (fs.existsSync(local)) return local;
  }

  // 2. Direct local file path
  if (fs.existsSync(imageInput)) {
    return path.resolve(imageInput);
  }

  // 3. Base64 Data URL
  if (imageInput.startsWith('data:image/')) {
    const b64 = imageInput.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(tempPath, Buffer.from(b64, 'base64'));
    return tempPath;
  } else if (/^[A-Za-z0-9+/=]{100,}/.test(imageInput)) {
    fs.writeFileSync(tempPath, Buffer.from(imageInput, 'base64'));
    return tempPath;
  } else if (imageInput.startsWith('http://') || imageInput.startsWith('https://')) {
    const res = await fetch(imageInput);
    const buf = await res.arrayBuffer();
    fs.writeFileSync(tempPath, Buffer.from(buf));
    return tempPath;
  }

  throw new Error('Format attachment tidak valid (gunakan Base64, URL, atau file path).');
}

export function formatEditPrompt(rawPrompt: string, aspectRatio?: string): string {
  const p = rawPrompt.trim();
  const ratioSpec = aspectRatio && aspectRatio !== 'Auto' ? ` dalam rasio aspek ${aspectRatio} (${aspectRatio} aspect ratio)` : '';
  return `Edit dan modifikasi gambar yang saya lampirkan ini secara visual: "${p}"${ratioSpec}. Buatkan gambar visual baru hasil modifikasinya sekarang juga (generate edited image).`;
}

export async function runEditTask(rawPrompt: string, imageInput: string, aspectRatio?: string, modelId?: string): Promise<GeneratedImage[]> {
  const prompt = formatEditPrompt(rawPrompt, aspectRatio);
  const tempFilePath = await resolveAttachment(imageInput);
  const page = await acquirePage();
  const taskId = Math.random().toString(36).slice(2, 7);

  try {
    console.log(`[EDIT:${taskId}] Navigating to Gemini App...`);
    await page.goto('https://gemini.google.com/app', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(800);
    await page.keyboard.press('Escape').catch(() => {});

    // Switch model if specified
    if (modelId) {
      console.log(`[EDIT:${taskId}] Applying model "${modelId}"...`);
      await applyGeminiModel(page, modelId);
    }

    const existingImages = await page.evaluate(() => [...document.querySelectorAll('img')].map((i) => i.src)).catch(() => []);

    // Open upload menu
    const uploadBtn = page.locator('button[aria-label*="Upload &" i], button[aria-label*="Upload and" i], .gem-menu-button button, .menu-button button').first();
    if (await uploadBtn.count()) {
      await uploadBtn.click();
      await page.waitForTimeout(800);
    }

    const fileInput = page.locator('input[type="file"]').first();
    if (await fileInput.count()) {
      await fileInput.setInputFiles(tempFilePath);
      await page.waitForTimeout(2500);
    }

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

    console.log(`[EDIT:${taskId}] Prompt sent. Waiting for edited output from Gemini...`);
    const results = await extractGeneratedImages(page, existingImages, 'edit', 140000);
    console.log(`[EDIT:${taskId}] Task completed successfully with ${results.length} image(s)!`);
    return results;
  } finally {
    releasePage(page);
    if (tempFilePath && tempFilePath.includes(TEMP_DIR) && fs.existsSync(tempFilePath)) {
      try { fs.unlinkSync(tempFilePath); } catch {}
    }
  }
}
