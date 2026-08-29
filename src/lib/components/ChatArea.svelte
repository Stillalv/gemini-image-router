<script lang="ts">
  import { ArrowUp, ArrowDown, Sparkles, Palette, Loader2, PanelLeft, Plus, X } from 'lucide-svelte';
  import { fly, fade, scale } from 'svelte/transition';
  import { cubicOut, backOut } from 'svelte/easing';
  import { tick } from 'svelte';
  import MessageBubble from './MessageBubble.svelte';
  import ImageModal from './ImageModal.svelte';
  import StatusBadge from './StatusBadge.svelte';
  import { t } from '$lib/i18n';
  import type { Session, Message } from '$lib/types';

  interface Props {
    session: Session | null;
    messages: Message[];
    isLoading: boolean;
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
    onSendMessage: (prompt: string, attachmentBase64?: string) => Promise<void>;
  }

  let {
    session,
    messages = [],
    isLoading = false,
    isSidebarOpen,
    onToggleSidebar,
    onSendMessage
  }: Props = $props();

  let prompt = $state('');
  let attachedBase64: string | null = $state(null);
  let attachedName = $state('');
  let isDragging = $state(false);
  let fileInput: HTMLInputElement;
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
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    showScrollBottom = distanceFromBottom > 120;
  }

  function scrollToBottomSmooth() {
    if (!chatContainer) return;
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    chatContainer.scrollTo({
      top: chatContainer.scrollHeight,
      behavior: prefersReduced ? 'auto' : 'smooth'
    });
  }

  $effect(() => {
    if (messages.length > 0 || isLoading) {
      tick().then(() => {
        requestAnimationFrame(() => {
          if (!showScrollBottom && chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
          }
        });
      });
    }
  });

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

  async function handleSend() {
    if ((!prompt.trim() && !attachedBase64) || isLoading) return;
    const text = prompt.trim();
    const attachment = attachedBase64 || undefined;
    prompt = '';
    attachedBase64 = null;
    attachedName = '';
    await onSendMessage(text, attachment);
  }

  async function handleRevert(revertPrompt: string, attachmentUrl?: string | null) {
    prompt = revertPrompt;
    if (attachmentUrl) {
      if (attachmentUrl.startsWith('data:')) {
        attachedBase64 = attachmentUrl;
      } else {
        try {
          const res = await fetch(attachmentUrl);
          const blob = await res.blob();
          const reader = new FileReader();
          reader.onload = (e) => {
            if (typeof e.target?.result === 'string') {
              attachedBase64 = e.target.result;
            }
          };
          reader.readAsDataURL(blob);
        } catch {
          attachedBase64 = attachmentUrl;
        }
      }
      attachedName = attachmentUrl.split('/').pop() || 'lampiran.png';
    }
  }

  async function handleApplyAreaEdit(imageUrl: string, editPrompt: string) {
    if (isLoading) return;
    await onSendMessage(editPrompt, imageUrl);
  }

  function getOriginalImageUrlForMessage(index: number): string | null {
    // Look backwards from current message to find the source attachment or previous image
    for (let i = index - 1; i >= 0; i--) {
      if (messages[i].role === 'user' && messages[i].attachment_url) {
        return messages[i].attachment_url || null;
      }
      if (messages[i].role === 'assistant' && messages[i].image_url) {
        return messages[i].image_url || null;
      }
    }
    const userWithAttachment = messages.find((m) => m.role === 'user' && m.attachment_url);
    return userWithAttachment?.attachment_url || null;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }
</script>

<div class="flex-1 flex flex-col h-screen bg-white dark:bg-[#0f0f10] overflow-hidden">
  <!-- Top Bar (Height strictly h-14 with subtle Tab Pool badge on the right) -->
  <header class="h-14 border-b border-neutral-200 dark:border-[#27272a] px-4 flex items-center justify-between flex-shrink-0 bg-white dark:bg-[#0f0f10]">
    <div class="flex items-center">
      <!-- Fluid Expanding Open Sidebar Button (Zero layout snapping) -->
      <div class="flex items-center overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] {isSidebarOpen ? 'w-0 opacity-0 pointer-events-none' : 'w-9 opacity-100 mr-2'}">
        <button
          type="button"
          onclick={onToggleSidebar}
          class="btn-spring h-8 w-8 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg cursor-pointer flex-shrink-0"
          title={$t('app.openSidebar')}
        >
          <PanelLeft class="w-4 h-4" />
        </button>
      </div>

      <div class="flex items-center gap-2">
        {#if session?.type === 'edit'}
          <Palette class="w-4 h-4 text-neutral-700 dark:text-neutral-300 transition-transform duration-200" />
        {:else}
          <Sparkles class="w-4 h-4 text-neutral-700 dark:text-neutral-300 transition-transform duration-200" />
        {/if}
        <div>
          <h1 class="text-sm font-semibold text-neutral-900 dark:text-white truncate max-w-md">
            {session ? session.title : $t('app.newSession')}
          </h1>
          <p class="text-[11px] text-neutral-400 dark:text-neutral-500">
            {session?.type === 'edit' ? $t('chat.editMode') : $t('chat.generateMode')}
          </p>
        </div>
      </div>
    </div>

    <!-- Top Right: Subtle Tab Pool Badge -->
    <div class="flex items-center gap-2">
      <StatusBadge />
    </div>
  </header>

  <!-- Messages List (Centered Workspace Flow) -->
  <div bind:this={chatContainer} onscroll={handleScroll} class="flex-1 overflow-y-auto p-6 space-y-6">
    {#if messages.length === 0}
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
          {session?.type === 'edit'
            ? $t('chat.welcomeEditDesc')
            : $t('chat.welcomeGenerateDesc')}
        </p>
      </div>
    {:else}
      <div class="max-w-4xl mx-auto space-y-6">
        {#each messages as msg, index (msg.id)}
          <MessageBubble
            message={msg}
            sessionType={session?.type}
            originalImageUrl={msg.role === 'assistant' ? getOriginalImageUrlForMessage(index) : null}
            onRevert={handleRevert}
            onApplyEdit={handleApplyAreaEdit}
            onOpenModal={(data) => (activeModalImage = data)}
          />
        {/each}

        <!-- Loading Indicator with Ambient Pulsing Glow -->
        {#if isLoading}
          <div
            class="flex justify-start w-full"
            in:fly={{ y: 8, duration: 200, easing: cubicOut }}
            out:fade={{ duration: 150 }}
          >
            <div class="flex flex-col items-start space-y-1.5">
              <div class="flex items-center gap-2 px-1">
                <span class="text-[11px] font-medium text-neutral-400 dark:text-neutral-500">
                  {$t('chat.assistant')}
                </span>
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

  <!-- Prompt Input Container (Gemini-style unified card with Plus button & Drag & Drop) -->
  <div class="p-4 border-t border-neutral-200 dark:border-[#27272a] bg-white dark:bg-[#0f0f10] flex-shrink-0 relative">
    <!-- Floating Scroll-to-Bottom Widget Button (Dynamic: Loading 3-dots vs ArrowDown) -->
    {#if isLoading}
      <div
        class="absolute -top-11 left-1/2 -translate-x-1/2 z-20"
        in:fly={{ y: 10, duration: 220, easing: cubicOut }}
        out:fly={{ y: 6, duration: 150, easing: cubicOut }}
      >
        <button
          type="button"
          onclick={scrollToBottomSmooth}
          class="flex items-center gap-2 px-3.5 py-1.5 bg-neutral-900/95 dark:bg-white/95 backdrop-blur-md text-white dark:text-neutral-950 shadow-lg hover:shadow-xl rounded-full text-xs font-medium transition-all duration-200 active:scale-95 hover:-translate-y-0.5 border border-white/10 dark:border-black/5 cursor-pointer"
          title={$t('chat.processing')}
        >
          <div class="flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-400 dark:bg-amber-600 animate-bounce [animation-delay:-0.3s]"></span>
            <span class="w-1.5 h-1.5 rounded-full bg-amber-400 dark:bg-amber-600 animate-bounce [animation-delay:-0.15s]"></span>
            <span class="w-1.5 h-1.5 rounded-full bg-amber-400 dark:bg-amber-600 animate-bounce"></span>
          </div>
          <span>{$t('chat.processingShort')}</span>
        </button>
      </div>
    {:else if showScrollBottom}
      <div
        class="absolute -top-11 left-1/2 -translate-x-1/2 z-20"
        in:fly={{ y: 10, duration: 220, easing: cubicOut }}
        out:fly={{ y: 6, duration: 150, easing: cubicOut }}
      >
        <button
          type="button"
          onclick={scrollToBottomSmooth}
          class="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 dark:bg-[#18181a]/95 backdrop-blur-md border border-neutral-200/90 dark:border-[#27272a] text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800 shadow-md hover:shadow-lg rounded-full text-xs font-medium transition-all duration-200 active:scale-95 hover:-translate-y-0.5 cursor-pointer"
          title={$t('chat.scrollToBottom')}
        >
          <ArrowDown class="w-3.5 h-3.5" />
          <span>{$t('chat.scrollToBottom')}</span>
        </button>
      </div>
    {/if}

    <div class="max-w-3xl mx-auto">
      <div
        role="region"
        aria-label="Prompt Input Area"
        ondragover={(e) => { e.preventDefault(); isDragging = true; }}
        ondragleave={() => isDragging = false}
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
          placeholder={session?.type === 'edit' ? $t('chat.placeholderEdit') : $t('chat.placeholderGenerate')}
          rows="1"
          class="w-full bg-transparent border-0 resize-none outline-none text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm px-1 py-1 min-h-[36px] max-h-[140px]"
        ></textarea>

        <!-- Bottom Action Row (+ Plus button & Send button) -->
        <div class="flex items-center justify-between mt-1 pt-1">
          <div class="flex items-center gap-1">
            <button
              type="button"
              onclick={() => fileInput.click()}
              class="btn-spring h-8 w-8 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800 rounded-lg cursor-pointer"
              title={$t('chat.attachImage')}
            >
              <Plus class="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onclick={handleSend}
            disabled={!prompt.trim() || isLoading}
            class="btn-spring h-8 w-8 flex items-center justify-center bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-20 text-white dark:text-neutral-900 rounded-lg flex-shrink-0 cursor-pointer"
            title="Kirim"
          >
            {#if isLoading}
              <Loader2 class="w-4 h-4 animate-spin text-white dark:text-neutral-900" />
            {:else}
              <ArrowUp class="w-4 h-4" />
            {/if}
          </button>
        </div>

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
  </div>

  <!-- Global Fullscreen Image Lightbox Modal Layer (Rendered outside chat stream) -->
  {#if activeModalImage}
    <ImageModal
      isOpen={!!activeModalImage}
      imageUrl={activeModalImage.imageUrl}
      originalImageUrl={activeModalImage.originalImageUrl}
      width={activeModalImage.width}
      height={activeModalImage.height}
      prompt={activeModalImage.prompt}
      onClose={() => (activeModalImage = null)}
      onApplyEdit={handleApplyAreaEdit}
    />
  {/if}
</div>
