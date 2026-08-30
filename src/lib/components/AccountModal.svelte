<script lang="ts">
  import { untrack } from 'svelte';
  import { X, Crown, Key, LogIn } from 'lucide-svelte';
  import { account } from '$lib/stores/account';
  import { t } from '$lib/i18n';
  import { fade, scale } from 'svelte/transition';
  import { backOut, cubicIn } from 'svelte/easing';

  import AccountUsageCard from './account/AccountUsageCard.svelte';
  import AccountPlanTab from './account/AccountPlanTab.svelte';
  import AccountKeysTab from './account/AccountKeysTab.svelte';
  import AccountAuthTab from './account/AccountAuthTab.svelte';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
  }

  let { isOpen = false, onClose }: Props = $props();

  let activeSubTab: 'plan' | 'keys' | 'auth' = $state('auth');
  let authInitialMode: 'login' | 'signup' = $state('signup');
  let authInitialError: string | null = $state(null);

  // Data fetching effect: strictly untracked to guarantee zero infinite loops
  $effect(() => {
    if (isOpen) {
      untrack(() => {
        account.fetchUsage();
        if ($account.isLoggedIn) {
          activeSubTab = 'plan';
          account.fetchApiKeys();
        } else {
          activeSubTab = 'auth';
          authInitialMode = 'signup';
        }
      });
    } else {
      untrack(() => {
        authInitialError = null;
      });
    }
  });

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && isOpen) onClose();
  }

  function handleSwitchToAuth(mode: 'login' | 'signup' = 'signup', errorMsg?: string) {
    authInitialMode = mode;
    authInitialError = errorMsg || null;
    activeSubTab = 'auth';
  }

  async function handleLogout() {
    await account.logout();
    activeSubTab = 'auth';
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <!-- Modal Backdrop with smooth fade -->
  <div
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    transition:fade={{ duration: 150 }}
    onclick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    class="modal-backdrop"
  >
    <!-- Modal Card -->
    <div
      in:scale={{ duration: 200, start: 0.96, opacity: 0, easing: backOut }}
      out:scale={{ duration: 120, start: 0.98, opacity: 0, easing: cubicIn }}
      onclick={(e) => e.stopPropagation()}
      class="bg-white dark:bg-[#18181a] border border-neutral-200 dark:border-[#27272a] rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col text-neutral-900 dark:text-neutral-100 transition-colors duration-150 relative z-50"
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

      <!-- Tab Navigation inside Account Modal -->
      <div class="flex border-b border-neutral-200 dark:border-[#27272a] px-5 bg-neutral-50/40 dark:bg-[#18181a]">
        <button
          type="button"
          onclick={() => (activeSubTab = 'plan')}
          class="py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer select-none {activeSubTab === 'plan' ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white' : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'}"
        >
          <span class="pointer-events-none">{$t('settings.tabs.account')}</span>
        </button>

        <button
          type="button"
          onclick={() => (activeSubTab = 'keys')}
          class="py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer select-none flex items-center gap-1.5 {activeSubTab === 'keys' ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white' : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'}"
        >
          <Key class="w-3.5 h-3.5 pointer-events-none" />
          <span class="pointer-events-none">{$t('account.apiKeysTitle')}</span>
          {#if $account.apiKeys.length > 0}
            <span class="px-1.5 py-0.2 bg-neutral-200 dark:bg-neutral-800 text-[10px] rounded-full font-bold pointer-events-none">
              {$account.apiKeys.length}
            </span>
          {/if}
        </button>

        <button
          type="button"
          onclick={() => (activeSubTab = 'auth')}
          class="py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer select-none flex items-center gap-1.5 {activeSubTab === 'auth' ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white' : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'}"
        >
          <LogIn class="w-3.5 h-3.5 pointer-events-none" />
          <span class="pointer-events-none">{$t('account.authTab')}</span>
          {#if !$account.isLoggedIn}
            <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse pointer-events-none"></span>
          {/if}
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-5 space-y-5">
        {#if activeSubTab === 'plan'}
          <AccountUsageCard
            onSwitchToAuth={() => handleSwitchToAuth('login')}
            onLogout={handleLogout}
          />
          <AccountPlanTab
            onSwitchToAuth={handleSwitchToAuth}
          />
        {:else if activeSubTab === 'keys'}
          <AccountKeysTab
            onSwitchToAuth={() => handleSwitchToAuth('login')}
          />
        {:else if activeSubTab === 'auth'}
          <AccountAuthTab
            initialMode={authInitialMode}
            initialError={authInitialError}
            onAuthSuccess={() => (activeSubTab = 'plan')}
          />
        {/if}
      </div>
    </div>
  </div>
{/if}
