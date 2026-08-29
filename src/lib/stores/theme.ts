import { writable } from 'svelte/store';

export type ThemeMode = 'light' | 'dark' | 'system';
export type FontSize = 'small' | 'normal' | 'large';
export type FontFamily = 'sans' | 'geist' | 'mono' | 'serif';

interface ThemeConfig {
  mode: ThemeMode;
  fontSize: FontSize;
  fontFamily: FontFamily;
}

const defaultConfig: ThemeConfig = {
  mode: 'light',
  fontSize: 'normal',
  fontFamily: 'sans'
};

function getSavedConfig(): ThemeConfig {
  if (typeof localStorage === 'undefined') return defaultConfig;
  try {
    const raw = localStorage.getItem('gemini_theme_config');
    if (raw) return { ...defaultConfig, ...JSON.parse(raw) };
  } catch {}
  return defaultConfig;
}

export const theme = writable<ThemeConfig>(getSavedConfig());

let transitionTimer: ReturnType<typeof setTimeout> | null = null;

export function triggerSmoothTransition() {
  if (typeof document === 'undefined') return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const root = document.documentElement;
  root.classList.add('theme-transitioning');

  if (transitionTimer) clearTimeout(transitionTimer);
  transitionTimer = setTimeout(() => {
    root.classList.remove('theme-transitioning');
    transitionTimer = null;
  }, 260); // Matches the 250ms CSS transition duration
}

export function applyTheme(config: ThemeConfig, animate: boolean = false) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // 1. Apply Dark / Light / System Mode
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = config.mode === 'dark' || (config.mode === 'system' && prefersDark);
  const currentIsDark = root.classList.contains('dark');

  // Trigger smooth transition only if dark state is actually toggled
  if (animate && currentIsDark !== isDark) {
    triggerSmoothTransition();
  }

  if (isDark) {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }

  // 2. Apply Font Size
  const fontSizes = {
    small: '13px',
    normal: '14px',
    large: '16px'
  };
  root.style.setProperty('--app-font-size', fontSizes[config.fontSize] || '14px');

  // 3. Apply Font Family
  const fontFamilies = {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    geist: '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"Fira Code", Consolas, Monaco, "Courier New", monospace',
    serif: 'Merriweather, Georgia, Cambria, "Times New Roman", serif'
  };
  root.style.setProperty('--app-font-family', fontFamilies[config.fontFamily] || fontFamilies.sans);

  try {
    localStorage.setItem('gemini_theme_config', JSON.stringify(config));
  } catch {}
}

let isInitialized = false;

if (typeof window !== 'undefined') {
  theme.subscribe((cfg) => {
    // Initial mount is instant to prevent flash; subsequent user updates animate
    applyTheme(cfg, isInitialized);
    isInitialized = true;
  });

  // Listen to system color scheme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    theme.update((curr) => {
      if (curr.mode === 'system') applyTheme(curr, true);
      return curr;
    });
  });
}

export function setThemeMode(mode: ThemeMode) {
  theme.update((curr) => ({ ...curr, mode }));
}

export function setFontSize(fontSize: FontSize) {
  theme.update((curr) => ({ ...curr, fontSize }));
}

export function setFontFamily(fontFamily: FontFamily) {
  theme.update((curr) => ({ ...curr, fontFamily }));
}
