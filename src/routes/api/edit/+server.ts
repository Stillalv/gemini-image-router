import { json, type RequestHandler } from '@sveltejs/kit';
import { editSchema } from '$lib/server/security/validator';
import { runEditTask } from '$lib/server/gemini/editor';
import { sessionRepo, messageRepo } from '$lib/server/db/repository';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = editSchema.safeParse(body);

    if (!parsed.success) {
      return json({ ok: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { prompt, image, session_id } = parsed.data;
    let currentSessionId = session_id;

    // Save attachment preview image cleanly
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

    // Save user message with attachment preview
    if (currentSessionId && sessionRepo.get(currentSessionId)) {
      messageRepo.create({
        session_id: currentSessionId,
        role: 'user',
        content: prompt,
        attachment_url: savedAttachmentUrl
      });
    }

    // Run edit workflow
    const images = await runEditTask(prompt, image);

    // Save assistant message to session
    if (currentSessionId && sessionRepo.get(currentSessionId) && images[0]) {
      messageRepo.create({
        session_id: currentSessionId,
        role: 'assistant',
        content: `Edited image with prompt: "${prompt}"`,
        image_url: images[0].file,
        width: images[0].width,
        height: images[0].height
      });
    }

    return json({
      ok: true,
      mode: 'edit',
      prompt,
      images,
      count: images.length,
      session_id: currentSessionId
    });
  } catch (err: any) {
    console.error('[API] /api/edit error:', err.message);
    return json({ ok: false, error: err.message || 'Internal error' }, { status: 500 });
  }
};
