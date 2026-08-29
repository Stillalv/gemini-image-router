<script lang="ts">
  import {
    X,
    Palette,
    Crown,
    Globe,
    Cpu,
    Info,
    Sun,
    Moon,
    Laptop,
    Check,
    Sparkles,
    Flame,
    Clock,
    User,
    Zap,
    ShieldCheck
  } from 'lucide-svelte';
  import { fly, fade, scale } from 'svelte/transition';
  import { cubicOut, cubicIn } from 'svelte/easing';
  import { t, locale, setLocale } from '$lib/i18n';
  import {
    theme,
    setThemeMode,
    setFontSize,
    setFontFamily
  } from '$lib/stores/theme';
  import { account, PLANS, type PlanType } from '$lib/stores/account';
  import type { TaskStatus } from '$lib/types';
  import { onMount } from 'svelte';

  interface Props {
    isOpen: boolean;
    initialTab?: 'appearance' | 'account' | 'language' | 'engine' | 'about';
    onClose: () => void;
  }

  let { isOpen = false, initialTab = 'appearance', onClose }: Props = $props();

  let activeTab: 'appearance' | 'account' | 'language' | 'engine' | 'about' = $state('appearance');

  $effect(() => {
    if (isOpen && initialTab) {
      activeTab = initialTab;
    }
  });

  let poolStatus: TaskStatus = $state({
    maxTabs: 3,
    busyTabs: 0,
    idleTabs: 0,
    queuedTasks: 0
  });

  async function fetchPoolStatus() {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      if (data.ok) {
        poolStatus = {
          maxTabs: data.maxTabs,
          busyTabs: data.busyTabs,
          idleTabs: data.idleTabs,
          queuedTasks: data.queuedTasks
        };
      }
    } catch {}
  }

  onMount(() => {
    fetchPoolStatus();
  });

  $effect(() => {
    if (isOpen) fetchPoolStatus();
  });

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && isOpen) onClose();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <div
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    transition:fade={{ duration: 180 }}
    onclick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    class="modal-backdrop select-none"
  >
    <!-- Modal container with FIXED STATIC HEIGHT (h-[520px]) & Spring Scale Entrance -->
    <div
      in:scale={{ duration: 240, start: 0.94, opacity: 0, easing: cubicOut }}
      out:scale={{ duration: 160, start: 0.96, opacity: 0, easing: cubicIn }}
      class="bg-white dark:bg-[#18181a] border border-neutral-200 dark:border-[#27272a] rounded-2xl shadow-2xl w-full max-w-2xl h-[520px] overflow-hidden flex flex-col text-neutral-900 dark:text-neutral-100 transition-colors duration-150"
    >
      <!-- Header (Fixed h-14) -->
      <div class="h-14 px-5 border-b border-neutral-200 dark:border-[#27272a] flex items-center justify-between flex-shrink-0 bg-neutral-50/70 dark:bg-[#1f1f22]/70">
        <div>
          <h2 class="text-sm font-bold tracking-tight">{$t('settings.title')}</h2>
          <p class="text-[11px] text-neutral-500 dark:text-neutral-400">{$t('settings.subtitle')}</p>
        </div>
        <button
          type="button"
          onclick={onClose}
          class="btn-spring p-1.5 text-neutral-400 hover:text-neutral-800 dark:hover:text-white rounded-lg hover:bg-neutral-200/60 dark:hover:bg-neutral-800 cursor-pointer"
          title="Tutup"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Body: Sidebar tabs on left + Absolute Viewport on right -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Settings Inner Navigation -->
        <nav class="w-48 bg-neutral-50 dark:bg-[#141416] border-r border-neutral-200 dark:border-[#27272a] p-2.5 space-y-1 flex-shrink-0">
          <button
            type="button"
            onclick={() => (activeTab = 'appearance')}
            class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all duration-150 ease-out cursor-pointer {activeTab === 'appearance' ? 'bg-white dark:bg-[#202023] text-neutral-900 dark:text-white shadow-xs font-semibold translate-x-0.5' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 font-medium hover:text-neutral-900 dark:hover:text-neutral-200'}"
          >
            <Palette class="w-4 h-4 transition-colors duration-150 {activeTab === 'appearance' ? 'text-neutral-900 dark:text-white' : 'text-neutral-500 dark:text-neutral-400'}" />
            <span>{$t('settings.tabs.appearance')}</span>
          </button>

          <button
            type="button"
            onclick={() => (activeTab = 'account')}
            class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all duration-150 ease-out cursor-pointer {activeTab === 'account' ? 'bg-white dark:bg-[#202023] text-neutral-900 dark:text-white shadow-xs font-semibold translate-x-0.5' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 font-medium hover:text-neutral-900 dark:hover:text-neutral-200'}"
          >
            <Crown class="w-4 h-4 transition-colors duration-150 {activeTab === 'account' ? 'text-neutral-900 dark:text-white' : 'text-neutral-500 dark:text-neutral-400'}" />
            <span>{$t('settings.tabs.account')}</span>
          </button>

          <button
            type="button"
            onclick={() => (activeTab = 'language')}
            class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all duration-150 ease-out cursor-pointer {activeTab === 'language' ? 'bg-white dark:bg-[#202023] text-neutral-900 dark:text-white shadow-xs font-semibold translate-x-0.5' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 font-medium hover:text-neutral-900 dark:hover:text-neutral-200'}"
          >
            <Globe class="w-4 h-4 transition-colors duration-150 {activeTab === 'language' ? 'text-neutral-900 dark:text-white' : 'text-neutral-500 dark:text-neutral-400'}" />
            <span>{$t('settings.tabs.language')}</span>
          </button>

          <button
            type="button"
            onclick={() => (activeTab = 'engine')}
            class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all duration-150 ease-out cursor-pointer {activeTab === 'engine' ? 'bg-white dark:bg-[#202023] text-neutral-900 dark:text-white shadow-xs font-semibold translate-x-0.5' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 font-medium hover:text-neutral-900 dark:hover:text-neutral-200'}"
          >
            <Cpu class="w-4 h-4 transition-colors duration-150 {activeTab === 'engine' ? 'text-neutral-900 dark:text-white' : 'text-neutral-500 dark:text-neutral-400'}" />
            <span>{$t('settings.tabs.engine')}</span>
          </button>

          <button
            type="button"
            onclick={() => (activeTab = 'about')}
            class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all duration-150 ease-out cursor-pointer {activeTab === 'about' ? 'bg-white dark:bg-[#202023] text-neutral-900 dark:text-white shadow-xs font-semibold translate-x-0.5' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 font-medium hover:text-neutral-900 dark:hover:text-neutral-200'}"
          >
            <Info class="w-4 h-4 transition-colors duration-150 {activeTab === 'about' ? 'text-neutral-900 dark:text-white' : 'text-neutral-500 dark:text-neutral-400'}" />
            <span>{$t('settings.tabs.about')}</span>
          </button>
        </nav>

        <!-- Tab Content Area (Clean Absolute Viewport with Smooth Cross-Fade & Slide) -->
        <div class="flex-1 relative overflow-hidden bg-white dark:bg-[#18181a]">
          {#key activeTab}
            <div
              in:fly={{ y: 6, duration: 200, delay: 40, easing: cubicOut }}
              out:fade={{ duration: 100, easing: cubicIn }}
              class="absolute inset-0 overflow-y-auto p-5 space-y-6 will-change-[transform,opacity]"
            >
              <!-- TAB 1: APPEARANCE & THEME -->
              {#if activeTab === 'appearance'}
                <!-- 1. Theme Mode -->
                <div class="space-y-2.5">
                  <div class="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    {$t('settings.appearance.themeMode')}
                  </div>
                  <div class="grid grid-cols-3 gap-2.5">
                    <!-- Light Mode Card -->
                    <button
                      type="button"
                      onclick={() => setThemeMode('light')}
                      class="card-spring-hover flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-medium cursor-pointer {$theme.mode === 'light' ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800 ring-2 ring-neutral-900/10 dark:ring-white/20' : 'border-neutral-200 dark:border-[#27272a] hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}"
                    >
                      <Sun class="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                      <span>{$t('settings.appearance.light')}</span>
                    </button>

                    <!-- Dark Mode Card -->
                    <button
                      type="button"
                      onclick={() => setThemeMode('dark')}
                      class="card-spring-hover flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-medium cursor-pointer {$theme.mode === 'dark' ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800 ring-2 ring-neutral-900/10 dark:ring-white/20' : 'border-neutral-200 dark:border-[#27272a] hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}"
                    >
                      <Moon class="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                      <span>{$t('settings.appearance.dark')}</span>
                    </button>

                    <!-- System Mode Card -->
                    <button
                      type="button"
                      onclick={() => setThemeMode('system')}
                      class="card-spring-hover flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-medium cursor-pointer {$theme.mode === 'system' ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800 ring-2 ring-neutral-900/10 dark:ring-white/20' : 'border-neutral-200 dark:border-[#27272a] hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}"
                    >
                      <Laptop class="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                      <span>{$t('settings.appearance.system')}</span>
                    </button>
                  </div>
                </div>

                <!-- 2. Font Size -->
                <div class="space-y-2.5 pt-2 border-t border-neutral-100 dark:border-[#27272a]">
                  <div>
                    <div class="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                      {$t('settings.appearance.fontSize')}
                    </div>
                    <p class="text-[11px] text-neutral-500 dark:text-neutral-400">{$t('settings.appearance.fontSizeDesc')}</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      onclick={() => setFontSize('small')}
                      class="btn-spring flex-1 py-2 px-3 rounded-xl border text-xs font-medium cursor-pointer {$theme.fontSize === 'small' ? 'border-neutral-900 dark:border-white bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold' : 'border-neutral-200 dark:border-[#27272a] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'}"
                    >
                      {$t('settings.appearance.fontSmall')}
                    </button>
                    <button
                      type="button"
                      onclick={() => setFontSize('normal')}
                      class="btn-spring flex-1 py-2 px-3 rounded-xl border text-xs font-medium cursor-pointer {$theme.fontSize === 'normal' ? 'border-neutral-900 dark:border-white bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold' : 'border-neutral-200 dark:border-[#27272a] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'}"
                    >
                      {$t('settings.appearance.fontNormal')}
                    </button>
                    <button
                      type="button"
                      onclick={() => setFontSize('large')}
                      class="btn-spring flex-1 py-2 px-3 rounded-xl border text-xs font-medium cursor-pointer {$theme.fontSize === 'large' ? 'border-neutral-900 dark:border-white bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold' : 'border-neutral-200 dark:border-[#27272a] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'}"
                    >
                      {$t('settings.appearance.fontLarge')}
                    </button>
                  </div>
                </div>

                <!-- 3. Font Family -->
                <div class="space-y-2.5 pt-2 border-t border-neutral-100 dark:border-[#27272a]">
                  <div>
                    <div class="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                      {$t('settings.appearance.fontFamily')}
                    </div>
                    <p class="text-[11px] text-neutral-500 dark:text-neutral-400">{$t('settings.appearance.fontFamilyDesc')}</p>
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onclick={() => setFontFamily('sans')}
                      class="card-spring-hover flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer {$theme.fontFamily === 'sans' ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800 font-semibold' : 'border-neutral-200 dark:border-[#27272a] hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}"
                    >
                      <span style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;">{$t('settings.appearance.fontSans')}</span>
                      {#if $theme.fontFamily === 'sans'}<Check class="w-3.5 h-3.5 text-neutral-900 dark:text-white" />{/if}
                    </button>

                    <button
                      type="button"
                      onclick={() => setFontFamily('geist')}
                      class="card-spring-hover flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer {$theme.fontFamily === 'geist' ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800 font-semibold' : 'border-neutral-200 dark:border-[#27272a] hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}"
                    >
                      <span style="font-family: 'Geist', sans-serif;">{$t('settings.appearance.fontGeist')}</span>
                      {#if $theme.fontFamily === 'geist'}<Check class="w-3.5 h-3.5 text-neutral-900 dark:text-white" />{/if}
                    </button>

                    <button
                      type="button"
                      onclick={() => setFontFamily('mono')}
                      class="card-spring-hover flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer {$theme.fontFamily === 'mono' ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800 font-semibold' : 'border-neutral-200 dark:border-[#27272a] hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}"
                    >
                      <span style="font-family: monospace;">{$t('settings.appearance.fontMono')}</span>
                      {#if $theme.fontFamily === 'mono'}<Check class="w-3.5 h-3.5 text-neutral-900 dark:text-white" />{/if}
                    </button>

                    <button
                      type="button"
                      onclick={() => setFontFamily('serif')}
                      class="card-spring-hover flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer {$theme.fontFamily === 'serif' ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800 font-semibold' : 'border-neutral-200 dark:border-[#27272a] hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}"
                    >
                      <span style="font-family: serif;">{$t('settings.appearance.fontSerif')}</span>
                      {#if $theme.fontFamily === 'serif'}<Check class="w-3.5 h-3.5 text-neutral-900 dark:text-white" />{/if}
                    </button>
                  </div>
                </div>

              <!-- TAB 2: ACCOUNT & SUBSCRIPTION PLAN -->
              {:else if activeTab === 'account'}
                <div class="space-y-4 text-xs">
                  <!-- Profile Info Card -->
                  <div class="p-3.5 bg-neutral-50 dark:bg-[#202023] rounded-2xl border border-neutral-200/90 dark:border-[#2f2f33] flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3 min-w-0">
                      <div class="w-10 h-10 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-bold flex items-center justify-center text-sm shadow-xs flex-shrink-0">
                        {$account.name.charAt(0).toUpperCase()}
                      </div>
                      <div class="min-w-0">
                        <div class="flex items-center gap-2">
                          <span class="font-bold text-neutral-900 dark:text-white truncate">{$account.name}</span>
                          <span class="px-1.5 py-0.2 rounded bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-[9px] uppercase">
                            {PLANS[$account.plan].badge}
                          </span>
                        </div>
                        <p class="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">{$account.email}</p>
                      </div>
                    </div>

                    <div class="flex-shrink-0">
                      <span class="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        <ShieldCheck class="w-3 h-3" />
                        <span>{$t('account.statusActive')}</span>
                      </span>
                    </div>
                  </div>

                  <!-- Daily Usage Widget -->
                  <div class="p-3.5 bg-neutral-50 dark:bg-[#202023] rounded-2xl border border-neutral-200/90 dark:border-[#2f2f33] space-y-2">
                    <div class="flex items-center justify-between text-xs">
                      <div class="flex items-center gap-1.5 font-semibold text-neutral-800 dark:text-neutral-200">
                        <Flame class="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300" />
                        <span>{$t('account.dailyUsage')}</span>
                      </div>
                      <div class="font-bold text-neutral-900 dark:text-white">
                        {$account.requestsUsedToday.toLocaleString()} / {PLANS[$account.plan].maxDaily.toLocaleString()}
                      </div>
                    </div>

                    <!-- Progress Bar -->
                    <div class="w-full bg-neutral-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                      <div
                        class="bg-neutral-900 dark:bg-white h-full rounded-full transition-all duration-300"
                        style="width: {Math.min(100, Math.max(3, ($account.requestsUsedToday / PLANS[$account.plan].maxDaily) * 100))}%"
                      ></div>
                    </div>

                    <div class="flex items-center justify-between text-[10px] text-neutral-400 dark:text-neutral-500">
                      <div class="flex items-center gap-1">
                        <Clock class="w-3 h-3" />
                        <span>{$t('account.resetDailyInfo')}</span>
                      </div>
                      <div>{Math.max(0, PLANS[$account.plan].maxDaily - $account.requestsUsedToday).toLocaleString()} {$t('account.remaining')}</div>
                    </div>
                  </div>

                  <!-- Plan Switcher Matrix -->
                  <div class="space-y-2">
                    <div class="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                      {$t('account.availablePlans')}
                    </div>

                    <div class="grid grid-cols-1 gap-2">
                      <!-- Free -->
                      <button
                        type="button"
                        onclick={() => account.setPlan('free')}
                        class="card-spring-hover w-full text-left p-3 rounded-xl border text-xs flex items-center justify-between gap-3 cursor-pointer {$account.plan === 'free' ? 'border-neutral-900 dark:border-white bg-neutral-100/80 dark:bg-neutral-800/90 ring-2 ring-neutral-900/10 dark:ring-white/20' : 'border-neutral-200 dark:border-[#27272a] hover:bg-neutral-50 dark:hover:bg-neutral-800/40'}"
                      >
                        <div class="flex items-center gap-2.5">
                          <User class="w-4 h-4 text-neutral-500" />
                          <div>
                            <div class="font-bold text-neutral-900 dark:text-white">{PLANS.free.name} <span class="text-[10px] text-neutral-500 font-normal">({PLANS.free.price})</span></div>
                            <div class="text-[11px] text-neutral-500 dark:text-neutral-400">{PLANS.free.description}</div>
                          </div>
                        </div>
                        {#if $account.plan === 'free'}
                          <Check class="w-4 h-4 text-emerald-500" />
                        {/if}
                      </button>

                      <!-- Pro -->
                      <button
                        type="button"
                        onclick={() => account.setPlan('pro')}
                        class="card-spring-hover w-full text-left p-3 rounded-xl border text-xs flex items-center justify-between gap-3 cursor-pointer {$account.plan === 'pro' ? 'border-neutral-900 dark:border-white bg-neutral-100/80 dark:bg-neutral-800/90 ring-2 ring-neutral-900/10 dark:ring-white/20' : 'border-neutral-200 dark:border-[#27272a] hover:bg-neutral-50 dark:hover:bg-neutral-800/40'}"
                      >
                        <div class="flex items-center gap-2.5">
                          <Zap class="w-4 h-4 text-neutral-500" />
                          <div>
                            <div class="font-bold text-neutral-900 dark:text-white">{PLANS.pro.name} <span class="text-[10px] text-neutral-500 font-normal">({PLANS.pro.price})</span></div>
                            <div class="text-[11px] text-neutral-500 dark:text-neutral-400">{PLANS.pro.description}</div>
                          </div>
                        </div>
                        {#if $account.plan === 'pro'}
                          <Check class="w-4 h-4 text-emerald-500" />
                        {/if}
                      </button>

                      <!-- Ultra -->
                      <button
                        type="button"
                        onclick={() => account.setPlan('ultra')}
                        class="card-spring-hover w-full text-left p-3 rounded-xl border text-xs flex items-center justify-between gap-3 cursor-pointer {$account.plan === 'ultra' ? 'border-neutral-900 dark:border-white bg-neutral-100/80 dark:bg-neutral-800/90 ring-2 ring-neutral-900/10 dark:ring-white/20' : 'border-neutral-200 dark:border-[#27272a] hover:bg-neutral-50 dark:hover:bg-neutral-800/40'}"
                      >
                        <div class="flex items-center gap-2.5">
                          <Sparkles class="w-4 h-4 text-neutral-900 dark:text-white" />
                          <div>
                            <div class="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                              <span>{PLANS.ultra.name}</span>
                              <span class="px-1 py-0.2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[8px] font-black rounded uppercase">VIP</span>
                              <span class="text-[10px] text-neutral-500 font-normal">({PLANS.ultra.price})</span>
                            </div>
                            <div class="text-[11px] text-neutral-500 dark:text-neutral-400">{PLANS.ultra.description}</div>
                          </div>
                        </div>
                        {#if $account.plan === 'ultra'}
                          <Check class="w-4 h-4 text-emerald-500" />
                        {/if}
                      </button>
                    </div>
                  </div>
                </div>

              <!-- TAB 3: LANGUAGE -->
              {:else if activeTab === 'language'}
                <div class="space-y-3">
                  <div>
                    <h3 class="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                      {$t('settings.language.selectLang')}
                    </h3>
                    <p class="text-[11px] text-neutral-500 dark:text-neutral-400">{$t('settings.language.selectLangDesc')}</p>
                  </div>

                  <div class="space-y-2">
                    <!-- Indonesian -->
                    <button
                      type="button"
                      onclick={() => setLocale('id')}
                      class="card-spring-hover w-full flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer {$locale === 'id' ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800 font-semibold' : 'border-neutral-200 dark:border-[#27272a] hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}"
                    >
                      <div class="flex items-center gap-2.5">
                        <span class="text-sm">🇮🇩</span>
                        <span>{$t('settings.language.id')}</span>
                      </div>
                      {#if $locale === 'id'}<Check class="w-4 h-4 text-neutral-900 dark:text-white" />{/if}
                    </button>

                    <!-- English -->
                    <button
                      type="button"
                      onclick={() => setLocale('en')}
                      class="card-spring-hover w-full flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer {$locale === 'en' ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800 font-semibold' : 'border-neutral-200 dark:border-[#27272a] hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}"
                    >
                      <div class="flex items-center gap-2.5">
                        <span class="text-sm">🇺🇸</span>
                        <span>{$t('settings.language.en')}</span>
                      </div>
                      {#if $locale === 'en'}<Check class="w-4 h-4 text-neutral-900 dark:text-white" />{/if}
                    </button>
                  </div>
                </div>

              <!-- TAB 4: AUTOMATION & POOL ENGINE -->
              {:else if activeTab === 'engine'}
                <div class="space-y-4">
                  <h3 class="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    {$t('settings.engine.statusTitle')}
                  </h3>

                  <div class="grid grid-cols-2 gap-2 text-xs">
                    <div class="p-3 bg-neutral-50 dark:bg-[#202023] rounded-xl border border-neutral-200/80 dark:border-[#27272a]">
                      <div class="text-[11px] text-neutral-500 dark:text-neutral-400">{$t('settings.engine.maxTabs')}</div>
                      <div class="text-sm font-bold mt-1 text-neutral-800 dark:text-white">{poolStatus.maxTabs} Tabs</div>
                    </div>

                    <div class="p-3 bg-neutral-50 dark:bg-[#202023] rounded-xl border border-neutral-200/80 dark:border-[#27272a]">
                      <div class="text-[11px] text-neutral-500 dark:text-neutral-400">{$t('settings.engine.busyTabs')}</div>
                      <div class="text-sm font-bold mt-1 text-neutral-800 dark:text-white">{poolStatus.busyTabs} Active</div>
                    </div>

                    <div class="p-3 bg-neutral-50 dark:bg-[#202023] rounded-xl border border-neutral-200/80 dark:border-[#27272a]">
                      <div class="text-[11px] text-neutral-500 dark:text-neutral-400">{$t('settings.engine.idleTabs')}</div>
                      <div class="text-sm font-bold mt-1 text-neutral-800 dark:text-white">{poolStatus.idleTabs} Warm</div>
                    </div>

                    <div class="p-3 bg-neutral-50 dark:bg-[#202023] rounded-xl border border-neutral-200/80 dark:border-[#27272a]">
                      <div class="text-[11px] text-neutral-500 dark:text-neutral-400">{$t('settings.engine.queuedTasks')}</div>
                      <div class="text-sm font-bold mt-1 text-neutral-800 dark:text-white">{poolStatus.queuedTasks} Tasks</div>
                    </div>
                  </div>

                  <div class="p-3.5 bg-neutral-50 dark:bg-[#202023] rounded-xl border border-neutral-200/80 dark:border-[#27272a] space-y-1.5 text-xs">
                    <div class="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">{$t('settings.engine.cdnDelivery')}</div>
                    <div class="font-medium text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                      <Sparkles class="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
                      <span>{$t('settings.engine.cdnDeliveryVal')}</span>
                    </div>
                  </div>
                </div>

              <!-- TAB 5: ABOUT -->
              {:else if activeTab === 'about'}
                <div class="space-y-3 text-xs">
                  <div class="p-4 bg-neutral-50 dark:bg-[#202023] rounded-xl border border-neutral-200/80 dark:border-[#27272a] space-y-2">
                    <div class="font-bold text-sm text-neutral-900 dark:text-white">
                      {$t('settings.about.name')}
                    </div>
                    <div class="text-neutral-600 dark:text-neutral-300">
                      {$t('settings.about.version')}
                    </div>
                    <div class="pt-2 border-t border-neutral-200 dark:border-neutral-700/60 grid grid-cols-2 gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                      <div>Runtime: <span class="text-neutral-800 dark:text-neutral-200 font-medium">Bun 1.4.0</span></div>
                      <div>Database: <span class="text-neutral-800 dark:text-neutral-200 font-medium">SQLite (bun:sqlite)</span></div>
                      <div>Automation: <span class="text-neutral-800 dark:text-neutral-200 font-medium">Playwright Chrome</span></div>
                      <div>Model: <span class="text-neutral-800 dark:text-neutral-200 font-medium">Google Imagen 3</span></div>
                    </div>
                  </div>
                </div>
              {/if}
            </div>
          {/key}
        </div>
      </div>
    </div>
  </div>
{/if}
