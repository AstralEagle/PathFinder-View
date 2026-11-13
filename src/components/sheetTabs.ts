import type { Character } from '../pathbuilder/model.ts';
import type { GameState } from '../game/state.ts';

export type TabKey =
  'combat' | 'actions' | 'skills' | 'feats' | 'inventory' | 'ammo' | 'spells' | 'identity';

export interface TabDef {
  key: TabKey;
  label: string;
}

/**
 * Onglets de la fiche. L'onglet Sorts n'apparaît que pour un lanceur de sorts,
 * l'onglet Munitions nommées seulement s'il est activé dans les Paramètres.
 */
export function sheetTabs(c: Character, state?: GameState): TabDef[] {
  return [
    { key: 'combat', label: 'Combat' },
    { key: 'actions', label: 'Actions' },
    { key: 'skills', label: 'Compétences' },
    { key: 'feats', label: 'Dons et capacités' },
    { key: 'inventory', label: 'Inventaire' },
    ...(state?.namedAmmoEnabled ? [{ key: 'ammo' as const, label: 'Munitions nommées' }] : []),
    ...(c.spellCasters.length > 0 ? [{ key: 'spells' as const, label: 'Sorts' }] : []),
    { key: 'identity', label: 'Identité' },
  ];
}
