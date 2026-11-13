import type { ProficiencyValue } from '../pathbuilder/model.ts';

export type ProficiencyRank = 'untrained' | 'trained' | 'expert' | 'master' | 'legendary';

const RANKS: Record<ProficiencyValue, ProficiencyRank> = {
  0: 'untrained',
  2: 'trained',
  4: 'expert',
  6: 'master',
  8: 'legendary',
};

export function proficiencyRank(value: ProficiencyValue): ProficiencyRank {
  return RANKS[value];
}

/** Bonus de maîtrise : 0 si non qualifié (sans le niveau), sinon valeur + niveau. */
export function proficiencyBonus(value: ProficiencyValue, level: number): number {
  return value === 0 ? 0 : value + level;
}
