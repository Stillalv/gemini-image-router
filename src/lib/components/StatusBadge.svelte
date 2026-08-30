<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '$lib/i18n';
  import type { TaskStatus } from '$lib/types';

  let status: TaskStatus = $state({
    maxTabs: 3,
    busyTabs: 0,
    idleTabs: 0,
    queuedTasks: 0
  });

  async function fetchStatus() {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      if (data.ok) {
        status = {
          maxTabs: data.maxTabs,
          busyTabs: data.busyTabs,
          idleTabs: data.idleTabs,
          queuedTasks: data.queuedTasks
        };
      }
    } catch {}
  }

  onMount(() => {
    fetchStatus();
    const timer = setInterval(fetchStatus, 3500);
    return () => clearInterval(timer);
  });
</script>

<div class="flex items-center gap-1.5 text-[11px] font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-100/90 dark:bg-neutral-800/70 px-2.5 py-1 rounded-full border border-neutral-200/80 dark:border-neutral-700/60 transition">
  <span class="w-1.5 h-1.5 rounded-full {status.busyTabs > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}"></span>
  <span>{$t('app.poolLabel') || 'Pool'}: {status.busyTabs}/{status.maxTabs}</span>
  {#if status.queuedTasks > 0}
    <span class="text-amber-600 dark:text-amber-400 font-semibold">• {status.queuedTasks} {$t('app.queued')}</span>
  {/if}
</div>
