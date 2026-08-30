<script lang="ts">
  import { ArrowDown, Sparkles, Palette, Loader2 } from 'lucide-svelte';
  import { fly, fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { tick } from 'svelte';
  import MessageBubble from './MessageBubble.svelte';
  import ImageModal from './ImageModal.svelte';
  import ChatHeader from './chat/ChatHeader.svelte';
  import ChatPromptInput from './chat/ChatPromptInput.svelte';
  import { parseSlashCommand } from '$lib/commands';
  import { t } from '$lib/i18n';
  import type { Session, Message, GeminiModelId, AttachmentItem } from '$lib/types';

  interface Props {
    session: Session | null;
    messages: Message[];
    isLoading: boolean;
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
    onSendMessage: (
      prompt: string,
      attachments?: AttachmentItem[],
      aspectRatio?: string,
      model?: GeminiModelId,
      options?: { count?: number; mode?: 'composite' | 'batch' }
    ) => Promise<void>;
    onStop?: () => void;
  }

  let {
    session,
    messages = [],
    isLoading = false,
    isSidebarOpen,
    onToggleSidebar,
    onSendMessage,
    onStop
  }: Props = $props();

  let prompt = $state('');
  let attachments: AttachmentItem[] = $state([]);
  let selectedRatio = $state('Auto');
  let selectedModel: GeminiModelId = $state('3.7-flash');

  let chatContainer: HTMLDivElement | null = $state(null);
  let showScrollBottom = $state(false);

  let activeModalImage: {
    imageUrl: string;
    originalImageUrl?: string | null;
    width?: number | null;
    height?: number | null;
    prompt?: string;
  } | null = $state(null);

  function handleScroll() {
    if (!chatContainer) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainer;
    showScrollBottom = scrollHeight - scrollTop - clientHeight > 120;
  }

  function scrollToBottomSmooth() {
    if (!chatContainer) return;
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: prefersReduced ? 'auto' : 'smooth' });
  }

  $effect(() => {
    if (messages.length > 0 || isLoading) {
      tick().then(() => {
        requestAnimationFrame(() => {
          if (!showScrollBottom && chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
        });
      });
    }
  });

  async function handleSend() {
    if ((!prompt.trim() && attachments.length === 0) || isLoading) return;

    // Parse slash commands like /multi, /batch, /ratio, /model
    const parsed = parseSlashCommand(prompt);
    let targetPrompt = parsed.commandId ? parsed.cleanPrompt.trim() : prompt.trim();
    let targetRatio = selectedRatio;
    let targetModel = selectedModel;
    let count: number | undefined = parsed.count;
    let mode: 'composite' | 'batch' = 'composite';

    if (parsed.commandId === 'batch') {
      mode = 'batch';
    } else if (parsed.commandId === 'ratio' && parsed.param) {
      targetRatio = parsed.param;
    } else if (parsed.commandId === 'model' && parsed.param) {
      targetModel = parsed.param as any;
    }

    // If prompt is empty after extracting command and no attachments exist, do not send
    if (!targetPrompt && attachments.length === 0) {
      return;
    }

    const currentAttachments = [...attachments];
    prompt = '';
    attachments = [];

    await onSendMessage(targetPrompt, currentAttachments, targetRatio, targetModel, { count, mode });
  }

  async function handleRevert(revertPrompt: string, attachmentUrls?: string[] | string | null) {
    prompt = revertPrompt;
    if (!attachmentUrls) {
      attachments = [];
      return;
    }

    const urls = Array.isArray(attachmentUrls) ? attachmentUrls : [attachmentUrls];
    const loadedAttachments: AttachmentItem[] = [];

    for (const url of urls) {
      if (!url) continue;
      if (url.startsWith('data:')) {
        loadedAttachments.push({
          id: crypto.randomUUID(),
          name: 'reverted.png',
          dataUrl: url
        });
      } else {
        try {
          const res = await fetch(url);
          const blob = await res.blob();
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve((e.target?.result as string) || url);
            reader.readAsDataURL(blob);
          });
          loadedAttachments.push({
            id: crypto.randomUUID(),
            name: url.split('/').pop() || 'attachment.png',
            dataUrl
          });
        } catch {
          loadedAttachments.push({
            id: crypto.randomUUID(),
            name: url.split('/').pop() || 'attachment.png',
            dataUrl: url
          });
        }
      }
    }

    attachments = loadedAttachments;
  }

  async function handleApplyAreaEdit(imageUrl: string, editPrompt: string) {
    if (isLoading) return;
    let dataUrl = imageUrl;
    if (!imageUrl.startsWith('data:') && !imageUrl.startsWith('/output/') && !imageUrl.startsWith('output/')) {
      try {
        const res = await fetch(imageUrl);
        const blob = await res.blob();
        dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve((e.target?.result as string) || imageUrl);
          reader.readAsDataURL(blob);
        });
      } catch {}
    }
    await onSendMessage(editPrompt, [{ id: crypto.randomUUID(), name: 'area_edit.png', dataUrl }], selectedRatio, selectedModel);
  }

  function getOriginalImageUrlsForMessage(index: number): string[] {
    if (session?.type !== 'edit') return [];
    for (let i = index - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        const urls = messages[i].attachment_urls || (messages[i].attachment_url ? [messages[i].attachment_url!] : []);
        if (urls.length > 0) return urls;
      }
      if (messages[i].role === 'assistant') {
        const urls = messages[i].images?.map(img => img.file) || messages[i].image_urls || (messages[i].image_url ? [messages[i].image_url!] : []);
        if (urls.length > 0) return urls;
      }
    }
    const userWithAttachment = messages.find((m) => m.role === 'user' && (m.attachment_url || m.attachment_urls?.length));
    if (userWithAttachment) {
      return userWithAttachment.attachment_urls || (userWithAttachment.attachment_url ? [userWithAttachment.attachment_url!] : []);
    }
    return [];
  }
</script>

<div class="flex-1 flex flex-col h-screen bg-white dark:bg-[#0f0f10] overflow-hidden">
  <ChatHeader {session} {isSidebarOpen} {onToggleSidebar} />

  <!-- Messages List -->
  <div bind:this={chatContainer} onscroll={handleScroll} class="flex-1 overflow-y-auto p-6 space-y-6">
    {#if messages.length === 0 && !isLoading}
      <div class="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-3">
        {#if session?.type === 'edit'}
          <Palette class="w-8 h-8 text-neutral-400 dark:text-neutral-600" />
        {:else}
          <Sparkles class="w-8 h-8 text-neutral-400 dark:text-neutral-600" />
        {/if}
        <h2 class="text-sm font-bold text-neutral-800 dark:text-neutral-200">
          {session?.type === 'edit' ? $t('chat.welcomeEditTitle') : $t('chat.welcomeGenerateTitle')}
        </h2>
        <p class="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
          {session?.type === 'edit' ? $t('chat.welcomeEditDesc') : $t('chat.welcomeGenerateDesc')}
        </p>
      </div>
    {:else}
      <div class="max-w-4xl mx-auto space-y-6">
        {#each messages as msg, index (msg.id)}
          <MessageBubble
            message={msg}
            sessionType={session?.type}
            originalImageUrl={msg.role === 'assistant' ? getOriginalImageUrlsForMessage(index)[0] || null : null}
            originalImageUrls={msg.role === 'assistant' ? getOriginalImageUrlsForMessage(index) : []}
            onRevert={handleRevert}
            onApplyEdit={handleApplyAreaEdit}
            onOpenModal={(data) => (activeModalImage = data)}
          />
        {/each}

        {#if isLoading}
          <div class="flex justify-start w-full" in:fly={{ y: 8, duration: 200, easing: cubicOut }} out:fade={{ duration: 150 }}>
            <div class="flex flex-col items-start space-y-1.5">
              <div class="flex items-center gap-2 px-1">
                <span class="text-[11px] font-medium text-neutral-400 dark:text-neutral-500">{$t('chat.assistant')}</span>
              </div>
              <div class="flex items-center gap-2.5 text-xs text-neutral-700 dark:text-neutral-300 py-1.5 px-3 bg-neutral-50 dark:bg-[#18181a] border border-neutral-200/80 dark:border-[#27272a] rounded-xl shadow-xs">
                <div class="relative flex items-center justify-center">
                  <span class="absolute w-4 h-4 rounded-full bg-amber-400/30 dark:bg-amber-400/40 animate-ping"></span>
                  <Loader2 class="w-3.5 h-3.5 animate-spin text-amber-600 dark:text-amber-400 flex-shrink-0 relative z-10" />
                </div>
                <span class="font-medium animate-pulse">{$t('chat.processing')}</span>
              </div>
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Prompt Input Container -->
  <div class="p-4 bg-white dark:bg-[#0f0f10] flex-shrink-0 relative">
    {#if isLoading}
      <div class="absolute -top-11 left-1/2 -translate-x-1/2 z-20" in:fly={{ y: 10, duration: 220, easing: cubicOut }} out:fly={{ y: 6, duration: 150, easing: cubicOut }}>
        <button type="button" onclick={scrollToBottomSmooth} class="flex items-center gap-2 px-3.5 py-1.5 bg-neutral-900/95 dark:bg-white/95 backdrop-blur-md text-white dark:text-neutral-950 shadow-lg rounded-full text-xs font-medium border border-white/10 dark:border-black/5 cursor-pointer" title={$t('chat.processing')}>
          <div class="flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-400 dark:bg-amber-600 animate-bounce [animation-delay:-0.3s]"></span>
            <span class="w-1.5 h-1.5 rounded-full bg-amber-400 dark:bg-amber-600 animate-bounce [animation-delay:-0.15s]"></span>
            <span class="w-1.5 h-1.5 rounded-full bg-amber-400 dark:bg-amber-600 animate-bounce"></span>
          </div>
          <span>{$t('chat.processingShort')}</span>
        </button>
      </div>
    {:else if showScrollBottom}
      <div class="absolute -top-11 left-1/2 -translate-x-1/2 z-20" in:fly={{ y: 10, duration: 220, easing: cubicOut }} out:fly={{ y: 6, duration: 150, easing: cubicOut }}>
        <button type="button" onclick={scrollToBottomSmooth} class="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 dark:bg-[#18181a]/95 backdrop-blur-md border border-neutral-200/90 dark:border-[#27272a] text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white shadow-md rounded-full text-xs font-medium cursor-pointer" title={$t('chat.scrollToBottom')}>
          <ArrowDown class="w-3.5 h-3.5" /><span>{$t('chat.scrollToBottom')}</span>
        </button>
      </div>
    {/if}

    <ChatPromptInput
      bind:prompt
      bind:attachments
      bind:selectedRatio
      bind:selectedModel
      sessionType={session?.type}
      {isLoading}
      onSend={handleSend}
      {onStop}
    />
  </div>
</div>

<ImageModal
  isOpen={Boolean(activeModalImage)}
  imageUrl={activeModalImage?.imageUrl || ''}
  originalImageUrl={activeModalImage?.originalImageUrl}
  width={activeModalImage?.width}
  height={activeModalImage?.height}
  prompt={activeModalImage?.prompt}
  onClose={() => (activeModalImage = null)}
  onApplyEdit={handleApplyAreaEdit}
/>
