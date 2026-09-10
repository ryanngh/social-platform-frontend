import { vi, type Translations } from './locales/vi';
import { en } from './locales/en';

export type Language = 'vi' | 'en';

export const translations: Record<Language, Translations> = {
  vi,
  en,
};

export type { Translations };

// Helper to resolve dot-notated paths safely e.g. "topNav.notifications"
export function getNestedTranslation(
  obj: Record<string, unknown>,
  path: string,
  params?: Record<string, string | number>
): string {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return path; // Fallback to key if not found
    }
  }

  if (typeof current !== 'string') {
    return path;
  }

  if (params) {
    return Object.entries(params).reduce((str, [key, val]) => {
      return str.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
    }, current);
  }

  return current;
}
