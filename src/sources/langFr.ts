import { cached, fetchJson } from './cache.ts';
import { pascal, slugify } from './slug.ts';

/**
 * Source n°4 : module Foundry « lang-fr » de Pathfinder-fr (interface du système pf2e en français).
 * Sert à traduire les termes de jeu : traits, langues, états.
 */
export const LANG_FR_URL =
  'https://raw.githubusercontent.com/pathfinder-fr/foundryvtt-pathfinder2e-lang-fr/master/module/lang/fr.json';

export type LangTable = Record<string, string>;

/** Aplatit { PF2E: { TraitAgile: "Agile" } } en { "PF2E.TraitAgile": "Agile" }. */
export function flattenLang(data: unknown, prefix = '', out: LangTable = {}): LangTable {
  if (!data || typeof data !== 'object') return out;
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    if (typeof v === 'string') out[`${prefix}${k}`] = v;
    else if (v && typeof v === 'object') flattenLang(v, `${prefix}${k}.`, out);
  }
  return out;
}

export function loadLangFr(): Promise<LangTable> {
  return cached('lang-fr', async () => flattenLang(await fetchJson(LANG_FR_URL)));
}

/** Trait Foundry (« deadly-d10 ») → « Mortel d10 », ou null. */
export function traitFr(table: LangTable, trait: string): string | null {
  return table[`PF2E.Trait${pascal(slugify(trait))}`] ?? null;
}

/** Nom anglais d'un terme (langue, trait, état) → traduction, ou null. */
export function termFr(table: LangTable, en: string): string | null {
  const key = pascal(slugify(en));
  if (!key) return null;
  return (
    table[`PF2E.Language${key}`] ??
    table[`PF2E.Trait${key}`] ??
    table[`PF2E.condition.${key.toLowerCase()}.name`] ??
    null
  );
}
