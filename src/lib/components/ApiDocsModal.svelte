<script lang="ts">
  import { Code2, X, Copy, Check, Terminal, FileCode, Sparkles, Key } from 'lucide-svelte';
  import { fade, scale } from 'svelte/transition';
  import { cubicOut, cubicIn } from 'svelte/easing';
  import { t } from '$lib/i18n';

  interface Props {
    open: boolean;
    onClose: () => void;
  }

  let { open = false, onClose }: Props = $props();
  let activeTab: 'generate' | 'edit' | 'sessions' | 'auth' = $state('generate');
  let snippetLang: 'curl' | 'python' | 'javascript' = $state('curl');
  let copied = $state(false);

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && open) onClose();
  }

  const snippets = {
    generate: {
      curl: `curl -X POST http://localhost:8787/api/generate \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer gem_sec_your_key_here" \\\n  -d '{\n    "prompt": "astronaut cat on cyberpunk neon street, 8k cinematic",\n    "aspect_ratio": "16:9",\n    "model": "3.7-flash"\n  }'`,
      python: `import requests\n\nurl = "http://localhost:8787/api/generate"\nheaders = {\n    "Content-Type": "application/json",\n    "Authorization": "Bearer gem_sec_your_key_here"\n}\npayload = {\n    "prompt": "astronaut cat on cyberpunk neon street, 8k cinematic",\n    "aspect_ratio": "16:9",\n    "model": "3.7-flash"\n}\nres = requests.post(url, json=payload, headers=headers).json()\nprint("Image URL:", res["images"][0]["file"])`,
      javascript: `const res = await fetch("http://localhost:8787/api/generate", {\n  method: "POST",\n  headers: {\n    "Content-Type": "application/json",\n    "Authorization": "Bearer gem_sec_your_key_here"\n  },\n  body: JSON.stringify({\n    prompt: "astronaut cat on cyberpunk neon street, 8k cinematic",\n    aspect_ratio: "16:9",\n    model: "3.7-flash"\n  })\n});\nconst data = await res.json();\nconsole.log(data.images[0].file);`
    },
    edit: {
      curl: `curl -X POST http://localhost:8787/api/edit \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer gem_sec_your_key_here" \\\n  -d '{\n    "prompt": "Change the helmet color to bright gold and add starry background",\n    "image": "data:image/png;base64,iVBORw0KGgo...",\n    "aspect_ratio": "1:1"\n  }'`,
      python: `import requests, base64\n\nwith open("input.png", "rb") as f:\n    b64 = "data:image/png;base64," + base64.b64encode(f.read()).decode()\n\nres = requests.post(\n    "http://localhost:8787/api/edit",\n    headers={"Authorization": "Bearer gem_sec_your_key_here"},\n    json={\n        "prompt": "Change the helmet color to bright gold",\n        "image": b64\n    }\n).json()\nprint("Edited Image:", res["images"][0]["file"])`,
      javascript: `const res = await fetch("http://localhost:8787/api/edit", {\n  method: "POST",\n  headers: {\n    "Content-Type": "application/json",\n    "Authorization": "Bearer gem_sec_your_key_here"\n  },\n  body: JSON.stringify({\n    prompt: "Change the helmet color to bright gold",\n    image: "data:image/png;base64,iVBORw0KGgo..."\n  })\n});\nconst data = await res.json();`
    },
    sessions: {
      curl: `# 1. Get all sessions\ncurl http://localhost:8787/api/sessions \\\n  -H "Authorization: Bearer gem_sec_your_key_here"\n\n# 2. Create new session\ncurl -X POST http://localhost:8787/api/sessions \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer gem_sec_your_key_here" \\\n  -d '{"title": "Character Concepts", "type": "generate"}'`,
      python: `import requests\n\nheaders = {"Authorization": "Bearer gem_sec_your_key_here"}\nsessions = requests.get("http://localhost:8787/api/sessions", headers=headers).json()\nprint("Active Sessions:", sessions["sessions"])`,
      javascript: `const headers = { "Authorization": "Bearer gem_sec_your_key_here" };\nconst res = await fetch("/api/sessions", { headers });\nconst { sessions } = await res.json();`
    },
    auth: {
      curl: `curl http://localhost:8787/api/account/me \\\n  -H "Authorization: Bearer gem_sec_your_key_here"`,
      python: `import requests\n\nres = requests.get(\n    "http://localhost:8787/api/account/me",\n    headers={"Authorization": "Bearer gem_sec_your_key_here"}\n).json()\nprint("Account Quota:", res["quota"])`,
      javascript: `const res = await fetch("/api/account/me", {\n  headers: { "Authorization": "Bearer gem_sec_your_key_here" }\n});\nconst data = await res.json();`
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
      class="modal-panel w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden text-neutral-900 dark:text-neutral-100"
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-[#27272a] bg-white dark:bg-[#18181a]">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-xl bg-neutral-100 dark:bg-[#222226] text-neutral-800 dark:text-neutral-200">
            <Code2 class="w-5 h-5" />
          </div>
          <div>
            <h2 id="api-docs-modal-title" class="text-sm font-bold">{$t('docs.title')}</h2>
            <p class="text-xs text-neutral-500 dark:text-neutral-400">{$t('docs.subtitle')}</p>
          </div>
        </div>
        <button
          type="button"
          onclick={onClose}
          class="btn-spring p-1.5 text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg cursor-pointer"
          aria-label={$t('modal.close')}
          title={$t('modal.close')}
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Endpoint Tabs -->
      <div class="flex gap-1.5 px-5 pt-3 border-b border-neutral-200 dark:border-[#27272a] bg-neutral-50 dark:bg-[#141416] overflow-x-auto">
        {#each [
          { id: 'generate', label: $t('docs.tabs.generate') },
          { id: 'edit', label: $t('docs.tabs.edit') },
          { id: 'sessions', label: $t('docs.tabs.sessions') },
          { id: 'auth', label: $t('docs.tabs.auth') }
        ] as tab}
          <button
            type="button"
            onclick={() => (activeTab = tab.id as any)}
            class="px-3.5 py-1.5 text-xs font-semibold rounded-t-lg transition-all duration-150 active:scale-[0.98] cursor-pointer whitespace-nowrap {activeTab === tab.id
              ? 'bg-white dark:bg-[#18181a] text-neutral-900 dark:text-white border-t border-x border-neutral-200 dark:border-[#27272a] -mb-px shadow-xs'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50'}"
          >
            {tab.label}
          </button>
        {/each}
      </div>

      <!-- Body Viewport -->
      <div class="p-5 overflow-y-auto space-y-5 flex-1 text-xs bg-white dark:bg-[#18181a]">
        {#if activeTab === 'generate'}
          <div class="space-y-2">
            <div class="font-semibold text-neutral-800 dark:text-neutral-200 text-sm">{$t('docs.generate.title')}</div>
            <p class="text-neutral-500 dark:text-neutral-400 text-xs">{$t('docs.generate.desc')}</p>
            <div class="bg-neutral-50 dark:bg-[#1f1f22] p-3.5 rounded-xl border border-neutral-200 dark:border-[#27272a] space-y-1.5 font-mono text-[11px] text-neutral-700 dark:text-neutral-300">
              <div><span class="font-bold text-neutral-900 dark:text-white">prompt</span> (string, wajib) : {$t('docs.generate.promptParam')}</div>
              <div><span class="font-bold text-neutral-900 dark:text-white">session_id</span> (string, opsional) : {$t('docs.generate.sessionParam')}</div>
              <div><span class="font-bold text-neutral-900 dark:text-white">aspect_ratio</span> (string, opsional) : {$t('docs.generate.aspectRatioParam')}</div>
              <div><span class="font-bold text-neutral-900 dark:text-white">model</span> (string, opsional) : {$t('docs.generate.modelParam')}</div>
            </div>
          </div>
        {:else if activeTab === 'edit'}
          <div class="space-y-2">
            <div class="font-semibold text-neutral-800 dark:text-neutral-200 text-sm">{$t('docs.edit.title')}</div>
            <p class="text-neutral-500 dark:text-neutral-400 text-xs">{$t('docs.edit.desc')}</p>
            <div class="bg-neutral-50 dark:bg-[#1f1f22] p-3.5 rounded-xl border border-neutral-200 dark:border-[#27272a] space-y-1.5 font-mono text-[11px] text-neutral-700 dark:text-neutral-300">
              <div><span class="font-bold text-neutral-900 dark:text-white">prompt</span> (string, wajib) : {$t('docs.edit.promptParam')}</div>
              <div><span class="font-bold text-neutral-900 dark:text-white">image</span> (string, wajib) : {$t('docs.edit.imageParam')}</div>
              <div><span class="font-bold text-neutral-900 dark:text-white">session_id</span> (string, opsional) : {$t('docs.edit.sessionParam')}</div>
              <div><span class="font-bold text-neutral-900 dark:text-white">aspect_ratio</span> (string, opsional) : {$t('docs.edit.aspectRatioParam')}</div>
              <div><span class="font-bold text-neutral-900 dark:text-white">model</span> (string, opsional) : {$t('docs.edit.modelParam')}</div>
            </div>
          </div>
        {:else if activeTab === 'sessions'}
          <div class="space-y-2">
            <div class="font-semibold text-neutral-800 dark:text-neutral-200 text-sm">{$t('docs.sessions.title')}</div>
            <p class="text-neutral-500 dark:text-neutral-400 text-xs">{$t('docs.sessions.desc')}</p>
            <div class="bg-neutral-50 dark:bg-[#1f1f22] p-3.5 rounded-xl border border-neutral-200 dark:border-[#27272a] space-y-2 text-[11px]">
              <div><span class="font-mono font-bold text-neutral-900 dark:text-white">GET /api/sessions</span> : {$t('docs.sessions.listDesc')}</div>
              <div><span class="font-mono font-bold text-neutral-900 dark:text-white">POST /api/sessions</span> : {$t('docs.sessions.createDesc')}</div>
              <div><span class="font-mono font-bold text-neutral-900 dark:text-white">GET /api/sessions/:id</span> : {$t('docs.sessions.detailDesc')}</div>
              <div><span class="font-mono font-bold text-neutral-900 dark:text-white">DELETE /api/sessions/:id</span> : {$t('docs.sessions.deleteDesc')}</div>
            </div>
          </div>
        {:else}
          <div class="space-y-2">
            <div class="font-semibold text-neutral-800 dark:text-neutral-200 text-sm">{$t('docs.auth.title')}</div>
            <p class="text-neutral-500 dark:text-neutral-400 text-xs">{$t('docs.auth.desc')}</p>
            <div class="bg-neutral-50 dark:bg-[#1f1f22] p-3.5 rounded-xl border border-neutral-200 dark:border-[#27272a] space-y-1.5 text-[11px]">
              <div class="font-semibold text-neutral-700 dark:text-neutral-300">{$t('docs.auth.headerLabel')}</div>
              <input
                type="text"
                readonly
                value={$t('docs.auth.headerValue')}
                onclick={(e) => (e.target as HTMLInputElement).select()}
                class="w-full font-mono p-2 bg-white dark:bg-[#141416] rounded-lg border border-neutral-200 dark:border-neutral-800 text-[11px] select-all cursor-text focus:outline-hidden"
              />
            </div>
          </div>
        {/if}

        <!-- Interactive Code Snippet Tabs (cURL / Python / Node.js) -->
        <div class="space-y-2.5 pt-2 border-t border-neutral-100 dark:border-[#27272a]">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-[#1f1f22] rounded-lg">
              <button
                type="button"
                onclick={() => (snippetLang = 'curl')}
                class="px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer {snippetLang === 'curl' ? 'bg-white dark:bg-[#2c2c30] text-neutral-900 dark:text-white shadow-xs' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}"
              >
                {$t('docs.tabs.curl')}
              </button>
              <button
                type="button"
                onclick={() => (snippetLang = 'python')}
                class="px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer {snippetLang === 'python' ? 'bg-white dark:bg-[#2c2c30] text-neutral-900 dark:text-white shadow-xs' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}"
              >
                {$t('docs.tabs.python')}
              </button>
              <button
                type="button"
                onclick={() => (snippetLang = 'javascript')}
                class="px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer {snippetLang === 'javascript' ? 'bg-white dark:bg-[#2c2c30] text-neutral-900 dark:text-white shadow-xs' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}"
              >
                {$t('docs.tabs.javascript')}
              </button>
            </div>

            <button
              type="button"
              onclick={() => copyCode(snippets[activeTab][snippetLang])}
              class="btn-spring flex items-center gap-1.5 text-[11px] text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-[#202023] hover:bg-neutral-200 dark:hover:bg-neutral-800 cursor-pointer"
            >
              {#if copied}
                <Check class="w-3.5 h-3.5 text-emerald-500" />
                <span class="text-emerald-500 font-medium">{$t('docs.copied')}</span>
              {:else}
                <Copy class="w-3.5 h-3.5" />
                <span>{$t('docs.copy')}</span>
              {/if}
            </button>
          </div>

          <pre class="bg-neutral-900 text-neutral-100 p-3.5 rounded-xl overflow-x-auto font-mono text-[11px] leading-relaxed border border-neutral-800 select-text">{snippets[activeTab][snippetLang]}</pre>
        </div>

        <!-- Responses & Error Codes Accordion -->
        <div class="pt-2 border-t border-neutral-100 dark:border-[#27272a] space-y-2">
          <div class="font-semibold text-neutral-800 dark:text-neutral-200 text-xs">
            {$t('docs.responses.title')}
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-neutral-600 dark:text-neutral-400">
            <div class="p-2.5 bg-neutral-50 dark:bg-[#1f1f22] rounded-lg border border-neutral-200/80 dark:border-[#27272a]">
              <span class="font-bold text-emerald-600 dark:text-emerald-400">200 OK</span>: {$t('docs.responses.successDesc')}
            </div>
            <div class="p-2.5 bg-neutral-50 dark:bg-[#1f1f22] rounded-lg border border-neutral-200/80 dark:border-[#27272a]">
              <span class="font-bold text-red-500">400 Bad Request</span>: {$t('docs.responses.error400')}
            </div>
            <div class="p-2.5 bg-neutral-50 dark:bg-[#1f1f22] rounded-lg border border-neutral-200/80 dark:border-[#27272a]">
              <span class="font-bold text-amber-500">401 / 403 Quota</span>: {$t('docs.responses.error403')}
            </div>
            <div class="p-2.5 bg-neutral-50 dark:bg-[#1f1f22] rounded-lg border border-neutral-200/80 dark:border-[#27272a]">
              <span class="font-bold text-red-600">500 Server Error</span>: {$t('docs.responses.error500')}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

