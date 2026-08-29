<script lang="ts">
  import { onMount } from 'svelte';
  import SidePanel from '$lib/components/SidePanel.svelte';
  import ChatArea from '$lib/components/ChatArea.svelte';
  import SessionModal from '$lib/components/SessionModal.svelte';
  import ApiDocsModal from '$lib/components/ApiDocsModal.svelte';
  import SettingsModal from '$lib/components/SettingsModal.svelte';
  import AccountModal from '$lib/components/AccountModal.svelte';
  import { account } from '$lib/stores/account';
  import type { Session, Message, SessionType } from '$lib/types';

  let sessions: Session[] = $state([]);
  let currentSessionId: string | null = $state(null);
  let currentSession: Session | null = $derived(sessions.find(s => s.id === currentSessionId) || null);
  let messages: Message[] = $state([]);
  let isLoading = $state(false);
  let isSidebarOpen = $state(true);
  let showSessionModal = $state(false);
  let showDocsModal = $state(false);
  let showSettingsModal = $state(false);
  let showAccountModal = $state(false);

  async function loadSessions() {
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      if (data.ok && Array.isArray(data.sessions)) {
        sessions = data.sessions;
        if (sessions.length > 0 && !currentSessionId) {
          selectSession(sessions[0].id);
        }
      }
    } catch {}
  }

  async function selectSession(id: string) {
    currentSessionId = id;
    try {
      const res = await fetch(`/api/sessions/${id}`);
      const data = await res.json();
      if (data.ok) {
        messages = data.messages || [];
      }
    } catch {}
  }

  async function createSession(type: SessionType) {
    showSessionModal = false;
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      const data = await res.json();
      if (data.ok && data.session) {
        sessions = [data.session, ...sessions];
        selectSession(data.session.id);
      }
    } catch {}
  }

  async function deleteSession(id: string) {
    if (!confirm('Hapus sesi ini beserta riwayatnya?')) return;
    try {
      await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
      sessions = sessions.filter(s => s.id !== id);
      if (currentSessionId === id) {
        if (sessions.length > 0) selectSession(sessions[0].id);
        else {
          currentSessionId = null;
          messages = [];
        }
      }
    } catch {}
  }

  async function handleSendMessage(prompt: string, attachmentBase64?: string | null) {
    if (!currentSessionId) {
      await createSession(attachmentBase64 ? 'edit' : 'generate');
    }

    const activeId = currentSessionId!;
    const isEdit = currentSession?.type === 'edit';

    const tempUserMsg: Message = {
      id: 'temp_' + Date.now(),
      session_id: activeId,
      role: 'user',
      content: prompt,
      attachment_url: attachmentBase64 || null,
      created_at: Date.now()
    };
    messages = [...messages, tempUserMsg];
    isLoading = true;

    try {
      const endpoint = isEdit ? '/api/edit' : '/api/generate';
      const payload = isEdit ? { prompt, image: attachmentBase64, session_id: activeId } : { prompt, session_id: activeId };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.ok && data.images?.length) {
        account.incrementUsage(1);
        await selectSession(activeId);
        await loadSessions();
      } else {
        alert('Gagal: ' + (data.error || 'Terjadi kesalahan sistem'));
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    loadSessions();
  });
</script>

<div
  class="group/sidebar-wrapper flex h-screen w-screen overflow-hidden bg-white dark:bg-[#0f0f10] text-neutral-900 dark:text-neutral-100"
  data-state={isSidebarOpen ? 'expanded' : 'collapsed'}
  data-collapsible="offcanvas"
>
  <SidePanel
    {sessions}
    {currentSessionId}
    isOpen={isSidebarOpen}
    onToggle={() => isSidebarOpen = !isSidebarOpen}
    onSelectSession={selectSession}
    onNewSessionClick={() => showSessionModal = true}
    onDeleteSession={deleteSession}
    onOpenDocs={() => showDocsModal = true}
    onOpenSettings={() => showSettingsModal = true}
    onOpenAccount={() => showAccountModal = true}
  />

  <ChatArea
    session={currentSession}
    {messages}
    {isLoading}
    {isSidebarOpen}
    onToggleSidebar={() => isSidebarOpen = !isSidebarOpen}
    onSendMessage={handleSendMessage}
  />

  <SessionModal
    open={showSessionModal}
    onSelect={createSession}
    onClose={() => showSessionModal = false}
  />

  <ApiDocsModal
    open={showDocsModal}
    onClose={() => showDocsModal = false}
  />

  <SettingsModal
    isOpen={showSettingsModal}
    onClose={() => showSettingsModal = false}
  />

  <AccountModal
    isOpen={showAccountModal}
    onClose={() => showAccountModal = false}
  />
</div>
