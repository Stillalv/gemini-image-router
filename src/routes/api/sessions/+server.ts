import { json, type RequestHandler } from '@sveltejs/kit';
import { sessionRepo } from '$lib/server/db/repository';
import { sessionCreateSchema } from '$lib/server/security/validator';
import { authenticateRequest } from '$lib/server/security/quota-guard';

export const GET: RequestHandler = async ({ request }) => {
  const auth = await authenticateRequest(request, { required: false });
  const trackingId = auth.user ? auth.user.id : `guest_${auth.clientIp}`;
  const sessions = await sessionRepo.list(trackingId);
  return json({ ok: true, sessions });
};

export const POST: RequestHandler = async ({ request }) => {
  const auth = await authenticateRequest(request, { required: false });
  const trackingId = auth.user ? auth.user.id : `guest_${auth.clientIp}`;

  const body = await request.json().catch(() => ({}));
  const parsed = sessionCreateSchema.safeParse(body);
  if (!parsed.success) {
    return json({ ok: false, error: parsed.error.issues[0].message }, { status: 400 });
  }

  const title = parsed.data.title || (parsed.data.type === 'edit' ? 'Sesi Edit Baru' : 'Sesi Gambar Baru');
  const session = await sessionRepo.create(title, parsed.data.type, trackingId);
  return json({ ok: true, session });
};
