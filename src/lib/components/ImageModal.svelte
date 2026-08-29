<script lang="ts">
  import {
    X,
    Download,
    Copy,
    ExternalLink,
    Check,
    MousePointerClick,
    ArrowUp,
    Sparkles,
    Columns
  } from 'lucide-svelte';
  import { fade, scale, fly } from 'svelte/transition';
  import { cubicOut, cubicIn, backOut } from 'svelte/easing';
  import { t } from '$lib/i18n';

  interface Props {
    isOpen: boolean;
    imageUrl: string;
    originalImageUrl?: string | null;
    width?: number | null;
    height?: number | null;
    prompt?: string;
    onClose: () => void;
    onApplyEdit?: (imageUrl: string, editPrompt: string) => void;
  }

  let {
    isOpen = false,
    imageUrl,
    originalImageUrl = null,
    width,
    height,
    prompt = '',
    onClose,
    onApplyEdit
  }: Props = $props();

  let copied = $state(false);
  let isDownloading = $state(false);
  let isEditMode = $state(false);
  let isCompareMode = $state(false);
  let editComment = $state('');
  let pinPoint: { x: number; y: number; xPercent: number; yPercent: number } | null = $state(null);
  let imageElement: HTMLImageElement | null = $state(null);

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && isOpen) {
      onClose();
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
    } catch {
      window.open(imageUrl, '_blank');
    } finally {
      isDownloading = false;
    }
  }

  function handleImageClick(e: MouseEvent) {
    if (!isEditMode || !imageElement) return;

    const rect = imageElement.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const xPercent = Math.max(0, Math.min(100, Math.round((clickX / rect.width) * 100)));
    const yPercent = Math.max(0, Math.min(100, Math.round((clickY / rect.height) * 100)));

    pinPoint = {
      x: clickX,
      y: clickY,
      xPercent,
      yPercent
    };
  }

  function submitAreaEdit() {
    const text = editComment.trim();
    if (!text || !onApplyEdit) return;

    let areaDescription = '';
    if (pinPoint) {
      const vLoc = pinPoint.yPercent < 35 ? 'atas' : pinPoint.yPercent > 65 ? 'bawah' : 'tengah';
      const hLoc = pinPoint.xPercent < 35 ? 'kiri' : pinPoint.xPercent > 65 ? 'kanan' : 'tengah';
      areaDescription = `[Fokus edit area ${vLoc}-${hLoc} (${pinPoint.xPercent}%, ${pinPoint.yPercent}%)]: `;
    }

    const fullEditPrompt = `${areaDescription}${text}`;
    onApplyEdit(imageUrl, fullEditPrompt);

    // Reset state and close modal
    editComment = '';
    pinPoint = null;
    isEditMode = false;
    isCompareMode = false;
    onClose();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <!-- 1. LIGHTBOX BACKDROP: Smooth fade in/out with deep glassmorphism -->
  <div
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    transition:fade={{ duration: 200, easing: cubicOut }}
    class="fixed inset-0 z-50 bg-black/92 backdrop-blur-xl flex flex-col justify-between p-4 select-none"
  >
    <!-- Top Bar Toolbar -->
    <header
      in:fly={{ y: -12, duration: 220, easing: cubicOut }}
      out:fly={{ y: -8, duration: 150, easing: cubicIn }}
      class="w-full flex items-center justify-between text-white z-20 px-2 py-1 flex-shrink-0"
    >
      <div class="flex items-center gap-3">
        <div class="text-xs font-semibold tracking-wide text-neutral-300">
          {width && height ? `${width} × ${height}` : 'Full Resolution'} PNG
        </div>
        {#if prompt}
          <div class="hidden md:block text-xs text-neutral-400 truncate max-w-md">
            "{prompt}"
          </div>
        {/if}
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2">
        {#if originalImageUrl}
          <button
            type="button"
            onclick={() => {
              isCompareMode = !isCompareMode;
              if (isCompareMode) isEditMode = false;
            }}
            class="btn-spring flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200 {isCompareMode ? 'bg-white text-black font-semibold shadow-lg scale-105' : 'bg-neutral-800/80 hover:bg-neutral-700 text-white'}"
            title={$t('modal.compareBeforeAfter')}
          >
            <Columns class="w-3.5 h-3.5" />
            <span>{$t('modal.compareBeforeAfter')}</span>
          </button>
        {/if}

        <button
          type="button"
          onclick={() => {
            isEditMode = !isEditMode;
            if (isEditMode) isCompareMode = false;
            if (!isEditMode) pinPoint = null;
          }}
          class="btn-spring flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200 {isEditMode ? 'bg-white text-black font-semibold shadow-lg scale-105' : 'bg-neutral-800/80 hover:bg-neutral-700 text-white'}"
          title={$t('modal.pointEditArea')}
        >
          <MousePointerClick class="w-3.5 h-3.5" />
          <span>{isEditMode ? $t('modal.clickingArea') : $t('modal.pointEditArea')}</span>
        </button>

        <button
          type="button"
          onclick={copyUrl}
          class="btn-spring p-2 bg-neutral-800/80 hover:bg-neutral-700 text-white rounded-lg cursor-pointer"
          title={$t('chat.copyLink')}
        >
          {#if copied}
            <Check class="w-4 h-4 text-emerald-400" />
          {:else}
            <Copy class="w-4 h-4" />
          {/if}
        </button>

        <a
          href={imageUrl}
          target="_blank"
          rel="noreferrer"
          class="btn-spring p-2 bg-neutral-800/80 hover:bg-neutral-700 text-white rounded-lg cursor-pointer"
          title={$t('chat.openNewTab')}
        >
          <ExternalLink class="w-4 h-4" />
        </a>

        <button
          type="button"
          onclick={handleDownload}
          disabled={isDownloading}
          class="btn-spring flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-200 text-neutral-900 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
          title={$t('chat.download')}
        >
          <Download class="w-3.5 h-3.5" />
          <span>{isDownloading ? $t('chat.downloading') : $t('chat.download')}</span>
        </button>

        <button
          type="button"
          onclick={onClose}
          class="btn-spring p-2 bg-neutral-800/80 hover:bg-red-600 text-white rounded-lg cursor-pointer ml-1"
          title={$t('modal.close')}
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </header>

    <!-- Main Viewport Area -->
    <main class="flex-1 flex items-center justify-center relative overflow-hidden py-2">
      {#if isCompareMode && originalImageUrl}
        <!-- 3. BEFORE / AFTER COMPARE: Coordinated directional fly-in transitions -->
        <div class="flex items-center justify-center gap-5 max-h-[78vh] max-w-[94vw] w-full px-4">
          <!-- Original Image (Before: Slides in from left) -->
          <div
            in:fly={{ x: -24, duration: 280, easing: cubicOut }}
            out:fade={{ duration: 150 }}
            class="flex-1 flex flex-col items-center max-h-[78vh]"
          >
            <div class="text-[11px] font-medium text-neutral-400 mb-2 px-3 py-0.5 bg-neutral-800/90 rounded-full border border-neutral-700/80 shadow-md">
              {$t('modal.originalImage')}
            </div>
            <img
              src={originalImageUrl}
              alt="Original"
              class="max-h-[72vh] max-w-full object-contain rounded-xl border border-neutral-700/80 shadow-2xl transition-transform duration-300"
            />
          </div>

          <!-- Divider Indicator -->
          <div
            in:scale={{ start: 0.6, duration: 220, easing: cubicOut }}
            out:fade={{ duration: 150 }}
            class="w-px h-64 bg-neutral-800/90 self-center hidden md:block"
          ></div>

          <!-- Edited Output Image (After: Slides in from right) -->
          <div
            in:fly={{ x: 24, duration: 280, easing: cubicOut }}
            out:fade={{ duration: 150 }}
            class="flex-1 flex flex-col items-center max-h-[78vh]"
          >
            <div class="text-[11px] font-medium text-neutral-200 mb-2 px-3 py-0.5 bg-neutral-800/90 rounded-full border border-neutral-700/80 shadow-md">
              {$t('modal.editedImage')}
            </div>
            <img
              src={imageUrl}
              alt={prompt || 'Gemini output'}
              class="max-h-[72vh] max-w-full object-contain rounded-xl border border-neutral-700/80 shadow-2xl transition-transform duration-300"
            />
          </div>
        </div>
      {:else}
        <!-- 2. SINGLE IMAGE VIEW: Smooth Zoom Entrance & Exit Scale -->
        <button
          type="button"
          onclick={handleImageClick}
          in:scale={{ start: 0.92, duration: 250, easing: cubicOut }}
          out:scale={{ start: 0.96, duration: 180, easing: cubicIn }}
          class="relative p-0 border-0 bg-transparent outline-none flex items-center justify-center max-h-[78vh] max-w-[90vw] {isEditMode ? 'cursor-crosshair' : 'cursor-default'}"
        >
          <img
            bind:this={imageElement}
            src={imageUrl}
            alt={prompt || 'Gemini output'}
            class="max-h-[78vh] max-w-[90vw] object-contain rounded-xl shadow-2xl transition-all duration-200 {isEditMode ? 'ring-2 ring-white/90 shadow-white/10' : ''}"
          />
        </button>

        <!-- 4. PIN AREA MARKER: Spring entrance + Multi-tier Sonar Radar Waves -->
        {#if isEditMode && pinPoint}
          <div
            style="left: {pinPoint.x}px; top: {pinPoint.y}px;"
            class="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 flex items-center justify-center"
          >
            <!-- Outer Sonar Radar Ring -->
            <div class="pin-sonar-outer"></div>
            <!-- Inner Glowing Pulse Ring -->
            <div class="pin-sonar-inner"></div>

            <!-- Core Pin Icon with Spring Entrance -->
            <div class="pin-marker-core">
              ✦
            </div>

            <!-- Floating Coordinates Tag -->
            <div
              in:fly={{ y: 6, duration: 200, easing: backOut }}
              class="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/90 text-white text-[10px] font-semibold rounded-md border border-neutral-700 shadow-xl whitespace-nowrap"
            >
              {pinPoint.xPercent}%, {pinPoint.yPercent}%
            </div>
          </div>
        {/if}
      {/if}
    </main>

    <!-- Bottom Bar / Inline Area Edit Box -->
    <footer class="w-full flex justify-center z-20 px-4 py-2 flex-shrink-0">
      {#if isEditMode}
        <div
          in:fly={{ y: 20, duration: 240, easing: cubicOut }}
          out:fly={{ y: 15, duration: 160, easing: cubicIn }}
          class="w-full max-w-2xl bg-neutral-900/95 border border-neutral-700/90 rounded-2xl p-2.5 shadow-2xl flex items-center gap-2 backdrop-blur-xl"
        >
          <div class="flex items-center gap-1.5 pl-2 text-neutral-300 flex-shrink-0 text-xs font-semibold">
            <Sparkles class="w-4 h-4 text-neutral-400" />
            <span>{pinPoint ? `Area (${pinPoint.xPercent}%, ${pinPoint.yPercent}%)` : $t('modal.clickAreaFirst')}:</span>
          </div>

          <input
            type="text"
            bind:value={editComment}
            placeholder={pinPoint ? $t('modal.editPromptPlaceholder') : $t('modal.clickAreaFirst')}
            onkeydown={(e) => e.key === 'Enter' && submitAreaEdit()}
            class="flex-1 bg-transparent border-0 outline-none text-white text-xs placeholder-neutral-500 px-2 py-1"
          />

          <button
            type="button"
            onclick={submitAreaEdit}
            disabled={!editComment.trim()}
            class="btn-spring px-3 py-1.5 bg-white hover:bg-neutral-200 disabled:opacity-30 text-black font-semibold text-xs rounded-xl flex items-center gap-1 cursor-pointer flex-shrink-0"
          >
            <ArrowUp class="w-3.5 h-3.5" />
            <span>{$t('modal.sendEdit')}</span>
          </button>
        </div>
      {:else if isCompareMode}
        <div in:fade={{ duration: 180 }} class="text-xs text-neutral-400 text-center">
          Tampilan komparasi perbandingan gambar asli vs hasil edit Gemini.
        </div>
      {:else}
        <div in:fade={{ duration: 180 }} class="text-xs text-neutral-500 text-center">
          {$t('modal.pointEditTip')}
        </div>
      {/if}
    </footer>
  </div>
{/if}

<style>
  /* Pin Core Pop Spring Animation */
  .pin-marker-core {
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 9999px;
    border: 2px solid #000000;
    background-color: #ffffff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    font-weight: 700;
    color: #000000;
    position: relative;
    z-index: 10;
    animation: pinPop 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  /* Inner Soft Glow Wave */
  .pin-sonar-inner {
    position: absolute;
    width: 2rem;
    height: 2rem;
    border-radius: 9999px;
    border: 1.5px solid rgba(255, 255, 255, 0.8);
    background-color: rgba(255, 255, 255, 0.2);
    animation: sonarInner 2.2s cubic-bezier(0.25, 1, 0.5, 1) infinite;
  }

  /* Outer Expanding Radar Sonar Wave */
  .pin-sonar-outer {
    position: absolute;
    width: 3.5rem;
    height: 3.5rem;
    border-radius: 9999px;
    border: 1.5px solid rgba(255, 255, 255, 0.5);
    animation: sonarOuter 2.2s cubic-bezier(0, 0, 0.2, 1) infinite;
  }

  @keyframes pinPop {
    0% {
      transform: scale(0);
      opacity: 0;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes sonarInner {
    0% {
      transform: scale(0.6);
      opacity: 0.9;
    }
    50% {
      transform: scale(1.15);
      opacity: 0.4;
    }
    100% {
      transform: scale(0.6);
      opacity: 0.9;
    }
  }

  @keyframes sonarOuter {
    0% {
      transform: scale(0.3);
      opacity: 0.85;
    }
    75% {
      transform: scale(1.35);
      opacity: 0.05;
    }
    100% {
      transform: scale(1.5);
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .pin-marker-core,
    .pin-sonar-inner,
    .pin-sonar-outer {
      animation: none !important;
    }
  }
</style>
