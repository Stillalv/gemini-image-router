<script lang="ts">
  import { Check } from 'lucide-svelte';
  import { t, locale, setLocale } from '$lib/i18n';
</script>

<div class="space-y-3">
  <div>
    <h3 class="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
      {$t('settings.language.selectLang')}
    </h3>
    <p class="text-[11px] text-neutral-500 dark:text-neutral-400">{$t('settings.language.selectLangDesc')}</p>
  </div>

  <div class="space-y-2">
    <!-- Indonesian -->
    <button
      type="button"
      onclick={() => setLocale('id')}
      class="card-spring-hover w-full flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer {$locale === 'id' ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800 font-semibold' : 'border-neutral-200 dark:border-[#27272a] hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}"
    >
      <div class="flex items-center gap-2.5">
        <span class="text-sm">🇮🇩</span>
        <span>{$t('settings.language.id')}</span>
      </div>
      {#if $locale === 'id'}<Check class="w-4 h-4 text-neutral-900 dark:text-white" />{/if}
    </button>

    <!-- English -->
    <button
      type="button"
      onclick={() => setLocale('en')}
      class="card-spring-hover w-full flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer {$locale === 'en' ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800 font-semibold' : 'border-neutral-200 dark:border-[#27272a] hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}"
    >
      <div class="flex items-center gap-2.5">
        <span class="text-sm">🇺🇸</span>
        <span>{$t('settings.language.en')}</span>
      </div>
      {#if $locale === 'en'}<Check class="w-4 h-4 text-neutral-900 dark:text-white" />{/if}
    </button>
  </div>
</div>
