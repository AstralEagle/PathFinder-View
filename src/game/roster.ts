import type { Character } from '../pathbuilder/model.ts';
import { parsePathbuilderText } from '../pathbuilder/parse.ts';
import { initialGameState, reconcile, type GameState } from './state.ts';

/** Un personnage enregistré sur l'appareil : le JSON Pathbuilder brut et son état de jeu. */
export interface StoredCharacter {
  id: string;
  /** Nom du personnage, recopié pour l'affichage de la liste. */
  name: string;
  raw: string;
  importedAt: string;
  state: GameState;
}

export const STORE_VERSION = 1;

export interface Store {
  version: typeof STORE_VERSION;
  characters: StoredCharacter[];
}

export function emptyStore(): Store {
  return { version: STORE_VERSION, characters: [] };
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Repli (contexte non sécurisé, ex. http sur le réseau local).
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Normalise un nom pour reconnaître un personnage au ré-import. */
function sameName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function findByName(store: Store, name: string): StoredCharacter | undefined {
  return store.characters.find((sc) => sameName(sc.name, name));
}

/** Ajoute un nouveau personnage. */
export function addCharacter(
  store: Store,
  character: Character,
  raw: string,
): { store: Store; id: string } {
  const id = newId();
  const entry: StoredCharacter = {
    id,
    name: character.name,
    raw,
    importedAt: new Date().toISOString(),
    state: initialGameState(character),
  };
  return { store: { ...store, characters: [...store.characters, entry] }, id };
}

/** Remplace le build d'un personnage existant en conservant (et recadrant) son état de jeu. */
export function updateBuild(store: Store, id: string, character: Character, raw: string): Store {
  return {
    ...store,
    characters: store.characters.map((sc) =>
      sc.id === id
        ? {
            ...sc,
            name: character.name,
            raw,
            importedAt: new Date().toISOString(),
            state: reconcile(sc.state, character),
          }
        : sc,
    ),
  };
}

export function updateState(store: Store, id: string, state: GameState): Store {
  return {
    ...store,
    characters: store.characters.map((sc) => (sc.id === id ? { ...sc, state } : sc)),
  };
}

export function removeCharacter(store: Store, id: string): Store {
  return { ...store, characters: store.characters.filter((sc) => sc.id !== id) };
}

/** Relit le build d'un personnage enregistré. */
export function loadCharacter(sc: StoredCharacter): Character | null {
  const r = parsePathbuilderText(sc.raw);
  return r.ok ? r.character : null;
}
