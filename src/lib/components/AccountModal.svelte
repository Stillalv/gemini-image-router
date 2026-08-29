<script lang="ts">
  import {
    X,
    User,
    Crown,
    Zap,
    Check,
    Sparkles,
    ShieldCheck,
    Clock,
    Flame
  } from 'lucide-svelte';
  import { account, PLANS, type PlanType } from '$lib/stores/account';
  import { t } from '$lib/i18n';
  import { fade, scale } from 'svelte/transition';
  import { backOut, cubicOut, cubicIn } from 'svelte/easing';
  import { tweened } from 'svelte/motion';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
  }

  let { isOpen = false, onClose }: Props = $props();

  // Usage meter animated progress tween
  const usageProgress = tweened(0, {
    duration: 800,
    easing: cubicOut
  });

  // Animate progress bar fill on modal open and dynamically when plan or usage changes
  $effect(() => {
    if (isOpen) {
      const maxDaily = PLANS[$account.plan]?.maxDaily || 1;
      const targetPct = Math.min(100, Math.max(3, ($account.requestsUsedToday / maxDaily) * 100));
      usageProgress.set(targetPct);
    } else {
      usageProgress.set(0, { duration: 0 });
    }
  });

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && isOpen) onClose();
  }

  function handleSelectPlan(planId: PlanType) {
    account.setPlan(planId);
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <!-- Modal Backdrop with smooth fade -->
  <div
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    transition:fade={{ duration: 180 }}
    onclick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    class="modal-backdrop select-none"
  >
    <!-- Modal Card with spring scale entrance & smooth exit -->
    <div
      in:scale={{ duration: 300, start: 0.92, opacity: 0, easing: backOut }}
      out:scale={{ duration: 160, start: 0.96, opacity: 0, easing: cubicIn }}
      class="bg-white dark:bg-[#18181a] border border-neutral-200 dark:border-[#27272a] rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col text-neutral-900 dark:text-neutral-100 transition-colors duration-150"
    >
      <!-- Header -->
      <div class="h-14 px-5 border-b border-neutral-200 dark:border-[#27272a] flex items-center justify-between flex-shrink-0 bg-neutral-50/70 dark:bg-[#1f1f22]/70">
        <div class="flex items-center gap-2">
          <Crown class="w-4 h-4 text-neutral-800 dark:text-neutral-200" />
          <h2 class="text-sm font-bold tracking-tight">{$t('account.title')}</h2>
        </div>
        <button
          type="button"
          onclick={onClose}
          class="btn-spring p-1.5 text-neutral-400 hover:text-neutral-800 dark:hover:text-white rounded-lg hover:bg-neutral-200/60 dark:hover:bg-neutral-800 cursor-pointer"
          title={$t('modal.close')}
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-5 space-y-5">
        <!-- User Profile Card -->
        <div class="p-4 bg-neutral-50 dark:bg-[#202023] rounded-2xl border border-neutral-200/90 dark:border-[#2f2f33] flex items-center justify-between gap-4">
          <div class="flex items-center gap-3.5 min-w-0">
            <!-- Monogram Avatar with Glow Badge -->
            <div class="relative flex-shrink-0">
              <div class="w-12 h-12 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-bold flex items-center justify-center text-base shadow-md">
                {$account.name.charAt(0).toUpperCase()}
              </div>
              <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-neutral-800 dark:bg-neutral-200 border-2 border-white dark:border-[#202023] flex items-center justify-center text-[10px] text-white dark:text-neutral-900 font-black">
                ★
              </div>
            </div>

            <!-- Name, Email & Plan Badge -->
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-neutral-900 dark:text-white truncate">
                  {$account.name}
                </span>
                <span class="px-2 py-0.5 text-[10px] font-bold rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 uppercase tracking-wider shadow-xs">
                  {PLANS[$account.plan].badge}
                </span>
              </div>
              <p class="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                {$account.email}
              </p>
            </div>
          </div>

          <div class="text-right flex-shrink-0">
            <span class="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
              <ShieldCheck class="w-3.5 h-3.5" />
              <span>{$t('account.statusActive')}</span>
            </span>
          </div>
        </div>

        <!-- Daily Request Usage Widget Card -->
        <div class="p-4 bg-neutral-50 dark:bg-[#202023] rounded-2xl border border-neutral-200/90 dark:border-[#2f2f33] space-y-2.5">
          <div class="flex items-center justify-between text-xs">
            <div class="flex items-center gap-1.5 font-semibold text-neutral-800 dark:text-neutral-200">
              <Flame class="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
              <span>{$t('account.dailyUsage')}</span>
            </div>
            <div class="font-bold text-neutral-900 dark:text-white">
              {$account.requestsUsedToday.toLocaleString()} / {PLANS[$account.plan].maxDaily.toLocaleString()} <span class="text-neutral-500 dark:text-neutral-400 font-normal text-[11px]">{$t('account.requestsToday')}</span>
            </div>
          </div>

          <!-- Progress Bar with Tweened Animation -->
          <div class="w-full bg-neutral-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
            <div
              class="bg-neutral-900 dark:bg-white h-full rounded-full transition-[background-color] duration-300"
              style="width: {$usageProgress}%;"
            ></div>
          </div>

          <div class="flex items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-500 pt-0.5">
            <div class="flex items-center gap-1">
              <Clock class="w-3 h-3" />
              <span>{$t('account.resetDailyInfo')}</span>
            </div>
            <div>
              {Math.max(0, PLANS[$account.plan].maxDaily - $account.requestsUsedToday).toLocaleString()} {$t('account.remaining')}
            </div>
          </div>
        </div>

        <!-- Plan Selection & Upgrade Matrix -->
        <div class="space-y-2.5">
          <div class="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            {$t('account.availablePlans')}
          </div>

          <div class="grid grid-cols-1 gap-2.5">
            <!-- 1. Free Plan -->
            <button
              type="button"
              onclick={() => handleSelectPlan('free')}
              class="card-spring-hover w-full text-left p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 cursor-pointer {$account.plan === 'free' ? 'border-neutral-900 dark:border-white bg-neutral-100/80 dark:bg-neutral-800/90 ring-2 ring-neutral-900/10 dark:ring-white/20 shadow-xs' : 'border-neutral-200 dark:border-[#27272a] hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'}"
            >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center font-bold transition-colors duration-200 {$account.plan === 'free' ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'}">
                  <User class="w-4 h-4" />
                </div>
                <div>
                  <div class="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                    <span>{PLANS.free.name}</span>
                    <span class="text-[10px] text-neutral-500 font-normal">({PLANS.free.price})</span>
                  </div>
                  <div class="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {PLANS.free.description}
                  </div>
                </div>
              </div>

              {#if $account.plan === 'free'}
                <div
                  in:scale={{ duration: 200, start: 0.8, easing: backOut }}
                  class="flex items-center gap-1 text-[11px] font-semibold text-neutral-900 dark:text-white"
                >
                  <Check class="w-4 h-4 text-emerald-500" />
                  <span>{$t('account.activePlan')}</span>
                </div>
              {/if}
            </button>

            <!-- 2. Pro Plan -->
            <button
              type="button"
              onclick={() => handleSelectPlan('pro')}
              class="card-spring-hover w-full text-left p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 cursor-pointer {$account.plan === 'pro' ? 'border-neutral-900 dark:border-white bg-neutral-100/80 dark:bg-neutral-800/90 ring-2 ring-neutral-900/10 dark:ring-white/20 shadow-xs' : 'border-neutral-200 dark:border-[#27272a] hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'}"
            >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center font-bold transition-colors duration-200 {$account.plan === 'pro' ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'}">
                  <Zap class="w-4 h-4" />
                </div>
                <div>
                  <div class="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                    <span>{PLANS.pro.name}</span>
                    <span class="text-[10px] text-neutral-500 font-normal">({PLANS.pro.price})</span>
                  </div>
                  <div class="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {PLANS.pro.description}
                  </div>
                </div>
              </div>

              {#if $account.plan === 'pro'}
                <div
                  in:scale={{ duration: 200, start: 0.8, easing: backOut }}
                  class="flex items-center gap-1 text-[11px] font-semibold text-neutral-900 dark:text-white"
                >
                  <Check class="w-4 h-4 text-emerald-500" />
                  <span>{$t('account.activePlan')}</span>
                </div>
              {/if}
            </button>

            <!-- 3. Ultra Plan (Highlighted) -->
            <button
              type="button"
              onclick={() => handleSelectPlan('ultra')}
              class="card-spring-hover w-full text-left p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 cursor-pointer {$account.plan === 'ultra' ? 'border-neutral-900 dark:border-white bg-neutral-100/80 dark:bg-neutral-800/90 ring-2 ring-neutral-900/10 dark:ring-white/20 shadow-xs' : 'border-neutral-200 dark:border-[#27272a] hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'}"
            >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center font-bold transition-colors duration-200 {$account.plan === 'ultra' ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'}">
                  <Sparkles class="w-4 h-4" />
                </div>
                <div>
                  <div class="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                    <span>{PLANS.ultra.name}</span>
                    <span class="px-1.5 py-0.2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[9px] font-black rounded uppercase">VIP</span>
                    <span class="text-[10px] text-neutral-500 font-normal">({PLANS.ultra.price})</span>
                  </div>
                  <div class="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {PLANS.ultra.description}
                  </div>
                </div>
              </div>

              {#if $account.plan === 'ultra'}
                <div
                  in:scale={{ duration: 200, start: 0.8, easing: backOut }}
                  class="flex items-center gap-1 text-[11px] font-semibold text-neutral-900 dark:text-white"
                >
                  <Check class="w-4 h-4 text-emerald-500" />
                  <span>{$t('account.activePlan')}</span>
                </div>
              {/if}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
