/**
 * Recherche des informations détaillées (description, prérequis…) dans les données de Pathfinder-fr,
 * interrogées directement par le navigateur sur GitHub.
 * Chaque catégorie est un fichier JSON téléchargé au premier besoin, puis gardé en cache :
 * en mémoire pour la session, et dans le Cache Storage du navigateur pour le hors-ligne.
 */

export const PF2FR_BASE =
  'https://raw.githubusercontent.com/pathfinder-fr/foundryvtt-pathfinder2-fr/master/babele/fr/';

/** Nom du cache navigateur. Changer la version force un nouveau téléchargement. */
export const CACHE_NAME = 'pf2fr-details-v1';

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
  'feat' | 'special' | 'item' | 'spell' | 'heritage' | 'ancestry' | 'background' | 'class';

export const PACKS_BY_KIND: Record<DetailKind, Pack[]> = {
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

const memory = new Map<Pack, Promise<Map<string, DetailEntry>>>();

async function fetchPackJson(pack: Pack): Promise<unknown> {
  const url = `${PF2FR_BASE}pf2e.${pack}.json`;
  // Cache Storage : disponible en contexte sécurisé (https, localhost).
  const cache =
    typeof caches !== 'undefined' ? await caches.open(CACHE_NAME).catch(() => null) : null;
  const cached = await cache?.match(url);
  if (cached) return cached.json();

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  await cache?.put(url, res.clone()).catch(() => undefined);
  return res.json();
}

function loadPack(pack: Pack): Promise<Map<string, DetailEntry>> {
  let p = memory.get(pack);
  if (!p) {
    p = fetchPackJson(pack).then((data) => indexPack(pack, data));
    // En cas d'échec (hors-ligne…), on autorise un nouvel essai plus tard.
    p.catch(() => memory.delete(pack));
    memory.set(pack, p);
  }
  return p;
}

/**
 * Cherche le détail d'un élément par son nom anglais.
 * Renvoie null s'il n'existe dans aucune catégorie ; lève une erreur si le réseau échoue.
 */
export async function findDetail(kind: DetailKind, en: string): Promise<DetailEntry | null> {
  const key = en.trim().toLowerCase();
  for (const pack of PACKS_BY_KIND[kind]) {
    const index = await loadPack(pack);
    const hit = index.get(key);
    if (hit) return hit;
  }
  return null;
}

/** Vide le cache des descriptions (mémoire et navigateur). */
export async function clearDetailsCache(): Promise<void> {
  memory.clear();
  if (typeof caches !== 'undefined') await caches.delete(CACHE_NAME).catch(() => false);
}
