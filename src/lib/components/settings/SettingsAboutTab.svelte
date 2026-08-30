<script lang="ts">
  import { t } from '$lib/i18n';
</script>

<div class="space-y-3 text-xs">
  <div class="p-4 bg-neutral-50 dark:bg-[#202023] rounded-xl border border-neutral-200/80 dark:border-[#27272a] space-y-2">
    <div class="font-bold text-sm text-neutral-900 dark:text-white">
      {$t('settings.about.name')}
    </div>
    <div class="text-neutral-600 dark:text-neutral-300">
      {$t('settings.about.version')}
    </div>
    <div class="pt-2 border-t border-neutral-200 dark:border-neutral-700/60 grid grid-cols-2 gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
      <div>Runtime: <span class="text-neutral-800 dark:text-neutral-200 font-medium">Bun 1.4.0</span></div>
      <div>Database: <span class="text-neutral-800 dark:text-neutral-200 font-medium">MongoDB Atlas</span></div>
      <div>Automation: <span class="text-neutral-800 dark:text-neutral-200 font-medium">Playwright Chrome</span></div>
      <div>Model: <span class="text-neutral-800 dark:text-neutral-200 font-medium">Google Imagen 3</span></div>
    </div>
  </div>
</div>
