import type { Character } from '../pathbuilder/model.ts';
import type { DetailKind } from '../details/packs.ts';
import type { FoundryItem } from '../sources/foundry.ts';

/** Catégories affichées dans l'onglet Actions. */
export type ActionGroup = 'action' | 'activity' | 'free' | 'reaction';

export const ACTION_GROUPS: { key: ActionGroup; label: string }[] = [
  { key: 'action', label: 'Actions' },
  { key: 'activity', label: 'Activités' },
  { key: 'free', label: 'Actions gratuites' },
  { key: 'reaction', label: 'Réactions' },
];

/**
 * Actions de base que tout personnage possède (règles Remaster, noms anglais Foundry).
 * Celles absentes des données Foundry sont simplement ignorées.
 */
export const BASIC_ACTIONS = [
  'Aid',
  'Crawl',
  'Delay',
  'Drop Prone',
  'Escape',
  'Interact',
  'Leap',
  'Ready',
  'Release',
  'Seek',
  'Sense Motive',
  'Stand',
  'Step',
  'Stride',
  'Strike',
  'Take Cover',
];

export interface ActionCandidate {
  kind: DetailKind;
  en: string;
  /** Origine affichée : don, capacité, action de base. */
  origin: 'feat' | 'special' | 'basic';
}

/** Dons et capacités du personnage susceptibles d'être des actions (sans doublon). */
export function characterActionCandidates(c: Character): ActionCandidate[] {
  const seen = new Set<string>();
  const out: ActionCandidate[] = [];
  const add = (cand: ActionCandidate) => {
    const key = cand.en.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(cand);
  };
  c.feats.forEach((f) => add({ kind: 'feat', en: f.name, origin: 'feat' }));
  c.specials.forEach((s) => add({ kind: 'special', en: s, origin: 'special' }));
  return out;
}

export function basicActionCandidates(): ActionCandidate[] {
  return BASIC_ACTIONS.map((en) => ({ kind: 'action', en, origin: 'basic' }));
}

/**
 * Classe un élément Foundry :
 * - réaction, action gratuite : selon le type d'action ;
 * - 1 action : action ; 2 ou 3 actions : activité ;
 * - passif d'exploration ou d'intermède : activité (dure plus longtemps qu'un tour) ;
 * - autre passif : pas une action (null).
 */
export function classifyAction(item: FoundryItem): ActionGroup | null {
  switch (item.actionType) {
    case 'reaction':
      return 'reaction';
    case 'free':
      return 'free';
    case 'action':
      return item.actions !== null && item.actions >= 2 ? 'activity' : 'action';
    case 'passive':
      return item.traits.includes('exploration') || item.traits.includes('downtime')
        ? 'activity'
        : null;
    default:
      return null;
  }
}

/** Symbole du coût en actions : ◆, ◆◆, ◆◆◆, ◇ (gratuite), ⟲ (réaction). */
export function actionGlyph(item: FoundryItem): string {
  switch (item.actionType) {
    case 'reaction':
      return '⟲';
    case 'free':
      return '◇';
    case 'action':
      return '◆'.repeat(Math.min(3, Math.max(1, item.actions ?? 1)));
    default:
      return '';
  }
}
