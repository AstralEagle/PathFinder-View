import type { Dictionary } from '../i18n/lookup.ts';

/** Traductions saisies dans l'appli (source n°3), propres à l'appareil. */
const KEY = 'pf2.localNames';

export function loadLocalNames(): Dictionary {
  try {
    const raw = localStorage.getItem(KEY);
    const data: unknown = raw ? JSON.parse(raw) : {};
    return data && typeof data === 'object' && !Array.isArray(data) ? (data as Dictionary) : {};
  } catch {
    return {};
  }
}

export function saveLocalNames(names: Dictionary): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(names));
  } catch {
    // ignoré
  }
}
