import type { AbilityKey, Character, ProficiencyValue, Weapon } from '../pathbuilder/model.ts';
import { abilityModifier } from './abilities.ts';
import { proficiencyBonus, proficiencyRank, type ProficiencyRank } from './proficiency.ts';

export interface Check {
  total: number;
  ability: AbilityKey;
  proficiency: ProficiencyValue;
  rank: ProficiencyRank;
}

export const SKILLS = [
  { key: 'acrobatics', ability: 'dex' },
  { key: 'arcana', ability: 'int' },
  { key: 'athletics', ability: 'str' },
  { key: 'crafting', ability: 'int' },
  { key: 'deception', ability: 'cha' },
  { key: 'diplomacy', ability: 'cha' },
  { key: 'intimidation', ability: 'cha' },
  { key: 'medicine', ability: 'wis' },
  { key: 'nature', ability: 'wis' },
  { key: 'occultism', ability: 'int' },
  { key: 'performance', ability: 'cha' },
  { key: 'religion', ability: 'wis' },
  { key: 'society', ability: 'int' },
  { key: 'stealth', ability: 'dex' },
  { key: 'survival', ability: 'wis' },
  { key: 'thievery', ability: 'dex' },
] as const satisfies readonly { key: string; ability: AbilityKey }[];

export type SkillKey = (typeof SKILLS)[number]['key'];

export const SAVES = [
  { key: 'fortitude', ability: 'con' },
  { key: 'reflex', ability: 'dex' },
  { key: 'will', ability: 'wis' },
] as const satisfies readonly { key: string; ability: AbilityKey }[];

export type SaveKey = (typeof SAVES)[number]['key'];

export function mod(c: Character, ability: AbilityKey): number {
  return abilityModifier(c.abilities[ability]);
}

function prof(c: Character, key: string): ProficiencyValue {
  return c.proficiencies[key] ?? 0;
}

function check(c: Character, ability: AbilityKey, value: ProficiencyValue, other = 0): Check {
  return {
    total: mod(c, ability) + proficiencyBonus(value, c.level) + other,
    ability,
    proficiency: value,
    rank: proficiencyRank(value),
  };
}

/** Détail d'un test : modificateur de caractéristique, maîtrise (valeur + niveau), autres. */
export interface CheckBreakdown {
  abilityMod: number;
  /** Valeur de rang (0, 2, 4, 6, 8). */
  rankValue: ProficiencyValue;
  /** Niveau ajouté (0 si non qualifié). */
  levelBonus: number;
  proficiencyBonus: number;
  /** Malus d'armure et autres ajustements. */
  other: number;
  total: number;
}

export function checkBreakdown(c: Character, check: Check): CheckBreakdown {
  const abilityMod = mod(c, check.ability);
  const prof = proficiencyBonus(check.proficiency, c.level);
  return {
    abilityMod,
    rankValue: check.proficiency,
    levelBonus: check.proficiency === 0 ? 0 : c.level,
    proficiencyBonus: prof,
    other: check.total - abilityMod - prof,
    total: check.total,
  };
}

export function maxHp(c: Character): number {
  const a = c.attributes;
  return a.ancestryHp + (a.classHp + mod(c, 'con') + a.bonusHpPerLevel) * c.level + a.bonusHp;
}

export function speed(c: Character): number {
  return c.attributes.speed + c.attributes.speedBonus;
}

/** Armure portée (la première marquée `worn`), ou null. */
export function wornArmor(c: Character) {
  return c.armor.find((a) => a.worn) ?? null;
}

/**
 * Classe d'armure. Utilise le total calculé par Pathbuilder quand il existe ;
 * sinon recalcule 10 + Dex (plafonnée si `dexCap` est fourni) + maîtrise + bonus d'objet.
 */
export function armorClass(c: Character, fallback: { itemBonus?: number; dexCap?: number } = {}) {
  if (c.acTotal) return c.acTotal.total;
  const armor = wornArmor(c);
  const category = armor?.prof || 'unarmored';
  const dex = mod(c, 'dex');
  const cappedDex = fallback.dexCap === undefined ? dex : Math.min(dex, fallback.dexCap);
  return (
    10 +
    cappedDex +
    proficiencyBonus(prof(c, category), c.level) +
    (fallback.itemBonus ?? 0) +
    (armor?.potency ?? 0)
  );
}

export function perception(c: Character): Check {
  return check(c, 'wis', prof(c, 'perception'));
}

export function save(c: Character, key: SaveKey): Check {
  const def = SAVES.find((s) => s.key === key)!;
  return check(c, def.ability, prof(c, key));
}

/**
 * Compétence. `armorPenalty` (valeur négative ou 0) s'applique aux compétences de Force et de Dextérité.
 * Pathbuilder n'exporte pas le malus d'armure : il faut le fournir à part.
 */
export function skill(c: Character, key: SkillKey, armorPenalty = 0): Check {
  const def = SKILLS.find((s) => s.key === key)!;
  const penalty = def.ability === 'str' || def.ability === 'dex' ? armorPenalty : 0;
  return check(c, def.ability, prof(c, key), penalty);
}

export function lore(c: Character, name: string): Check | null {
  const l = c.lores.find((x) => x.name === name);
  return l ? check(c, 'int', l.proficiency) : null;
}

export function classDC(c: Character): number | null {
  if (!c.keyAbility) return null;
  return 10 + mod(c, c.keyAbility) + proficiencyBonus(prof(c, 'classDC'), c.level);
}

const STRIKING_DICE: Record<string, number> = {
  striking: 2,
  greaterstriking: 3,
  majorstriking: 4,
};

export interface Attack {
  weapon: Weapon;
  attack: number | null;
  diceCount: number;
  die: string;
  damageBonus: number;
  damageType: string;
  extra: string[];
}

export function weaponAttack(w: Weapon): Attack {
  return {
    weapon: w,
    attack: w.attack,
    diceCount: STRIKING_DICE[w.striking.toLowerCase()] ?? 1,
    die: w.die,
    damageBonus: w.damageBonus,
    damageType: w.damageType,
    extra: w.extraDamage,
  };
}

/**
 * Bonus des 1re, 2e et 3e attaques du tour (pénalité d'attaques multiples) :
 * −5 / −10, ou −4 / −8 pour une arme agile.
 */
export function multipleAttackBonuses(attack: number, agile: boolean): [number, number, number] {
  const step = agile ? 4 : 5;
  return [attack, attack - step, attack - 2 * step];
}

/** Formule de dégâts lisible, ex. « 2d10+2 P ». */
export function damageFormula(a: Attack): string {
  const bonus =
    a.damageBonus === 0 ? '' : a.damageBonus > 0 ? `+${a.damageBonus}` : `${a.damageBonus}`;
  return `${a.diceCount}${a.die}${bonus} ${a.damageType}`.trim();
}
