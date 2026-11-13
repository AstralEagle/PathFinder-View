import { addCharacter, emptyStore, STORE_VERSION, type Store } from './game/roster.ts';
import { parsePathbuilderText } from './pathbuilder/parse.ts';

/** Sauvegarde locale à l'appareil (localStorage). */
const KEY = 'pf2.store';
/** Ancienne clé du jalon 3 (un seul personnage) : migrée au premier chargement. */
const LEGACY_KEY = 'pf2.lastCharacter';

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function isStore(v: unknown): v is Store {
  return (
    typeof v === 'object' &&
    v !== null &&
    (v as Store).version === STORE_VERSION &&
    Array.isArray((v as Store).characters)
  );
}

export function loadStore(): Store {
  const raw = read(KEY);
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isStore(parsed)) return parsed;
    } catch {
      // Données illisibles : on repart d'une liste vide plutôt que de planter.
    }
  }

  const legacy = read(LEGACY_KEY);
  if (legacy) {
    const r = parsePathbuilderText(legacy);
    if (r.ok) return addCharacter(emptyStore(), r.character, legacy).store;
  }
  return emptyStore();
}

export function saveStore(store: Store): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    // Stockage indisponible (navigation privée, quota…) : l'appli continue sans sauvegarde.
  }
}
