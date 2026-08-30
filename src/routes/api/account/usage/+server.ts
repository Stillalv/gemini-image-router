import { json, type RequestHandler } from '@sveltejs/kit';
import { authenticateRequest } from '$lib/server/security/quota-guard';
import { usageRepo, planRepo } from '$lib/server/db/repository';

export const GET: RequestHandler = async ({ request }) => {
  try {
    const auth = await authenticateRequest(request, { required: false });
    const plans = await planRepo.list();

    if (auth.isGuest || !auth.user) {
      const guestId = `guest_${auth.clientIp}`;
      const quota = await usageRepo.getQuotaStatus(guestId, 'free');
      const history = await usageRepo.getHistory(guestId, 7);

      return json({
        ok: true,
        isLoggedIn: false,
        user: null,
        quota,
        plans,
        history
      });
    }

    const quota = await usageRepo.getQuotaStatus(auth.user.id, auth.user.plan);
    const history = await usageRepo.getHistory(auth.user.id, 7);

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
      quota,
      plans,
      history
    });
  } catch (err: any) {
    return json({ ok: false, error: err.message }, { status: 500 });
  }
};
