<script lang="ts">
  import { ArrowUp, Loader2, Plus, X } from 'lucide-svelte';
  import { scale } from 'svelte/transition';
  import { backOut } from 'svelte/easing';
  import AspectRatioPicker from './AspectRatioPicker.svelte';
  import ModelSelector from './ModelSelector.svelte';
  import { t } from '$lib/i18n';
  import type { GeminiModelId } from '$lib/types';

  interface Props {
    prompt?: string;
    attachedBase64?: string | null;
    attachedName?: string;
    selectedRatio?: string;
    selectedModel?: GeminiModelId;
    sessionType?: 'generate' | 'edit';
    isLoading?: boolean;
    onSend: () => void;
  }

  let {
    prompt = $bindable(''),
    attachedBase64 = $bindable(null),
    attachedName = $bindable(''),
    selectedRatio = $bindable('Auto'),
    selectedModel = $bindable('3.7-flash'),
    sessionType = 'generate',
    isLoading = false,
    onSend
  }: Props = $props();

  let isDragging = $state(false);
  let fileInput: HTMLInputElement;

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    attachedName = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        attachedBase64 = e.target.result;
      }
    };
    reader.readAsDataURL(file);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
    if (e.dataTransfer?.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if ((prompt.trim() || attachedBase64) && !isLoading) {
        onSend();
      }
    }
  }
</script>

<div class="max-w-3xl mx-auto">
  <div
    role="region"
    aria-label="Prompt Input Area"
    ondragover={(e) => { e.preventDefault(); isDragging = true; }}
    ondragleave={() => (isDragging = false)}
    ondrop={onDrop}
    class="relative flex flex-col bg-neutral-50 dark:bg-[#18181a] border rounded-2xl p-3 focus-within:border-neutral-900 dark:focus-within:border-neutral-400 focus-within:bg-white dark:focus-within:bg-[#1f1f22] transition shadow-sm {isDragging ? 'border-neutral-900 dark:border-white ring-2 ring-neutral-900/10 bg-neutral-100 dark:bg-neutral-800' : 'border-neutral-300 dark:border-[#2f2f33]'}"
  >
    <!-- Top Thumbnail Preview inside input card with Pop-In -->
    {#if attachedBase64}
      <div
        class="flex items-center gap-2 mb-2 p-1.5 bg-white dark:bg-[#202023] rounded-xl border border-neutral-200/90 dark:border-[#333338] w-fit shadow-xs origin-bottom-left"
        transition:scale={{ duration: 200, start: 0.88, easing: backOut }}
      >
        <img src={attachedBase64} alt="preview" class="w-10 h-10 object-cover rounded-lg border border-neutral-200 dark:border-neutral-700" />
        <div class="flex flex-col pr-1">
          <span class="text-xs font-medium text-neutral-800 dark:text-neutral-200 truncate max-w-[150px]">{attachedName || 'attachment.png'}</span>
          <span class="text-[10px] text-neutral-400 dark:text-neutral-500">{$t('chat.attachedImage')}</span>
        </div>
        <button
          type="button"
          onclick={() => { attachedBase64 = null; attachedName = ''; }}
          class="btn-spring p-1 text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md cursor-pointer"
          title={$t('chat.removeAttachment')}
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>
    {/if}

    <!-- Textarea -->
    <textarea
      bind:value={prompt}
      onkeydown={handleKeydown}
      disabled={isLoading}
      placeholder={sessionType === 'edit' ? $t('chat.placeholderEdit') : $t('chat.placeholderGenerate')}
      rows="1"
      class="w-full bg-transparent border-0 resize-none outline-none text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm px-1 py-1 min-h-[36px] max-h-[140px]"
    ></textarea>

    <!-- Bottom Action Row (+ Plus button, Ratio Selector, Model Selector, & Send button) -->
    <div class="flex items-center justify-between mt-1 pt-1">
      <div class="flex items-center gap-1.5">
        <!-- Attach Image Button -->
        <button
          type="button"
          onclick={() => fileInput.click()}
          class="btn-spring h-8 w-8 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800 rounded-lg cursor-pointer"
          title={$t('chat.attachImage')}
        >
          <Plus class="w-4 h-4" />
        </button>

        <!-- Aspect Ratio Dropdown Pill -->
        <AspectRatioPicker
          selectedRatio={selectedRatio}
          onSelectRatio={(r) => (selectedRatio = r)}
        />

        <!-- Model Dropdown Pill -->
        <ModelSelector
          selectedModel={selectedModel}
          onSelectModel={(m) => (selectedModel = m)}
        />
      </div>

      <!-- Send Button -->
      <button
        type="button"
        onclick={onSend}
        disabled={(!prompt.trim() && !attachedBase64) || isLoading}
        class="btn-spring h-8 w-8 flex items-center justify-center bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-20 text-white dark:text-neutral-900 rounded-lg flex-shrink-0 cursor-pointer"
        title={$t('chat.send')}
      >
        {#if isLoading}
          <Loader2 class="w-4 h-4 animate-spin text-white dark:text-neutral-900" />
        {:else}
          <ArrowUp class="w-4 h-4" />
        {/if}
      </button>
    </div>

    <!-- Hidden File Input -->
    <input
      bind:this={fileInput}
      type="file"
      accept="image/*"
      class="hidden"
      onchange={(e) => {
        const target = e.target as HTMLInputElement;
        if (target.files?.[0]) handleFile(target.files[0]);
      }}
    />
  </div>

  <div class="text-[11px] text-center text-neutral-400 dark:text-neutral-500 mt-2">
    {$t('chat.pressEnter')}
  </div>
</div>
