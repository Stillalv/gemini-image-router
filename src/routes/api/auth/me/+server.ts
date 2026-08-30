import { json, type RequestHandler } from '@sveltejs/kit';
import { authenticateRequest } from '$lib/server/security/quota-guard';
import { usageRepo } from '$lib/server/db/repository';

export const GET: RequestHandler = async ({ request }) => {
  try {
    const auth = await authenticateRequest(request, { required: false });

    if (auth.isGuest || !auth.user) {
      const quota = await usageRepo.getQuotaStatus(`guest_${auth.clientIp}`, 'free');
      return json({
        ok: true,
        isLoggedIn: false,
        user: null,
        quota
      });
    }

    const quota = await usageRepo.getQuotaStatus(auth.user.id, auth.user.plan);
    return json({
      ok: true,
      isLoggedIn: true,
      user: {
        id: auth.user.id,
        name: auth.user.name,
        email: auth.user.email,
        plan: auth.user.plan,
        role: auth.user.role
      },
      quota
    });
  } catch (err: any) {
    return json({ ok: false, error: err.message }, { status: 500 });
  }
};
