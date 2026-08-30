import { json, type RequestHandler } from '@sveltejs/kit';
import { userRepo } from '$lib/server/db/repository';
import { parseCookies } from '$lib/server/security/auth';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const parsed = parseCookies(request.headers.get('cookie'));
    const token = parsed['gem_sess_token'];

    if (token) {
      const user = await userRepo.findBySessionToken(token);
      if (user) {
        await userRepo.removeSessionToken(user.id, token);
      }
    }

    cookies.delete('gem_sess_token', { path: '/' });
    return json({ ok: true, message: 'Logout berhasil' });
  } catch (err: any) {
    return json({ ok: false, error: err.message }, { status: 500 });
  }
};
