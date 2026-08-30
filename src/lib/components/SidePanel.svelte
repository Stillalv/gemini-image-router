<script lang="ts">
  import {
    SquarePen,
    Palette,
    Sparkles,
    Trash2,
    Settings,
    BookOpen,
    PanelLeftClose,
    Crown,
    Zap,
    User
  } from 'lucide-svelte';
  import { account, PLANS } from '$lib/stores/account';
  import { t } from '$lib/i18n';
  import type { Session } from '$lib/types';

  interface Props {
    sessions: Session[];
    currentSessionId: string | null;
    loadingSessionIds?: string[];
    isOpen: boolean;
    onToggle: () => void;
    onSelectSession: (id: string) => void;
    onNewSessionClick: () => void;
    onDeleteSession: (id: string) => void;
    onOpenDocs: () => void;
    onOpenSettings: () => void;
    onOpenAccount: () => void;
  }

  let {
    sessions = [],
    currentSessionId,
    loadingSessionIds = [],
    isOpen = true,
    onToggle,
    onSelectSession,
    onNewSessionClick,
    onDeleteSession,
    onOpenDocs,
    onOpenSettings,
    onOpenAccount
  }: Props = $props();
</script>

<!-- 1. Layout Gap Spacer in Flex Flow (Smooth 300ms width collapse) -->
<div class="sidebar-gap-spacer" class:collapsed={!isOpen} aria-hidden="true"></div>

<!-- 2. Decoupled GPU-Accelerated Fixed Sidebar Panel (Smooth 300ms translate3d slide) -->
<aside class="sidebar-fixed-panel" class:collapsed={!isOpen}>
  <!-- Top Navbar Header (Height strictly h-14 with ChatGPT-style icon buttons) -->
  <div class="h-14 px-3 flex items-center justify-between border-b border-neutral-200 dark:border-[#27272a] flex-shrink-0 bg-neutral-50 dark:bg-[#141416]">
    <div class="flex items-center gap-2 pl-1">
      <span class="text-xs font-bold text-neutral-800 dark:text-neutral-200 tracking-tight">{$t('app.title')}</span>
    </div>

    <div class="flex items-center gap-1">
      <button
        type="button"
        onclick={onNewSessionClick}
        class="btn-spring h-8 w-8 flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800 rounded-lg cursor-pointer"
        title={$t('app.newSession')}
      >
        <SquarePen class="w-4 h-4" />
      </button>

      <button
        type="button"
        onclick={onToggle}
        class="btn-spring h-8 w-8 flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800 rounded-lg cursor-pointer"
        title={$t('app.closeSidebar')}
      >
        <PanelLeftClose class="w-4 h-4" />
      </button>
    </div>
  </div>

  <!-- Session List (Scrollable with smooth hover & delete reveal) -->
  <div class="flex-1 overflow-y-auto p-2.5 space-y-1.5 [contain:content]">
    <div class="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 px-3 py-1.5 uppercase tracking-wider">
      {$t('app.sessionHistory')}
    </div>

    {#if sessions.length === 0}
      <div class="text-center py-8 text-xs text-neutral-400 dark:text-neutral-500 px-4">
        {$t('app.noSessions')}
      </div>
    {:else}
      {#each sessions as sess (sess.id)}
        <div
          role="button"
          tabindex="0"
          onclick={() => onSelectSession(sess.id)}
          onkeydown={(e) => e.key === 'Enter' && onSelectSession(sess.id)}
          class="group w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between gap-2.5 cursor-pointer border transition-all duration-150 ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.99] {currentSessionId === sess.id ? 'bg-white dark:bg-[#202023] text-neutral-900 dark:text-white font-semibold border-neutral-200 dark:border-[#2f2f33] shadow-xs' : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-white'}"
        >
          <div class="flex items-center gap-2.5 min-w-0 flex-1">
            {#if sess.type === 'edit'}
              <Palette class="w-3.5 h-3.5 flex-shrink-0 text-neutral-500 dark:text-neutral-400 transition-transform duration-150 group-hover:scale-110" />
            {:else}
              <Sparkles class="w-3.5 h-3.5 flex-shrink-0 text-neutral-500 dark:text-neutral-400 transition-transform duration-150 group-hover:scale-110" />
            {/if}
            <span class="truncate">{sess.title}</span>

            {#if loadingSessionIds.includes(sess.id)}
              <span class="relative flex h-2 w-2 ml-1 flex-shrink-0" title="Sedang memproses...">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            {/if}
          </div>

          <button
            type="button"
            onclick={(e) => {
              e.stopPropagation();
              onDeleteSession(sess.id);
            }}
            class="opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 focus-visible:opacity-100 focus-visible:scale-100 p-1 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/20 active:scale-90 rounded-md transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
            title={$t('app.deleteSession')}
          >
            <Trash2 class="w-3.5 h-3.5 transition-transform duration-150 group-hover:rotate-6" />
          </button>
        </div>
      {/each}
    {/if}
  </div>

  <!-- Bottom Profile, Plan, Usage & Settings Area -->
  <div class="p-2.5 border-t border-neutral-200 dark:border-[#27272a] space-y-2 bg-neutral-50 dark:bg-[#141416] flex-shrink-0">
    <!-- 1. Daily Usage Metric Widget (Directly above Profile) -->
    <div
      role="button"
      tabindex="0"
      onclick={onOpenAccount}
      onkeydown={(e) => e.key === 'Enter' && onOpenAccount()}
      class="card-spring-hover p-2.5 bg-white dark:bg-[#1e1e21] rounded-xl border border-neutral-200/90 dark:border-[#2a2a2e] space-y-1.5 cursor-pointer shadow-2xs group/usage"
      title="Lihat Detail Kuota Request"
    >
      <div class="flex items-center justify-between text-[11px]">
        <span class="font-medium text-neutral-500 dark:text-neutral-400 group-hover/usage:text-neutral-900 dark:group-hover/usage:text-white transition-colors duration-150">
          {$t('account.dailyUsage')}
        </span>
        <span class="font-bold text-neutral-800 dark:text-neutral-200">
          {$account.requestsUsedToday} / {$account.maxDaily || PLANS[$account.plan]?.maxDaily || 20}
        </span>
      </div>

      <!-- Mini Progress Bar with Smooth Width Easing -->
      <div class="w-full bg-neutral-100 dark:bg-[#2c2c30] h-1.5 rounded-full overflow-hidden">
        <div
          class="bg-neutral-900 dark:bg-white h-full rounded-full transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style="width: {Math.min(100, Math.max(4, ($account.requestsUsedToday / ($account.maxDaily || PLANS[$account.plan]?.maxDaily || 20)) * 100))}%"
        ></div>
      </div>
    </div>

    <!-- 2. Account Profile Card on Left + Settings & Docs Icon Buttons on Right -->
    <div class="flex items-center justify-between gap-1.5 pt-0.5">
      <!-- Profile Button (Avatar + Email + Plan) -->
      <button
        type="button"
        onclick={onOpenAccount}
        class="flex-1 flex items-center gap-2.5 p-1.5 -ml-1 text-left rounded-xl hover:bg-neutral-200/60 dark:hover:bg-neutral-800/70 active:scale-[0.98] transition-all duration-150 min-w-0 group/prof cursor-pointer select-none"
        title={$t('account.title')}
      >
        <!-- Avatar Circle with Scale Micro-Motion (Liquid Gold to Orange Wave) -->
        <div class="w-8 h-8 rounded-xl flex items-center justify-center text-xs flex-shrink-0 shadow-xs group-hover/prof:scale-105 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none {$account.plan === 'ultra' ? 'liquid-gold-surface text-neutral-950 font-black' : $account.plan === 'pro' ? 'bg-sky-600 text-white font-bold' : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-bold'}">
          {($account.name || 'T').charAt(0).toUpperCase()}
        </div>

        <div class="min-w-0 flex-1 pointer-events-none space-y-1">
          <div class="text-xs font-semibold text-neutral-900 dark:text-white truncate group-hover/prof:underline decoration-neutral-400 underline-offset-2 leading-tight">
            {$account.isLoggedIn ? $account.email : $account.name}
          </div>
          <div class="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium flex items-center gap-1.5 pt-0.5">
            {#if $account.plan === 'ultra'}
              <span class="px-1.5 py-0.5 rounded-[4px] liquid-gold-badge text-neutral-950 font-black text-[8px] uppercase tracking-wider inline-flex items-center gap-1 shadow-xs">
                <Crown class="w-2.5 h-2.5 text-neutral-950" />
                <span>VIP ULTRA</span>
              </span>
            {:else if $account.plan === 'pro'}
              <span class="px-1.5 py-0.5 rounded-[4px] bg-sky-500 text-white font-black text-[8px] uppercase tracking-wider inline-flex items-center gap-1 shadow-xs">
                <Zap class="w-2.5 h-2.5 text-white" />
                <span>PRO</span>
              </span>
            {:else}
              <span class="px-1.5 py-0.5 rounded-[4px] bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold text-[8px] uppercase tracking-wider inline-flex items-center gap-1">
                <User class="w-2.5 h-2.5 text-neutral-500 dark:text-neutral-400" />
                <span>FREE</span>
              </span>
            {/if}
            {#if !$account.isLoggedIn}
              <span class="text-[9px] text-amber-500 font-semibold">{$t('account.login')}</span>
            {/if}
          </div>
        </div>
      </button>

      <!-- Action Icons (Settings & API Docs) on the Right of Profile -->
      <div class="flex items-center gap-0.5 flex-shrink-0">
        <button
          type="button"
          onclick={onOpenDocs}
          class="btn-spring h-8 w-8 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800 rounded-lg cursor-pointer group"
          title={$t('app.apiDocs')}
        >
          <BookOpen class="w-4 h-4 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-0.5" />
        </button>

        <button
          type="button"
          onclick={onOpenSettings}
          class="btn-spring h-8 w-8 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800 rounded-lg cursor-pointer group"
          title={$t('app.settings')}
        >
          <Settings class="w-4 h-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-45" />
        </button>
      </div>
    </div>
  </div>
</aside>
