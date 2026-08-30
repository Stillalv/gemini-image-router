<script lang="ts">
  import { Copy, Check, Terminal, FileCode, Layers } from 'lucide-svelte';
  import { t } from '$lib/i18n';

  interface Props {
    snippets: Record<'curl' | 'python' | 'javascript' | 'n8n', string>;
  }

  let { snippets }: Props = $props();
  let snippetLang: 'curl' | 'python' | 'javascript' | 'n8n' = $state('curl');
  let copied = $state(false);

  async function copyCode(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch {}
  }
</script>

<div class="space-y-2.5">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-[#1f1f22] rounded-xl">
      <button
        type="button"
        onclick={() => (snippetLang = 'curl')}
        class="px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer {snippetLang === 'curl' ? 'bg-white dark:bg-[#2c2c30] text-neutral-900 dark:text-white shadow-xs' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}"
      >
        <span class="flex items-center gap-1.5"><Terminal class="w-3 h-3" /> cURL</span>
      </button>
      <button
        type="button"
        onclick={() => (snippetLang = 'python')}
        class="px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer {snippetLang === 'python' ? 'bg-white dark:bg-[#2c2c30] text-neutral-900 dark:text-white shadow-xs' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}"
      >
        <span class="flex items-center gap-1.5"><FileCode class="w-3 h-3" /> Python</span>
      </button>
      <button
        type="button"
        onclick={() => (snippetLang = 'javascript')}
        class="px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer {snippetLang === 'javascript' ? 'bg-white dark:bg-[#2c2c30] text-neutral-900 dark:text-white shadow-xs' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}"
      >
        <span class="flex items-center gap-1.5"><FileCode class="w-3 h-3" /> JavaScript</span>
      </button>
      <button
        type="button"
        onclick={() => (snippetLang = 'n8n')}
        class="px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer {snippetLang === 'n8n' ? 'bg-white dark:bg-[#2c2c30] text-neutral-900 dark:text-white shadow-xs' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}"
      >
        <span class="flex items-center gap-1.5"><Layers class="w-3 h-3" /> n8n / Workflow</span>
      </button>
    </div>

    <button
      type="button"
      onclick={() => copyCode(snippets[snippetLang])}
      class="btn-spring flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-[#202023] hover:bg-neutral-200 dark:hover:bg-neutral-800 cursor-pointer"
      title="Salin Code Snippet"
    >
      {#if copied}
        <Check class="w-3.5 h-3.5 text-emerald-500" />
        <span class="text-emerald-500 font-medium">{$t('docs.copied')}</span>
      {:else}
        <Copy class="w-3.5 h-3.5" />
        <span>{$t('docs.copy')}</span>
      {/if}
    </button>
  </div>

  <pre class="bg-neutral-900 dark:bg-[#121214] text-neutral-100 p-4 rounded-xl overflow-x-auto font-mono text-[11.5px] leading-relaxed border border-neutral-800 dark:border-[#27272a] select-text shadow-inner">{snippets[snippetLang]}</pre>
</div>
