import { describe, expect, it } from 'vitest';
import flacon from '../../fixtures/flacon.json';
import { parsePathbuilder, parsePathbuilderText } from './parse.ts';

describe('parsePathbuilder : Flacon', () => {
  const result = parsePathbuilder(flacon);
  if (!result.ok) throw new Error(result.error);
  const c = result.character;

  it('lit l’identité', () => {
    expect(c.name).toBe('Flacon "Oeil de Taupe"');
    expect(c.className).toBe('Gunslinger');
    expect(c.level).toBe(4);
    expect(c.ancestry).toBe('Goblin');
    expect(c.heritage).toBe('Tailed Goblin');
    expect(c.background).toBe('Hunter');
    expect(c.keyAbility).toBe('dex');
    expect(c.gender).toBe('Masculin');
    expect(c.age).toBe('17');
    expect(c.languages).toEqual(['Common', 'Goblin', 'Orcish']);
  });

  it('traite « Not set » comme vide', () => {
    expect(c.deity).toBeNull();
    expect(c.dualClass).toBeNull();
  });

  it('lit les dons, capacités et connaissances', () => {
    expect(c.feats).toHaveLength(10);
    expect(c.feats[0]).toEqual({
      name: 'Survey Wildlife',
      choice: null,
      type: 'Awarded Feat',
      level: 1,
      slot: null,
      parent: null,
    });
    expect(c.feats.find((f) => f.name === 'Running Reload')?.slot).toBe('Gunslinger Feat 4');
    expect(c.specials).toContain('Way of the Sniper');
    expect(c.lores).toEqual([{ name: 'Tanning', proficiency: 2 }]);
  });

  it('lit l’équipement et les contenants', () => {
    expect(c.containers).toEqual([
      { id: 'fc374284-9f39-4953-8485-9e355ef0c6fa', name: 'Backpack', bagOfHolding: false },
    ]);
    expect(c.equipment).toHaveLength(12);
    expect(c.equipment.find((e) => e.name === 'Bolts')).toEqual({
      name: 'Bolts',
      qty: 20,
      containerId: null,
    });
    expect(c.equipment.find((e) => e.name === 'Torch')).toEqual({
      name: 'Torch',
      qty: 5,
      containerId: 'fc374284-9f39-4953-8485-9e355ef0c6fa',
    });
    expect(c.money).toEqual({ cp: 0, sp: 1, gp: 17, pp: 0 });
  });

  it('lit armes et armure', () => {
    expect(c.weapons.map((w) => w.display)).toEqual(['+1 Striking Arbalest', 'Dagger']);
    expect(c.weapons[0]?.striking).toBe('striking');
    expect(c.armor[0]).toMatchObject({ name: 'Leather Armor', prof: 'light', worn: true });
  });
});

describe('parsePathbuilder : cas défensifs', () => {
  it('refuse ce qui n’est pas un objet', () => {
    expect(parsePathbuilder(null)).toMatchObject({ ok: false });
    expect(parsePathbuilder([1, 2])).toMatchObject({ ok: false });
  });

  it('refuse un export sans build', () => {
    const r = parsePathbuilder({ success: true });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('build');
  });

  it('refuse un niveau invalide', () => {
    expect(parsePathbuilder({ build: { name: 'X', level: 0 } }).ok).toBe(false);
    expect(parsePathbuilder({ build: { name: 'X', level: 'abc' } }).ok).toBe(false);
  });

  it('accepte un build minimal avec des valeurs par défaut', () => {
    const r = parsePathbuilder({
      build: { name: 'Minimal', level: 1, languages: ['None selected'] },
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.character.languages).toEqual([]);
    expect(r.character.abilities.str).toBe(10);
    expect(r.character.feats).toEqual([]);
    expect(r.character.acTotal).toBeNull();
  });

  it('ignore les entrées mal formées', () => {
    const r = parsePathbuilder({
      build: {
        name: 'Bancal',
        level: 2,
        feats: [null, 'texte', ['Toughness', null, 'General Feat', 1]],
        equipment: [['Rope'], 42, ['', 3]],
        weapons: [{}, { name: 'Club', die: 'd6' }],
      },
    });
    if (!r.ok) throw new Error(r.error);
    expect(r.character.feats.map((f) => f.name)).toEqual(['Toughness']);
    expect(r.character.equipment).toEqual([{ name: 'Rope', qty: 1, containerId: null }]);
    expect(r.character.weapons.map((w) => w.name)).toEqual(['Club']);
    expect(r.character.weapons[0]?.attack).toBeNull();
  });
});

describe('parsePathbuilderText', () => {
  it('signale un texte vide', () => {
    expect(parsePathbuilderText('   ')).toMatchObject({ ok: false });
  });

  it('signale un JSON invalide en français', () => {
    const r = parsePathbuilderText('{ pas du json');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('JSON valide');
  });

  it('lit un JSON valide', () => {
    expect(parsePathbuilderText(JSON.stringify(flacon)).ok).toBe(true);
  });
});
