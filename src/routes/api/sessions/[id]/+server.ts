import { json, type RequestHandler } from '@sveltejs/kit';
import { sessionRepo, messageRepo } from '$lib/server/db/repository';

export const GET: RequestHandler = async ({ params }) => {
  const id = params.id;
  if (!id) return json({ ok: false, error: 'ID sesi tidak valid' }, { status: 400 });

  const session = sessionRepo.get(id);
  if (!session) return json({ ok: false, error: 'Sesi tidak ditemukan' }, { status: 404 });

  const messages = messageRepo.listBySession(id);
  return json({ ok: true, session, messages });
};

export const PUT: RequestHandler = async ({ params, request }) => {
  const id = params.id;
  if (!id) return json({ ok: false, error: 'ID sesi tidak valid' }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const title = (body.title || '').trim();
  if (!title) return json({ ok: false, error: 'Title wajib diisi' }, { status: 400 });

  const updated = sessionRepo.updateTitle(id, title);
  if (!updated) return json({ ok: false, error: 'Sesi tidak ditemukan' }, { status: 404 });

  return json({ ok: true, id, title });
};

export const DELETE: RequestHandler = async ({ params }) => {
  const id = params.id;
  if (!id) return json({ ok: false, error: 'ID sesi tidak valid' }, { status: 400 });

  const deleted = sessionRepo.delete(id);
  return json({ ok: deleted });
};
