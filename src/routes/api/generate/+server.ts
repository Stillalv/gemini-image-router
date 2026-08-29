import { json, type RequestHandler } from '@sveltejs/kit';
import { generateSchema } from '$lib/server/security/validator';
import { runGenerateTask } from '$lib/server/gemini/generator';
import { sessionRepo, messageRepo } from '$lib/server/db/repository';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = generateSchema.safeParse(body);

    if (!parsed.success) {
      return json({ ok: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { prompt, session_id } = parsed.data;
    let currentSessionId = session_id;

    // If session_id provided, create user message
    if (currentSessionId && sessionRepo.get(currentSessionId)) {
      messageRepo.create({
        session_id: currentSessionId,
        role: 'user',
        content: prompt
      });
    }

    // Run generation workflow
    const images = await runGenerateTask(prompt);

    // Save assistant message to session if exists
    if (currentSessionId && sessionRepo.get(currentSessionId) && images[0]) {
      messageRepo.create({
        session_id: currentSessionId,
        role: 'assistant',
        content: `Generated ${images.length} image(s)`,
        image_url: images[0].file,
        width: images[0].width,
        height: images[0].height
      });
    }

    return json({
      ok: true,
      mode: 'generate',
      prompt,
      images,
      count: images.length,
      session_id: currentSessionId
    });
  } catch (err: any) {
    console.error('[API] /api/generate error:', err.message);
    return json({ ok: false, error: err.message || 'Internal error' }, { status: 500 });
  }
};
