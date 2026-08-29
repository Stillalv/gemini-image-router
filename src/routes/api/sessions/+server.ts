import { json, type RequestHandler } from '@sveltejs/kit';
import { sessionRepo } from '$lib/server/db/repository';
import { sessionCreateSchema } from '$lib/server/security/validator';

export const GET: RequestHandler = async () => {
  const sessions = sessionRepo.list();
  return json({ ok: true, sessions });
};

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json().catch(() => ({}));
  const parsed = sessionCreateSchema.safeParse(body);
  if (!parsed.success) {
    return json({ ok: false, error: parsed.error.issues[0].message }, { status: 400 });
  }

  const title = parsed.data.title || (parsed.data.type === 'edit' ? 'Sesi Edit Baru' : 'Sesi Gambar Baru');
  const session = sessionRepo.create(title, parsed.data.type);
  return json({ ok: true, session });
};
