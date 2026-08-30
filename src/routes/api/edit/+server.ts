import { json, type RequestHandler } from '@sveltejs/kit';
import { editSchema } from '$lib/server/security/validator';
import { runEditTask } from '$lib/server/gemini/editor';
import { sessionRepo, messageRepo, usageRepo } from '$lib/server/db/repository';
import { authenticateRequest, checkQuotaAndCapability, recordExecutionLog } from '$lib/server/security/quota-guard';

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

    const { prompt, image, session_id, aspect_ratio, model } = parsed.data;
    validatedPrompt = prompt;
    validatedSessionId = session_id;

    // 2. Authenticate and enforce quota with model cost multiplier
    authContext = await authenticateRequest(request, { required: false });
    const { creditCost } = await checkQuotaAndCapability(authContext, 'edit', model);

    // 3. Save attachment preview image cleanly
    let savedAttachmentUrl: string | null = null;
    if (image.startsWith('data:image/')) {
      const fs = await import('node:fs');
      const path = await import('node:path');
      const attachFile = `attach_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.png`;
      const fullPath = path.join(path.resolve('output'), attachFile);
      const b64 = image.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(fullPath, Buffer.from(b64, 'base64'));
      savedAttachmentUrl = `/output/${attachFile}`;
    } else if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('/output/')) {
      savedAttachmentUrl = image;
    }

    // 4. Save user message with attachment preview
    if (session_id) {
      const sess = await sessionRepo.get(session_id);
      if (sess) {
        await messageRepo.create({
          session_id,
          role: 'user',
          content: prompt,
          attachment_url: savedAttachmentUrl
        });
      }
    }

    // 5. Run edit workflow
    const images = await runEditTask(prompt, image, aspect_ratio, model);
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
      creditCost,
      imageCount: images.length,
      outputUrls: images.map((i) => i.file),
      sessionId: session_id
    });

    const trackingId = authContext.user ? authContext.user.id : `guest_${authContext.clientIp}`;
    const quotaStatus = await usageRepo.getQuotaStatus(trackingId, authContext.user?.plan || 'free');

    return json({
      ok: true,
      mode: 'edit',
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

    return json(
      {
        ok: false,
        error: err.message || 'Gagal mengedit gambar'
      },
      { status: err.message?.includes('kuota') ? 429 : 500 }
    );
  }
};
