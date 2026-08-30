<script lang="ts">
  import { X, Palette, Crown, Globe, Cpu, Info } from 'lucide-svelte';
  import { fly, fade, scale } from 'svelte/transition';
  import { cubicOut, cubicIn } from 'svelte/easing';
  import { t } from '$lib/i18n';

  import SettingsAppearanceTab from './settings/SettingsAppearanceTab.svelte';
  import SettingsLanguageTab from './settings/SettingsLanguageTab.svelte';
  import SettingsEngineTab from './settings/SettingsEngineTab.svelte';
  import SettingsAboutTab from './settings/SettingsAboutTab.svelte';
  import AccountUsageCard from './account/AccountUsageCard.svelte';
  import AccountPlanTab from './account/AccountPlanTab.svelte';

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
          title={$t('modal.close')}
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

        <!-- Tab Content Area -->
        <div class="flex-1 relative overflow-hidden bg-white dark:bg-[#18181a]">
          {#key activeTab}
            <div
              in:fly={{ y: 6, duration: 200, delay: 40, easing: cubicOut }}
              out:fade={{ duration: 100, easing: cubicIn }}
              class="absolute inset-0 overflow-y-auto p-5 space-y-6 will-change-[transform,opacity]"
            >
              {#if activeTab === 'appearance'}
                <SettingsAppearanceTab />
              {:else if activeTab === 'account'}
                <div class="space-y-4">
                  <AccountUsageCard showActions={false} />
                  <AccountPlanTab />
                </div>
              {:else if activeTab === 'language'}
                <SettingsLanguageTab />
              {:else if activeTab === 'engine'}
                <SettingsEngineTab />
              {:else if activeTab === 'about'}
                <SettingsAboutTab />
              {/if}
            </div>
          {/key}
        </div>
      </div>
    </div>
  </div>
{/if}
