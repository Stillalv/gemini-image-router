<script lang="ts">
  import { Download, Copy, ExternalLink, Check, Maximize2 } from 'lucide-svelte';
  import { t } from '$lib/i18n';

  interface Props {
    imageUrl: string;
    originalImageUrl?: string | null;
    width?: number | null;
    height?: number | null;
    prompt?: string;
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
    imageUrl,
    originalImageUrl = null,
    width,
    height,
    prompt = '',
    onApplyEdit,
    onOpenModal
  }: Props = $props();

  let copied = $state(false);
  let isDownloading = $state(false);
  let isImageLoaded = $state(false);

  function handleCardClick() {
    if (onOpenModal) {
      onOpenModal({ imageUrl, originalImageUrl, width, height, prompt });
    }
  }

  async function copyUrl() {
    try {
      const fullUrl = imageUrl.startsWith('http') ? imageUrl : window.location.origin + imageUrl;
      await navigator.clipboard.writeText(fullUrl);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch {}
  }

  async function handleDownload() {
    if (isDownloading) return;
    isDownloading = true;
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `gemini_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(imageUrl, '_blank');
    } finally {
      isDownloading = false;
    }
  }
</script>

<div class="group/card rounded-xl overflow-hidden border border-neutral-200 dark:border-[#27272a] bg-white dark:bg-[#18181a] shadow-xs hover:shadow-md transition-shadow duration-300 max-w-xl flex flex-col w-fit">
  <!-- Clickable image container with smooth micro-zoom entrance & tactile overlay -->
  <div
    role="button"
    tabindex="0"
    onclick={handleCardClick}
    onkeydown={(e) => e.key === 'Enter' && handleCardClick()}
    class="cursor-zoom-in relative overflow-hidden bg-neutral-100 dark:bg-neutral-900 w-full flex items-center justify-center min-h-[140px]"
  >
    <img
      src={imageUrl}
      alt={prompt || 'Gemini image'}
      loading="lazy"
      decoding="async"
      onload={() => (isImageLoaded = true)}
      style={width && height ? `aspect-ratio: ${width} / ${height};` : ''}
      class="w-full h-auto object-contain max-h-[500px] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/card:scale-[1.02] block will-change-transform [backface-visibility:hidden] [transform:translateZ(0)] {isImageLoaded ? 'opacity-100' : 'opacity-0'}"
    />

    <!-- Subtle hover overlay badge with smooth scale & fade -->
    <div class="absolute inset-0 bg-black/25 opacity-0 group-hover/card:opacity-100 pointer-events-none flex items-center justify-center transition-all duration-200 ease-out backdrop-blur-[1px]">
      <div class="flex items-center gap-1.5 px-3.5 py-1.5 bg-black/85 backdrop-blur-md text-white text-xs font-medium rounded-full shadow-xl transform scale-95 group-hover/card:scale-100 transition-transform duration-200 ease-out">
        <Maximize2 class="w-3.5 h-3.5" />
        <span>{$t('chat.fullSizeEdit')}</span>
      </div>
    </div>
  </div>
  
  <div class="p-2.5 bg-white dark:bg-[#18181a] border-t border-neutral-100 dark:border-[#27272a] flex items-center justify-between gap-2">
    <div class="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
      {width && height ? `${width} × ${height}` : '1024 × 559'} PNG
    </div>

    <div class="flex items-center gap-1">
      <button
        type="button"
        onclick={copyUrl}
        class="btn-spring p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded cursor-pointer"
        title={$t('chat.copyLink')}
      >
        {#if copied}
          <Check class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        {:else}
          <Copy class="w-3.5 h-3.5" />
        {/if}
      </button>

      <a
        href={imageUrl}
        target="_blank"
        rel="noreferrer"
        class="btn-spring p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded cursor-pointer"
        title={$t('chat.openNewTab')}
      >
        <ExternalLink class="w-3.5 h-3.5" />
      </a>

      <button
        type="button"
        onclick={handleDownload}
        disabled={isDownloading}
        class="btn-spring flex items-center gap-1 px-2.5 py-1 bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 text-white dark:text-neutral-900 rounded text-xs font-medium cursor-pointer"
        title={$t('chat.download')}
      >
        <Download class="w-3 h-3" />
        <span>{isDownloading ? $t('chat.downloading') : $t('chat.download')}</span>
      </button>
    </div>
  </div>
</div>
