import { json, type RequestHandler } from '@sveltejs/kit';
import { userRepo, usageRepo } from '$lib/server/db/repository';
import { hashPassword, generateSessionToken } from '$lib/server/security/auth';
import type { PlanType } from '$lib/types';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const { name, email, password, plan } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return json({ ok: false, error: 'Nama minimal 2 karakter.' }, { status: 400 });
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return json({ ok: false, error: 'Format email tidak valid.' }, { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return json({ ok: false, error: 'Password minimal 6 karakter.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await userRepo.findByEmail(cleanEmail);
    if (existing) {
      return json({ ok: false, error: 'Email sudah terdaftar. Silakan login.' }, { status: 409 });
    }

    const passwordHash = hashPassword(password);
    const selectedPlan: PlanType = (['free', 'pro', 'ultra'].includes(plan) ? plan : 'ultra') as PlanType;

    const newUser = await userRepo.create(name, cleanEmail, passwordHash, selectedPlan);
    const sessionToken = generateSessionToken();
    await userRepo.addSessionToken(newUser.id, sessionToken);

    // Set authentication cookie
    cookies.set('gem_sess_token', sessionToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });

    const quota = await usageRepo.getQuotaStatus(newUser.id);

    return json({
      ok: true,
      message: 'Registrasi berhasil!',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        plan: newUser.plan,
        role: newUser.role
      },
      quota,
      sessionToken
    });
  } catch (err: any) {
    return json({ ok: false, error: err.message }, { status: 500 });
  }
};
