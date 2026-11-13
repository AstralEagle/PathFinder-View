/**
 * Source n°2 : module Foundry « pf2-fr » de Pathfinder-fr (fichiers Babele sur GitHub).
 * Chaque catégorie est un fichier JSON téléchargé au premier besoin, puis gardé en cache.
 */
import { cached, fetchJson } from '../sources/cache.ts';

export const PF2FR_BASE =
  'https://raw.githubusercontent.com/pathfinder-fr/foundryvtt-pathfinder2-fr/master/babele/fr/';

export type Pack =
  | 'feats-srd'
  | 'classfeatures'
  | 'ancestryfeatures'
  | 'heritages'
  | 'ancestries'
  | 'backgrounds'
  | 'classes'
  | 'equipment-srd'
  | 'spells-srd'
  | 'actionspf2e';

/** Type d'élément affiché dans la fiche : détermine les catégories à interroger, dans l'ordre. */
export type DetailKind =
  | 'feat'
  | 'special'
  | 'action'
  | 'item'
  | 'spell'
  | 'heritage'
  | 'ancestry'
  | 'background'
  | 'class';

export const PACKS_BY_KIND: Record<DetailKind, Pack[]> = {
  action: ['actionspf2e'],
  feat: ['feats-srd', 'heritages', 'classfeatures', 'ancestryfeatures', 'actionspf2e'],
  special: ['classfeatures', 'ancestryfeatures', 'heritages', 'feats-srd', 'actionspf2e'],
  item: ['equipment-srd'],
  spell: ['spells-srd'],
  heritage: ['heritages'],
  ancestry: ['ancestries'],
  background: ['backgrounds'],
  class: ['classes'],
};

export interface DetailEntry {
  /** Nom anglais (clé). */
  id: string;
  /** Nom français. */
  name: string;
  /** Description HTML brute (balises Foundry non nettoyées). */
  description: string;
  prereq: string[];
  /** Champs propres aux sorts. */
  range?: string;
  target?: string;
  area?: string;
  pack: Pack;
}

type RawEntry = Record<string, unknown>;

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

/** Convertit le JSON Babele d'une catégorie en index nom anglais (minuscules) → entrée. */
export function indexPack(pack: Pack, data: unknown): Map<string, DetailEntry> {
  const index = new Map<string, DetailEntry>();
  const entries = (data as { entries?: unknown })?.entries;
  const list: RawEntry[] = Array.isArray(entries)
    ? (entries as RawEntry[])
    : entries && typeof entries === 'object'
      ? Object.entries(entries as Record<string, RawEntry>).map(([id, e]) => ({ id, ...e }))
      : [];

  for (const e of list) {
    const id = str(e.id);
    if (!id) continue;
    const prereq = Array.isArray(e.prereq)
      ? e.prereq.map((p) => str((p as RawEntry)?.value)).filter((p): p is string => !!p)
      : [];
    index.set(id.toLowerCase(), {
      id,
      name: str(e.name) ?? id,
      description: str(e.description) ?? '',
      prereq,
      range: str(e.range),
      target: str(e.target),
      area: str(e.areasize),
      pack,
    });
  }
  return index;
}

/** Index d'une catégorie, téléchargé une fois puis gardé en cache (mémoire + navigateur). */
function loadPack(pack: Pack): Promise<Record<string, DetailEntry>> {
  return cached(`pf2fr:${pack}`, async () =>
    Object.fromEntries(indexPack(pack, await fetchJson(`${PF2FR_BASE}pf2e.${pack}.json`))),
  );
}

/**
 * Cherche le détail d'un élément par son nom anglais.
 * Renvoie null s'il n'existe dans aucune catégorie ; lève une erreur si le réseau échoue.
 */
export async function findDetail(kind: DetailKind, en: string): Promise<DetailEntry | null> {
  const key = en.trim().toLowerCase();
  for (const pack of PACKS_BY_KIND[kind]) {
    const hit = (await loadPack(pack))[key];
    if (hit) return hit;
  }
  return null;
}
