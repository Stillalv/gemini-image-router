import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type PlanType = 'free' | 'pro' | 'ultra';

export interface PlanConfig {
  id: PlanType;
  name: string;
  maxDaily: number;
  badge: string;
  description: string;
  price: string;
}

export const PLANS: Record<PlanType, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free Plan',
    maxDaily: 20,
    badge: 'Free',
    description: '20 request generasi per hari',
    price: 'Rp 0'
  },
  pro: {
    id: 'pro',
    name: 'Pro Plan',
    maxDaily: 100,
    badge: 'Pro',
    description: '100 request generasi per hari',
    price: 'Rp 49.000 / bln'
  },
  ultra: {
    id: 'ultra',
    name: 'Ultra Plan',
    maxDaily: 1000,
    badge: 'Ultra',
    description: '1.000 request generasi per hari (Prioritas Tertinggi)',
    price: 'Rp 149.000 / bln'
  }
};

export interface AccountState {
  name: string;
  email: string;
  avatarUrl: string;
  plan: PlanType;
  requestsUsedToday: number;
  lastResetDate: string; // YYYY-MM-DD
}

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const DEFAULT_ACCOUNT: AccountState = {
  name: 'Uni Master',
  email: 'uni@gemini.router',
  avatarUrl: '',
  plan: 'ultra', // Preset to Ultra plan as requested by user
  requestsUsedToday: 6,
  lastResetDate: getTodayString()
};

function createAccountStore() {
  let initial: AccountState = DEFAULT_ACCOUNT;

  if (browser) {
    try {
      const saved = localStorage.getItem('gemini_account');
      if (saved) {
        const parsed = JSON.parse(saved) as AccountState;
        const today = getTodayString();
        // Reset daily counter if date changed
        if (parsed.lastResetDate !== today) {
          parsed.requestsUsedToday = 0;
          parsed.lastResetDate = today;
        }
        initial = { ...DEFAULT_ACCOUNT, ...parsed };
      }
    } catch {}
  }

  const { subscribe, set, update } = writable<AccountState>(initial);

  return {
    subscribe,
    setPlan: (plan: PlanType) => {
      update((state) => {
        const next = { ...state, plan };
        if (browser) localStorage.setItem('gemini_account', JSON.stringify(next));
        return next;
      });
    },
    incrementUsage: (count: number = 1) => {
      update((state) => {
        const today = getTodayString();
        const isNewDay = state.lastResetDate !== today;
        const nextUsed = (isNewDay ? 0 : state.requestsUsedToday) + count;
        const next = {
          ...state,
          requestsUsedToday: nextUsed,
          lastResetDate: today
        };
        if (browser) localStorage.setItem('gemini_account', JSON.stringify(next));
        return next;
      });
    },
    updateProfile: (name: string, email: string) => {
      update((state) => {
        const next = { ...state, name, email };
        if (browser) localStorage.setItem('gemini_account', JSON.stringify(next));
        return next;
      });
    },
    reset: () => {
      set(DEFAULT_ACCOUNT);
      if (browser) localStorage.setItem('gemini_account', JSON.stringify(DEFAULT_ACCOUNT));
    }
  };
}

export const account = createAccountStore();
