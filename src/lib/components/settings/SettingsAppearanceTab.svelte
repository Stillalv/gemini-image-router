<script lang="ts">
  import { Sun, Moon, Laptop, Check } from 'lucide-svelte';
  import { t } from '$lib/i18n';
  import {
    theme,
    setThemeMode,
    setFontSize,
    setFontFamily
  } from '$lib/stores/theme';
</script>

<div class="space-y-6">
  <!-- 1. Theme Mode -->
  <div class="space-y-2.5">
    <div class="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
      {$t('settings.appearance.themeMode')}
    </div>
    <div class="grid grid-cols-3 gap-2.5">
      <!-- Light Mode Card -->
      <button
        type="button"
        onclick={() => setThemeMode('light')}
        class="card-spring-hover flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-medium cursor-pointer {$theme.mode === 'light' ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800 ring-2 ring-neutral-900/10 dark:ring-white/20' : 'border-neutral-200 dark:border-[#27272a] hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}"
      >
        <Sun class="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
        <span>{$t('settings.appearance.light')}</span>
      </button>

      <!-- Dark Mode Card -->
      <button
        type="button"
        onclick={() => setThemeMode('dark')}
        class="card-spring-hover flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-medium cursor-pointer {$theme.mode === 'dark' ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800 ring-2 ring-neutral-900/10 dark:ring-white/20' : 'border-neutral-200 dark:border-[#27272a] hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}"
      >
        <Moon class="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
        <span>{$t('settings.appearance.dark')}</span>
      </button>

      <!-- System Mode Card -->
      <button
        type="button"
        onclick={() => setThemeMode('system')}
        class="card-spring-hover flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-medium cursor-pointer {$theme.mode === 'system' ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800 ring-2 ring-neutral-900/10 dark:ring-white/20' : 'border-neutral-200 dark:border-[#27272a] hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}"
      >
        <Laptop class="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
        <span>{$t('settings.appearance.system')}</span>
      </button>
    </div>
  </div>

  <!-- 2. Font Size -->
  <div class="space-y-2.5 pt-2 border-t border-neutral-100 dark:border-[#27272a]">
    <div>
      <div class="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
        {$t('settings.appearance.fontSize')}
      </div>
      <p class="text-[11px] text-neutral-500 dark:text-neutral-400">{$t('settings.appearance.fontSizeDesc')}</p>
    </div>
    <div class="flex items-center gap-2">
      <button
        type="button"
        onclick={() => setFontSize('small')}
        class="btn-spring flex-1 py-2 px-3 rounded-xl border text-xs font-medium cursor-pointer {$theme.fontSize === 'small' ? 'border-neutral-900 dark:border-white bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold' : 'border-neutral-200 dark:border-[#27272a] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'}"
      >
        {$t('settings.appearance.fontSmall')}
      </button>
      <button
        type="button"
        onclick={() => setFontSize('normal')}
        class="btn-spring flex-1 py-2 px-3 rounded-xl border text-xs font-medium cursor-pointer {$theme.fontSize === 'normal' ? 'border-neutral-900 dark:border-white bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold' : 'border-neutral-200 dark:border-[#27272a] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'}"
      >
        {$t('settings.appearance.fontNormal')}
      </button>
      <button
        type="button"
        onclick={() => setFontSize('large')}
        class="btn-spring flex-1 py-2 px-3 rounded-xl border text-xs font-medium cursor-pointer {$theme.fontSize === 'large' ? 'border-neutral-900 dark:border-white bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold' : 'border-neutral-200 dark:border-[#27272a] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'}"
      >
        {$t('settings.appearance.fontLarge')}
      </button>
    </div>
  </div>

  <!-- 3. Font Family -->
  <div class="space-y-2.5 pt-2 border-t border-neutral-100 dark:border-[#27272a]">
    <div>
      <div class="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
        {$t('settings.appearance.fontFamily')}
      </div>
      <p class="text-[11px] text-neutral-500 dark:text-neutral-400">{$t('settings.appearance.fontFamilyDesc')}</p>
    </div>
    <div class="grid grid-cols-2 gap-2">
      <button
        type="button"
        onclick={() => setFontFamily('sans')}
        class="card-spring-hover flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer {$theme.fontFamily === 'sans' ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800 font-semibold' : 'border-neutral-200 dark:border-[#27272a] hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}"
      >
        <span style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;">{$t('settings.appearance.fontSans')}</span>
        {#if $theme.fontFamily === 'sans'}<Check class="w-3.5 h-3.5 text-neutral-900 dark:text-white" />{/if}
      </button>

      <button
        type="button"
        onclick={() => setFontFamily('geist')}
        class="card-spring-hover flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer {$theme.fontFamily === 'geist' ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800 font-semibold' : 'border-neutral-200 dark:border-[#27272a] hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}"
      >
        <span style="font-family: 'Geist', sans-serif;">{$t('settings.appearance.fontGeist')}</span>
        {#if $theme.fontFamily === 'geist'}<Check class="w-3.5 h-3.5 text-neutral-900 dark:text-white" />{/if}
      </button>

      <button
        type="button"
        onclick={() => setFontFamily('mono')}
        class="card-spring-hover flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer {$theme.fontFamily === 'mono' ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800 font-semibold' : 'border-neutral-200 dark:border-[#27272a] hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}"
      >
        <span style="font-family: monospace;">{$t('settings.appearance.fontMono')}</span>
        {#if $theme.fontFamily === 'mono'}<Check class="w-3.5 h-3.5 text-neutral-900 dark:text-white" />{/if}
      </button>

      <button
        type="button"
        onclick={() => setFontFamily('serif')}
        class="card-spring-hover flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer {$theme.fontFamily === 'serif' ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800 font-semibold' : 'border-neutral-200 dark:border-[#27272a] hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}"
      >
        <span style="font-family: serif;">{$t('settings.appearance.fontSerif')}</span>
        {#if $theme.fontFamily === 'serif'}<Check class="w-3.5 h-3.5 text-neutral-900 dark:text-white" />{/if}
      </button>
    </div>
  </div>
</div>
