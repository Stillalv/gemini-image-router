<script lang="ts">
  import { onMount } from 'svelte';
  import { Copy, Check, Download, FileJson, Loader2 } from 'lucide-svelte';
  import { t } from '$lib/i18n';

  let openApiSpec = $state('');
  let isLoading = $state(true);
  let copied = $state(false);

  async function loadSpec() {
    try {
      isLoading = true;
      const res = await fetch('/api/docs');
      const data = await res.json();
      openApiSpec = JSON.stringify(data, null, 2);
    } catch {
      openApiSpec = 'Gagal memuat OpenAPI spec';
    } finally {
      isLoading = false;
    }
  }

  async function copySpec() {
    try {
      await navigator.clipboard.writeText(openApiSpec);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch {}
  }

  function downloadJson() {
    const blob = new Blob([openApiSpec], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gemini-image-router-openapi.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  onMount(() => {
    loadSpec();
  });
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-2">
      <FileJson class="w-4 h-4 text-amber-500" />
      <span class="text-xs font-bold text-neutral-800 dark:text-neutral-200">
        OpenAPI 3.0.0 Specification JSON
      </span>
    </div>

    <div class="flex items-center gap-2">
      <button
        type="button"
        onclick={copySpec}
        class="btn-spring flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-[#202023] hover:bg-neutral-200 dark:hover:bg-neutral-800 cursor-pointer"
      >
        {#if copied}
          <Check class="w-3.5 h-3.5 text-emerald-500" />
          <span class="text-emerald-500 font-medium">{$t('docs.copied')}</span>
        {:else}
          <Copy class="w-3.5 h-3.5" />
          <span>{$t('docs.copy')}</span>
        {/if}
      </button>

      <button
        type="button"
        onclick={downloadJson}
        class="btn-spring flex items-center gap-1.5 text-xs text-white bg-neutral-900 dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 px-3 py-1.5 rounded-lg cursor-pointer font-medium"
      >
        <Download class="w-3.5 h-3.5" />
        <span>{$t('docs.downloadSpec')}</span>
      </button>
    </div>
  </div>

  {#if isLoading}
    <div class="h-64 flex items-center justify-center gap-2 text-neutral-500 text-xs">
      <Loader2 class="w-4 h-4 animate-spin text-amber-500" />
      <span>Memuat OpenAPI specification...</span>
    </div>
  {:else}
    <pre class="bg-neutral-900 dark:bg-[#121214] text-neutral-100 p-4 rounded-xl overflow-x-auto font-mono text-[11px] leading-relaxed border border-neutral-800 dark:border-[#27272a] max-h-[480px] select-text shadow-inner">{openApiSpec}</pre>
  {/if}
</div>
