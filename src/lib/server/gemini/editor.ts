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
  const ratioSpec = aspectRatio && aspectRatio !== 'Auto' ? ` in ${aspectRatio} aspect ratio` : '';
  const refText = isMultiAttachment
    ? 'the attached images as visual references'
    : 'the attached image';

  return `Generate an edited visual image based on ${refText}. Apply these visual edits and output the new generated image: "${p}"${ratioSpec}. Generate image now (create image output).`;
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

    if (page.url().includes('google.com/sorry')) {
      throw new Error('Google mendeteksi aktivitas otomatis (google.com/sorry captcha). Silakan buka terminal dan jalankan "bun run login" untuk verifikasi.');
    }
    if (page.url().includes('accounts.google.com')) {
      throw new Error('Sesi Google telah kedaluwarsa. Silakan buka terminal dan jalankan "bun run login" untuk login ulang.');
    }

    await page.keyboard.press('Escape').catch(() => {});

    // 1. Wait for editor box to be ready
    const input = page.locator('rich-textarea div[contenteditable="true"], div.ql-editor[contenteditable="true"], div[contenteditable="true"][role="textbox"]').first();
    await input.waitFor({ state: 'visible', timeout: 25000 });

    // 2. Switch model if specified
    if (modelId) {
      console.log(`[EDIT:${taskId}] Applying model "${modelId}"...`);
      await applyGeminiModel(page, modelId);
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(400);
    }

    const existingImages = await page.evaluate(() => [...document.querySelectorAll('img')].map((i) => i.src)).catch(() => []);

    // 3. Upload files via verified FileChooser
    console.log(`[EDIT:${taskId}] Opening upload menu for ${tempFilePaths.length} attachment(s)...`);
    const uploadBtn = page.locator('button[aria-label*="Upload" i], button[aria-label*="Tambahkan" i], button[aria-label*="Tools" i]').first();
    await uploadBtn.waitFor({ state: 'visible', timeout: 15000 });
    await uploadBtn.click();
    await page.waitForTimeout(600);

    const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 8000 }).catch(() => null);
    const uploadMenuItem = page.locator('[role="menuitem"]:has-text("Upload"), [role="menuitem"]:has-text("Unggah"), .mat-mdc-menu-item:has-text("Upload"), .mat-mdc-menu-item:has-text("Unggah")').first();

    if (await uploadMenuItem.count()) {
      await uploadMenuItem.click();
    }

    const fileChooser = await fileChooserPromise;
    if (fileChooser) {
      console.log(`[EDIT:${taskId}] Setting ${tempFilePaths.length} file(s) on FileChooser...`);
      await fileChooser.setFiles(tempFilePaths);
    } else {
      const mountedInput = page.locator('input[type="file"]').first();
      if (await mountedInput.count()) {
        await mountedInput.setInputFiles(tempFilePaths);
      }
    }

    // 4. Wait for attachment thumbnail chip to render in input area
    const thumbnail = page.locator('.input-area img, rich-textarea img, form img, [class*="thumbnail"] img, [aria-label*="remove image" i], [aria-label*="hapus gambar" i]').first();
    await thumbnail.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {
      console.log(`[EDIT:${taskId}] Thumbnail wait finished.`);
    });
    await page.waitForTimeout(1200);

    // 5. Dismiss any open menu or Material backdrop overlays
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
