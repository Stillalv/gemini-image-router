<script lang="ts">
  import { Key, Plus, Trash2, Copy, Check, AlertCircle, LogIn } from 'lucide-svelte';
  import { account } from '$lib/stores/account';
  import { t } from '$lib/i18n';

  interface Props {
    onSwitchToAuth?: () => void;
  }

  let { onSwitchToAuth }: Props = $props();

  let newKeyName = $state('');
  let isCreatingKey = $state(false);
  let newlyGeneratedKey: string | null = $state(null);
  let copiedKey = $state(false);

  async function handleCreateApiKey() {
    if (isCreatingKey || !$account.isLoggedIn) return;
    isCreatingKey = true;
    try {
      const res = await account.createApiKey(newKeyName.trim() || 'API Key');
      if (res) {
        newlyGeneratedKey = res.rawKey;
        newKeyName = '';
      }
    } finally {
      isCreatingKey = false;
    }
  }

  async function handleCopyKey(textToCopy?: string) {
    const text = textToCopy || newlyGeneratedKey;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      copiedKey = true;
      setTimeout(() => (copiedKey = false), 2500);
    } catch {}
  }

  async function handleRevokeKey(keyId: string) {
    await account.revokeApiKey(keyId);
  }
</script>

<div class="space-y-4">
  <div>
    <h3 class="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
      {$t('account.apiKeysTitle')}
    </h3>
    <p class="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
      {$t('account.apiKeysDesc')}
    </p>
  </div>

  {#if !$account.isLoggedIn}
    <!-- Prompt to Login/Sign Up for Guest -->
    <div class="p-5 bg-neutral-50 dark:bg-[#202023] rounded-2xl border border-neutral-200/90 dark:border-[#2f2f33] text-center space-y-3">
      <div class="w-10 h-10 rounded-xl bg-neutral-200 dark:bg-neutral-800 mx-auto flex items-center justify-center text-neutral-600 dark:text-neutral-300">
        <Key class="w-5 h-5" />
      </div>
      <div class="space-y-1">
        <div class="font-bold text-xs text-neutral-900 dark:text-white">{$t('account.guestAuthRequired')}</div>
        <p class="text-[11px] text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
          {$t('account.guestAuthRequiredDesc')}
        </p>
      </div>
      {#if onSwitchToAuth}
        <button
          type="button"
          onclick={onSwitchToAuth}
          class="btn-spring px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-bold rounded-xl inline-flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <LogIn class="w-3.5 h-3.5" />
          <span>{$t('account.openAuthFormBtn')}</span>
        </button>
      {/if}
    </div>
  {:else}
    <!-- Newly Created Key Alert Banner -->
    {#if newlyGeneratedKey}
      <div class="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2 text-xs">
        <div class="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-semibold text-[11px]">
          <AlertCircle class="w-4 h-4 flex-shrink-0" />
          <span>{$t('account.copyRawKeyTip')}</span>
        </div>
        <div class="flex items-center gap-2">
          <input
            type="text"
            readonly
            value={newlyGeneratedKey}
            onclick={(e) => (e.target as HTMLInputElement).select()}
            class="flex-1 p-2.5 bg-white dark:bg-[#121214] border border-amber-500/40 rounded-lg text-xs font-mono font-bold text-neutral-900 dark:text-white select-all focus:outline-hidden"
          />
          <button
            type="button"
            onclick={() => handleCopyKey()}
            class="btn-spring px-4 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            {#if copiedKey}
              <Check class="w-3.5 h-3.5 text-emerald-500" />
              <span>{$t('chat.copied')}</span>
            {:else}
              <Copy class="w-3.5 h-3.5" />
              <span>{$t('chat.copy')}</span>
            {/if}
          </button>
        </div>
      </div>
    {/if}

    <!-- Create New Key Form -->
    <form onsubmit={(e) => { e.preventDefault(); handleCreateApiKey(); }} class="flex gap-2">
      <input
        type="text"
        bind:value={newKeyName}
        placeholder={$t('account.keyNamePlaceholder')}
        class="flex-1 text-xs px-3 py-2 bg-neutral-50 dark:bg-[#202023] border border-neutral-200 dark:border-[#2f2f33] rounded-xl focus:outline-hidden focus:border-neutral-900 dark:focus:border-white select-text"
      />
      <button
        type="submit"
        disabled={isCreatingKey}
        class="btn-spring px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
      >
        <Plus class="w-3.5 h-3.5" />
        <span>{$t('account.generateKeyBtn')}</span>
      </button>
    </form>

    <!-- API Keys List -->
    <div class="space-y-2">
      {#if $account.apiKeys.length === 0}
        <div class="p-6 text-center text-xs text-neutral-400 dark:text-neutral-500 bg-neutral-50 dark:bg-[#202023] rounded-xl border border-neutral-200/60 dark:border-[#27272a]">
          {$t('account.noKeys')}
        </div>
      {:else}
        {#each $account.apiKeys as key (key.id)}
          <div class="p-3 bg-neutral-50 dark:bg-[#202023] rounded-xl border border-neutral-200 dark:border-[#27272a] flex items-center justify-between gap-3 text-xs">
            <div class="min-w-0 flex-1 space-y-0.5">
              <div class="font-semibold text-neutral-900 dark:text-white truncate select-text">
                {key.name}
              </div>
              <div class="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                <span class="select-text font-bold text-neutral-800 dark:text-neutral-200">{key.keyPrefix}</span>
                <span>•</span>
                <span>{new Date(key.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <button
              type="button"
              onclick={() => handleRevokeKey(key.id)}
              class="btn-spring p-2 text-neutral-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 cursor-pointer"
              title={$t('account.revokeKey')}
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        {/each}
      {/if}
    </div>

    <!-- cURL Quick Integration Guide -->
    <div class="p-3.5 bg-neutral-50 dark:bg-[#202023] rounded-xl border border-neutral-200/70 dark:border-[#27272a] space-y-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
      <div class="font-semibold text-neutral-800 dark:text-neutral-200">{$t('account.authHeaderTitle')}</div>
      <input
        type="text"
        readonly
        value="Authorization: Bearer gem_sec_your_key_here"
        onclick={(e) => (e.target as HTMLInputElement).select()}
        class="w-full font-mono p-2 bg-white dark:bg-[#141416] rounded border border-neutral-200/60 dark:border-neutral-800 text-[11px] select-all cursor-text focus:outline-hidden text-neutral-800 dark:text-neutral-300"
      />
    </div>
  {/if}
</div>
