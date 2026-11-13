import type { GameState } from './state.ts';

/** Une munition nommée (ex. un carreau baptisé par le joueur). */
export interface NamedAmmo {
  id: string;
  name: string;
  /** true = dans le carquois ; false = tirée, pas encore récupérée. */
  held: boolean;
  hits: number;
  misses: number;
  /** Note libre du joueur (histoire, effet, souvenir…). */
  note?: string;
}

function touch(s: GameState, namedAmmo: NamedAmmo[]): GameState {
  return { ...s, namedAmmo, updatedAt: new Date().toISOString() };
}

function newAmmoId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const list = (s: GameState): NamedAmmo[] => s.namedAmmo ?? [];

const update = (s: GameState, id: string, fn: (a: NamedAmmo) => NamedAmmo): GameState =>
  touch(
    s,
    list(s).map((a) => (a.id === id ? fn(a) : a)),
  );

export function setNamedAmmoEnabled(s: GameState, enabled: boolean): GameState {
  return { ...s, namedAmmoEnabled: enabled, updatedAt: new Date().toISOString() };
}

/** Ajoute des munitions ; chaque nom non vide en crée une (dans le carquois, compteurs à 0). */
export function addNamedAmmo(s: GameState, names: string[]): GameState {
  const added = names
    .map((n) => n.trim())
    .filter(Boolean)
    .map((name) => ({ id: newAmmoId(), name, held: true, hits: 0, misses: 0 }));
  return touch(s, [...list(s), ...added]);
}

/** Tir : la munition quitte le carquois et son compteur de touches ou de ratés augmente. */
export function fireNamedAmmo(s: GameState, id: string, hit: boolean): GameState {
  return update(s, id, (a) => ({
    ...a,
    held: false,
    hits: a.hits + (hit ? 1 : 0),
    misses: a.misses + (hit ? 0 : 1),
  }));
}

export function recoverNamedAmmo(s: GameState, id: string): GameState {
  return update(s, id, (a) => ({ ...a, held: true }));
}

export function recoverAllNamedAmmo(s: GameState): GameState {
  return touch(
    s,
    list(s).map((a) => ({ ...a, held: true })),
  );
}

export function renameNamedAmmo(s: GameState, id: string, name: string): GameState {
  const n = name.trim();
  return n ? update(s, id, (a) => ({ ...a, name: n })) : s;
}

export function setNamedAmmoNote(s: GameState, id: string, note: string): GameState {
  const n = note.trim();
  return update(s, id, (a) => {
    const next = { ...a };
    if (n) next.note = n;
    else delete next.note;
    return next;
  });
}

export function removeNamedAmmo(s: GameState, id: string): GameState {
  return touch(
    s,
    list(s).filter((a) => a.id !== id),
  );
}

/** Correction manuelle d'un compteur (jamais sous 0). */
export function adjustNamedAmmo(
  s: GameState,
  id: string,
  field: 'hits' | 'misses',
  delta: number,
): GameState {
  return update(s, id, (a) => ({ ...a, [field]: Math.max(0, a[field] + delta) }));
}

export function namedAmmoSummary(s: GameState) {
  const all = list(s);
  return {
    total: all.length,
    held: all.filter((a) => a.held).length,
    hits: all.reduce((n, a) => n + a.hits, 0),
    misses: all.reduce((n, a) => n + a.misses, 0),
  };
}
