import { json, type RequestHandler } from '@sveltejs/kit';
import { sessionRepo, messageRepo } from '$lib/server/db/repository';
import { authenticateRequest } from '$lib/server/security/quota-guard';

export const GET: RequestHandler = async ({ params, request }) => {
  const id = params.id;
  if (!id) return json({ ok: false, error: 'ID sesi tidak valid' }, { status: 400 });

  const auth = await authenticateRequest(request, { required: false });
  const trackingId = auth.user ? auth.user.id : `guest_${auth.clientIp}`;

  const session = await sessionRepo.get(id, trackingId);
  if (!session) return json({ ok: false, error: 'Sesi tidak ditemukan' }, { status: 404 });

  const messages = await messageRepo.listBySession(id);
  return json({ ok: true, session, messages });
};

export const PUT: RequestHandler = async ({ params, request }) => {
  const id = params.id;
  if (!id) return json({ ok: false, error: 'ID sesi tidak valid' }, { status: 400 });

  const auth = await authenticateRequest(request, { required: false });
  const trackingId = auth.user ? auth.user.id : `guest_${auth.clientIp}`;

  const body = await request.json().catch(() => ({}));
  const title = (body.title || '').trim();
  if (!title) return json({ ok: false, error: 'Title wajib diisi' }, { status: 400 });

  const updated = await sessionRepo.updateTitle(id, title, trackingId);
  if (!updated) return json({ ok: false, error: 'Sesi tidak ditemukan' }, { status: 404 });

  return json({ ok: true, id, title });
};

export const DELETE: RequestHandler = async ({ params, request }) => {
  const id = params.id;
  if (!id) return json({ ok: false, error: 'ID sesi tidak valid' }, { status: 400 });

  const auth = await authenticateRequest(request, { required: false });
  const trackingId = auth.user ? auth.user.id : `guest_${auth.clientIp}`;

  const deleted = await sessionRepo.delete(id, trackingId);
  if (!deleted) return json({ ok: false, error: 'Sesi tidak ditemukan' }, { status: 404 });
  return json({ ok: true });
};
