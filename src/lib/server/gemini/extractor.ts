import type { Page } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { OUTPUT_DIR } from '../security/path-guard';
import type { GeneratedImage } from '$lib/types';

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

export async function extractGeneratedImages(
  page: Page,
  existingImages: string[],
  prefix: 'gen' | 'edit' = 'gen',
  timeoutMs: number = 85000
): Promise<GeneratedImage[]> {
  const start = Date.now();
  let extracted: Array<{ publicUrl?: string; dataUrl?: string; src: string; width: number; height: number; alt: string }> = [];

  // Listen to network responses to capture the exact public Google CDN URL
  const capturedCdnUrls: string[] = [];
  const onResponse = (res: any) => {
    try {
      const url = res.url();
      if (
        (url.includes('googleusercontent.com') || url.includes('generativeai.google.com')) &&
        !url.includes('avatar') &&
        !url.includes('profile') &&
        !url.includes('sparkle') &&
        !url.includes('gstatic')
      ) {
        console.log('[NETWORK] Intercepted Google CDN Image URL:', url.slice(0, 100));
        capturedCdnUrls.push(url);
      }
    } catch {}
  };
  page.on('response', onResponse);

  try {
    while (Date.now() - start < timeoutMs) {
      await page.waitForTimeout(800);
      const elapsed = Math.round((Date.now() - start) / 1000);

    const candidates = await page.evaluate((existing) => {
      // 1. Locate model response containers in the DOM hierarchy
      const responseContainers = [
        ...document.querySelectorAll('model-response, [data-message-author-role="model"], .model-response-text, .response-container, message-content')
      ];

      if (!responseContainers.length) return [];

      // Focus on the latest model response
      const latestResponse = responseContainers[responseContainers.length - 1];

      // 2. Select the specific generated image element inside the model response
      const modelImgs = [
        ...latestResponse.querySelectorAll('button.image-button img, .overlay-container img, image-viewer img, img.image, img.animate.loaded')
      ];

      const valid: Array<{ publicUrl?: string; dataUrl?: string; src: string; width: number; height: number; alt: string }> = [];

      for (const img of modelImgs) {
        const el = img as HTMLImageElement;
        const w = el.naturalWidth || el.clientWidth || 0;
        const h = el.naturalHeight || el.clientHeight || 0;
        const src = el.src || '';

        // Check if there is an explicit Google CDN public URL on the element or parent
        const parentBtn = el.closest('button, a');
        const candidateUrl = el.getAttribute('src') || el.src || '';
        const isGoogleCdn = candidateUrl.startsWith('https://lh3.googleusercontent.com') || candidateUrl.startsWith('https://generativeai.google.com');

        // Must have loaded source and not be a previously seen image
        if (src && !existing.includes(src) && w > 0 && h > 0) {
          if (isGoogleCdn) {
            valid.push({ publicUrl: candidateUrl, src, width: w, height: h, alt: el.alt || '' });
          } else {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext('2d')!;
              ctx.drawImage(el, 0, 0);
              const dataUrl = canvas.toDataURL('image/png');
              valid.push({ dataUrl, src: src.slice(0, 120), width: w, height: h, alt: el.alt || '' });
            } catch {
              valid.push({ src, width: w, height: h, alt: el.alt || '' });
            }
          }
        }
      }
      return valid;
    }, existingImages).catch(() => []);

    if (candidates.length > 0) {
      console.log(`[EXTRACTOR] Found ${candidates.length} Imagen image element(s) inside model-response (${candidates[0].width}x${candidates[0].height}) in ${elapsed}s`);
      extracted = candidates;
      break;
    }

    // Auto-detect if Gemini replied with text only and re-prompt to generate image
    if (elapsed >= 14 && elapsed <= 20) {
      const sendBtnReady = await page.locator('button[aria-label*="Kirim" i], button[aria-label*="Send" i], button.send-button, [data-test-id="send-button"]').first().isVisible().catch(() => false);
      if (sendBtnReady) {
        console.log(`[EXTRACTOR] Gemini replied with text only after ${elapsed}s, injecting follow-up force image directive...`);
        const input = page.locator('rich-textarea div[contenteditable="true"], div.ql-editor[contenteditable="true"], div[role="textbox"]').first();
        if (await input.count()) {
          await input.click({ force: true }).catch(() => {});
          await page.keyboard.type('Hasilkan dan buatkan gambar visualnya sekarang juga (generate the image now)', { delay: 6 }).catch(() => {});
          await page.keyboard.press('Enter').catch(() => {});
          await page.waitForTimeout(2500);
        }
      }
    }

    const bodyText = await page.evaluate(() => document.body.innerText.slice(-1500)).catch(() => '');
    if (/tidak dapat membuat gambar|can't generate images|rate limit|coba lagi beberapa saat/i.test(bodyText)) {
      break;
    }
  }

  if (!extracted.length) {
    const shot = `fail_${Date.now()}.png`;
    await page.screenshot({ path: path.join(OUTPUT_DIR, shot), fullPage: true }).catch(() => {});
    throw new Error('Gagal mendeteksi gambar hasil generasi. Pastikan prompt dan gambar sesuai kebijakan Gemini.');
  }

  const saved: GeneratedImage[] = [];
  for (let i = 0; i < extracted.length; i++) {
    const item = extracted[i];
    const filename = `${prefix}_${Date.now()}_${i}.png`;
    const filePath = path.join(OUTPUT_DIR, filename);

    if (item.dataUrl) {
      const b64 = item.dataUrl.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(filePath, Buffer.from(b64, 'base64'));
    } else {
      const loc = page.locator(`img[src="${item.src}"]`).first();
      if (await loc.count()) {
        await loc.screenshot({ path: filePath });
      }
    }

    saved.push({
      file: `/output/${filename}`,
      localPath: filePath,
      width: item.width,
      height: item.height,
      alt: item.alt
    });
  }

  const totalTime = Math.round((Date.now() - start) / 1000);
  console.log(`[EXTRACTOR] Successfully delivered ${saved.length} image(s) in ${totalTime}s -> ${saved[0]?.file}`);
  return saved;
  } finally {
    page.off('response', onResponse);
  }
}
