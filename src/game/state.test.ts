import { describe, expect, it } from 'vitest';
import flacon from '../../fixtures/flacon.json';
import { parsePathbuilder } from '../pathbuilder/parse.ts';
import type { Character } from '../pathbuilder/model.ts';
import {
  adjustConsumable,
  applyDamage,
  applyHealing,
  consumableItems,
  initialGameState,
  reconcile,
  setHeroPoints,
  setTempHp,
} from './state.ts';

const r = parsePathbuilder(flacon);
if (!r.ok) throw new Error(r.error);
const c = r.character;

describe('consommables de Flacon', () => {
  it('repère potions, munitions et objets en plusieurs exemplaires', () => {
    const names = consumableItems(c).map((i) => i.name);
    expect(names).toEqual(
      expect.arrayContaining(['Bolts', 'Healing Potion (Minor)', 'Chalk', 'Rations', 'Torch']),
    );
    expect(names).not.toContain('Backpack');
    expect(names).not.toContain('Rope');
  });
});

describe('initialGameState', () => {
  it('démarre à PV max avec 1 point d’héroïsme', () => {
    const s = initialGameState(c);
    expect(s.hp).toEqual({ current: 46, temp: 0 });
    expect(s.heroPoints).toBe(1);
    expect(s.consumables['Bolts']).toBe(20);
    expect(s.consumables['Healing Potion (Minor)']).toBe(2);
  });
});

describe('PV', () => {
  const s = initialGameState(c);

  it('les dégâts retirent d’abord les PV temporaires', () => {
    const t = applyDamage(setTempHp(s, 5), 8);
    expect(t.hp).toEqual({ current: 43, temp: 0 });
  });

  it('les PV ne descendent pas sous 0', () => {
    expect(applyDamage(s, 100).hp.current).toBe(0);
  });

  it('les soins sont plafonnés au max', () => {
    expect(applyHealing(applyDamage(s, 10), 50, 46).hp.current).toBe(46);
  });

  it('ignore les valeurs négatives ou invalides', () => {
    expect(applyDamage(s, -5).hp.current).toBe(46);
    expect(applyHealing(s, Number.NaN, 46).hp.current).toBe(46);
  });
});

describe('points d’héroïsme', () => {
  it('restent entre 0 et 3', () => {
    const s = initialGameState(c);
    expect(setHeroPoints(s, 5).heroPoints).toBe(3);
    expect(setHeroPoints(s, -1).heroPoints).toBe(0);
  });
});

describe('adjustConsumable', () => {
  it('ne descend pas sous 0', () => {
    const s = initialGameState(c);
    expect(
      adjustConsumable(s, 'Healing Potion (Minor)', -1).consumables['Healing Potion (Minor)'],
    ).toBe(1);
    expect(
      adjustConsumable(s, 'Healing Potion (Minor)', -5).consumables['Healing Potion (Minor)'],
    ).toBe(0);
  });
});

describe('reconcile (ré-import)', () => {
  it('garde l’état et recadre les valeurs devenues invalides', () => {
    let s = initialGameState(c);
    s = adjustConsumable(s, 'Bolts', -5);
    s = setHeroPoints(s, 2);

    const lower: Character = {
      ...c,
      attributes: { ...c.attributes, classHp: 6 }, // PV max : 6 + (6+2)×4 = 38
      equipment: [
        ...c.equipment.filter((e) => e.name !== 'Healing Potion (Minor)'),
        { name: 'Elixir of Life (Minor)', qty: 1, containerId: null },
      ],
    };
    const next = reconcile(s, lower);

    expect(next.hp.current).toBe(38);
    expect(next.heroPoints).toBe(2);
    expect(next.consumables['Bolts']).toBe(15);
    expect(next.consumables['Healing Potion (Minor)']).toBeUndefined();
    expect(next.consumables['Elixir of Life (Minor)']).toBe(1);
  });
});
