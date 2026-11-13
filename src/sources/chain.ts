/**
 * Chaîne des sources de traduction. Chaque source répond si elle connaît l'élément,
 * sinon on passe à la suivante :
 *   1. Fichier du groupe (URL, ex. Gist) + surcharge du dépôt (names.override.fr.json) : noms officiels BBE
 *   2. Pathfinder-fr, module Foundry « pf2-fr » : noms (embarqués) et descriptions (à la demande)
 *   3. Saisie locale dans l'appli
 *   4. Pathfinder-fr, module Foundry « lang-fr » : termes de jeu (langues, traits, états)
 *   5. Foundry pf2e, anglais officiel : description, niveau, traits, actions
 */
import names from '../i18n/names.fr.json';
import overrides from '../i18n/names.override.fr.json';
import { createLookup, type Dictionary, type Lookup } from '../i18n/lookup.ts';
import { findDetail, type DetailEntry, type DetailKind } from '../details/packs.ts';
import type { GroupData } from './groupFile.ts';
import { termFr, type LangTable } from './langFr.ts';
import { findFoundryItem, type FoundryItem } from './foundry.ts';

export type SourceId = 'group' | 'pf2fr' | 'local' | 'langfr' | 'foundry';

export const SOURCE_LABELS: Record<SourceId, string> = {
  group: 'Fichier du groupe',
  pf2fr: 'Pathfinder-fr (module Foundry pf2-fr)',
  local: 'Saisie locale',
  langfr: 'Pathfinder-fr (module Foundry lang-fr)',
  foundry: 'Foundry pf2e (anglais officiel)',
};

export interface NameSources {
  group: GroupData;
  local: Dictionary;
  lang: LangTable | null;
}

/** Fonction de traduction des noms, dans l'ordre de la chaîne. */
export function buildNameLookup({ group, local, lang }: NameSources): Lookup {
  const tiers = createLookup(group.names, overrides as Dictionary, names as Dictionary, local);
  return (en) => tiers(en) ?? (lang ? termFr(lang, en) : null);
}

/** Indique quelle source fournit le nom d'un élément. */
export function nameSource({ group, local, lang }: NameSources, en: string): SourceId | null {
  if (createLookup(group.names, overrides as Dictionary)(en)) return 'group';
  if (createLookup(names as Dictionary)(en)) return 'pf2fr';
  if (createLookup(local)(en)) return 'local';
  if (lang && termFr(lang, en)) return 'langfr';
  return null;
}

export interface ResolvedDetail {
  description: { html: string; source: SourceId; lang: 'fr' | 'en' } | null;
  prereq: { values: string[]; lang: 'fr' | 'en' } | null;
  /** Champs de sort (Pathfinder-fr). */
  spell: Pick<DetailEntry, 'range' | 'area' | 'target'> | null;
  /** Niveau, traits, actions (Foundry pf2e). */
  meta: FoundryItem | null;
  /** Sources qui n'ont pas pu être interrogées (réseau). */
  failed: SourceId[];
}

/** Interroge les sources pour le détail d'un élément (Pathfinder-fr et Foundry en parallèle). */
export async function resolveDetail(
  kind: DetailKind,
  en: string,
  group: GroupData,
): Promise<ResolvedDetail> {
  const [fr, foundry] = await Promise.allSettled([findDetail(kind, en), findFoundryItem(kind, en)]);
  const pf2fr = fr.status === 'fulfilled' ? fr.value : null;
  const meta = foundry.status === 'fulfilled' ? foundry.value : null;
  const failed: SourceId[] = [];
  if (fr.status === 'rejected') failed.push('pf2fr');
  if (foundry.status === 'rejected') failed.push('foundry');

  const groupDesc = group.descriptions[en.trim().toLowerCase()];
  const description = groupDesc
    ? { html: groupDesc, source: 'group' as const, lang: 'fr' as const }
    : pf2fr?.description
      ? { html: pf2fr.description, source: 'pf2fr' as const, lang: 'fr' as const }
      : meta?.description
        ? { html: meta.description, source: 'foundry' as const, lang: 'en' as const }
        : null;

  const prereq = pf2fr?.prereq.length
    ? { values: pf2fr.prereq, lang: 'fr' as const }
    : meta?.prereq.length
      ? { values: meta.prereq, lang: 'en' as const }
      : null;

  const spell =
    pf2fr && (pf2fr.range || pf2fr.area || pf2fr.target)
      ? { range: pf2fr.range, area: pf2fr.area, target: pf2fr.target }
      : null;

  return { description, prereq, spell, meta, failed };
}
