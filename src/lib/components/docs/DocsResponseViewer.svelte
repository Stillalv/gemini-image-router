<script lang="ts">
  import { Check, Copy, AlertCircle, ShieldAlert, XCircle, Info } from 'lucide-svelte';
  import { t } from '$lib/i18n';

  interface Props {
    successResponse: string;
    error400Example?: string;
    error403Example?: string;
  }

  let { successResponse, error400Example, error403Example }: Props = $props();
  let copied = $state(false);

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch {}
  }
</script>

<div class="space-y-4">
  <!-- Success 200 OK Response Card -->
  <div class="space-y-2">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          200 OK
        </span>
        <span class="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
          {$t('docs.responseSuccess')}
        </span>
      </div>

      <button
        type="button"
        onclick={() => copyText(successResponse)}
        class="btn-spring flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-[#202023] cursor-pointer"
      >
        {#if copied}
          <Check class="w-3 h-3 text-emerald-500" />
          <span class="text-emerald-500">{$t('docs.copied')}</span>
        {:else}
          <Copy class="w-3 h-3" />
          <span>{$t('docs.copy')}</span>
        {/if}
      </button>
    </div>

    <pre class="bg-neutral-900 dark:bg-[#121214] text-neutral-100 p-3.5 rounded-xl overflow-x-auto font-mono text-[11px] leading-relaxed border border-neutral-800 dark:border-[#27272a] select-text shadow-inner">{successResponse}</pre>
  </div>

  <!-- Status Codes & Error Response Descriptions -->
  <div class="space-y-2 pt-2 border-t border-neutral-100 dark:border-[#27272a]">
    <div class="flex items-center gap-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
      <Info class="w-3.5 h-3.5 text-neutral-500" />
      <span>{$t('docs.responseErrors')}</span>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
      <div class="p-2.5 bg-neutral-50 dark:bg-[#1c1c1f] rounded-xl border border-neutral-200 dark:border-[#27272a] space-y-1">
        <div class="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
          <AlertCircle class="w-3.5 h-3.5" />
          <span>400 Bad Request</span>
        </div>
        <p class="text-neutral-600 dark:text-neutral-400 leading-normal">
          {$t('docs.responses.error400')}
        </p>
      </div>

      <div class="p-2.5 bg-neutral-50 dark:bg-[#1c1c1f] rounded-xl border border-neutral-200 dark:border-[#27272a] space-y-1">
        <div class="flex items-center gap-1.5 font-bold text-rose-500">
          <ShieldAlert class="w-3.5 h-3.5" />
          <span>401 Unauthorized</span>
        </div>
        <p class="text-neutral-600 dark:text-neutral-400 leading-normal">
          {$t('docs.responses.error401')}
        </p>
      </div>

      <div class="p-2.5 bg-neutral-50 dark:bg-[#1c1c1f] rounded-xl border border-neutral-200 dark:border-[#27272a] space-y-1">
        <div class="flex items-center gap-1.5 font-bold text-orange-500">
          <XCircle class="w-3.5 h-3.5" />
          <span>403 Quota Exceeded</span>
        </div>
        <p class="text-neutral-600 dark:text-neutral-400 leading-normal">
          {$t('docs.responses.error403')}
        </p>
      </div>

      <div class="p-2.5 bg-neutral-50 dark:bg-[#1c1c1f] rounded-xl border border-neutral-200 dark:border-[#27272a] space-y-1">
        <div class="flex items-center gap-1.5 font-bold text-red-600 dark:text-red-400">
          <AlertCircle class="w-3.5 h-3.5" />
          <span>500 Server Error</span>
        </div>
        <p class="text-neutral-600 dark:text-neutral-400 leading-normal">
          {$t('docs.responses.error500')}
        </p>
      </div>
    </div>
  </div>
</div>
