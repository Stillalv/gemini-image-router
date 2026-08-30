import { json, type RequestHandler } from '@sveltejs/kit';
import { authenticateRequest } from '$lib/server/security/quota-guard';
import { userRepo } from '$lib/server/db/repository';

export const GET: RequestHandler = async ({ request }) => {
  try {
    const auth = await authenticateRequest(request, { required: true });
    if (!auth.user) {
      return json({ ok: false, error: 'Silakan login terlebih dahulu.' }, { status: 401 });
    }
    const user = await userRepo.findById(auth.user.id);
    const keys = (user?.apiKeys || []).map((k) => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt
    }));

    return json({ ok: true, keys });
  } catch (err: any) {
    return json({ ok: false, error: err.message }, { status: 401 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const auth = await authenticateRequest(request, { required: true });
    if (!auth.user) {
      return json({ ok: false, error: 'Silakan login terlebih dahulu.' }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    const name = (body.name || 'API Key').toString().trim().slice(0, 50);

    const { rawKey, keyItem } = await userRepo.createApiKey(auth.user.id, name);

    return json({
      ok: true,
      apiKey: {
        id: keyItem.id,
        name: keyItem.name,
        keyPrefix: keyItem.keyPrefix,
        rawKey, // Returned ONLY once upon creation!
        createdAt: keyItem.createdAt
      }
    });
  } catch (err: any) {
    return json({ ok: false, error: err.message }, { status: 401 });
  }
};
