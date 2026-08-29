<script lang="ts">
  import { Code2, X, Copy, Check } from 'lucide-svelte';
  import { fade, scale } from 'svelte/transition';
  import { cubicOut, cubicIn } from 'svelte/easing';

  interface Props {
    open: boolean;
    onClose: () => void;
  }

  let { open = false, onClose }: Props = $props();
  let activeTab: 'generate' | 'edit' | 'sessions' = $state('generate');
  let copied = $state(false);

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && open) onClose();
  }

  const snippets = {
    generate: {
      curl: `curl -X POST http://localhost:8787/api/generate \\\n  -H "Content-Type: application/json" \\\n  -d '{"prompt": "kucing astronot di tokyo cyberpunk 3d render"}'`,
      python: `import requests\n\nurl = "http://localhost:8787/api/generate"\npayload = {"prompt": "kucing astronot di tokyo cyberpunk 3d render"}\nres = requests.post(url, json=payload).json()\nprint("Hasil gambar:", res["images"][0]["file"])`,
      typescript: `const res = await fetch("http://localhost:8787/api/generate", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({ prompt: "kucing astronot" })\n});\nconst data = await res.json();`
    },
    edit: {
      curl: `curl -X POST http://localhost:8787/api/edit \\\n  -H "Content-Type: application/json" \\\n  -d '{"prompt": "Tambahkan topi rajut hijau", "image": "data:image/png;base64,..."}'`,
      python: `import requests, base64\n\nwith open("gambar.png", "rb") as f:\n    b64 = "data:image/png;base64," + base64.b64encode(f.read()).decode()\n\nres = requests.post("http://localhost:8787/api/edit", json={\n    "prompt": "Tambahkan topi rajut hijau",\n    "image": b64\n}).json()`,
      typescript: `const res = await fetch("http://localhost:8787/api/edit", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({\n    prompt: "Tambahkan topi rajut hijau",\n    image: "data:image/png;base64,..."\n  })\n});`
    },
    sessions: {
      curl: `# Dapatkan riwayat sesi\ncurl http://localhost:8787/api/sessions\n\n# Buat sesi baru\ncurl -X POST http://localhost:8787/api/sessions -H "Content-Type: application/json" -d '{"title": "Projek Karakter", "type": "generate"}'`,
      python: `import requests\nsessions = requests.get("http://localhost:8787/api/sessions").json()\nprint(sessions)`,
      typescript: `const { sessions } = await (await fetch("/api/sessions")).json();`
    }
  };

  async function copyCode(text: string) {
    await navigator.clipboard.writeText(text);
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="api-docs-modal-title"
    tabindex="-1"
    transition:fade={{ duration: 180 }}
    onclick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    class="modal-backdrop select-none"
  >
    <div
      in:scale={{ duration: 240, start: 0.94, opacity: 0, easing: cubicOut }}
      out:scale={{ duration: 150, start: 0.96, opacity: 0, easing: cubicIn }}
      class="modal-panel w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden text-neutral-900 dark:text-neutral-100"
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-[#27272a]">
        <div class="flex items-center gap-2.5">
          <Code2 class="w-5 h-5 text-neutral-800 dark:text-neutral-200" />
          <div>
            <h2 id="api-docs-modal-title" class="text-sm font-bold">Dokumentasi API</h2>
            <p class="text-xs text-neutral-500 dark:text-neutral-400">Spesifikasi Endpoint Text-to-Image & Image-to-Image</p>
          </div>
        </div>
        <button
          onclick={onClose}
          class="btn-spring p-1.5 text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg cursor-pointer"
          aria-label="Close"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Tabs with Tactile Transitions -->
      <div class="flex gap-2 px-5 pt-3 border-b border-neutral-200 dark:border-[#27272a] bg-neutral-50 dark:bg-[#141416]">
        {#each [
          { id: 'generate', label: 'POST /api/generate' },
          { id: 'edit', label: 'POST /api/edit' },
          { id: 'sessions', label: 'CRUD /api/sessions' }
        ] as tab}
          <button
            onclick={() => (activeTab = tab.id as any)}
            class="px-3.5 py-1.5 text-xs font-semibold rounded-t-lg transition-all duration-150 active:scale-[0.98] cursor-pointer {activeTab === tab.id
              ? 'bg-white dark:bg-[#18181a] text-neutral-900 dark:text-white border-t border-x border-neutral-200 dark:border-[#27272a] -mb-px shadow-xs'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50'}"
          >
            {tab.label}
          </button>
        {/each}
      </div>

      <!-- Body -->
      <div class="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
        {#if activeTab === 'generate'}
          <div>
            <h3 class="font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">Request Body (JSON)</h3>
            <div class="bg-neutral-50 dark:bg-[#1f1f22] p-3 rounded-lg border border-neutral-200 dark:border-[#27272a] space-y-1 font-mono text-[11px] text-neutral-700 dark:text-neutral-300">
              <div><span class="font-bold text-neutral-900 dark:text-white">prompt</span> (string, wajib) : Deskripsi gambar</div>
              <div><span class="font-bold text-neutral-900 dark:text-white">session_id</span> (string, opsional) : ID sesi percakapan</div>
            </div>
          </div>
        {:else if activeTab === 'edit'}
          <div>
            <h3 class="font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">Request Body (JSON)</h3>
            <div class="bg-neutral-50 dark:bg-[#1f1f22] p-3 rounded-lg border border-neutral-200 dark:border-[#27272a] space-y-1 font-mono text-[11px] text-neutral-700 dark:text-neutral-300">
              <div><span class="font-bold text-neutral-900 dark:text-white">prompt</span> (string, wajib) : Instruksi edit</div>
              <div><span class="font-bold text-neutral-900 dark:text-white">image</span> (string, wajib) : Base64 data URL atau URL gambar</div>
              <div><span class="font-bold text-neutral-900 dark:text-white">session_id</span> (string, opsional) : ID sesi</div>
            </div>
          </div>
        {:else}
          <div>
            <h3 class="font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">Riwayat SQLite</h3>
            <p class="text-neutral-600 dark:text-neutral-400">Semua riwayat sesi dan pesan tersimpan otomatis di database SQLite lokal.</p>
          </div>
        {/if}

        <!-- Code Examples -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="font-semibold text-neutral-700 dark:text-neutral-300">Contoh cURL</span>
            <button
              onclick={() => copyCode(snippets[activeTab].curl)}
              class="btn-spring flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
            >
              {#if copied}
                <Check class="w-3.5 h-3.5 text-emerald-500" />
                <span class="text-emerald-500 font-medium">Tersalin</span>
              {:else}
                <Copy class="w-3.5 h-3.5" />
                <span>Salin</span>
              {/if}
            </button>
          </div>
          <pre class="bg-neutral-900 text-neutral-100 p-3.5 rounded-lg overflow-x-auto font-mono text-[11px] border border-neutral-800">{snippets[activeTab].curl}</pre>

          <div class="flex items-center justify-between pt-1">
            <span class="font-semibold text-neutral-700 dark:text-neutral-300">Contoh Python (requests)</span>
            <button
              onclick={() => copyCode(snippets[activeTab].python)}
              class="btn-spring flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
            >
              {#if copied}
                <Check class="w-3.5 h-3.5 text-emerald-500" />
                <span class="text-emerald-500 font-medium">Tersalin</span>
              {:else}
                <Copy class="w-3.5 h-3.5" />
                <span>Salin</span>
              {/if}
            </button>
          </div>
          <pre class="bg-neutral-900 text-neutral-100 p-3.5 rounded-lg overflow-x-auto font-mono text-[11px] border border-neutral-800">{snippets[activeTab].python}</pre>
        </div>
      </div>
    </div>
  </div>
{/if}
