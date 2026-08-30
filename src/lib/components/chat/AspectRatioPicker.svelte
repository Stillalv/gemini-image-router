<script lang="ts">
  import { ChevronDown } from 'lucide-svelte';
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { t } from '$lib/i18n';

  interface AspectRatioItem {
    id: string;
    label: string;
    boxW?: string;
    boxH?: string;
  }

  const RATIOS: AspectRatioItem[] = [
    { id: '1:1', label: '1:1', boxW: 'w-3 h-3' },
    { id: '16:9', label: '16:9', boxW: 'w-3.5 h-2' },
    { id: '9:16', label: '9:16', boxW: 'w-2 h-3.5' },
    { id: '4:3', label: '4:3', boxW: 'w-3 h-2.5' },
    { id: '3:4', label: '3:4', boxW: 'w-2.5 h-3' },
    { id: '2:1', label: '2:1', boxW: 'w-3.5 h-1.5' },
    { id: '1:2', label: '1:2', boxW: 'w-1.5 h-3.5' },
    { id: 'Auto', label: 'auto' }
  ];

  interface Props {
    selectedRatio?: string;
    onSelectRatio: (ratio: string) => void;
  }

  let { selectedRatio = 'Auto', onSelectRatio }: Props = $props();

  let isRatioMenuOpen = $state(false);
  let currentRatioItem = $derived(RATIOS.find((r) => r.id === selectedRatio));

  function handleSelect(id: string) {
    onSelectRatio(id);
    isRatioMenuOpen = false;
  }
</script>

<div class="relative">
  <button
    type="button"
    onclick={() => (isRatioMenuOpen = !isRatioMenuOpen)}
    class="card-spring-hover flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-200/70 dark:bg-[#202024] text-neutral-800 dark:text-neutral-200 hover:bg-neutral-300/70 dark:hover:bg-[#28282e] border border-neutral-300/70 dark:border-[#333338] cursor-pointer select-none transition-colors"
    title={$t('chat.selectRatioTitle')}
  >
    {#if currentRatioItem?.boxW && currentRatioItem?.boxH}
      <span class="inline-block {currentRatioItem.boxW} {currentRatioItem.boxH} border border-current rounded-[2px] flex-shrink-0"></span>
    {/if}
    <span class="font-mono tracking-tight">{selectedRatio === 'Auto' ? $t('models.auto') : selectedRatio}</span>
    <ChevronDown class="w-3 h-3 text-neutral-500 transition-transform duration-150 {isRatioMenuOpen ? 'rotate-180' : ''}" />
  </button>

  {#if isRatioMenuOpen}
    <!-- Backdrop click catcher -->
    <div
      class="fixed inset-0 z-30"
      role="presentation"
      onclick={() => (isRatioMenuOpen = false)}
      onkeydown={(e) => { if (e.key === 'Escape') isRatioMenuOpen = false; }}
    ></div>

    <!-- Aspect Grid Popover Card -->
    <div
      class="absolute bottom-full left-0 mb-2 w-64 p-3 bg-white dark:bg-[#141416] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl z-40 origin-bottom-left"
      in:fly={{ y: 6, duration: 150, easing: cubicOut }}
    >
      <div class="text-[10px] font-bold tracking-widest text-neutral-400 dark:text-neutral-500 uppercase mb-2 px-0.5 select-none">
        {$t('models.aspectTitle')}
      </div>

      <div class="grid grid-cols-3 gap-1.5">
        {#each RATIOS as r}
          <button
            type="button"
            onclick={() => handleSelect(r.id)}
            class="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl border text-xs font-mono transition-all duration-150 cursor-pointer select-none {selectedRatio === r.id ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 border-neutral-900 dark:border-white font-bold shadow-xs' : 'bg-neutral-50 dark:bg-[#1c1c1f] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700/80 hover:border-neutral-400 dark:hover:border-neutral-500 hover:bg-neutral-100 dark:hover:bg-[#25252a]'}"
          >
            {#if r.boxW && r.boxH}
              <span class="inline-block {r.boxW} {r.boxH} border border-current rounded-[2px] flex-shrink-0"></span>
            {/if}
            <span class="leading-none text-[11px]">{r.id === 'Auto' ? $t('models.auto') : r.label}</span>
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>
