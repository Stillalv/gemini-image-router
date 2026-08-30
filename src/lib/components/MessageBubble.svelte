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
    onRevert?: (prompt: string, attachmentUrls?: string[] | string | null) => void;
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

  // Derived list of assistant generated images
  let generatedImageList = $derived(
    message.images && message.images.length > 0
      ? message.images.map(img => ({ url: img.file, width: img.width, height: img.height }))
      : message.image_urls && message.image_urls.length > 0
        ? message.image_urls.map(url => ({ url, width: message.width, height: message.height }))
        : message.image_url
          ? [{ url: message.image_url, width: message.width, height: message.height }]
          : []
  );

  // Derived list of user attached images
  let attachedImageList = $derived(
    message.attachment_urls && message.attachment_urls.length > 0
      ? message.attachment_urls
      : message.attachment_url
        ? [message.attachment_url]
        : []
  );

  async function handleCopyText() {
    if (!message.content) return;
    try {
      await navigator.clipboard.writeText(message.content);
      isCopied = true;
      setTimeout(() => {
        isCopied = false;
      }, 2000);
    } catch {}
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
            onclick={() => onRevert(message.content, attachedImageList)}
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
      {#if attachedImageList.length > 0}
        <!-- Multi-Attachment Preview Chips -->
        <div class="flex flex-wrap gap-2 mb-2.5">
          {#each attachedImageList as attUrl}
            <div
              class="flex items-center gap-2 p-1.5 rounded-xl border w-fit {message.role === 'user' ? 'bg-white/10 dark:bg-neutral-100 border-white/15 dark:border-neutral-200 text-white dark:text-neutral-900' : 'bg-neutral-100 dark:bg-[#202023] border-neutral-200 dark:border-[#333338]'}"
              in:scale={{ duration: 200, start: 0.9, easing: cubicOut }}
            >
              <img
                src={attUrl}
                alt="Attachment thumbnail"
                class="w-9 h-9 object-cover rounded-lg border transition-transform duration-200 hover:scale-105 {message.role === 'user' ? 'border-white/20 dark:border-neutral-300' : 'border-neutral-200 dark:border-neutral-700'}"
              />
              <span class="text-xs font-medium truncate max-w-[120px]">
                {attUrl.split('/').pop()?.slice(0, 16) || 'attachment.png'}
              </span>
            </div>
          {/each}
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

    <!-- Single or Multi-Grid Image Output -->
    {#if generatedImageList.length === 1}
      <div class="pt-1 w-fit max-w-xl">
        <ImageCard
          imageUrl={generatedImageList[0].url}
          originalImageUrl={sessionType === 'edit' ? originalImageUrl : null}
          width={generatedImageList[0].width}
          height={generatedImageList[0].height}
          prompt={message.content}
          {onApplyEdit}
          {onOpenModal}
        />
      </div>
    {:else if generatedImageList.length > 1}
      <div class="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-3xl">
        {#each generatedImageList as imgItem, i}
          <div class="w-full">
            <ImageCard
              imageUrl={imgItem.url}
              originalImageUrl={sessionType === 'edit' ? originalImageUrl : null}
              width={imgItem.width}
              height={imgItem.height}
              prompt={`${message.content} (#${i + 1})`}
              {onApplyEdit}
              {onOpenModal}
            />
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>
