/**
 * Cache des données téléchargées : en mémoire pour la session,
 * et dans le Cache Storage du navigateur pour le hors-ligne (contexte sécurisé : https, localhost).
 */
export const CACHE_NAME = 'pf2-sources-v1';
const CACHE_ORIGIN = 'https://cache.local/';

const memory = new Map<string, Promise<unknown>>();

async function openCache(): Promise<Cache | null> {
  if (typeof caches === 'undefined') return null;
  return caches.open(CACHE_NAME).catch(() => null);
}

/**
 * Renvoie la donnée associée à `key`, en la calculant avec `loader` si elle n'est pas en cache.
 * Un échec (hors-ligne…) n'est pas mis en cache : un nouvel essai reste possible.
 */
export function cached<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const hit = memory.get(key);
  if (hit) return hit as Promise<T>;

  const p = (async () => {
    const cache = await openCache();
    const url = CACHE_ORIGIN + encodeURIComponent(key);
    const stored = await cache?.match(url);
    if (stored) return (await stored.json()) as T;

    const data = await loader();
    await cache
      ?.put(
        url,
        new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } }),
      )
      .catch(() => undefined);
    return data;
  })();

  memory.set(key, p);
  p.catch(() => memory.delete(key));
  return p;
}

export async function fetchJson(url: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`HTTP ${res.status} : ${url}`);
  return res.json();
}

/** Vide tout le cache des sources (mémoire et navigateur). */
export async function clearSourcesCache(): Promise<void> {
  memory.clear();
  if (typeof caches !== 'undefined') await caches.delete(CACHE_NAME).catch(() => false);
}
