/**
 * Modèle normalisé d'un personnage, produit par le parseur à partir du JSON Pathbuilder.
 * Les noms de jeu restent en anglais (VO) : la traduction se fait à l'affichage.
 */

export const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;
export type AbilityKey = (typeof ABILITY_KEYS)[number];

/** Valeur de maîtrise Pathbuilder : 0 non qualifié, 2 qualifié, 4 expert, 6 maître, 8 légendaire. */
export type ProficiencyValue = 0 | 2 | 4 | 6 | 8;

export interface Feat {
  name: string;
  choice: string | null;
  /** Type Pathbuilder : "Class Feat", "Skill Feat", "Ancestry Feat", "General Feat", "Heritage", "Awarded Feat"… */
  type: string;
  level: number;
  /** Libellé de l'emplacement, ex. "Gunslinger Feat 4". */
  slot: string | null;
  parent: string | null;
}

export interface Lore {
  name: string;
  proficiency: ProficiencyValue;
}

export interface EquipmentItem {
  name: string;
  qty: number;
  /** Identifiant du contenant (clé de `containers`), ou null si porté directement. */
  containerId: string | null;
}

export interface Container {
  id: string;
  name: string;
  bagOfHolding: boolean;
}

export interface Weapon {
  name: string;
  /** Nom complet affiché par Pathbuilder, ex. "+1 Striking Arbalest". */
  display: string;
  qty: number;
  /** Catégorie de maîtrise : simple, martial, advanced, unarmed. */
  prof: string;
  /** Dé de dégâts, ex. "d10". */
  die: string;
  /** Rune de puissance (+1, +2, +3). */
  potency: number;
  /** Rune de frappe : "", "striking", "greaterStriking", "majorStriking". */
  striking: string;
  material: string | null;
  runes: string[];
  damageType: string;
  /** Bonus d'attaque total calculé par Pathbuilder. */
  attack: number | null;
  damageBonus: number;
  extraDamage: string[];
}

export interface Armor {
  name: string;
  display: string;
  qty: number;
  /** Catégorie : unarmored, light, medium, heavy. */
  prof: string;
  potency: number;
  /** Rune de résilience : "", "resilient", "greaterResilient", "majorResilient". */
  resilient: string;
  material: string | null;
  worn: boolean;
  runes: string[];
}

export interface Money {
  cp: number;
  sp: number;
  gp: number;
  pp: number;
}

export interface AcTotal {
  profBonus: number;
  abilityBonus: number;
  itemBonus: number;
  total: number;
  shieldBonus: number | null;
}

export interface SpecificProficiencies {
  trained: string[];
  expert: string[];
  master: string[];
  legendary: string[];
}

export interface Character {
  name: string;
  className: string;
  dualClass: string | null;
  level: number;
  ancestry: string;
  heritage: string | null;
  background: string | null;
  deity: string | null;
  age: string | null;
  gender: string | null;
  sizeName: string | null;
  keyAbility: AbilityKey | null;
  languages: string[];

  /** Scores de caractéristique (12, 18…), comme exportés par Pathbuilder. */
  abilities: Record<AbilityKey, number>;
  attributes: {
    ancestryHp: number;
    classHp: number;
    bonusHp: number;
    bonusHpPerLevel: number;
    speed: number;
    speedBonus: number;
  };
  /** Valeurs de maîtrise brutes (perception, fortitude, stealth, classDC…). */
  proficiencies: Record<string, ProficiencyValue>;
  specificProficiencies: SpecificProficiencies;

  feats: Feat[];
  specials: string[];
  lores: Lore[];

  equipment: EquipmentItem[];
  containers: Container[];
  weapons: Weapon[];
  armor: Armor[];
  money: Money;
  acTotal: AcTotal | null;

  /** Format à confirmer avec l'export d'un lanceur de sorts : conservé brut pour l'instant. */
  spellCasters: unknown[];
  focusPoints: number;
}
