<script lang="ts">
  import { Crown, Zap, User, Check, ArrowRight } from 'lucide-svelte';
  import { account, type PlanType } from '$lib/stores/account';
  import { t } from '$lib/i18n';
  import { scale } from 'svelte/transition';
  import { backOut } from 'svelte/easing';

  interface Props {
    onSwitchToAuth?: (mode?: 'login' | 'signup', msg?: string) => void;
  }

  let { onSwitchToAuth }: Props = $props();

  async function handleSelectPlan(planId: PlanType) {
    if (!$account.isLoggedIn) {
      if (onSwitchToAuth) {
        onSwitchToAuth('signup', $t('alerts.needLoginPlan'));
      } else {
        await account.setPlan(planId);
      }
      return;
    }
    await account.setPlan(planId);
  }
</script>

<div class="space-y-4 text-xs">
  <!-- Guest Upgrade Call-to-Action Banner -->
  {#if !$account.isLoggedIn && onSwitchToAuth}
    <div class="p-4 bg-neutral-900 dark:bg-neutral-800 rounded-xl text-white space-y-2.5 border border-neutral-800 dark:border-neutral-700">
      <div class="flex items-center gap-2 font-bold text-sm text-amber-400">
        <Crown class="w-4 h-4 text-amber-400" />
        <span>{$t('account.guestBannerTitle')}</span>
      </div>
      <p class="text-xs text-neutral-300 leading-relaxed">
        {$t('account.guestBannerDesc')}
      </p>
      <button
        type="button"
        onclick={() => onSwitchToAuth('signup')}
        class="btn-spring px-4 py-2 bg-white text-neutral-950 text-xs font-bold rounded-lg flex items-center gap-2 cursor-pointer hover:bg-neutral-100"
      >
        <span>{$t('account.guestBannerBtn')}</span>
        <ArrowRight class="w-3.5 h-3.5" />
      </button>
    </div>
  {/if}

  <!-- Plan Selection Matrix -->
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <div class="text-xs font-bold text-neutral-800 dark:text-neutral-200">
        {$t('account.availablePlans')}
      </div>
      <span class="text-[10px] text-neutral-400 font-medium">{$t('account.switchAnytime')}</span>
    </div>

    <div class="grid grid-cols-1 gap-3">
      <!-- 1. FREE PLAN CARD -->
      <button
        type="button"
        onclick={() => handleSelectPlan('free')}
        class="card-spring-hover w-full text-left p-4 rounded-xl border text-xs flex items-start justify-between gap-3.5 cursor-pointer transition-all duration-150 {$account.plan === 'free' ? 'border-neutral-900 dark:border-white bg-neutral-100/90 dark:bg-[#202024] ring-1 ring-neutral-900 dark:ring-white shadow-xs' : 'border-neutral-200 dark:border-[#27272a] bg-neutral-50/70 dark:bg-[#161618] hover:bg-neutral-100/60 dark:hover:bg-[#1c1c1f]'}"
      >
        <div class="flex items-start gap-3.5 min-w-0 pointer-events-none">
          <div class="w-9 h-9 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center flex-shrink-0">
            <User class="w-4 h-4" />
          </div>
          <div class="min-w-0 space-y-1">
            <div class="flex items-center gap-2">
              <span class="font-bold text-sm text-neutral-900 dark:text-white">{$t('plans.free.name')}</span>
              <span class="px-1.5 py-0.5 rounded-[4px] bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold text-[8.5px] uppercase tracking-wider">Free</span>
              <span class="text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300">$0</span>
            </div>
            <p class="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
              {$t('plans.free.description')}
            </p>
            <div class="flex flex-wrap items-center gap-1.5 pt-0.5 text-[10px] text-neutral-600 dark:text-neutral-400 font-medium">
              <span class="px-2 py-0.5 rounded-[4px] bg-neutral-200/60 dark:bg-neutral-800/80 border border-neutral-300/60 dark:border-neutral-700/60">• 20 req/hari</span>
              <span class="px-2 py-0.5 rounded-[4px] bg-neutral-200/60 dark:bg-neutral-800/80 border border-neutral-300/60 dark:border-neutral-700/60">• 1024px Resolusi</span>
            </div>
          </div>
        </div>

        {#if $account.plan === 'free'}
          <div
            in:scale={{ duration: 180, start: 0.8, easing: backOut }}
            class="flex items-center gap-1 text-[11px] font-bold text-neutral-900 dark:text-white pointer-events-none flex-shrink-0 pt-0.5"
          >
            <Check class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{$t('account.activePlan')}</span>
          </div>
        {/if}
      </button>

      <!-- 2. PRO PLAN CARD -->
      <button
        type="button"
        onclick={() => handleSelectPlan('pro')}
        class="card-spring-hover w-full text-left p-4 rounded-xl border text-xs flex items-start justify-between gap-3.5 cursor-pointer transition-all duration-150 {$account.plan === 'pro' ? 'border-neutral-900 dark:border-white bg-neutral-100/90 dark:bg-[#202024] ring-1 ring-neutral-900 dark:ring-white shadow-xs' : 'border-neutral-200 dark:border-[#27272a] bg-neutral-50/70 dark:bg-[#161618] hover:bg-neutral-100/60 dark:hover:bg-[#1c1c1f]'}"
      >
        <div class="flex items-start gap-3.5 min-w-0 pointer-events-none">
          <div class="w-9 h-9 rounded-lg bg-sky-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
            <Zap class="w-4 h-4" />
          </div>
          <div class="min-w-0 space-y-1">
            <div class="flex items-center gap-2">
              <span class="font-bold text-sm text-neutral-900 dark:text-white">{$t('plans.pro.name')}</span>
              <span class="px-1.5 py-0.5 rounded-[4px] bg-sky-500 text-white font-black text-[8.5px] uppercase tracking-wider shadow-xs">PRO</span>
              <span class="text-xs font-mono font-bold text-neutral-900 dark:text-white">$9.99 / mo</span>
            </div>
            <p class="text-[11px] text-neutral-600 dark:text-neutral-300 leading-snug">
              {$t('plans.pro.description')}
            </p>
            <div class="flex flex-wrap items-center gap-1.5 pt-0.5 text-[10px] text-neutral-700 dark:text-neutral-300 font-medium">
              <span class="px-2 py-0.5 rounded-[4px] bg-neutral-200/60 dark:bg-neutral-800/80 border border-neutral-300/60 dark:border-neutral-700/60">⚡ Prioritas Cepat</span>
              <span class="px-2 py-0.5 rounded-[4px] bg-neutral-200/60 dark:bg-neutral-800/80 border border-neutral-300/60 dark:border-neutral-700/60">100 req/hari</span>
              <span class="px-2 py-0.5 rounded-[4px] bg-neutral-200/60 dark:bg-neutral-800/80 border border-neutral-300/60 dark:border-neutral-700/60">Akses Kunci API</span>
            </div>
          </div>
        </div>

        {#if $account.plan === 'pro'}
          <div
            in:scale={{ duration: 180, start: 0.8, easing: backOut }}
            class="flex items-center gap-1 text-[11px] font-bold text-neutral-900 dark:text-white pointer-events-none flex-shrink-0 pt-0.5"
          >
            <Check class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{$t('account.activePlan')}</span>
          </div>
        {/if}
      </button>

      <!-- 3. ULTRA VIP PLAN CARD -->
      <button
        type="button"
        onclick={() => handleSelectPlan('ultra')}
        class="card-spring-hover w-full text-left p-4 rounded-xl border text-xs flex items-start justify-between gap-3.5 cursor-pointer transition-all duration-150 {$account.plan === 'ultra' ? 'border-neutral-900 dark:border-white bg-neutral-100/90 dark:bg-[#202024] ring-1 ring-neutral-900 dark:ring-white shadow-xs' : 'border-neutral-200 dark:border-[#27272a] bg-neutral-50/70 dark:bg-[#161618] hover:bg-neutral-100/60 dark:hover:bg-[#1c1c1f]'}"
      >
        <div class="flex items-start gap-3.5 min-w-0 pointer-events-none">
          <div class="w-9 h-9 rounded-lg liquid-gold-surface text-neutral-950 font-black flex items-center justify-center flex-shrink-0 shadow-xs">
            <Crown class="w-4 h-4 text-neutral-950" />
          </div>
          <div class="min-w-0 space-y-1">
            <div class="flex items-center gap-2">
              <span class="font-bold text-sm text-neutral-900 dark:text-white">{$t('plans.ultra.name')}</span>
              <span class="px-1.5 py-0.5 rounded-[4px] liquid-gold-badge text-neutral-950 font-black text-[8.5px] uppercase tracking-wider shadow-xs">VIP ULTRA</span>
              <span class="text-xs font-mono font-bold text-neutral-900 dark:text-white">$29.99 / mo</span>
            </div>
            <p class="text-[11px] text-neutral-600 dark:text-neutral-300 leading-snug">
              {$t('plans.ultra.description')}
            </p>
            <div class="flex flex-wrap items-center gap-1.5 pt-0.5 text-[10px] text-neutral-700 dark:text-neutral-300 font-medium">
              <span class="px-2 py-0.5 rounded-[4px] bg-neutral-200/60 dark:bg-neutral-800/80 border border-neutral-300/60 dark:border-neutral-700/60">★ 1.000 req/hari</span>
              <span class="px-2 py-0.5 rounded-[4px] bg-neutral-200/60 dark:bg-neutral-800/80 border border-neutral-300/60 dark:border-neutral-700/60">2048px Ultra HD</span>
              <span class="px-2 py-0.5 rounded-[4px] bg-neutral-200/60 dark:bg-neutral-800/80 border border-neutral-300/60 dark:border-neutral-700/60">Prioritas VIP Tertinggi</span>
              <span class="px-2 py-0.5 rounded-[4px] bg-neutral-200/60 dark:bg-neutral-800/80 border border-neutral-300/60 dark:border-neutral-700/60">Akses Kunci API</span>
            </div>
          </div>
        </div>

        {#if $account.plan === 'ultra'}
          <div
            in:scale={{ duration: 180, start: 0.8, easing: backOut }}
            class="flex items-center gap-1 text-[11px] font-bold text-neutral-900 dark:text-white pointer-events-none flex-shrink-0 pt-0.5"
          >
            <Check class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{$t('account.activePlan')}</span>
          </div>
        {/if}
      </button>
    </div>
  </div>
</div>
