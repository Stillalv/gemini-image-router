import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { PlanType, PlanConfig, QuotaStatus, ApiKeyItem } from '$lib/types';

export { type PlanType, type PlanConfig } from '$lib/types';

export const PLANS: Record<string, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free Plan',
    maxDaily: 20,
    badge: 'Free',
    description: '20 image requests per day',
    price: '$0',
    priceNum: 0,
    priority: 1,
    allowImageEditing: true,
    maxImageResolution: 1024,
    nameKey: 'plans.free.name',
    descKey: 'plans.free.description'
  },
  pro: {
    id: 'pro',
    name: 'Pro Plan',
    maxDaily: 100,
    badge: 'Pro',
    description: '100 image requests per day (Fast Priority)',
    price: '$9.99 / mo',
    priceNum: 9.99,
    priority: 5,
    allowImageEditing: true,
    maxImageResolution: 1024,
    nameKey: 'plans.pro.name',
    descKey: 'plans.pro.description'
  },
  ultra: {
    id: 'ultra',
    name: 'Ultra Plan',
    maxDaily: 1000,
    badge: 'Ultra',
    description: '1,000 requests per day (Highest VIP Priority)',
    price: '$29.99 / mo',
    priceNum: 29.99,
    priority: 10,
    allowImageEditing: true,
    maxImageResolution: 2048,
    nameKey: 'plans.ultra.name',
    descKey: 'plans.ultra.description'
  }
};

export interface AccountState {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  plan: PlanType;
  requestsUsedToday: number;
  maxDaily: number;
  remainingToday: number;
  lastResetDate: string;
  apiKeys: ApiKeyItem[];
  availablePlans: PlanConfig[];
  isLoading: boolean;
  isLoggedIn: boolean;
}

const DEFAULT_ACCOUNT: AccountState = {
  id: '',
  name: 'Tamu (Guest)',
  email: '',
  avatarUrl: '',
  plan: 'free',
  requestsUsedToday: 0,
  maxDaily: 20,
  remainingToday: 20,
  lastResetDate: new Date().toISOString().slice(0, 10),
  apiKeys: [],
  availablePlans: Object.values(PLANS),
  isLoading: false,
  isLoggedIn: false
};

function createAccountStore() {
  const { subscribe, set, update } = writable<AccountState>(DEFAULT_ACCOUNT);

  async function fetchUsage() {
    if (!browser) return;
    try {
      update((s) => ({ ...s, isLoading: true }));
      const res = await fetch('/api/account/usage');
      const data = await res.json();
      if (data.ok && data.quota) {
        const isLoggedIn = Boolean(data.isLoggedIn && data.user);
        update((s) => ({
          ...s,
          id: data.user?.id || '',
          name: isLoggedIn ? data.user.name : 'Tamu (Guest)',
          email: isLoggedIn ? data.user.email : '',
          plan: data.quota.plan || (isLoggedIn ? 'ultra' : 'free'),
          requestsUsedToday: data.quota.usedToday,
          maxDaily: data.quota.maxDaily,
          remainingToday: data.quota.remainingToday,
          availablePlans: Array.isArray(data.plans) && data.plans.length ? data.plans : s.availablePlans,
          isLoggedIn,
          isLoading: false
        }));
      } else {
        update((s) => ({ ...s, isLoading: false }));
      }
    } catch {
      update((s) => ({ ...s, isLoading: false }));
    }
  }

  async function fetchApiKeys() {
    if (!browser) return;
    try {
      const res = await fetch('/api/account/keys');
      const data = await res.json();
      if (data.ok && data.keys) {
        update((s) => ({ ...s, apiKeys: data.keys }));
      } else {
        update((s) => ({ ...s, apiKeys: [] }));
      }
    } catch {
      update((s) => ({ ...s, apiKeys: [] }));
    }
  }

  // Initial fetch on browser load
  if (browser) {
    setTimeout(() => {
      fetchUsage();
      fetchApiKeys();
    }, 50);
  }

  return {
    subscribe,
    fetchUsage,
    fetchApiKeys,
    login: async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.ok && data.user) {
          update((s) => ({
            ...s,
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            plan: data.user.plan || 'ultra',
            requestsUsedToday: data.quota?.usedToday || 0,
            maxDaily: data.quota?.maxDaily || 1000,
            remainingToday: data.quota?.remainingToday || 1000,
            isLoggedIn: true
          }));
          await fetchApiKeys();
          return { ok: true };
        }
        return { ok: false, error: data.error || 'Login gagal' };
      } catch (err: any) {
        return { ok: false, error: err.message };
      }
    },
    register: async (name: string, email: string, password: string, plan: PlanType = 'ultra'): Promise<{ ok: boolean; error?: string }> => {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, plan })
        });
        const data = await res.json();
        if (data.ok && data.user) {
          update((s) => ({
            ...s,
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            plan: data.user.plan || 'ultra',
            requestsUsedToday: data.quota?.usedToday || 0,
            maxDaily: data.quota?.maxDaily || 1000,
            remainingToday: data.quota?.remainingToday || 1000,
            isLoggedIn: true
          }));
          await fetchApiKeys();
          return { ok: true };
        }
        return { ok: false, error: data.error || 'Registrasi gagal' };
      } catch (err: any) {
        return { ok: false, error: err.message };
      }
    },
    logout: async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch {}
      set({
        ...DEFAULT_ACCOUNT,
        isLoggedIn: false,
        apiKeys: []
      });
      await fetchUsage();
    },
    setQuota: (quota: QuotaStatus) => {
      update((s) => ({
        ...s,
        plan: quota.plan,
        requestsUsedToday: quota.usedToday,
        maxDaily: quota.maxDaily,
        remainingToday: quota.remainingToday
      }));
    },
    incrementUsage: (count: number = 1) => {
      update((s) => {
        const nextUsed = s.requestsUsedToday + count;
        return {
          ...s,
          requestsUsedToday: nextUsed,
          remainingToday: Math.max(0, s.maxDaily - nextUsed)
        };
      });
    },
    setPlan: async (plan: PlanType) => {
      update((s) => ({ ...s, plan, maxDaily: PLANS[plan]?.maxDaily || 20 }));
      if (browser) {
        try {
          const res = await fetch('/api/account/plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan })
          });
          const data = await res.json();
          if (data.ok && data.quota) {
            update((s) => ({
              ...s,
              plan: data.quota.plan,
              requestsUsedToday: data.quota.usedToday,
              maxDaily: data.quota.maxDaily,
              remainingToday: data.quota.remainingToday
            }));
          }
        } catch {}
      }
    },
    createApiKey: async (name: string): Promise<{ rawKey: string; keyItem: ApiKeyItem } | null> => {
      try {
        const res = await fetch('/api/account/keys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name })
        });
        const data = await res.json();
        if (data.ok && data.apiKey) {
          update((s) => ({
            ...s,
            apiKeys: [data.apiKey, ...s.apiKeys]
          }));
          return { rawKey: data.apiKey.rawKey, keyItem: data.apiKey };
        }
      } catch {}
      return null;
    },
    revokeApiKey: async (keyId: string): Promise<boolean> => {
      try {
        const res = await fetch(`/api/account/keys/${keyId}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.ok) {
          update((s) => ({
            ...s,
            apiKeys: s.apiKeys.filter((k) => k.id !== keyId)
          }));
          return true;
        }
      } catch {}
      return false;
    }
  };
}

export const account = createAccountStore();
