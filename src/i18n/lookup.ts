export type Dictionary = Record<string, string>;
export type Lookup = (en: string) => string | null;

/**
 * Crée une fonction de traduction à partir de dictionnaires anglais → français,
 * du plus prioritaire au moins prioritaire. Cherche d'abord le nom exact,
 * puis sans tenir compte de la casse. Renvoie null si rien n'est trouvé : jamais d'invention.
 */
export function createLookup(...dicts: Dictionary[]): Lookup {
  const exact = new Map<string, string>();
  const folded = new Map<string, string>();
  for (const dict of dicts) {
    for (const [en, fr] of Object.entries(dict)) {
      if (typeof fr !== 'string' || !fr.trim()) continue;
      if (!exact.has(en)) exact.set(en, fr);
      const key = en.toLowerCase();
      if (!folded.has(key)) folded.set(key, fr);
    }
  }
  return (en) => {
    const name = en.trim();
    return exact.get(name) ?? folded.get(name.toLowerCase()) ?? null;
  };
}
