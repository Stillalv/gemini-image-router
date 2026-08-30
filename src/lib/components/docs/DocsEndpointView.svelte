<script lang="ts">
  import DocsCodeSnippets from './DocsCodeSnippets.svelte';
  import DocsResponseViewer from './DocsResponseViewer.svelte';
  import { Lock, Globe, Sparkles, Tag } from 'lucide-svelte';
  import { t } from '$lib/i18n';

  export interface ParameterItem {
    name: string;
    type: string;
    required: boolean;
    description: string;
    defaultValue?: string;
  }

  interface Props {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    title: string;
    description: string;
    authType: 'optional' | 'required' | 'none';
    authNote?: string;
    parameters?: ParameterItem[];
    snippets: Record<'curl' | 'python' | 'javascript' | 'n8n', string>;
    successResponse: string;
  }

  let {
    method,
    path,
    title,
    description,
    authType,
    authNote,
    parameters = [],
    snippets,
    successResponse
  }: Props = $props();

  const methodColors: Record<string, string> = {
    POST: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    GET: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    PUT: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    DELETE: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
  };
</script>

<div class="space-y-6">
  <!-- Endpoint Header Hero -->
  <div class="p-4 rounded-2xl bg-neutral-50 dark:bg-[#18181b] border border-neutral-200 dark:border-[#27272a] space-y-2">
    <div class="flex flex-wrap items-center gap-2.5">
      <span class="px-2.5 py-0.5 rounded-lg text-xs font-mono font-black border {methodColors[method]}">
        {method}
      </span>
      <span class="font-mono text-sm font-bold text-neutral-900 dark:text-white select-all">
        {path}
      </span>

      <div class="ml-auto flex items-center gap-1 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
        {#if authType === 'required'}
          <Lock class="w-3.5 h-3.5 text-amber-500" />
          <span class="text-amber-600 dark:text-amber-400 font-semibold">Auth Required</span>
        {:else if authType === 'optional'}
          <Globe class="w-3.5 h-3.5 text-neutral-400" />
          <span>Guest OK / Optional Bearer</span>
        {:else}
          <Globe class="w-3.5 h-3.5 text-neutral-400" />
          <span>Public</span>
        {/if}
      </div>
    </div>

    <p class="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed pt-1">
      {description}
    </p>

    {#if authNote}
      <div class="text-[11px] text-neutral-500 dark:text-neutral-400 bg-white/70 dark:bg-[#121214]/70 p-2.5 rounded-xl border border-neutral-200/60 dark:border-[#2a2a2e] flex items-start gap-2">
        <Sparkles class="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
        <span>{authNote}</span>
      </div>
    {/if}
  </div>

  <!-- Request Headers Section -->
  <div class="space-y-2">
    <div class="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
      {$t('docs.requestHeaders')}
    </div>
    <div class="bg-neutral-50 dark:bg-[#141416] rounded-xl border border-neutral-200 dark:border-[#27272a] divide-y divide-neutral-200/70 dark:divide-[#27272a] text-xs font-mono">
      <div class="p-2.5 flex items-center justify-between">
        <div>
          <span class="font-bold text-neutral-900 dark:text-white">Content-Type</span>
          <span class="text-[11px] text-neutral-500 ml-2 font-sans">wajib untuk payload JSON</span>
        </div>
        <span class="text-neutral-600 dark:text-neutral-300 text-[11px]">application/json</span>
      </div>
      <div class="p-2.5 flex items-center justify-between">
        <div>
          <span class="font-bold text-neutral-900 dark:text-white">Authorization</span>
          <span class="text-[11px] text-neutral-500 ml-2 font-sans">{authType === 'required' ? 'wajib' : 'opsional'}</span>
        </div>
        <span class="text-neutral-600 dark:text-neutral-300 text-[11px]">Bearer gem_sec_...</span>
      </div>
    </div>
  </div>

  <!-- Request Body Parameters Table -->
  {#if parameters.length > 0}
    <div class="space-y-2">
      <div class="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
        {$t('docs.requestBody')}
      </div>

      <div class="border border-neutral-200 dark:border-[#27272a] rounded-xl overflow-hidden bg-white dark:bg-[#141416]">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-neutral-100/70 dark:bg-[#1b1b1e] border-b border-neutral-200 dark:border-[#27272a] text-neutral-500 dark:text-neutral-400 text-[11px]">
              <th class="p-2.5 font-semibold">Parameter</th>
              <th class="p-2.5 font-semibold">Tipe</th>
              <th class="p-2.5 font-semibold">Wajib</th>
              <th class="p-2.5 font-semibold">Keterangan</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100 dark:divide-[#202024]">
            {#each parameters as p}
              <tr class="hover:bg-neutral-50 dark:hover:bg-[#18181c] transition-colors">
                <td class="p-2.5 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                  {p.name}
                </td>
                <td class="p-2.5 font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
                  {p.type}
                </td>
                <td class="p-2.5">
                  {#if p.required}
                    <span class="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      WAJIB
                    </span>
                  {:else}
                    <span class="px-1.5 py-0.5 rounded text-[9.5px] font-medium bg-neutral-200/60 dark:bg-neutral-800 text-neutral-500">
                      Opsional
                    </span>
                  {/if}
                </td>
                <td class="p-2.5 text-neutral-600 dark:text-neutral-300 text-[11.5px] leading-relaxed">
                  {p.description}
                  {#if p.defaultValue}
                    <span class="text-neutral-400 block text-[10px] mt-0.5 font-mono">Default: {p.defaultValue}</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}

  <!-- Interactive Code Examples (cURL, Python, JS, n8n) -->
  <div class="space-y-2 pt-2 border-t border-neutral-100 dark:border-[#27272a]">
    <div class="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
      Contoh Request Code
    </div>
    <DocsCodeSnippets {snippets} />
  </div>

  <!-- Response Format & Error Codes -->
  <div class="pt-2 border-t border-neutral-100 dark:border-[#27272a]">
    <DocsResponseViewer {successResponse} />
  </div>
</div>
