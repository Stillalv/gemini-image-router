import { writable, derived } from 'svelte/store';
import idDict from './id.json';
import enDict from './en.json';

export type Locale = 'id' | 'en';

const dictionaries: Record<Locale, typeof idDict> = {
  id: idDict,
  en: enDict
};

const initialLocale: Locale = (typeof localStorage !== 'undefined' && (localStorage.getItem('gemini_locale') as Locale)) || 'id';

export const locale = writable<Locale>(initialLocale);

if (typeof window !== 'undefined') {
  locale.subscribe((val) => {
    try {
      localStorage.setItem('gemini_locale', val);
      document.documentElement.lang = val;
    } catch {}
  });
}

export function setLocale(newLocale: Locale) {
  locale.set(newLocale);
}

function getNestedValue(obj: any, path: string): string {
  const parts = path.split('.');
  let curr = obj;
  for (const part of parts) {
    if (curr === undefined || curr === null) return path;
    curr = curr[part];
  }
  return typeof curr === 'string' ? curr : path;
}

export const t = derived(locale, ($locale) => {
  const dict = dictionaries[$locale] || dictionaries.id;
  return (key: string): string => {
    return getNestedValue(dict, key) || key;
  };
});
