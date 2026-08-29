<script lang="ts">
  import { RotateCcw, Copy, Check } from 'lucide-svelte';
  import { fly, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import ImageCard from './ImageCard.svelte';
  import { t } from '$lib/i18n';
  import type { Message, SessionType } from '$lib/types';

  interface Props {
    message: Message;
    sessionType?: SessionType;
    originalImageUrl?: string | null;
    onRevert?: (prompt: string, attachmentUrl?: string | null) => void;
    onApplyEdit?: (imageUrl: string, editPrompt: string) => void;
    onOpenModal?: (data: {
      imageUrl: string;
      originalImageUrl?: string | null;
      width?: number | null;
      height?: number | null;
      prompt?: string;
    }) => void;
  }

  let {
    message,
    sessionType = 'generate',
    originalImageUrl = null,
    onRevert,
    onApplyEdit,
    onOpenModal
  }: Props = $props();

  let isCopied = $state(false);

  async function handleCopyText() {
    if (!message.content) return;
    try {
      await navigator.clipboard.writeText(message.content);
      isCopied = true;
      setTimeout(() => {
        isCopied = false;
      }, 2000);
    } catch {
      // Fallback
    }
  }
</script>

<div
  class="group/bubble flex flex-col space-y-1.5 {message.role === 'user' ? 'items-end' : 'items-start'} w-full"
  in:fly={{ y: 10, duration: 240, easing: cubicOut }}
>
  <!-- Role Header -->
  <div class="flex items-center gap-2 px-1 {message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}">
    <span class="text-xs font-semibold {message.role === 'user' ? 'text-neutral-800 dark:text-neutral-200' : 'text-neutral-500 dark:text-neutral-400'}">
      {message.role === 'user' ? $t('chat.you') : $t('chat.assistant')}
    </span>

    {#if message.role === 'user'}
      <div class="opacity-0 group-hover/bubble:opacity-100 flex items-center gap-1 transition-opacity duration-150">
        <!-- Copy Text Button -->
        <button
          type="button"
          onclick={handleCopyText}
          class="btn-spring flex items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200/80 dark:hover:bg-neutral-700 px-1.5 py-0.5 rounded cursor-pointer"
          title={$t('chat.copyText')}
        >
          {#if isCopied}
            <Check class="w-3 h-3 text-neutral-900 dark:text-white" />
            <span class="text-neutral-900 dark:text-white font-medium">{$t('chat.copied')}</span>
          {:else}
            <Copy class="w-3 h-3" />
            <span>{$t('chat.copyText')}</span>
          {/if}
        </button>

        <!-- Revert / Edit Button -->
        {#if onRevert}
          <button
            type="button"
            onclick={() => onRevert(message.content, message.attachment_url)}
            class="btn-spring flex items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200/80 dark:hover:bg-neutral-700 px-1.5 py-0.5 rounded cursor-pointer"
            title={$t('chat.revertTooltip')}
          >
            <RotateCcw class="w-3 h-3" />
            <span>{$t('chat.revertEdit')}</span>
          </button>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Content Box -->
  {#if message.role === 'user'}
    <div class="max-w-xl px-4 py-3 rounded-2xl rounded-tr-xs text-sm leading-relaxed whitespace-pre-wrap break-words bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs transition-shadow">
      {#if message.attachment_url}
        <!-- Compact Attachment Preview Pill with Pop-In -->
        <div
          class="flex items-center gap-2.5 mb-2.5 p-1.5 rounded-xl border w-fit {message.role === 'user' ? 'bg-white/10 dark:bg-neutral-100 border-white/15 dark:border-neutral-200 text-white dark:text-neutral-900' : 'bg-neutral-100 dark:bg-[#202023] border-neutral-200 dark:border-[#333338]'}"
          in:scale={{ duration: 220, start: 0.9, easing: cubicOut }}
        >
          <img
            src={message.attachment_url}
            alt="Attachment thumbnail"
            class="w-10 h-10 object-cover rounded-lg border transition-transform duration-200 hover:scale-105 {message.role === 'user' ? 'border-white/20 dark:border-neutral-300' : 'border-neutral-200 dark:border-neutral-700'}"
          />
          <div class="flex flex-col pr-2 text-left">
            <span class="text-xs font-medium truncate max-w-[160px]">
              {message.attachment_url.split('/').pop()?.slice(0, 20) || 'attachment.png'}
            </span>
            <span class="text-[10px] opacity-70">
              {$t('chat.attachedImage')}
            </span>
          </div>
        </div>
      {/if}
      <div>{message.content}</div>
    </div>
  {:else}
    {#if message.content}
      <div class="text-xs text-neutral-500 dark:text-neutral-400 max-w-2xl px-1">
        {message.content}
      </div>
    {/if}

    {#if message.image_url}
      <div class="pt-1 w-fit max-w-xl">
        <ImageCard
          imageUrl={message.image_url}
          {originalImageUrl}
          width={message.width}
          height={message.height}
          prompt={message.content}
          {onApplyEdit}
          {onOpenModal}
        />
      </div>
    {/if}
  {/if}
</div>
