import { json, type RequestHandler } from '@sveltejs/kit';
import { authenticateRequest } from '$lib/server/security/quota-guard';
import { userRepo, usageRepo, planRepo } from '$lib/server/db/repository';
import type { PlanType } from '$lib/types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const auth = await authenticateRequest(request, { required: true });
    if (!auth.user) {
      return json({ ok: false, error: 'Silakan login terlebih dahulu untuk mengubah paket.' }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    const { plan } = body;

    const validPlans: PlanType[] = ['free', 'pro', 'ultra'];
    if (!plan || !validPlans.includes(plan)) {
      return json({ ok: false, error: 'Pilihan plan tidak valid (free, pro, ultra)' }, { status: 400 });
    }

    await userRepo.updatePlan(auth.user.id, plan);
    const updatedQuota = await usageRepo.getQuotaStatus(auth.user.id, plan);

    return json({
      ok: true,
      message: `Plan berhasil diperbarui menjadi ${plan.toUpperCase()}`,
      plan,
      quota: updatedQuota
    });
  } catch (err: any) {
    return json({ ok: false, error: err.message }, { status: 401 });
  }
};
