import { describe, expect, it } from 'vitest';
import { pascal, slugify } from './slug.ts';
import { EMPTY_GROUP, normalizeGroupUrl, parseGroupFile } from './groupFile.ts';
import { flattenLang, termFr, traitFr } from './langFr.ts';
import { parseFoundryItem } from './foundry.ts';
import { buildNameLookup, nameSource } from './chain.ts';

describe('slug', () => {
  it('reproduit les noms de fichiers Foundry', () => {
    expect(slugify("Slinger's Precision")).toBe('slingers-precision');
    expect(slugify('Healing Potion (Minor)')).toBe('healing-potion-minor');
    expect(slugify('Hit the Dirt!')).toBe('hit-the-dirt');
    expect(slugify("Thieves' Toolkit")).toBe('thieves-toolkit');
  });
  it('construit les clés de langue', () => {
    expect(pascal('deadly-d10')).toBe('DeadlyD10');
    expect(pascal(slugify('Common'))).toBe('Common');
  });
});

describe('fichier du groupe', () => {
  it('accepte les noms simples et les objets avec description', () => {
    const g = parseGroupFile({
      _commentaire: 'ignoré',
      'Cat Fall': 'Chute féline',
      Arbalest: { name: 'Arbalète lourde', description: '<p>Texte</p>' },
      Vide: '',
    });
    expect(g.names).toEqual({ 'Cat Fall': 'Chute féline', Arbalest: 'Arbalète lourde' });
    expect(g.descriptions).toEqual({ arbalest: '<p>Texte</p>' });
  });
  it('refuse un tableau', () => {
    expect(() => parseGroupFile([])).toThrow();
  });
  it('convertit une page Gist en adresse brute', () => {
    expect(normalizeGroupUrl('https://gist.github.com/moi/abc123')).toBe(
      'https://gist.githubusercontent.com/moi/abc123/raw',
    );
    expect(normalizeGroupUrl('https://exemple.fr/noms.json')).toBe('https://exemple.fr/noms.json');
  });
});

describe('lang-fr', () => {
  const table = flattenLang({
    PF2E: { TraitDeadlyD10: 'Mortel d10', LanguageOrcish: 'Orquien', TraitAgile: 'Agile' },
  });
  it('aplatit le fichier de langue', () => {
    expect(table['PF2E.TraitAgile']).toBe('Agile');
  });
  it('traduit traits et langues', () => {
    expect(traitFr(table, 'deadly-d10')).toBe('Mortel d10');
    expect(termFr(table, 'Orcish')).toBe('Orquien');
    expect(termFr(table, 'Inconnu')).toBeNull();
  });
});

describe('parseFoundryItem', () => {
  it('extrait niveau, traits, actions et prérequis', () => {
    const item = parseFoundryItem({
      name: 'Cat Fall',
      system: {
        level: { value: 1 },
        traits: { value: ['general', 'skill'], rarity: 'common' },
        actionType: { value: 'passive' },
        actions: { value: null },
        prerequisites: { value: [{ value: 'trained in Acrobatics' }] },
        description: { value: '<p>Your catlike…</p>' },
      },
    });
    expect(item).toEqual({
      name: 'Cat Fall',
      level: 1,
      rarity: null,
      traits: ['general', 'skill'],
      actionType: 'passive',
      actions: null,
      prereq: ['trained in Acrobatics'],
      description: '<p>Your catlike…</p>',
    });
  });
  it('résiste à un contenu vide', () => {
    expect(parseFoundryItem(null).traits).toEqual([]);
  });
});

describe('chaîne des noms', () => {
  const lang = flattenLang({ PF2E: { LanguageCommon: 'Commun' } });

  it('respecte l’ordre : groupe, Pathfinder-fr, local, lang-fr', () => {
    const sources = {
      group: { names: { 'Cat Fall': 'Chute du chat (groupe)' }, descriptions: {} },
      local: { 'Cat Fall': 'Local', 'Slinger’s Thing': 'Truc local' },
      lang,
    };
    const tr = buildNameLookup(sources);
    expect(tr('Cat Fall')).toBe('Chute du chat (groupe)');
    expect(nameSource(sources, 'Cat Fall')).toBe('group');
    expect(tr('Fleet')).toBe('Vélocité');
    expect(nameSource(sources, 'Fleet')).toBe('pf2fr');
    expect(tr('Slinger’s Thing')).toBe('Truc local');
    expect(nameSource(sources, 'Slinger’s Thing')).toBe('local');
    expect(tr('Common')).toBe('Commun');
    expect(nameSource(sources, 'Common')).toBe('langfr');
  });

  it('garde la surcharge du dépôt au niveau 1', () => {
    const sources = { group: EMPTY_GROUP, local: {}, lang: null };
    expect(buildNameLookup(sources)('Arbalest')).toBe('Arbalète lourde');
    expect(nameSource(sources, 'Arbalest')).toBe('group');
  });
});
