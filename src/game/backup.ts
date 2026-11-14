/**
 * Sauvegarde : un fichier au format de l'export Pathbuilder ({ success, build }),
 * enrichi d'un bloc « pf2Viewer » qui contient tout ce que l'appli a ajouté
 * (état de jeu, munitions nommées, traductions saisies localement).
 * Un fichier peut contenir un personnage (objet) ou plusieurs (tableau).
 * Un export Pathbuilder ordinaire reste importable : il n'a simplement pas de bloc « pf2Viewer ».
 */
import type { Character } from '../pathbuilder/model.ts';
import { parsePathbuilder } from '../pathbuilder/parse.ts';
import type { Dictionary } from '../i18n/lookup.ts';
import type { StoredCharacter, Store } from './roster.ts';
import { initialGameState, reconcile, type GameState } from './state.ts';
import type { NamedAmmo } from './namedAmmo.ts';

export const EXT_KEY = 'pf2Viewer';
export const BACKUP_VERSION = 1;

export interface ViewerExtension {
  app: 'Fiche PF2';
  version: number;
  exportedAt: string;
  state: GameState;
  localNames: Dictionary;
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;

// --- Export ---

export function exportCharacterData(sc: StoredCharacter, localNames: Dictionary): Obj {
  const build = JSON.parse(sc.raw) as Obj;
  const ext: ViewerExtension = {
    app: 'Fiche PF2',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    state: sc.state,
    localNames,
  };
  return { ...build, [EXT_KEY]: ext };
}

export function exportAllData(store: Store, localNames: Dictionary): Obj[] {
  return store.characters.map((sc) => exportCharacterData(sc, localNames));
}

/** « Flacon "Oeil de Taupe" » → « flacon-oeil-de-taupe.json ». */
export function backupFileName(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug || 'personnage'}.json`;
}

// --- Import ---

function restoreAmmo(v: unknown): NamedAmmo[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((a) => {
    if (!isObj(a) || typeof a.name !== 'string' || !a.name.trim()) return [];
    const ammo: NamedAmmo = {
      id:
        typeof a.id === 'string' && a.id
          ? a.id
          : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      name: a.name.trim(),
      held: a.held !== false,
      hits: Math.max(0, Math.trunc(num(a.hits, 0))),
      misses: Math.max(0, Math.trunc(num(a.misses, 0))),
    };
    if (typeof a.note === 'string' && a.note.trim()) ammo.note = a.note.trim();
    return [ammo];
  });
}

function numberRecord(v: unknown): Record<string, number> | null {
  if (!isObj(v)) return null;
  const out: Record<string, number> = {};
  for (const [k, x] of Object.entries(v)) {
    if (typeof x === 'number' && Number.isFinite(x)) out[k] = Math.max(0, Math.trunc(x));
  }
  return out;
}

/** Relit un état de jeu de façon défensive, puis le recadre sur le build (PV max, consommables…). */
export function restoreState(data: unknown, c: Character): GameState | null {
  if (!isObj(data)) return null;
  const base = initialGameState(c);
  const hp = isObj(data.hp) ? data.hp : {};
  const state: GameState = {
    hp: { current: num(hp.current, base.hp.current), temp: num(hp.temp, 0) },
    heroPoints: num(data.heroPoints, base.heroPoints),
    consumables: { ...base.consumables, ...(numberRecord(data.consumables) ?? {}) },
    spellSlotsUsed: (numberRecord(data.spellSlotsUsed) ?? {}) as Record<number, number>,
    focusPointsUsed: Math.max(0, num(data.focusPointsUsed, 0)),
    namedAmmoEnabled: data.namedAmmoEnabled === true,
    namedAmmo: restoreAmmo(data.namedAmmo),
    updatedAt: base.updatedAt,
  };
  return reconcile(state, c);
}

export interface ImportEntry {
  character: Character;
  /** Export Pathbuilder d'origine, sans le bloc « pf2Viewer ». */
  raw: string;
  /** État de jeu sauvegardé, ou null pour un export Pathbuilder ordinaire. */
  state: GameState | null;
}

export type ImportResult =
  { ok: true; entries: ImportEntry[]; localNames: Dictionary } | { ok: false; error: string };

export function parseImportText(text: string): ImportResult {
  if (!text.trim()) {
    return { ok: false, error: 'Le texte est vide : collez l’export JSON de Pathbuilder.' };
  }
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return {
      ok: false,
      error: 'Ce texte n’est pas du JSON valide. Vérifiez que vous avez copié tout le fichier.',
    };
  }

  const items = Array.isArray(data) ? data : [data];
  if (items.length === 0) return { ok: false, error: 'Le fichier ne contient aucun personnage.' };

  const entries: ImportEntry[] = [];
  const localNames: Dictionary = {};
  for (const [i, item] of items.entries()) {
    const where = items.length > 1 ? `Personnage n° ${i + 1} : ` : '';
    if (!isObj(item)) return { ok: false, error: `${where}ce n’est pas un objet JSON.` };

    const { [EXT_KEY]: ext, ...build } = item;
    const r = parsePathbuilder(build);
    if (!r.ok) return { ok: false, error: `${where}${r.error}` };

    let state: GameState | null = null;
    if (isObj(ext)) {
      state = restoreState(ext.state, r.character);
      if (isObj(ext.localNames)) {
        for (const [en, fr] of Object.entries(ext.localNames)) {
          if (typeof fr === 'string' && fr.trim()) localNames[en] = fr.trim();
        }
      }
    }
    entries.push({ character: r.character, raw: JSON.stringify(build), state });
  }
  return { ok: true, entries, localNames };
}
