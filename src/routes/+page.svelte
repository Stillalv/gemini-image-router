<script lang="ts">
  import { onMount } from 'svelte';
  import SidePanel from '$lib/components/SidePanel.svelte';
  import ChatArea from '$lib/components/ChatArea.svelte';
  import SessionModal from '$lib/components/SessionModal.svelte';
  import ApiDocsModal from '$lib/components/ApiDocsModal.svelte';
  import SettingsModal from '$lib/components/SettingsModal.svelte';
  import AccountModal from '$lib/components/AccountModal.svelte';
  import { account } from '$lib/stores/account';
  import { t } from '$lib/i18n';
  import type { Session, Message, SessionType, GeminiModelId, AttachmentItem } from '$lib/types';

  let sessions: Session[] = $state([]);
  let currentSessionId: string | null = $state(null);
  let currentSession: Session | null = $derived(sessions.find(s => s.id === currentSessionId) || null);
  let messages: Message[] = $state([]);
  let loadingSessionIds: string[] = $state([]);
  let isCurrentSessionLoading = $derived(Boolean(currentSessionId && loadingSessionIds.includes(currentSessionId)));
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
      if (data.ok && Array.isArray(data.messages)) {
        messages = data.messages;
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
        currentSessionId = data.session.id;
        messages = [];
        return data.session;
      }
    } catch {}
    return null;
  }

  async function deleteSession(id: string) {
    if (!confirm($t('alerts.confirmDeleteSession'))) return;
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

  async function handleSendMessage(
    prompt: string,
    attachments?: AttachmentItem[] | string | null,
    aspectRatio?: string,
    model?: GeminiModelId,
    options?: { count?: number; mode?: 'composite' | 'batch' }
  ) {
    const rawAttachments = Array.isArray(attachments)
      ? attachments.map(a => a.dataUrl)
      : typeof attachments === 'string'
        ? [attachments]
        : [];

    const hasAttachments = rawAttachments.length > 0;

    if (!currentSessionId) {
      await createSession(hasAttachments ? 'edit' : 'generate');
    }

    const activeId = currentSessionId!;
    const isEdit = hasAttachments || currentSession?.type === 'edit';

    // If edit mode and no direct attachments passed, fallback to last generated/attached image in session
    let imagesToEdit = [...rawAttachments];
    if (isEdit && imagesToEdit.length === 0 && messages.length > 0) {
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].image_url) {
          imagesToEdit = [messages[i].image_url!];
          break;
        } else if (messages[i].attachment_url) {
          imagesToEdit = [messages[i].attachment_url!];
          break;
        }
      }
    }

    const tempUserMsg: Message = {
      id: 'temp_' + Date.now(),
      session_id: activeId,
      role: 'user',
      content: prompt,
      attachment_url: imagesToEdit[0] || null,
      attachment_urls: imagesToEdit.length > 1 ? imagesToEdit : undefined,
      created_at: Date.now()
    };

    if (currentSessionId === activeId) {
      messages = [...messages, tempUserMsg];
    }
    loadingSessionIds = [...loadingSessionIds, activeId];

    try {
      const endpoint = (isEdit && imagesToEdit.length > 0) ? '/api/edit' : '/api/generate';
      const payload = (isEdit && imagesToEdit.length > 0)
        ? {
            prompt,
            image: imagesToEdit[0],
            images: imagesToEdit.length > 1 ? imagesToEdit : undefined,
            mode: options?.mode || 'composite',
            count: options?.count,
            session_id: activeId,
            aspect_ratio: aspectRatio,
            model
          }
        : {
            prompt,
            count: options?.count || 1,
            session_id: activeId,
            aspect_ratio: aspectRatio,
            model
          };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.ok && data.images?.length) {
        if (data.quota) {
          account.setQuota(data.quota);
        } else {
          account.incrementUsage(data.images.length || 1);
        }
        if (currentSessionId === activeId) {
          await selectSession(activeId);
        }
        await loadSessions();
      } else {
        alert($t('alerts.requestFailed') + ': ' + (data.error || $t('alerts.systemError')));
      }
    } catch (err: any) {
      alert($t('alerts.networkError') + ': ' + err.message);
    } finally {
      loadingSessionIds = loadingSessionIds.filter(id => id !== activeId);
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
    {loadingSessionIds}
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
    isLoading={isCurrentSessionLoading}
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
