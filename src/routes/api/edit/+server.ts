import { json, type RequestHandler } from '@sveltejs/kit';
import { editSchema } from '$lib/server/security/validator';
import { runEditTask } from '$lib/server/gemini/editor';
import { sessionRepo, messageRepo, usageRepo } from '$lib/server/db/repository';
import { authenticateRequest, checkQuotaAndCapability, recordExecutionLog } from '$lib/server/security/quota-guard';
import type { GeneratedImage } from '$lib/types';
import fs from 'node:fs';
import path from 'node:path';

function saveAttachmentPreview(imageInput: string): string {
  if (imageInput.startsWith('data:image/')) {
    const attachFile = `attach_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.png`;
    const fullPath = path.join(path.resolve('output'), attachFile);
    const b64 = imageInput.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(fullPath, Buffer.from(b64, 'base64'));
    return `/output/${attachFile}`;
  }
  return imageInput;
}

export const POST: RequestHandler = async ({ request }) => {
  const startTime = Date.now();
  let authContext: any = null;
  let validatedPrompt = '';
  let validatedSessionId: string | undefined = undefined;

  try {
    // 1. Validate payload
    const body = await request.json().catch(() => ({}));
    const parsed = editSchema.safeParse(body);

    if (!parsed.success) {
      return json({ ok: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { prompt, image, images: multiImages, mode = 'composite', session_id, aspect_ratio, model, count = 1 } = parsed.data;
    validatedPrompt = prompt;
    validatedSessionId = session_id;

    // Consolidate input images array
    const imageList: string[] = multiImages && multiImages.length > 0 ? multiImages : [image!];

    // 2. Authenticate and enforce quota with model cost multiplier
    authContext = await authenticateRequest(request, { required: false });
    const { creditCost: singleCost } = await checkQuotaAndCapability(authContext, 'edit', model);

    // If batch mode: cost is singleCost * imageList.length
    // If composite mode with multi variations: singleCost * count
    const totalCreditCost = mode === 'batch'
      ? singleCost * imageList.length
      : singleCost * count;

    // 3. Save attachment preview URLs cleanly
    const savedAttachmentUrls = imageList.map(saveAttachmentPreview);

    // 4. Save user message with attachment previews
    if (session_id) {
      const sess = await sessionRepo.get(session_id);
      if (sess) {
        await messageRepo.create({
          session_id,
          role: 'user',
          content: prompt,
          attachment_url: savedAttachmentUrls[0] || null,
          attachment_urls: savedAttachmentUrls
        });
      }
    }

    // 5. Run edit workflow (Batch vs Composite vs Multi-Variations)
    let images: GeneratedImage[] = [];

    if (mode === 'batch' && imageList.length > 1) {
      // BATCH MODE: Process each image independently in parallel with slight stagger to avoid Chrome profile contention
      const batchPromises = imageList.map(async (img, idx) => {
        if (idx > 0) await new Promise((r) => setTimeout(r, idx * 800));
        return runEditTask(prompt, img, aspect_ratio, model).catch((err) => {
          console.error(`[BATCH-EDIT:${idx + 1}] Subtask failed:`, err?.message);
          return [] as GeneratedImage[];
        });
      });
      const batchResults = await Promise.all(batchPromises);
      images = batchResults.flat();
    } else if (count > 1) {
      // MULTI VARIATIONS: Run multiple composite turns in parallel with stagger
      const variationPromises = Array.from({ length: count }, async (_, idx) => {
        if (idx > 0) await new Promise((r) => setTimeout(r, idx * 800));
        return runEditTask(prompt, imageList, aspect_ratio, model).catch((err) => {
          console.error(`[MULTI-EDIT:${idx + 1}] Variation failed:`, err?.message);
          return [] as GeneratedImage[];
        });
      });
      const varResults = await Promise.all(variationPromises);
      images = varResults.flat();
    } else {
      // SINGLE / COMPOSITE MODE: All attachments in 1 turn
      images = await runEditTask(prompt, imageList, aspect_ratio, model);
    }

    if (images.length === 0) {
      throw new Error('Gagal menghasilkan gambar hasil edit.');
    }

    const durationMs = Date.now() - startTime;

    // 6. Persist assistant chat message
    if (session_id) {
      const sess = await sessionRepo.get(session_id);
      if (sess && images[0]) {
        await messageRepo.create({
          session_id,
          role: 'assistant',
          content: `Edited: ${prompt}`,
          image_url: images[0].file,
          image_urls: images.map((i) => i.file),
          images,
          width: images[0].width,
          height: images[0].height
        });
      }
    }

    // 7. Record usage and quota increment with creditCost
    await recordExecutionLog({
      auth: authContext,
      action: 'edit',
      prompt,
      durationMs,
      success: true,
      creditCost: totalCreditCost,
      imageCount: images.length,
      outputUrls: images.map((i) => i.file),
      sessionId: session_id
    });

    const trackingId = authContext.user ? authContext.user.id : `guest_${authContext.clientIp}`;
    const quotaStatus = await usageRepo.getQuotaStatus(trackingId, authContext.user?.plan || 'free');

    return json({
      ok: true,
      mode: 'edit',
      editMode: mode,
      prompt,
      images,
      count: images.length,
      quota: quotaStatus,
      duration_ms: durationMs
    });
  } catch (err: any) {
    const durationMs = Date.now() - startTime;

    if (authContext) {
      await recordExecutionLog({
        auth: authContext,
        action: 'edit',
        prompt: validatedPrompt || 'unknown',
        durationMs,
        success: false,
        errorCode: err.message,
        imageCount: 0,
        sessionId: validatedSessionId
      }).catch(() => {});
    }

    return json({ ok: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
};
