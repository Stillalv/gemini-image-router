<script lang="ts">
  import { ShieldCheck, LogOut, LogIn, UserPlus, User, Mail, Lock, Sparkles, AlertCircle, Check } from 'lucide-svelte';
  import { account } from '$lib/stores/account';
  import { t } from '$lib/i18n';

  interface Props {
    initialMode?: 'login' | 'signup';
    initialError?: string | null;
    onAuthSuccess?: () => void;
  }

  let { initialMode = 'signup', initialError = null, onAuthSuccess }: Props = $props();

  let authMode: 'login' | 'signup' = $state('signup');
  let authName = $state('');
  let authEmail = $state('');
  let authPassword = $state('');
  let authError: string | null = $state(null);
  let authSuccessMsg: string | null = $state(null);
  let isSubmittingAuth = $state(false);

  $effect(() => {
    if (initialMode) authMode = initialMode;
    if (initialError) authError = initialError;
  });

  async function handleAuthSubmit() {
    if (isSubmittingAuth) return;
    authError = null;
    authSuccessMsg = null;
    isSubmittingAuth = true;

    try {
      if (authMode === 'signup') {
        const res = await account.register(authName, authEmail, authPassword, 'ultra');
        if (res.ok) {
          authSuccessMsg = $t('alerts.signupUltraSuccess');
          authName = '';
          authEmail = '';
          authPassword = '';
          setTimeout(() => {
            if (onAuthSuccess) onAuthSuccess();
          }, 1000);
        } else {
          authError = res.error || $t('alerts.regFailed');
        }
      } else {
        const res = await account.login(authEmail, authPassword);
        if (res.ok) {
          authSuccessMsg = $t('alerts.loginSuccess');
          authEmail = '';
          authPassword = '';
          setTimeout(() => {
            if (onAuthSuccess) onAuthSuccess();
          }, 1000);
        } else {
          authError = res.error || $t('alerts.loginFailed');
        }
      }
    } finally {
      isSubmittingAuth = false;
    }
  }

  async function handleLogout() {
    await account.logout();
    authSuccessMsg = $t('alerts.logoutSuccess');
    authMode = 'login';
    setTimeout(() => {
      authSuccessMsg = null;
    }, 2000);
  }
</script>

<div class="space-y-4">
  {#if $account.isLoggedIn}
    <!-- Logged In Status Card with Logout Option -->
    <div class="p-5 bg-neutral-50 dark:bg-[#202023] rounded-2xl border border-neutral-200/90 dark:border-[#2f2f33] space-y-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
          <ShieldCheck class="w-5 h-5" />
        </div>
        <div>
          <div class="text-xs font-bold text-neutral-900 dark:text-white">{$t('account.alreadyLoggedIn')}</div>
          <div class="text-[11px] text-neutral-500 dark:text-neutral-400">{$account.email}</div>
        </div>
      </div>

      <div class="pt-2 border-t border-neutral-200/80 dark:border-[#2a2a2e] flex items-center justify-between">
        <span class="text-xs text-neutral-500">{$t('account.switchAccountPrompt')}</span>
        <button
          type="button"
          onclick={handleLogout}
          class="btn-spring px-4 py-2 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
        >
          <LogOut class="w-3.5 h-3.5" />
          <span>{$t('account.logout')}</span>
        </button>
      </div>
    </div>
  {:else}
    <!-- Auth Mode Switcher -->
    <div class="flex p-1 bg-neutral-100 dark:bg-[#202023] rounded-xl text-xs font-semibold">
      <button
        type="button"
        onclick={() => { authMode = 'signup'; authError = null; authSuccessMsg = null; }}
        class="flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 select-none {authMode === 'signup' ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}"
      >
        <UserPlus class="w-3.5 h-3.5 pointer-events-none" />
        <span class="pointer-events-none">{$t('account.signup')} (Ultra Plan)</span>
      </button>
      <button
        type="button"
        onclick={() => { authMode = 'login'; authError = null; authSuccessMsg = null; }}
        class="flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 select-none {authMode === 'login' ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}"
      >
        <LogIn class="w-3.5 h-3.5 pointer-events-none" />
        <span class="pointer-events-none">{$t('account.login')}</span>
      </button>
    </div>

    <!-- Notification Messages -->
    {#if authError}
      <div class="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
        <AlertCircle class="w-4 h-4 flex-shrink-0" />
        <span>{authError}</span>
      </div>
    {/if}

    {#if authSuccessMsg}
      <div class="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
        <Check class="w-4 h-4 flex-shrink-0" />
        <span>{authSuccessMsg}</span>
      </div>
    {/if}

    <!-- Form -->
    <form onsubmit={(e) => { e.preventDefault(); handleAuthSubmit(); }} class="space-y-3">
      {#if authMode === 'signup'}
        <div>
          <label for="auth-name" class="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
            {$t('account.name')}
          </label>
          <div class="relative">
            <User class="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
            <input
              id="auth-name"
              type="text"
              bind:value={authName}
              required
              placeholder="Nama Lengkap Anda"
              class="w-full text-xs pl-9 pr-3 py-2.5 bg-neutral-50 dark:bg-[#202023] border border-neutral-200 dark:border-[#2f2f33] rounded-xl focus:outline-hidden focus:border-neutral-900 dark:focus:border-white"
            />
          </div>
        </div>
      {/if}

      <div>
        <label for="auth-email" class="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
          {$t('account.email')}
        </label>
        <div class="relative">
          <Mail class="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
          <input
            id="auth-email"
            type="email"
            bind:value={authEmail}
            required
            placeholder="nama@email.com"
            class="w-full text-xs pl-9 pr-3 py-2.5 bg-neutral-50 dark:bg-[#202023] border border-neutral-200 dark:border-[#2f2f33] rounded-xl focus:outline-hidden focus:border-neutral-900 dark:focus:border-white"
          />
        </div>
      </div>

      <div>
        <label for="auth-pass" class="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
          {$t('account.password')}
        </label>
        <div class="relative">
          <Lock class="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
          <input
            id="auth-pass"
            type="password"
            bind:value={authPassword}
            required
            minlength="6"
            placeholder="••••••••"
            class="w-full text-xs pl-9 pr-3 py-2.5 bg-neutral-50 dark:bg-[#202023] border border-neutral-200 dark:border-[#2f2f33] rounded-xl focus:outline-hidden focus:border-neutral-900 dark:focus:border-white"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmittingAuth}
        class="btn-spring w-full py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2 shadow-sm"
      >
        {#if authMode === 'signup'}
          <Sparkles class="w-4 h-4" />
          <span>{$t('account.signupUltraBtn')}</span>
        {:else}
          <LogIn class="w-4 h-4" />
          <span>{$t('account.loginBtn')}</span>
        {/if}
      </button>
    </form>
  {/if}
</div>
