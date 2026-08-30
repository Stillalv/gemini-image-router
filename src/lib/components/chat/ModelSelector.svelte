<script lang="ts">
  import { Sparkles, ChevronDown, Check } from 'lucide-svelte';
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { GEMINI_MODELS, type GeminiModelId } from '$lib/types';
  import { t } from '$lib/i18n';

  interface Props {
    selectedModel?: GeminiModelId;
    onSelectModel: (model: GeminiModelId) => void;
  }

  let { selectedModel = '3.7-flash', onSelectModel }: Props = $props();

  let isModelMenuOpen = $state(false);
  let currentModelItem = $derived(GEMINI_MODELS.find((m) => m.id === selectedModel) || GEMINI_MODELS[0]);

  function handleSelect(id: GeminiModelId) {
    onSelectModel(id);
    isModelMenuOpen = false;
  }
</script>

<div class="relative">
  <button
    type="button"
    onclick={() => (isModelMenuOpen = !isModelMenuOpen)}
    class="card-spring-hover flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-200/70 dark:bg-[#202024] text-neutral-800 dark:text-neutral-200 hover:bg-neutral-300/70 dark:hover:bg-[#28282e] border border-neutral-300/70 dark:border-[#333338] cursor-pointer select-none transition-colors"
    title={$t('chat.selectModelTitle')}
  >
    <Sparkles class="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400 flex-shrink-0" />
    <span class="tracking-tight">{currentModelItem.name}</span>
    <span class="px-1 py-0.2 rounded text-[9px] font-mono font-bold bg-neutral-300/80 dark:bg-neutral-700/80 text-neutral-800 dark:text-neutral-200">{currentModelItem.badge}</span>
    <ChevronDown class="w-3 h-3 text-neutral-500 transition-transform duration-150 {isModelMenuOpen ? 'rotate-180' : ''}" />
  </button>

  {#if isModelMenuOpen}
    <!-- Backdrop click catcher -->
    <div
      class="fixed inset-0 z-30"
      role="presentation"
      onclick={() => (isModelMenuOpen = false)}
      onkeydown={(e) => { if (e.key === 'Escape') isModelMenuOpen = false; }}
    ></div>

    <!-- Model Selection Popover Card -->
    <div
      class="absolute bottom-full left-0 mb-2 w-72 p-3 bg-white dark:bg-[#141416] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl z-40 origin-bottom-left space-y-1.5"
      in:fly={{ y: 6, duration: 150, easing: cubicOut }}
    >
      <div class="flex items-center justify-between px-0.5 mb-1 text-[10px] font-bold tracking-widest text-neutral-400 dark:text-neutral-500 uppercase select-none">
        <span>{$t('models.title') || 'MODEL & USAGE'}</span>
        <span class="text-[9px] font-mono font-normal">{$t('models.costPerReq') || 'COST / REQ'}</span>
      </div>

      {#each GEMINI_MODELS as m}
        <button
          type="button"
          onclick={() => handleSelect(m.id)}
          class="w-full flex items-center justify-between p-2 rounded-xl border text-xs text-left transition-all duration-150 cursor-pointer select-none {selectedModel === m.id ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 border-neutral-900 dark:border-white font-bold shadow-xs' : 'bg-neutral-50 dark:bg-[#1c1c1f] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700/80 hover:border-neutral-400 dark:hover:border-neutral-500 hover:bg-neutral-100 dark:hover:bg-[#25252a]'}"
        >
          <div class="min-w-0 pr-2">
            <div class="flex items-center gap-1.5">
              <span class="font-semibold text-[12px]">{m.name}</span>
              <span class="px-1.5 py-0.2 rounded text-[8.5px] font-mono font-bold {selectedModel === m.id ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900' : 'bg-neutral-200/80 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'}">{m.tag}</span>
            </div>
            <div class="text-[10px] {selectedModel === m.id ? 'text-neutral-300 dark:text-neutral-700' : 'text-neutral-500 dark:text-neutral-400'} truncate mt-0.5">
              {m.description}
            </div>
          </div>

          <div class="flex-shrink-0 flex items-center gap-1.5">
            <span class="px-1.5 py-0.5 rounded-md font-mono text-[10px] font-black {selectedModel === m.id ? 'bg-amber-400 text-neutral-950' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200'}">
              {m.badge}
            </span>
            {#if selectedModel === m.id}
              <Check class="w-3.5 h-3.5 flex-shrink-0" />
            {/if}
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>
