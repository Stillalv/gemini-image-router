<script lang="ts">
  import { ArrowUp, Loader2, Plus, X, Sparkles, Layers } from 'lucide-svelte';
  import { scale, fly } from 'svelte/transition';
  import { backOut, cubicOut } from 'svelte/easing';
  import AspectRatioPicker from './AspectRatioPicker.svelte';
  import ModelSelector from './ModelSelector.svelte';
  import SlashCommandPopover from './SlashCommandPopover.svelte';
  import { t } from '$lib/i18n';
  import { parseSlashCommand, getAvailableCommands, type SlashCommand } from '$lib/commands';
  import type { GeminiModelId, AttachmentItem } from '$lib/types';

  interface Props {
    prompt?: string;
    attachments?: AttachmentItem[];
    selectedRatio?: string;
    selectedModel?: GeminiModelId;
    sessionType?: 'generate' | 'edit';
    isLoading?: boolean;
    onSend: () => void;
  }

  let {
    prompt = $bindable(''),
    attachments = $bindable([]),
    selectedRatio = $bindable('Auto'),
    selectedModel = $bindable('3.7-flash'),
    sessionType = 'generate',
    isLoading = false,
    onSend
  }: Props = $props();

  let isDragging = $state(false);
  let fileInput: HTMLInputElement;
  let selectedCmdIndex = $state(0);

  // Slash commands popover state
  let isEditMode = $derived(sessionType === 'edit' || attachments.length > 0);
  let showCommandPopover = $derived(prompt.startsWith('/') && !prompt.includes(' '));
  let availableCommands = $derived(getAvailableCommands(isEditMode, prompt));

  // Parsed command preview badge
  let parsedCommand = $derived(parseSlashCommand(prompt));

  function handleFiles(files: FileList | File[]) {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, 5 - attachments.length);
    for (const file of validFiles) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          attachments = [
            ...attachments,
            {
              id: crypto.randomUUID(),
              name: file.name,
              dataUrl: e.target.result,
              size: file.size
            }
          ];
        }
      };
      reader.readAsDataURL(file);
    }
  }

  function removeAttachment(id: string) {
    attachments = attachments.filter(a => a.id !== id);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
    if (e.dataTransfer?.files?.length) {
      handleFiles(e.dataTransfer.files);
    }
  }

  function selectCommand(cmd: SlashCommand) {
    prompt = `${cmd.name} `;
    selectedCmdIndex = 0;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (showCommandPopover && availableCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedCmdIndex = (selectedCmdIndex + 1) % availableCommands.length;
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedCmdIndex = (selectedCmdIndex - 1 + availableCommands.length) % availableCommands.length;
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        selectCommand(availableCommands[selectedCmdIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        prompt = '';
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if ((prompt.trim() || attachments.length > 0) && !isLoading) {
        onSend();
      }
    }
  }
</script>

<div class="max-w-3xl mx-auto relative">
  <!-- Slash Command Popover -->
  {#if showCommandPopover && availableCommands.length > 0}
    <SlashCommandPopover
      commands={availableCommands}
      selectedIndex={selectedCmdIndex}
      onSelect={selectCommand}
    />
  {/if}

  <div
    role="region"
    aria-label="Prompt Input Area"
    ondragover={(e) => { e.preventDefault(); isDragging = true; }}
    ondragleave={() => (isDragging = false)}
    ondrop={onDrop}
    class="relative flex flex-col bg-neutral-50 dark:bg-[#18181a] border rounded-2xl p-3 focus-within:border-neutral-900 dark:focus-within:border-neutral-400 focus-within:bg-white dark:focus-within:bg-[#1f1f22] transition shadow-sm {isDragging ? 'border-neutral-900 dark:border-white ring-2 ring-neutral-900/10 bg-neutral-100 dark:bg-neutral-800' : 'border-neutral-300 dark:border-[#2f2f33]'}"
  >
    <!-- Top Bar: Multi-Attachment Preview Chips & Batch Switcher -->
    {#if attachments.length > 0}
      <div class="flex flex-wrap items-center gap-2 mb-2">
        {#each attachments as att (att.id)}
          <div
            class="flex items-center gap-1.5 p-1 bg-white dark:bg-[#202023] rounded-xl border border-neutral-200/90 dark:border-[#333338] shadow-xs"
            transition:scale={{ duration: 180, start: 0.88, easing: backOut }}
          >
            <img src={att.dataUrl} alt="preview" class="w-8 h-8 object-cover rounded-lg border border-neutral-200 dark:border-neutral-700" />
            <span class="text-[11px] font-medium text-neutral-800 dark:text-neutral-200 truncate max-w-[100px]">{att.name}</span>
            <button
              type="button"
              onclick={() => removeAttachment(att.id)}
              class="btn-spring p-1 text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md cursor-pointer"
              title={$t('chat.removeAttachment')}
            >
              <X class="w-3 h-3" />
            </button>
          </div>
        {/each}

        <!-- Multi-Attachment Quick Switcher (when >= 2 images) -->
        {#if attachments.length > 1}
          <div class="flex items-center gap-1 ml-auto text-[11px]">
            <button
              type="button"
              onclick={() => { prompt = prompt.replace(/^\/batch\s*/i, ''); }}
              class="px-2 py-1 rounded-lg transition-all cursor-pointer {!parsedCommand.commandId || parsedCommand.commandId !== 'batch' ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold shadow-xs' : 'text-neutral-500 hover:bg-neutral-200/60 dark:hover:bg-neutral-800'}"
            >
              <span class="flex items-center gap-1"><Sparkles class="w-3 h-3" /> Referensi (1x)</span>
            </button>
            <button
              type="button"
              onclick={() => { if (!prompt.startsWith('/batch')) prompt = `/batch ${prompt}`.trim(); }}
              class="px-2 py-1 rounded-lg transition-all cursor-pointer {parsedCommand.commandId === 'batch' ? 'bg-amber-500 text-neutral-950 font-bold shadow-xs' : 'text-neutral-500 hover:bg-neutral-200/60 dark:hover:bg-neutral-800'}"
            >
              <span class="flex items-center gap-1"><Layers class="w-3 h-3" /> /batch ({attachments.length}x)</span>
            </button>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Active Command Badge Preview (when user types valid slash command) -->
    {#if parsedCommand.commandId}
      <div
        in:fly={{ y: -4, duration: 150, easing: cubicOut }}
        class="flex items-center gap-1.5 mb-1.5 px-2.5 py-1 w-fit rounded-lg bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 text-[11px] font-semibold text-amber-700 dark:text-amber-300"
      >
        <span class="font-mono">{parsedCommand.rawCommand}</span>
        {#if parsedCommand.commandId === 'multi'}
          <span>• Mode Variasi ({parsedCommand.count || 4}x Gambar)</span>
        {:else if parsedCommand.commandId === 'batch'}
          <span>• Mode Batch Edit ({attachments.length || 1}x Gambar)</span>
        {:else if parsedCommand.commandId === 'ratio'}
          <span>• Set Rasio ({parsedCommand.param})</span>
        {:else if parsedCommand.commandId === 'model'}
          <span>• Set Model ({parsedCommand.param})</span>
        {/if}
      </div>
    {/if}

    <!-- Textarea -->
    <textarea
      bind:value={prompt}
      onkeydown={handleKeydown}
      disabled={isLoading}
      placeholder={attachments.length > 0 ? $t('chat.placeholderEdit') : $t('chat.placeholderGenerate')}
      rows="1"
      class="w-full bg-transparent border-0 resize-none outline-none text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm px-1 py-1 min-h-[36px] max-h-[140px]"
    ></textarea>

    <!-- Bottom Action Row (+ Plus button, Ratio Selector, Model Selector, & Send button) -->
    <div class="flex items-center justify-between mt-1 pt-1">
      <div class="flex items-center gap-1.5">
        <!-- Attach Images Button (Multiple) -->
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
        disabled={(!prompt.trim() && attachments.length === 0) || isLoading}
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

    <!-- Hidden File Input (Multiple images) -->
    <input
      bind:this={fileInput}
      type="file"
      multiple
      accept="image/*"
      class="hidden"
      onchange={(e) => {
        const target = e.target as HTMLInputElement;
        if (target.files?.length) handleFiles(target.files);
        target.value = '';
      }}
    />
  </div>
</div>
