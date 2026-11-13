import { describe, expect, it } from 'vitest';
import { cleanEnrichers } from './enrichers.ts';

describe('cleanEnrichers', () => {
  it('garde le libellé des liens Foundry', () => {
    expect(
      cleanEnrichers(
        'pour @Compendium[pf2e.actionspf2e.pprgrYQ1QnIDGZiy]{Escalader} et @UUID[Compendium.pf2e.x.Item.y]{Croc-en-jambe}',
      ),
    ).toBe('pour Escalader et Croc-en-jambe');
  });

  it('retire les liens sans libellé et les paragraphes vides', () => {
    expect(cleanEnrichers('<p>A</p>\n<p>@UUID[Compendium.pf2e.x]</p>\n<p>B</p>')).toBe(
      '<p>A</p>\n<p>B</p>',
    );
  });

  it('traduit les tests de sauvegarde', () => {
    expect(cleanEnrichers('@Check[type:reflex|dc:20|basic:true]')).toBe('Réflexes DD 20 basique');
    expect(cleanEnrichers('@Check[will|dc:18]')).toBe('Volonté DD 18');
  });

  it('rend les dégâts', () => {
    expect(cleanEnrichers('@Damage[2d6[fire]]')).toBe('2d6 feu');
    expect(cleanEnrichers('@Damage[(2d6+4)[persistent,fire]]')).toBe('(2d6+4) persistants feu');
  });

  it('rend les gabarits en mètres', () => {
    expect(cleanEnrichers('@Template[type:burst|distance:20]')).toBe('explosion de 6 m');
  });

  it('rend les jets en ligne', () => {
    expect(cleanEnrichers('vous récupérez [[/r {1d8}[healing]]]{1d8 points de vie}.')).toBe(
      'vous récupérez 1d8 points de vie.',
    );
    expect(cleanEnrichers('lancez [[/r 1d20]] ici')).toBe('lancez 1d20 ici');
  });

  it('laisse le texte normal intact', () => {
    const html = '<p><strong>Intensifié (+1)</strong> Les dégâts augmentent de 2d6.</p>';
    expect(cleanEnrichers(html)).toBe(html);
  });
});
