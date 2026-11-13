import { describe, expect, it } from 'vitest';
import flacon from '../../fixtures/flacon.json';
import { parsePathbuilder } from '../pathbuilder/parse.ts';
import {
  armorClass,
  classDC,
  damageFormula,
  lore,
  maxHp,
  perception,
  save,
  skill,
  speed,
  weaponAttack,
} from './character.ts';
import { proficiencyBonus } from './proficiency.ts';

const parsed = parsePathbuilder(flacon);
if (!parsed.ok) throw new Error(parsed.error);
const c = parsed.character;

describe('proficiencyBonus', () => {
  it('ne compte pas le niveau si non qualifié', () => {
    expect(proficiencyBonus(0, 4)).toBe(0);
  });
  it('ajoute le niveau sinon', () => {
    expect(proficiencyBonus(2, 4)).toBe(6);
    expect(proficiencyBonus(8, 20)).toBe(28);
  });
});

/**
 * Valeurs attendues calculées à partir de fixtures/flacon.json
 * (For 14, Dex 18, Con 14, Int 10, Sag 8, Cha 14, niveau 4).
 */
describe('Flacon, niveau 4', () => {
  it('PV max', () => expect(maxHp(c)).toBe(46));
  it('CA', () => expect(armorClass(c)).toBe(21));
  it('Vitesse', () => expect(speed(c)).toBe(30));
  it('DD de classe', () => expect(classDC(c)).toBe(20));

  it('Perception', () => expect(perception(c).total).toBe(7));

  it('Sauvegardes', () => {
    expect(save(c, 'fortitude').total).toBe(10);
    expect(save(c, 'reflex').total).toBe(12);
    expect(save(c, 'will').total).toBe(7);
  });

  it('Compétences', () => {
    expect(skill(c, 'stealth')).toMatchObject({ total: 12, rank: 'expert' });
    expect(skill(c, 'acrobatics').total).toBe(10);
    expect(skill(c, 'thievery').total).toBe(10);
    expect(skill(c, 'athletics').total).toBe(8);
    expect(skill(c, 'survival').total).toBe(5);
    expect(skill(c, 'nature')).toMatchObject({ total: -1, rank: 'untrained' });
    expect(skill(c, 'diplomacy').total).toBe(2);
  });

  it('Connaissance (Tannage)', () => expect(lore(c, 'Tanning')?.total).toBe(6));

  it('Arbalète lourde +1 de frappe', () => {
    const a = weaponAttack(c.weapons[0]!);
    expect(a.attack).toBe(13);
    expect(damageFormula(a)).toBe('2d10 P');
    expect(a.extra).toEqual(['+2 precision']);
  });

  it('Dague', () => {
    const a = weaponAttack(c.weapons[1]!);
    expect(a.attack).toBe(10);
    expect(damageFormula(a)).toBe('1d4+2 P');
  });
});

describe('Malus d’armure', () => {
  it('s’applique seulement aux compétences de For et Dex', () => {
    expect(skill(c, 'stealth', -1).total).toBe(11);
    expect(skill(c, 'athletics', -1).total).toBe(7);
    expect(skill(c, 'survival', -1).total).toBe(5);
  });
});

describe('CA recalculée sans acTotal', () => {
  it('10 + Dex plafonnée + maîtrise + objet', () => {
    const sans = { ...c, acTotal: null };
    expect(armorClass(sans, { itemBonus: 1, dexCap: 4 })).toBe(21);
    expect(armorClass(sans, { itemBonus: 1, dexCap: 3 })).toBe(20);
  });
});
