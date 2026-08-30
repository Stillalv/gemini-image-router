<script lang="ts">
  import { onMount } from 'svelte';
  import { Sparkles } from 'lucide-svelte';
  import { t } from '$lib/i18n';
  import type { TaskStatus } from '$lib/types';

  let poolStatus: TaskStatus = $state({
    maxTabs: 3,
    busyTabs: 0,
    idleTabs: 0,
    queuedTasks: 0
  });

  async function fetchPoolStatus() {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      if (data.ok) {
        poolStatus = {
          maxTabs: data.maxTabs,
          busyTabs: data.busyTabs,
          idleTabs: data.idleTabs,
          queuedTasks: data.queuedTasks
        };
      }
    } catch {}
  }

  onMount(() => {
    fetchPoolStatus();
  });
</script>

<div class="space-y-4">
  <h3 class="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
    {$t('settings.engine.statusTitle')}
  </h3>

  <div class="grid grid-cols-2 gap-2 text-xs">
    <div class="p-3 bg-neutral-50 dark:bg-[#202023] rounded-xl border border-neutral-200/80 dark:border-[#27272a]">
      <div class="text-[11px] text-neutral-500 dark:text-neutral-400">{$t('settings.engine.maxTabs')}</div>
      <div class="text-sm font-bold mt-1 text-neutral-800 dark:text-white">{poolStatus.maxTabs} Tabs</div>
    </div>

    <div class="p-3 bg-neutral-50 dark:bg-[#202023] rounded-xl border border-neutral-200/80 dark:border-[#27272a]">
      <div class="text-[11px] text-neutral-500 dark:text-neutral-400">{$t('settings.engine.busyTabs')}</div>
      <div class="text-sm font-bold mt-1 text-neutral-800 dark:text-white">{poolStatus.busyTabs} Active</div>
    </div>

    <div class="p-3 bg-neutral-50 dark:bg-[#202023] rounded-xl border border-neutral-200/80 dark:border-[#27272a]">
      <div class="text-[11px] text-neutral-500 dark:text-neutral-400">{$t('settings.engine.idleTabs')}</div>
      <div class="text-sm font-bold mt-1 text-neutral-800 dark:text-white">{poolStatus.idleTabs} Warm</div>
    </div>

    <div class="p-3 bg-neutral-50 dark:bg-[#202023] rounded-xl border border-neutral-200/80 dark:border-[#27272a]">
      <div class="text-[11px] text-neutral-500 dark:text-neutral-400">{$t('settings.engine.queuedTasks')}</div>
      <div class="text-sm font-bold mt-1 text-neutral-800 dark:text-white">{poolStatus.queuedTasks} Tasks</div>
    </div>
  </div>

  <div class="p-3.5 bg-neutral-50 dark:bg-[#202023] rounded-xl border border-neutral-200/80 dark:border-[#27272a] space-y-1.5 text-xs">
    <div class="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">{$t('settings.engine.cdnDelivery')}</div>
    <div class="font-medium text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
      <Sparkles class="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
      <span>{$t('settings.engine.cdnDeliveryVal')}</span>
    </div>
  </div>
</div>
