import { userRepo, planRepo, usageRepo, usageLogRepo } from '../db/repository';
import { parseCookies } from './auth';
import type { UserAccount, SessionType, ApiKeyItem, QuotaStatus, PlanType } from '$lib/types';

export interface AuthContext {
  user: UserAccount | null;
  apiKey?: ApiKeyItem;
  clientIp: string;
  userAgent: string;
  isGuest: boolean;
}

export async function authenticateRequest(
  request: Request,
  options: { required?: boolean } = {}
): Promise<AuthContext> {
  const authHeader = request.headers.get('Authorization') || request.headers.get('x-api-key') || '';
  const clientIp = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || 'Unknown';

  // 1. API Key Authentication (Bearer gem_sec_...)
  if (authHeader.startsWith('Bearer gem_sec_') || authHeader.startsWith('gem_sec_')) {
    const rawKey = authHeader.replace(/^Bearer\s+/i, '').trim();
    const result = await userRepo.findByApiKey(rawKey);
    if (!result) {
      throw new Error('API Key tidak valid atau telah dicabut.');
    }
    return { user: result.user, apiKey: result.apiKey, clientIp, userAgent, isGuest: false };
  }

  // 2. Cookie Session Token Authentication
  const cookies = parseCookies(request.headers.get('cookie'));
  const sessionToken = cookies['gem_sess_token'] || authHeader.replace(/^Bearer\s+/i, '').trim();

  if (sessionToken && sessionToken.startsWith('gem_sess_')) {
    const sessionUser = await userRepo.findBySessionToken(sessionToken);
    if (sessionUser) {
      return { user: sessionUser, clientIp, userAgent, isGuest: false };
    }
  }

  // 3. If authentication is strictly required and not present
  if (options.required) {
    throw new Error('Silakan login terlebih dahulu untuk mengakses fitur ini.');
  }

  // 4. Guest / Anonymous User (Unauthenticated)
  return { user: null, clientIp, userAgent, isGuest: true };
}

export const MODEL_COST_MAP: Record<string, number> = {
  '3.5-flash-lite': 1,
  '3.7-flash': 2,
  '3.1-pro': 3,
  'extended-thinking': 4
};

export async function checkQuotaAndCapability(
  auth: AuthContext,
  action: SessionType,
  modelId?: string
): Promise<{ quota: QuotaStatus; creditCost: number }> {
  let planId: PlanType = 'free';
  let trackingId = `guest_${auth.clientIp}`;

  if (auth.user) {
    planId = auth.user.plan;
    trackingId = auth.user.id;
  }

  const plan = await planRepo.get(planId);
  const quota = await usageRepo.getQuotaStatus(trackingId, planId);
  const creditCost = MODEL_COST_MAP[modelId || '3.7-flash'] || 2;

  if (action === 'edit' && !plan.allowImageEditing) {
    throw new Error(`Plan "${plan.name}" tidak mendukung fitur Image-to-Image editing. Silakan upgrade ke Pro/Ultra.`);
  }

  if (quota.usedToday + creditCost > plan.maxDaily) {
    if (auth.isGuest) {
      throw new Error(
        `Batas kuota harian akun Tamu (${plan.maxDaily} request/hari) tidak mencukupi untuk model ini (membutuhkan ${creditCost} kredit). Silakan Daftar/Login untuk mendapatkan Paket Ultra (1.000 request/hari).`
      );
    }
    throw new Error(
      `Sisa kuota harian Anda (${quota.remainingToday} kredit pada ${plan.name}) tidak mencukupi untuk menjalankan model ini (${creditCost} kredit). Kuota akan direset otomatis pukul 00:00 WIB.`
    );
  }

  return { quota, creditCost };
}

export async function recordExecutionLog(params: {
  auth: AuthContext;
  action: SessionType;
  prompt: string;
  durationMs: number;
  success: boolean;
  errorCode?: string;
  imageCount: number;
  creditCost?: number;
  outputUrls?: string[];
  sessionId?: string;
}): Promise<void> {
  const { auth, action, prompt, durationMs, success, errorCode, imageCount, creditCost = 1, outputUrls, sessionId } = params;

  const trackingId = auth.user ? auth.user.id : `guest_${auth.clientIp}`;

  // 1. Increment daily quota by creditCost
  await usageRepo.recordUsage(trackingId, action, success, creditCost);

  // 2. Audit log entry
  await usageLogRepo.createLog({
    userId: trackingId,
    apiKeyId: auth.apiKey?.id,
    sessionId,
    action,
    prompt,
    durationMs,
    status: success ? 'success' : 'failed',
    errorCode,
    imageCount,
    outputUrls,
    clientIp: auth.clientIp
  });
}
