import { describe, expect, it } from 'vitest';
import { indexPack } from './packs.ts';

describe('indexPack', () => {
  it('indexe un fichier Babele (tableau) par nom anglais, sans tenir compte de la casse', () => {
    const index = indexPack('feats-srd', {
      label: 'Dons',
      entries: [
        {
          id: 'Cat Fall',
          name: 'Chute féline',
          description: '<p>…</p>',
          prereq: [{ value: 'qualifié en Acrobaties' }],
        },
        { id: 'Fleet', name: 'Vélocité', description: '<p>…</p>' },
        { name: 'Sans identifiant' },
      ],
    });
    expect(index.size).toBe(2);
    expect(index.get('cat fall')).toMatchObject({
      id: 'Cat Fall',
      name: 'Chute féline',
      prereq: ['qualifié en Acrobaties'],
      pack: 'feats-srd',
    });
    expect(index.get('fleet')?.prereq).toEqual([]);
  });

  it('accepte aussi le format objet et les champs de sort', () => {
    const index = indexPack('spells-srd', {
      entries: {
        Fireball: { name: 'Boule de feu', range: '150 mètres', areasize: 'explosion de 6 mètres' },
      },
    });
    expect(index.get('fireball')).toMatchObject({
      name: 'Boule de feu',
      range: '150 mètres',
      area: 'explosion de 6 mètres',
      description: '',
    });
  });

  it('résiste à un contenu inattendu', () => {
    expect(indexPack('classes', null).size).toBe(0);
    expect(indexPack('classes', { entries: 'n’importe quoi' }).size).toBe(0);
  });
});
