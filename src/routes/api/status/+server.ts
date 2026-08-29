import { json, type RequestHandler } from '@sveltejs/kit';
import { getPoolStatus } from '$lib/server/browser/pool';

export const GET: RequestHandler = async () => {
  const status = getPoolStatus();
  return json({ ok: true, ...status });
};
