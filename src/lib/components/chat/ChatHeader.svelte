<script lang="ts">
  import { PanelLeft, Palette, Sparkles } from 'lucide-svelte';
  import StatusBadge from '../StatusBadge.svelte';
  import { t } from '$lib/i18n';
  import type { Session } from '$lib/types';

  interface Props {
    session: Session | null;
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
  }

  let { session, isSidebarOpen, onToggleSidebar }: Props = $props();
</script>

<header class="h-14 border-b border-neutral-200 dark:border-[#27272a] px-4 flex items-center justify-between flex-shrink-0 bg-white dark:bg-[#0f0f10]">
  <div class="flex items-center">
    <!-- Fluid Expanding Open Sidebar Button -->
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

  <!-- Top Right: Status Badge -->
  <div class="flex items-center gap-2">
    <StatusBadge />
  </div>
</header>
