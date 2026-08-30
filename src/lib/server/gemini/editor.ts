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

export function formatEditPrompt(rawPrompt: string, aspectRatio?: string, isMultiAttachment = false): string {
  const p = rawPrompt.trim();
  const ratioSpec = aspectRatio && aspectRatio !== 'Auto' ? ` dalam rasio aspek ${aspectRatio} (${aspectRatio} aspect ratio)` : '';
  const refText = isMultiAttachment
    ? 'gambar-gambar yang saya lampirkan ini sebagai referensi visual'
    : 'gambar yang saya lampirkan ini secara visual';

  return `Edit dan modifikasi ${refText}: "${p}"${ratioSpec}. Buatkan gambar visual baru hasil modifikasinya sekarang juga (generate edited image).`;
}

export async function runEditTask(
  rawPrompt: string,
  imageInput: string | string[],
  aspectRatio?: string,
  modelId?: string
): Promise<GeneratedImage[]> {
  const imageInputs = Array.isArray(imageInput) ? imageInput : [imageInput];
  const prompt = formatEditPrompt(rawPrompt, aspectRatio, imageInputs.length > 1);

  const tempFilePaths: string[] = [];
  for (const img of imageInputs) {
    const resolved = await resolveAttachment(img);
    tempFilePaths.push(resolved);
  }

  const page = await acquirePage();
  const taskId = Math.random().toString(36).slice(2, 7);

  try {
    console.log(`[EDIT:${taskId}] Navigating to Gemini App (${tempFilePaths.length} attachment(s))...`);
    await page.goto('https://gemini.google.com/app', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(1000);
    await page.keyboard.press('Escape').catch(() => {});

    // 1. Wait for editor box to be ready
    const input = page.locator('rich-textarea div[contenteditable="true"], div.ql-editor[contenteditable="true"], div[contenteditable="true"][role="textbox"]').first();
    await input.waitFor({ state: 'visible', timeout: 35000 });

    // 2. Switch model if specified
    if (modelId) {
      console.log(`[EDIT:${taskId}] Applying model "${modelId}"...`);
      await applyGeminiModel(page, modelId);
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(400);
    }

    const existingImages = await page.evaluate(() => [...document.querySelectorAll('img')].map((i) => i.src)).catch(() => []);

    // 3. Upload files directly to file input
    const fileInput = page.locator('input[type="file"]').first();
    let uploadSuccess = false;

    if (await fileInput.count()) {
      try {
        await fileInput.setInputFiles(tempFilePaths);
        uploadSuccess = true;
      } catch (err: any) {
        console.warn(`[EDIT:${taskId}] Direct fileInput set failed, trying upload menu...`, err.message);
      }
    }

    if (!uploadSuccess) {
      const uploadBtn = page.locator('button[aria-label*="Upload &" i], button[aria-label*="Upload and" i], button[aria-label*="Tambahkan" i], .gem-menu-button button, .menu-button button').first();
      if (await uploadBtn.count() && (await uploadBtn.isVisible().catch(() => false))) {
        await uploadBtn.click();
        await page.waitForTimeout(600);
        const fallbackFileInput = page.locator('input[type="file"]').first();
        if (await fallbackFileInput.count()) {
          await fallbackFileInput.setInputFiles(tempFilePaths);
        }
      }
    }

    await page.waitForTimeout(2500 + tempFilePaths.length * 600);

    // 4. Dismiss any open menu or Material backdrop overlays
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(300);

    // 5. Focus editor and type prompt
    await input.click({ force: true });
    await page.waitForTimeout(200);
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.keyboard.type(prompt, { delay: 8 });
    await page.waitForTimeout(400);

    // 6. Send prompt
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
    for (const tempPath of tempFilePaths) {
      if (tempPath && tempPath.includes(TEMP_DIR) && fs.existsSync(tempPath)) {
        try { fs.unlinkSync(tempPath); } catch {}
      }
    }
  }
}
