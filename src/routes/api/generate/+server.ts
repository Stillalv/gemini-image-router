import { json, type RequestHandler } from '@sveltejs/kit';
import { generateSchema } from '$lib/server/security/validator';
import { runGenerateTask } from '$lib/server/gemini/generator';
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
    const parsed = generateSchema.safeParse(body);

    if (!parsed.success) {
      return json({ ok: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { prompt, session_id, aspect_ratio, model } = parsed.data;
    validatedPrompt = prompt;
    validatedSessionId = session_id;

    // 2. Authenticate and enforce quota with model cost multiplier
    authContext = await authenticateRequest(request, { required: false });
    const { creditCost } = await checkQuotaAndCapability(authContext, 'generate', model);

    // 3. Persist user chat message if session exists
    if (session_id) {
      const sess = await sessionRepo.get(session_id);
      if (sess) {
        await messageRepo.create({
          session_id,
          role: 'user',
          content: prompt
        });
      }
    }

    // 4. Execute generation workflow
    const images = await runGenerateTask(prompt, aspect_ratio, model);
    const durationMs = Date.now() - startTime;

    // 5. Persist assistant chat message
    if (session_id) {
      const sess = await sessionRepo.get(session_id);
      if (sess && images[0]) {
        await messageRepo.create({
          session_id,
          role: 'assistant',
          content: `Generated ${images.length} image(s)`,
          image_url: images[0].file,
          width: images[0].width,
          height: images[0].height
        });
      }
    }

    // 6. Record usage and quota increment with creditCost
    await recordExecutionLog({
      auth: authContext,
      action: 'generate',
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
      mode: 'generate',
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
        action: 'generate',
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
        error: err.message || 'Gagal menghasilkan gambar'
      },
      { status: err.message?.includes('kuota') ? 429 : 500 }
    );
  }
};
