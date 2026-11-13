import { createContext, useContext } from 'react';
import type { DistanceUnit } from './rules/units.ts';

/** Comment afficher les noms de jeu (dons, objets, sorts…). */
export type NameDisplay = 'both' | 'fr' | 'en';

export interface Settings {
  distanceUnit: DistanceUnit;
  nameDisplay: NameDisplay;
  /** Adresse du fichier de traductions du groupe (source n°1), ou chaîne vide. */
  groupUrl: string;
}

export const DEFAULT_SETTINGS: Settings = {
  distanceUnit: 'ft',
  nameDisplay: 'both',
  groupUrl: '',
};

const KEY = 'pf2.settings';

/** Réglages propres à l'appareil. Les valeurs inconnues sont remplacées par les valeurs par défaut. */
export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const s = JSON.parse(raw) as Partial<Settings>;
    return {
      distanceUnit: s.distanceUnit === 'm' ? 'm' : 'ft',
      nameDisplay: s.nameDisplay === 'fr' || s.nameDisplay === 'en' ? s.nameDisplay : 'both',
      groupUrl: typeof s.groupUrl === 'string' ? s.groupUrl.trim() : '',
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Stockage indisponible : les réglages valent pour la session seulement.
  }
}

export const SettingsContext = createContext<Settings>(DEFAULT_SETTINGS);

export function useSettings(): Settings {
  return useContext(SettingsContext);
}
