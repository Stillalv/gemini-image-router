import type { Page, Response } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { OUTPUT_DIR } from '../security/path-guard';
import type { GeneratedImage } from '$lib/types';

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

export async function extractGeneratedImages(
  page: Page,
  existingImages: string[],
  prefix: 'gen' | 'edit' = 'gen',
  timeoutMs: number = 130000
): Promise<GeneratedImage[]> {
  const start = Date.now();
  let extracted: Array<{ publicUrl?: string; dataUrl?: string; src: string; width: number; height: number; alt: string }> = [];

  // 1. Dual-Layer Capture: Network stream interception
  const capturedCdnUrls: string[] = [];
  const interceptedBuffers: Array<{ buffer: Buffer; url: string }> = [];

  const onResponse = async (res: Response) => {
    try {
      const url = res.url();
      const contentType = res.headers()['content-type'] || '';

      if (
        (url.includes('googleusercontent.com') || url.includes('generativeai.google.com')) &&
        !url.includes('/a/') &&
        !url.includes('/ogw/') &&
        !url.includes('/p/') &&
        !url.includes('avatar') &&
        !url.includes('profile') &&
        !url.includes('sparkle') &&
        !url.includes('gstatic') &&
        !existingImages.includes(url)
      ) {
        if (!capturedCdnUrls.includes(url)) {
          console.log('[NETWORK] Intercepted Google CDN Image Stream:', url.slice(0, 95));
          capturedCdnUrls.push(url);
        }

        if (contentType.startsWith('image/') || url.includes('=s') || url.includes('=w')) {
          const buf = await res.body().catch(() => null);
          if (buf && buf.length > 4000) {
            interceptedBuffers.push({ buffer: buf, url });
          }
        }
      }
    } catch {}
  };
  page.on('response', onResponse);

  try {
    let lastLog = 0;
    while (Date.now() - start < timeoutMs) {
      await page.waitForTimeout(1000);
      const elapsed = Math.round((Date.now() - start) / 1000);

      // Periodically log generation status
      if (elapsed - lastLog >= 5) {
        lastLog = elapsed;
        console.log(`[EXTRACTOR] Waiting for Gemini output... (${elapsed}s elapsed)`);
      }

      // Check DOM candidate images with in-memory Canvas rendering
      const candidates = await page.evaluate((existing) => {
        // 1. Locate latest model response container ONLY
        const responseContainers = [
          ...document.querySelectorAll('model-response, [data-message-author-role="model"], .model-response-text, .response-container, message-content, assistant-messages-primary')
        ];

        if (responseContainers.length === 0) return [];
        const latestTurn = responseContainers[responseContainers.length - 1];

        // 2. Query image elements STRICTLY inside the latest model response turn
        const turnImgs = Array.from(latestTurn.querySelectorAll('img'));
        const valid: Array<{ publicUrl?: string; dataUrl?: string; src: string; width: number; height: number; alt: string }> = [];

        for (const img of turnImgs) {
          const el = img as HTMLImageElement;
          const src = el.getAttribute('src') || el.src || '';
          const alt = el.alt || '';

          // Exclude Google account avatars, profile photos, icons, and upload thumbnails
          if (
            !src ||
            src.includes('gstatic.com') ||
            src.includes('/a/') ||
            src.includes('/ogw/') ||
            src.includes('/p/') ||
            src.includes('profile') ||
            src.includes('avatar') ||
            src.includes('sparkle') ||
            src.includes('gb_') ||
            alt.toLowerCase().includes('uploaded image preview') ||
            alt.toLowerCase().includes('pratinjau') ||
            alt.toLowerCase().includes('preview') ||
            alt.toLowerCase().includes('profile') ||
            alt.toLowerCase().includes('avatar') ||
            el.closest('header, nav, aside, .input-area, rich-textarea, .thumbnail-container, user-query-container, user-message, .user-query, .user-bubble')
          ) {
            continue;
          }

          // If it is already in existing images captured before sending prompt, skip
          if (existing.includes(src)) {
            continue;
          }

          const w = el.naturalWidth || el.clientWidth || 0;
          const h = el.naturalHeight || el.clientHeight || 0;
          const isGoogleCdn = src.startsWith('https://lh3.googleusercontent.com') || src.startsWith('https://generativeai.google.com');

          // Attempt in-memory canvas render
          let dataUrl: string | undefined = undefined;
          try {
            const canvas = document.createElement('canvas');
            canvas.width = w || 1024;
            canvas.height = h || 1024;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(el, 0, 0);
              dataUrl = canvas.toDataURL('image/png');
            }
          } catch {}

          valid.push({
            dataUrl,
            publicUrl: isGoogleCdn ? src : undefined,
            src,
            width: w || 1024,
            height: h || 1024,
            alt: alt || 'Gemini generated image'
          });
        }
        return valid;
      }, existingImages).catch(() => []);

      if (candidates.length > 0) {
        console.log(`[EXTRACTOR] Found ${candidates.length} Imagen image element(s) (${candidates[0].width}x${candidates[0].height}) in ${elapsed}s`);
        extracted = candidates;
        break;
      }

      // Check if generation finished and check for error/refusal text
      const status = await page.evaluate(() => {
        // Is stop button active?
        const stopBtn = document.querySelector('button[aria-label*="Stop" i], button[aria-label*="Hentikan" i], [data-test-id="stop-button"], .stop-button');
        const isGenerating = stopBtn !== null;

        // Is placeholder active?
        const placeholder = document.querySelector('.image-placeholder, [aria-label*="Membuat" i], [aria-label*="Generating" i], .generating-image');
        const isPlaceholderActive = placeholder !== null;

        // Check response text
        const responseContainers = document.querySelectorAll('model-response, [data-message-author-role="model"], message-content');
        let text = '';
        if (responseContainers.length > 0) {
          text = responseContainers[responseContainers.length - 1].textContent?.trim() || '';
        }

        const isRefusal = /tidak dapat membuat gambar|can't generate images|tidak dapat mengedit|cannot edit|cannot create a new image|since i cannot|cannot create|i am unable to create|rate limit|coba lagi beberapa saat|policy violation|maaf, saya tidak bisa/i.test(text);

        return { isGenerating, isPlaceholderActive, isRefusal, text };
      }).catch(() => ({ isGenerating: false, isPlaceholderActive: false, isRefusal: false, text: '' }));

      if (status.isRefusal) {
        console.warn(`[EXTRACTOR] Gemini returned refusal/error text: "${status.text.slice(0, 100)}..."`);
        throw new Error(`Gemini merespons teks tanpa gambar: ${status.text.slice(0, 120)}`);
      }

      // If network intercepted buffers are available and stop button disappeared
      if (interceptedBuffers.length > 0 && !status.isGenerating && !status.isPlaceholderActive && elapsed > 10) {
        console.log(`[EXTRACTOR] Generation completed and captured ${interceptedBuffers.length} network image buffer(s)!`);
        break;
      }
    }

    // 2. Process extracted or intercepted images (NEVER use loc.screenshot)
    const saved: GeneratedImage[] = [];

    // Fallback: If DOM extraction missed but network buffer captured
    if (!extracted.length && interceptedBuffers.length > 0) {
      console.log(`[EXTRACTOR] Saving ${interceptedBuffers.length} image(s) directly from network stream!`);
      for (let i = 0; i < interceptedBuffers.length; i++) {
        const item = interceptedBuffers[i];
        const filename = `${prefix}_${Date.now()}_${i}.png`;
        const filePath = path.join(OUTPUT_DIR, filename);
        fs.writeFileSync(filePath, item.buffer);

        saved.push({
          file: `/output/${filename}`,
          localPath: filePath,
          width: 1024,
          height: 1024,
          alt: 'Gemini edited image'
        });
      }
      return saved;
    }

    if (!extracted.length) {
      const shot = `fail_${Date.now()}.png`;
      await page.screenshot({ path: path.join(OUTPUT_DIR, shot), fullPage: true }).catch(() => {});
      throw new Error('Gagal mendeteksi gambar hasil generasi dari Gemini. Pastikan prompt dan gambar tidak melanggar kebijakan Gemini.');
    }

    for (let i = 0; i < extracted.length; i++) {
      const item = extracted[i];
      const filename = `${prefix}_${Date.now()}_${i}.png`;
      const filePath = path.join(OUTPUT_DIR, filename);

      if (item.dataUrl && item.dataUrl.startsWith('data:image/')) {
        const b64 = item.dataUrl.replace(/^data:image\/\w+;base64,/, '');
        fs.writeFileSync(filePath, Buffer.from(b64, 'base64'));
      } else if (interceptedBuffers.length > 0) {
        fs.writeFileSync(filePath, interceptedBuffers[0].buffer);
      } else if (item.src.startsWith('http://') || item.src.startsWith('https://')) {
        // Direct download via page context request (bypasses DOM visibility and scroll requirements)
        const resp = await page.request.get(item.src).catch(() => null);
        if (resp && resp.ok()) {
          const buf = await resp.body();
          fs.writeFileSync(filePath, buf);
        } else {
          const nodeRes = await fetch(item.src).catch(() => null);
          if (nodeRes && nodeRes.ok) {
            const ab = await nodeRes.arrayBuffer();
            fs.writeFileSync(filePath, Buffer.from(ab));
          }
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
