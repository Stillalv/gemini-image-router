import { json, type RequestHandler } from '@sveltejs/kit';
import { authenticateRequest } from '$lib/server/security/quota-guard';
import { userRepo } from '$lib/server/db/repository';

export const DELETE: RequestHandler = async ({ params, request }) => {
  try {
    const auth = await authenticateRequest(request, { required: true });
    if (!auth.user) {
      return json({ ok: false, error: 'Silakan login terlebih dahulu.' }, { status: 401 });
    }
    const keyId = params.id;

    if (!keyId) {
      return json({ ok: false, error: 'Key ID wajib disertakan' }, { status: 400 });
    }

    const revoked = await userRepo.revokeApiKey(auth.user.id, keyId);
    if (!revoked) {
      return json({ ok: false, error: 'API Key tidak ditemukan atau gagal dicabut' }, { status: 404 });
    }

    return json({ ok: true, message: 'API Key berhasil dicabut' });
  } catch (err: any) {
    return json({ ok: false, error: err.message }, { status: 401 });
  }
};
