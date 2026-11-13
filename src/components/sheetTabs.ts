import type { Character } from '../pathbuilder/model.ts';

export type TabKey = 'combat' | 'skills' | 'feats' | 'inventory' | 'spells' | 'identity';

export interface TabDef {
  key: TabKey;
  label: string;
}

/** Onglets de la fiche. L'onglet Sorts n'apparaît que pour un lanceur de sorts. */
export function sheetTabs(c: Character): TabDef[] {
  return [
    { key: 'combat', label: 'Combat' },
    { key: 'skills', label: 'Compétences' },
    { key: 'feats', label: 'Dons et capacités' },
    { key: 'inventory', label: 'Inventaire' },
    ...(c.spellCasters.length > 0 ? [{ key: 'spells' as const, label: 'Sorts' }] : []),
    { key: 'identity', label: 'Identité' },
  ];
}
