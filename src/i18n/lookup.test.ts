import { describe, expect, it } from 'vitest';
import flacon from '../../fixtures/flacon.json';
import { parsePathbuilder } from '../pathbuilder/parse.ts';
import { createLookup } from './lookup.ts';
import { collectNames } from './collectNames.ts';
import { trName } from './names.ts';

describe('createLookup', () => {
  const lookup = createLookup({ Arbalest: 'Officiel' }, { Arbalest: 'Communauté', Rope: 'Corde' });

  it('donne la priorité au premier dictionnaire', () => {
    expect(lookup('Arbalest')).toBe('Officiel');
  });
  it('se replie sur les suivants', () => {
    expect(lookup('Rope')).toBe('Corde');
  });
  it('ignore la casse et les espaces', () => {
    expect(lookup('  rope ')).toBe('Corde');
  });
  it('renvoie null sans inventer', () => {
    expect(lookup('Inconnu')).toBeNull();
  });
});

describe('trName', () => {
  it('utilise la surcharge pour l’arbalète lourde', () => {
    expect(trName('Arbalest')).toBe('Arbalète lourde');
  });
});

describe('collectNames', () => {
  it('liste les noms de Flacon sans doublon', () => {
    const r = parsePathbuilder(flacon);
    if (!r.ok) throw new Error(r.error);
    const entries = collectNames(r.character);
    expect(entries).toContainEqual({ kind: 'Don', en: 'Running Reload' });
    expect(entries).toContainEqual({ kind: 'Arme', en: 'Arbalest' });
    expect(entries).toContainEqual({ kind: 'Contenant', en: 'Backpack' });
    // « Tailed Goblin » apparaît comme héritage, don et capacité : une fois par type.
    expect(entries.filter((e) => e.en === 'Tailed Goblin')).toHaveLength(3);
    expect(entries.filter((e) => e.en === 'Running Reload')).toHaveLength(1);
  });
});
