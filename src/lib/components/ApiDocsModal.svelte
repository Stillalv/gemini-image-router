<script lang="ts">
  import { Code2, X, Sparkles, Image, MessagesSquare, Activity, Key, Crown, FileJson, Gauge } from 'lucide-svelte';
  import { fade, scale, fly } from 'svelte/transition';
  import { cubicOut, cubicIn } from 'svelte/easing';
  import { t } from '$lib/i18n';
  import DocsEndpointView, { type ParameterItem } from './docs/DocsEndpointView.svelte';
  import DocsOpenApiViewer from './docs/DocsOpenApiViewer.svelte';

  interface Props {
    open: boolean;
    onClose: () => void;
  }

  let { open = false, onClose }: Props = $props();

  type TabId = 'generate' | 'edit' | 'sessions' | 'usage' | 'plan' | 'keys' | 'status' | 'openapi';
  let activeTab: TabId = $state('generate');

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && open) onClose();
  }

  // 1. POST /api/generate
  const generateParams: ParameterItem[] = [
    { name: 'prompt', type: 'string', required: true, description: 'Deskripsi detail gambar yang ingin dibuat (maksimal 2.000 karakter).' },
    { name: 'session_id', type: 'string', required: false, description: 'ID sesi (sess_...) untuk menyimpan generasi ini ke dalam percakapan tertentu.' },
    { name: 'aspect_ratio', type: 'string', required: false, description: 'Rasio aspek: 1:1, 16:9, 9:16, 4:3, 3:4, 2:1, 1:2, atau Auto.', defaultValue: 'Auto' },
    { name: 'model', type: 'string', required: false, description: 'Model Gemini: 3.7-flash (2x), 3.5-flash-lite (1x), 3.1-pro (3x), extended-thinking (4x).', defaultValue: '3.7-flash' }
  ];

  const generateSnippets = {
    curl: `curl -X POST http://localhost:8787/api/generate \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer gem_sec_your_api_key" \\\n  -d '{\n    "prompt": "astronaut cat on neon cyberpunk tokyo street, 8k render",\n    "aspect_ratio": "16:9",\n    "model": "3.7-flash"\n  }'`,
    python: `import requests\n\nurl = "http://localhost:8787/api/generate"\nheaders = {\n    "Content-Type": "application/json",\n    "Authorization": "Bearer gem_sec_your_api_key"\n}\npayload = {\n    "prompt": "astronaut cat on neon cyberpunk tokyo street, 8k render",\n    "aspect_ratio": "16:9",\n    "model": "3.7-flash"\n}\nres = requests.post(url, json=payload, headers=headers).json()\nprint("Image URL:", res["images"][0]["file"])`,
    javascript: `const res = await fetch("http://localhost:8787/api/generate", {\n  method: "POST",\n  headers: {\n    "Content-Type": "application/json",\n    "Authorization": "Bearer gem_sec_your_api_key"\n  },\n  body: JSON.stringify({\n    prompt: "astronaut cat on neon cyberpunk tokyo street, 8k render",\n    aspect_ratio: "16:9",\n    model: "3.7-flash"\n  })\n});\nconst data = await res.json();\nconsole.log(data.images[0].url);`,
    n8n: `// HTTP Request Node in n8n\n// Method: POST\n// URL: http://localhost:8787/api/generate\n// Authentication: Header Auth -> Name: Authorization, Value: Bearer gem_sec_your_key\n// Body Parameters:\n{\n  "prompt": "={{ $json.promptText }}",\n  "aspect_ratio": "16:9",\n  "model": "3.7-flash"\n}`
  };

  const generateSuccessResponse = `{\n  "ok": true,\n  "mode": "generate",\n  "prompt": "astronaut cat on neon cyberpunk tokyo street, 8k render",\n  "images": [\n    {\n      "file": "gen_1788021537641_0.png",\n      "url": "/output/gen_1788021537641_0.png",\n      "width": 1024,\n      "height": 559,\n      "alt": "astronaut cat..."\n    }\n  ],\n  "count": 1,\n  "session_id": "sess_a81f33b1-4709-410a",\n  "quota": {\n    "plan": "ultra",\n    "planName": "Ultra Plan",\n    "badge": "VIP ULTRA",\n    "usedToday": 14,\n    "remainingToday": 986,\n    "maxDaily": 1000,\n    "percentageUsed": 1.4,\n    "resetTime": "00:00 WIB",\n    "allowImageEditing": true\n  }\n}`;

  // 2. POST /api/edit
  const editParams: ParameterItem[] = [
    { name: 'prompt', type: 'string', required: true, description: 'Instruksi perbaikan atau pengubahan visual pada gambar.' },
    { name: 'image', type: 'string', required: true, description: 'Base64 Data URL (data:image/png;base64,...) atau URL gambar target.' },
    { name: 'session_id', type: 'string', required: false, description: 'ID sesi terkait untuk menjaga riwayat percakapan.' },
    { name: 'aspect_ratio', type: 'string', required: false, description: 'Rasio aspek target baru hasil pengeditan (opsional).' },
    { name: 'model', type: 'string', required: false, description: 'Model Gemini yang dipakai untuk mengeksekusi edit.' }
  ];

  const editSnippets = {
    curl: `curl -X POST http://localhost:8787/api/edit \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer gem_sec_your_api_key" \\\n  -d '{\n    "prompt": "Ganti helm astronot menjadi topi koboi kulit cokelat",\n    "image": "data:image/png;base64,iVBORw0KGgoAAA...",\n    "aspect_ratio": "1:1"\n  }'`,
    python: `import requests, base64\n\nwith open("input.png", "rb") as f:\n    b64 = "data:image/png;base64," + base64.b64encode(f.read()).decode()\n\nres = requests.post(\n    "http://localhost:8787/api/edit",\n    headers={"Authorization": "Bearer gem_sec_your_api_key"},\n    json={\n        "prompt": "Ganti helm astronot menjadi topi koboi kulit cokelat",\n        "image": b64\n    }\n).json()\nprint("Hasil Edit:", res["images"][0]["file"])`,
    javascript: `const res = await fetch("http://localhost:8787/api/edit", {\n  method: "POST",\n  headers: {\n    "Content-Type": "application/json",\n    "Authorization": "Bearer gem_sec_your_api_key"\n  },\n  body: JSON.stringify({\n    prompt: "Ganti helm astronot menjadi topi koboi kulit cokelat",\n    image: "data:image/png;base64,iVBORw0KGgo...",\n    aspect_ratio: "1:1"\n  })\n});\nconst data = await res.json();\nconsole.log("Edited:", data.images[0].url);`,
    n8n: `// HTTP Request Node (Image Edit)\n// Method: POST\n// URL: http://localhost:8787/api/edit\n// Body:\n{\n  "prompt": "Make background sunset",\n  "image": "={{ $json.dataUri }}"\n}`
  };

  const editSuccessResponse = `{\n  "ok": true,\n  "mode": "edit",\n  "prompt": "Ganti helm astronot menjadi topi koboi kulit cokelat",\n  "images": [\n    {\n      "file": "gen_1788021643084_0.png",\n      "url": "/output/gen_1788021643084_0.png",\n      "width": 1024,\n      "height": 1024,\n      "alt": "Edited Result"\n    }\n  ],\n  "count": 1,\n  "quota": {\n    "plan": "ultra",\n    "remainingToday": 984,\n    "usedToday": 16\n  }\n}`;

  // 3. CRUD /api/sessions
  const sessionSnippets = {
    curl: `# 1. Ambil seluruh sesi percakapan\ncurl http://localhost:8787/api/sessions \\\n  -H "Authorization: Bearer gem_sec_your_api_key"\n\n# 2. Buat sesi baru\ncurl -X POST http://localhost:8787/api/sessions \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer gem_sec_your_api_key" \\\n  -d '{"title": "Projek Karakter Cyberpunk", "type": "generate"}'\n\n# 3. Ambil detail & pesan sesi\ncurl http://localhost:8787/api/sessions/sess_12345 \\\n  -H "Authorization: Bearer gem_sec_your_api_key"\n\n# 4. Hapus sesi\ncurl -X DELETE http://localhost:8787/api/sessions/sess_12345 \\\n  -H "Authorization: Bearer gem_sec_your_api_key"`,
    python: `import requests\n\nheaders = {"Authorization": "Bearer gem_sec_your_api_key"}\n# List sessions\nres = requests.get("http://localhost:8787/api/sessions", headers=headers).json()\nprint("Sessions:", res["sessions"])`,
    javascript: `const headers = { "Authorization": "Bearer gem_sec_your_api_key" };\nconst res = await fetch("http://localhost:8787/api/sessions", { headers });\nconst { sessions } = await res.json();\nconsole.log(sessions);`,
    n8n: `// GET Sessions in n8n\n// Method: GET\n// URL: http://localhost:8787/api/sessions`
  };

  const sessionSuccessResponse = `{\n  "ok": true,\n  "sessions": [\n    {\n      "id": "sess_8471b0ea-11f8-4cb1",\n      "title": "Sesi Gambar Baru",\n      "type": "generate",\n      "created_at": 1788021537600,\n      "updated_at": 1788021545100,\n      "message_count": 2\n    }\n  ]\n}`;

  // 4. GET /api/account/usage
  const usageSnippets = {
    curl: `curl http://localhost:8787/api/account/usage \\\n  -H "Authorization: Bearer gem_sec_your_api_key"`,
    python: `import requests\n\nres = requests.get("http://localhost:8787/api/account/usage", headers={"Authorization": "Bearer gem_sec_your_api_key"}).json()\nprint("Remaining:", res["quota"]["remainingToday"])`,
    javascript: `const res = await fetch("/api/account/usage", {\n  headers: { "Authorization": "Bearer gem_sec_your_api_key" }\n});\nconst data = await res.json();\nconsole.log(data.quota);`,
    n8n: `// Check Quota Node\n// GET http://localhost:8787/api/account/usage`
  };

  const usageSuccessResponse = `{\n  "ok": true,\n  "isLoggedIn": true,\n  "user": {\n    "id": "usr_9981a",\n    "name": "Ardianto",\n    "email": "user@example.com",\n    "plan": "ultra"\n  },\n  "quota": {\n    "plan": "ultra",\n    "planName": "Ultra Plan",\n    "maxDaily": 1000,\n    "usedToday": 14,\n    "remainingToday": 986,\n    "percentageUsed": 1.4,\n    "resetTime": "00:00 WIB",\n    "allowImageEditing": true\n  },\n  "history": []\n}`;

  // 5. POST /api/account/plan
  const planSnippets = {
    curl: `curl -X POST http://localhost:8787/api/account/plan \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer gem_sec_your_api_key" \\\n  -d '{"plan": "ultra"}'`,
    python: `import requests\nrequests.post("http://localhost:8787/api/account/plan", headers={"Authorization": "Bearer gem_sec_your_api_key"}, json={"plan": "ultra"})`,
    javascript: `await fetch("/api/account/plan", {\n  method: "POST",\n  headers: { "Content-Type": "application/json", "Authorization": "Bearer gem_sec_your_api_key" },\n  body: JSON.stringify({ plan: "ultra" })\n});`,
    n8n: `// Change Plan Node\n// POST http://localhost:8787/api/account/plan\n{ "plan": "ultra" }`
  };

  const planSuccessResponse = `{\n  "ok": true,\n  "message": "Plan berhasil diperbarui menjadi ULTRA",\n  "plan": "ultra",\n  "quota": {\n    "maxDaily": 1000,\n    "remainingToday": 986\n  }\n}`;

  // 6. POST & GET /api/account/keys
  const keysSnippets = {
    curl: `# 1. Buat API Key baru\ncurl -X POST http://localhost:8787/api/account/keys \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer gem_sec_your_api_key" \\\n  -d '{"name": "n8n Production Workflow"}'\n\n# 2. Ambil daftar key\ncurl http://localhost:8787/api/account/keys \\\n  -H "Authorization: Bearer gem_sec_your_api_key"`,
    python: `import requests\nres = requests.post("http://localhost:8787/api/account/keys", headers={"Authorization": "Bearer gem_sec_your_api_key"}, json={"name": "Backend Script"}).json()\nprint("New Raw API Key:", res["rawKey"])`,
    javascript: `const res = await fetch("/api/account/keys", {\n  method: "POST",\n  headers: { "Content-Type": "application/json", "Authorization": "Bearer gem_sec_your_api_key" },\n  body: JSON.stringify({ name: "Web App Key" })\n});\nconst { rawKey } = await res.json();`,
    n8n: `// Key Generator\n// POST http://localhost:8787/api/account/keys`
  };

  const keysSuccessResponse = `{\n  "ok": true,\n  "rawKey": "gem_sec_4f9a18c0e27189b3...",\n  "apiKey": {\n    "id": "key_77192a",\n    "name": "n8n Production Workflow",\n    "keyPrefix": "gem_sec_4f9a18c0...",\n    "createdAt": 1788021537600\n  }\n}`;

  // 7. GET /api/status
  const statusSnippets = {
    curl: `curl http://localhost:8787/api/status`,
    python: `import requests\nres = requests.get("http://localhost:8787/api/status").json()\nprint("Worker Pool:", res)`,
    javascript: `const res = await fetch("http://localhost:8787/api/status");\nconst poolStatus = await res.json();\nconsole.log(poolStatus);`,
    n8n: `// Pool Health Check\n// GET http://localhost:8787/api/status`
  };

  const statusSuccessResponse = `{\n  "ok": true,\n  "maxTabs": 3,\n  "busyTabs": 0,\n  "idleTabs": 1,\n  "queuedTasks": 0\n}`;
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <div
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    transition:fade={{ duration: 180 }}
    onclick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    class="modal-backdrop select-none"
  >
    <div
      in:scale={{ duration: 240, start: 0.94, opacity: 0, easing: cubicOut }}
      out:scale={{ duration: 150, start: 0.96, opacity: 0, easing: cubicIn }}
      class="bg-white dark:bg-[#141416] border border-neutral-200 dark:border-[#27272a] rounded-2xl shadow-2xl w-full max-w-4xl h-[620px] max-h-[90vh] flex flex-col overflow-hidden text-neutral-900 dark:text-neutral-100 transition-colors duration-150"
    >
      <!-- Modal Header (Fixed h-14) -->
      <div class="h-14 px-5 border-b border-neutral-200 dark:border-[#27272a] flex items-center justify-between flex-shrink-0 bg-neutral-50/80 dark:bg-[#1c1c1f]/80">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Code2 class="w-4 h-4" />
          </div>
          <div>
            <h2 class="text-sm font-bold tracking-tight">{$t('docs.title')}</h2>
            <p class="text-[11px] text-neutral-500 dark:text-neutral-400">{$t('docs.subtitle')}</p>
          </div>
        </div>
        <button
          type="button"
          onclick={onClose}
          class="btn-spring p-1.5 text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg cursor-pointer"
          title={$t('modal.close')}
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Main Layout: Left Sidebar Nav + Right Content Viewport -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Sidebar Navigation -->
        <nav class="w-56 bg-neutral-50 dark:bg-[#121214] border-r border-neutral-200 dark:border-[#27272a] p-2.5 space-y-1 flex-shrink-0 overflow-y-auto">
          <div class="px-2 py-1 text-[10px] font-bold tracking-wider text-neutral-400 uppercase">
            Endpoints
          </div>

          <button
            type="button"
            onclick={() => (activeTab = 'generate')}
            class="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer {activeTab === 'generate' ? 'bg-white dark:bg-[#202024] text-neutral-900 dark:text-white shadow-xs font-semibold' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'}"
          >
            <span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">POST</span>
            <span class="truncate">/api/generate</span>
          </button>

          <button
            type="button"
            onclick={() => (activeTab = 'edit')}
            class="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer {activeTab === 'edit' ? 'bg-white dark:bg-[#202024] text-neutral-900 dark:text-white shadow-xs font-semibold' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'}"
          >
            <span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">POST</span>
            <span class="truncate">/api/edit</span>
          </button>

          <button
            type="button"
            onclick={() => (activeTab = 'sessions')}
            class="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer {activeTab === 'sessions' ? 'bg-white dark:bg-[#202024] text-neutral-900 dark:text-white shadow-xs font-semibold' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'}"
          >
            <span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">CRUD</span>
            <span class="truncate">/api/sessions</span>
          </button>

          <div class="px-2 pt-3 py-1 text-[10px] font-bold tracking-wider text-neutral-400 uppercase">
            Account & Health
          </div>

          <button
            type="button"
            onclick={() => (activeTab = 'usage')}
            class="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer {activeTab === 'usage' ? 'bg-white dark:bg-[#202024] text-neutral-900 dark:text-white shadow-xs font-semibold' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'}"
          >
            <span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">GET</span>
            <span class="truncate">/api/account/usage</span>
          </button>

          <button
            type="button"
            onclick={() => (activeTab = 'plan')}
            class="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer {activeTab === 'plan' ? 'bg-white dark:bg-[#202024] text-neutral-900 dark:text-white shadow-xs font-semibold' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'}"
          >
            <span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">POST</span>
            <span class="truncate">/api/account/plan</span>
          </button>

          <button
            type="button"
            onclick={() => (activeTab = 'keys')}
            class="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer {activeTab === 'keys' ? 'bg-white dark:bg-[#202024] text-neutral-900 dark:text-white shadow-xs font-semibold' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'}"
          >
            <Key class="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span class="truncate">API Keys</span>
          </button>

          <button
            type="button"
            onclick={() => (activeTab = 'status')}
            class="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer {activeTab === 'status' ? 'bg-white dark:bg-[#202024] text-neutral-900 dark:text-white shadow-xs font-semibold' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'}"
          >
            <Gauge class="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            <span class="truncate">Worker Status</span>
          </button>

          <div class="pt-3">
            <button
              type="button"
              onclick={() => (activeTab = 'openapi')}
              class="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer {activeTab === 'openapi' ? 'bg-white dark:bg-[#202024] text-neutral-900 dark:text-white shadow-xs font-semibold' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'}"
            >
              <FileJson class="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span class="truncate">OpenAPI 3.0 Spec</span>
            </button>
          </div>
        </nav>

        <!-- Right Content Viewport -->
        <div class="flex-1 relative overflow-hidden bg-white dark:bg-[#18181a]">
          {#key activeTab}
            <div
              in:fly={{ y: 6, duration: 200, delay: 30, easing: cubicOut }}
              out:fade={{ duration: 100, easing: cubicIn }}
              class="absolute inset-0 overflow-y-auto p-6 space-y-6 will-change-[transform,opacity]"
            >
              {#if activeTab === 'generate'}
                <DocsEndpointView
                  method="POST"
                  path="/api/generate"
                  title={$t('docs.generate.title')}
                  description={$t('docs.generate.desc')}
                  authType="optional"
                  authNote={$t('docs.generate.authNote')}
                  parameters={generateParams}
                  snippets={generateSnippets}
                  successResponse={generateSuccessResponse}
                />
              {:else if activeTab === 'edit'}
                <DocsEndpointView
                  method="POST"
                  path="/api/edit"
                  title={$t('docs.edit.title')}
                  description={$t('docs.edit.desc')}
                  authType="optional"
                  authNote={$t('docs.edit.authNote')}
                  parameters={editParams}
                  snippets={editSnippets}
                  successResponse={editSuccessResponse}
                />
              {:else if activeTab === 'sessions'}
                <DocsEndpointView
                  method="GET"
                  path="/api/sessions"
                  title={$t('docs.sessions.title')}
                  description={$t('docs.sessions.desc')}
                  authType="optional"
                  snippets={sessionSnippets}
                  successResponse={sessionSuccessResponse}
                />
              {:else if activeTab === 'usage'}
                <DocsEndpointView
                  method="GET"
                  path="/api/account/usage"
                  title={$t('docs.usage.title')}
                  description={$t('docs.usage.desc')}
                  authType="optional"
                  authNote={$t('docs.usage.authNote')}
                  snippets={usageSnippets}
                  successResponse={usageSuccessResponse}
                />
              {:else if activeTab === 'plan'}
                <DocsEndpointView
                  method="POST"
                  path="/api/account/plan"
                  title={$t('docs.plan.title')}
                  description={$t('docs.plan.desc')}
                  authType="required"
                  parameters={[{ name: 'plan', type: 'string', required: true, description: 'Paket target: free | pro | ultra' }]}
                  snippets={planSnippets}
                  successResponse={planSuccessResponse}
                />
              {:else if activeTab === 'keys'}
                <DocsEndpointView
                  method="POST"
                  path="/api/account/keys"
                  title={$t('docs.keys.title')}
                  description={$t('docs.keys.desc')}
                  authType="required"
                  parameters={[{ name: 'name', type: 'string', required: false, description: 'Nama label API Key untuk identifikasi' }]}
                  snippets={keysSnippets}
                  successResponse={keysSuccessResponse}
                />
              {:else if activeTab === 'status'}
                <DocsEndpointView
                  method="GET"
                  path="/api/status"
                  title={$t('docs.status.title')}
                  description={$t('docs.status.desc')}
                  authType="none"
                  snippets={statusSnippets}
                  successResponse={statusSuccessResponse}
                />
              {:else if activeTab === 'openapi'}
                <DocsOpenApiViewer />
              {/if}
            </div>
          {/key}
        </div>
      </div>
    </div>
  </div>
{/if}
