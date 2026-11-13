import type { Dictionary } from '../i18n/lookup.ts';
import { fetchJson } from './cache.ts';

/**
 * Fichier de traductions du groupe (source n°1), hébergé par exemple sur un Gist GitHub.
 * Format : un objet dont chaque clé est le nom anglais, et la valeur
 *   - soit le nom français : "Cat Fall": "Chute féline"
 *   - soit un objet : "Arbalest": { "name": "Arbalète lourde", "description": "<p>…</p>" }
 * Les clés commençant par « _ » sont ignorées (commentaires).
 */
export interface GroupData {
  names: Dictionary;
  descriptions: Record<string, string>;
}

export const EMPTY_GROUP: GroupData = { names: {}, descriptions: {} };

export function parseGroupFile(data: unknown): GroupData {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(
      'Le fichier du groupe doit être un objet JSON { "Nom anglais": "Nom français" }.',
    );
  }
  const names: Dictionary = {};
  const descriptions: Record<string, string> = {};
  for (const [en, v] of Object.entries(data as Record<string, unknown>)) {
    if (en.startsWith('_')) continue;
    if (typeof v === 'string' && v.trim()) {
      names[en] = v.trim();
    } else if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>;
      if (typeof o.name === 'string' && o.name.trim()) names[en] = o.name.trim();
      if (typeof o.description === 'string' && o.description.trim()) {
        descriptions[en.toLowerCase()] = o.description.trim();
      }
    }
  }
  return { names, descriptions };
}

/** Accepte aussi l'adresse d'une page Gist et la convertit en adresse « raw ». */
export function normalizeGroupUrl(url: string): string {
  const u = url.trim();
  const gist = /^https:\/\/gist\.github\.com\/([^/]+)\/([0-9a-f]+)\/?$/i.exec(u);
  return gist ? `https://gist.githubusercontent.com/${gist[1]}/${gist[2]}/raw` : u;
}

export async function fetchGroupFile(url: string): Promise<GroupData> {
  // Pas de cache HTTP : on veut la dernière version du fichier partagé.
  return parseGroupFile(await fetchJson(normalizeGroupUrl(url), { cache: 'no-store' }));
}

// --- Copie locale du fichier du groupe (pour le hors-ligne) ---

const KEY = 'pf2.groupFile';

export interface StoredGroup {
  url: string;
  fetchedAt: string;
  data: GroupData;
}

export function loadStoredGroup(): StoredGroup | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredGroup) : null;
  } catch {
    return null;
  }
}

export function saveStoredGroup(g: StoredGroup | null): void {
  try {
    if (g) localStorage.setItem(KEY, JSON.stringify(g));
    else localStorage.removeItem(KEY);
  } catch {
    // ignoré
  }
}
