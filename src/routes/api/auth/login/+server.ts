import { json, type RequestHandler } from '@sveltejs/kit';
import { userRepo, usageRepo } from '$lib/server/db/repository';
import { verifyPassword, generateSessionToken } from '$lib/server/security/auth';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return json({ ok: false, error: 'Email dan password wajib diisi.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await userRepo.findByEmail(cleanEmail);

    if (!user) {
      return json({ ok: false, error: 'Email atau password tidak valid.' }, { status: 401 });
    }

    if (user.passwordHash && !verifyPassword(password, user.passwordHash)) {
      return json({ ok: false, error: 'Email atau password tidak valid.' }, { status: 401 });
    }

    const sessionToken = generateSessionToken();
    await userRepo.addSessionToken(user.id, sessionToken);

    // Set authentication cookie
    cookies.set('gem_sess_token', sessionToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });

    const quota = await usageRepo.getQuotaStatus(user.id);

    return json({
      ok: true,
      message: 'Login berhasil!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        role: user.role
      },
      quota,
      sessionToken
    });
  } catch (err: any) {
    return json({ ok: false, error: err.message }, { status: 500 });
  }
};
