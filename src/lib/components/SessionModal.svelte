<script lang="ts">
  import { Sparkles, Palette, X, ArrowRight } from 'lucide-svelte';
  import { fade, scale } from 'svelte/transition';
  import { cubicOut, cubicIn } from 'svelte/easing';
  import { t } from '$lib/i18n';
  import type { SessionType } from '$lib/types';

  interface Props {
    open: boolean;
    onSelect: (type: SessionType) => void;
    onClose: () => void;
  }

  let { open = false, onSelect, onClose }: Props = $props();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && open) onClose();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <!-- Backdrop with synchronized fade & blur -->
  <div
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    transition:fade={{ duration: 180 }}
    onclick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    class="modal-backdrop select-none"
  >
    <!-- Modal Panel with Spring Scale -->
    <div
      in:scale={{ duration: 240, start: 0.93, opacity: 0, easing: cubicOut }}
      out:scale={{ duration: 150, start: 0.96, opacity: 0, easing: cubicIn }}
      class="modal-panel w-full max-w-md p-6 space-y-5"
    >
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-base font-bold tracking-tight">{$t('modal.createSession')}</h2>
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{$t('modal.chooseSessionDesc')}</p>
        </div>
        <button
          type="button"
          onclick={onClose}
          class="btn-spring p-1.5 text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg cursor-pointer"
          title={$t('modal.close')}
          aria-label={$t('modal.close')}
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Session Cards with Spring Hover -->
      <div class="space-y-3">
        <!-- Option 1: Generate Image -->
        <button
          type="button"
          onclick={() => onSelect('generate')}
          class="card-spring-hover w-full text-left p-4 rounded-xl border border-neutral-200 dark:border-[#27272a] bg-neutral-50/50 dark:bg-[#1f1f22]/60 hover:border-neutral-400 dark:hover:border-neutral-500 hover:bg-white dark:hover:bg-[#252528] group flex items-center justify-between cursor-pointer"
        >
          <div class="flex items-center gap-3.5">
            <div class="p-2.5 rounded-lg bg-neutral-100 dark:bg-[#28282c] group-hover:scale-110 group-hover:bg-amber-50 dark:group-hover:bg-amber-950/40 transition-transform duration-200 ease-out">
              <Sparkles class="w-5 h-5 text-neutral-700 dark:text-neutral-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-200" />
            </div>
            <div>
              <div class="text-sm font-semibold text-neutral-900 dark:text-white">{$t('modal.textToImage')}</div>
              <div class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{$t('modal.textToImageDesc')}</div>
            </div>
          </div>
          <ArrowRight class="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all duration-200 ease-out" />
        </button>

        <!-- Option 2: Edit Image -->
        <button
          type="button"
          onclick={() => onSelect('edit')}
          class="card-spring-hover w-full text-left p-4 rounded-xl border border-neutral-200 dark:border-[#27272a] bg-neutral-50/50 dark:bg-[#1f1f22]/60 hover:border-neutral-400 dark:hover:border-neutral-500 hover:bg-white dark:hover:bg-[#252528] group flex items-center justify-between cursor-pointer"
        >
          <div class="flex items-center gap-3.5">
            <div class="p-2.5 rounded-lg bg-neutral-100 dark:bg-[#28282c] group-hover:scale-110 group-hover:bg-amber-50 dark:group-hover:bg-amber-950/40 transition-transform duration-200 ease-out">
              <Palette class="w-5 h-5 text-neutral-700 dark:text-neutral-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-200" />
            </div>
            <div>
              <div class="text-sm font-semibold text-neutral-900 dark:text-white">{$t('modal.imageToImage')}</div>
              <div class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{$t('modal.imageToImageDesc')}</div>
            </div>
          </div>
          <ArrowRight class="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all duration-200 ease-out" />
        </button>
      </div>
    </div>
  </div>
{/if}
