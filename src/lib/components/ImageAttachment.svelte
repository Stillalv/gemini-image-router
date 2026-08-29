<script lang="ts">
  import { ImagePlus, X } from 'lucide-svelte';

  interface Props {
    base64Image: string | null;
    fileName?: string;
    onImageSelected: (base64: string, name: string) => void;
    onClear: () => void;
  }

  let { base64Image = null, fileName = '', onImageSelected, onClear }: Props = $props();
  let isDragging = $state(false);
  let fileInput: HTMLInputElement;

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      alert('Hanya file gambar (PNG, JPG, WEBP) yang diperbolehkan');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        onImageSelected(e.target.result, file.name);
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
</script>

<div class="mb-3">
  {#if base64Image}
    <div class="flex items-center gap-3 bg-white border border-neutral-200 p-2 rounded-lg shadow-sm">
      <img src={base64Image} alt="preview" class="w-12 h-12 object-cover rounded border border-neutral-200" />
      <div class="flex-1 min-w-0">
        <div class="text-xs font-semibold text-neutral-800 truncate">{fileName || 'attachment.png'}</div>
        <div class="text-[11px] text-neutral-500">Gambar siap diedit</div>
      </div>
      <button
        type="button"
        onclick={onClear}
        class="p-1 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 rounded transition"
        title="Hapus gambar"
      >
        <X class="w-4 h-4" />
      </button>
    </div>
  {:else}
    <div
      role="button"
      tabindex="0"
      onclick={() => fileInput.click()}
      onkeydown={(e) => e.key === 'Enter' && fileInput.click()}
      ondragover={(e) => { e.preventDefault(); isDragging = true; }}
      ondragleave={() => isDragging = false}
      ondrop={onDrop}
      class="border border-dashed rounded-lg p-3 text-center cursor-pointer transition flex items-center justify-center gap-2 {isDragging ? 'border-neutral-900 bg-neutral-100' : 'border-neutral-300 bg-white hover:border-neutral-400 hover:bg-neutral-50'}"
    >
      <ImagePlus class="w-4 h-4 text-neutral-600" />
      <span class="text-xs font-medium text-neutral-700">Lampirkan gambar untuk diedit (PNG, JPG, WEBP)</span>
    </div>
  {/if}
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
