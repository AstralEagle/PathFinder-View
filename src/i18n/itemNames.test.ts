import { describe, expect, it } from 'vitest';
import flacon from '../../fixtures/flacon.json';
import { parsePathbuilder } from '../pathbuilder/parse.ts';
import { armorName, weaponName } from './itemNames.ts';
import { createLookup } from './lookup.ts';
import { trName } from './names.ts';

const r = parsePathbuilder(flacon);
if (!r.ok) throw new Error(r.error);
const c = r.character;

describe('weaponName', () => {
  it('Arbalète lourde +1 de frappe', () => {
    expect(weaponName(c.weapons[0]!, trName)).toEqual({
      en: '+1 Striking Arbalest',
      fr: 'Arbalète lourde +1 de frappe',
    });
  });

  it('se replie en VO si le nom de base manque', () => {
    expect(weaponName(c.weapons[0]!, createLookup({}))).toEqual({
      en: '+1 Striking Arbalest',
      fr: null,
    });
  });

  it('se replie en VO si une rune de propriété manque', () => {
    const w = { ...c.weapons[0]!, runes: ['Unknown Rune'] };
    expect(weaponName(w, trName).fr).toBeNull();
  });
});

describe('armorName', () => {
  it('Armure de cuir', () => {
    expect(armorName(c.armor[0]!, trName)).toEqual({ en: 'Leather', fr: 'Armure de cuir' });
  });
});
