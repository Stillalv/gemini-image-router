<script lang="ts">
  import { User, Crown, Zap, Flame, Clock, ShieldCheck, LogOut, LogIn } from 'lucide-svelte';
  import { account, PLANS } from '$lib/stores/account';
  import { t } from '$lib/i18n';

  interface Props {
    showActions?: boolean;
    onSwitchToAuth?: () => void;
    onLogout?: () => void;
  }

  let { showActions = true, onSwitchToAuth, onLogout }: Props = $props();

  let maxDaily = $derived($account.maxDaily || PLANS[$account.plan]?.maxDaily || 20);
  let usagePct = $derived(Math.min(100, Math.max(4, ($account.requestsUsedToday / maxDaily) * 100)));
  let remainingRequests = $derived(Math.max(0, maxDaily - $account.requestsUsedToday));
</script>

<div class="space-y-4 text-xs">
  <!-- User / Guest Profile Card -->
  <div class="p-4 bg-white dark:bg-[#18181b] rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-4">
    <div class="flex items-center gap-3.5 min-w-0">
      <div class="relative flex-shrink-0">
        <div class="w-11 h-11 rounded-xl flex items-center justify-center text-sm shadow-xs {$account.plan === 'ultra' ? 'liquid-gold-surface text-neutral-950 font-black' : $account.plan === 'pro' ? 'bg-sky-600 text-white font-bold' : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-bold'}">
          {($account.name || 'T').charAt(0).toUpperCase()}
        </div>
        {#if $account.isLoggedIn}
          <div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full {$account.plan === 'ultra' ? 'liquid-gold-surface text-neutral-950' : $account.plan === 'pro' ? 'bg-sky-500 text-white' : 'bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900'} border-2 border-white dark:border-[#18181b] flex items-center justify-center text-[8px] font-black">✓</div>
        {/if}
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <span class="text-sm font-bold text-neutral-900 dark:text-white truncate">{$account.name}</span>
          {#if $account.plan === 'ultra'}
            <span class="px-2 py-0.5 text-[9px] font-black rounded-[4px] liquid-gold-badge uppercase tracking-wider inline-flex items-center gap-1 shadow-xs">
              <Crown class="w-3 h-3 text-neutral-950" /><span>VIP ULTRA</span>
            </span>
          {:else if $account.plan === 'pro'}
            <span class="px-2 py-0.5 text-[9px] font-black rounded-[4px] bg-sky-500 text-white uppercase tracking-wider inline-flex items-center gap-1 shadow-xs">
              <Zap class="w-3 h-3 text-white" /><span>PRO</span>
            </span>
          {:else}
            <span class="px-2 py-0.5 text-[9px] font-bold rounded-[4px] bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 uppercase tracking-wider inline-flex items-center gap-1">
              <User class="w-3 h-3 text-neutral-500 dark:text-neutral-400" /><span>FREE</span>
            </span>
          {/if}
        </div>
        <p class="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5 select-text">{$account.email || 'Mode Tamu / Belum Masuk'}</p>
      </div>
    </div>

    {#if showActions}
      <div class="text-right flex-shrink-0 flex items-center gap-2">
        {#if $account.isLoggedIn}
          <span class="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-md border border-emerald-300 dark:border-emerald-800">
            <ShieldCheck class="w-3.5 h-3.5" /><span>{$t('account.statusActive')}</span>
          </span>
          {#if onLogout}
            <button type="button" onclick={onLogout} class="btn-spring p-1.5 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer" title={$t('account.logout')}>
              <LogOut class="w-4 h-4" />
            </button>
          {/if}
        {:else if onSwitchToAuth}
          <button type="button" onclick={onSwitchToAuth} class="btn-spring px-3 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer">
            <LogIn class="w-3.5 h-3.5" /><span>{$t('account.login')}</span>
          </button>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Daily Request Usage Widget Card -->
  <div class="p-4 bg-white dark:bg-[#18181b] rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2.5">
    <div class="flex items-center justify-between text-xs">
      <div class="flex items-center gap-1.5 font-semibold text-neutral-800 dark:text-neutral-200">
        <Flame class="w-4 h-4 text-neutral-700 dark:text-neutral-300" /><span>{$t('account.dailyUsage')}</span>
      </div>
      <div class="font-bold text-neutral-900 dark:text-white">
        {$account.requestsUsedToday.toLocaleString()} / {maxDaily.toLocaleString()} <span class="text-neutral-500 dark:text-neutral-400 font-normal text-[11px]">{$t('account.requestsToday')}</span>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
      <div class="bg-neutral-900 dark:bg-white h-full rounded-full transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" style="width: {usagePct}%;"></div>
    </div>

    <div class="flex items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-500 pt-0.5">
      <div class="flex items-center gap-1">
        <Clock class="w-3 h-3" /><span>{$t('account.resetDailyInfo')} WIB</span>
      </div>
      <div>{remainingRequests.toLocaleString()} {$t('account.remaining')}</div>
    </div>
  </div>
</div>
