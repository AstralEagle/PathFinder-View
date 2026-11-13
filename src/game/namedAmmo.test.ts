import { describe, expect, it } from 'vitest';
import flacon from '../../fixtures/flacon.json';
import { parsePathbuilder } from '../pathbuilder/parse.ts';
import { initialGameState, reconcile } from './state.ts';
import {
  addNamedAmmo,
  adjustNamedAmmo,
  fireNamedAmmo,
  namedAmmoSummary,
  recoverAllNamedAmmo,
  recoverNamedAmmo,
  removeNamedAmmo,
  renameNamedAmmo,
  setNamedAmmoNote,
} from './namedAmmo.ts';

const r = parsePathbuilder(flacon);
if (!r.ok) throw new Error(r.error);
const base = addNamedAmmo(initialGameState(r.character), ['Aiguille', '  ', 'Brise-Cœur']);
const [a, b] = base.namedAmmo!;

describe('munitions nommées', () => {
  it('ajoute les noms non vides, dans le carquois', () => {
    expect(base.namedAmmo).toHaveLength(2);
    expect(a).toMatchObject({ name: 'Aiguille', held: true, hits: 0, misses: 0 });
  });

  it('un tir sort la munition du carquois et compte touche ou raté', () => {
    let s = fireNamedAmmo(base, a!.id, true);
    s = fireNamedAmmo(s, b!.id, false);
    expect(s.namedAmmo![0]).toMatchObject({ held: false, hits: 1, misses: 0 });
    expect(s.namedAmmo![1]).toMatchObject({ held: false, hits: 0, misses: 1 });
    expect(namedAmmoSummary(s)).toEqual({ total: 2, held: 0, hits: 1, misses: 1 });

    s = recoverNamedAmmo(s, a!.id);
    expect(s.namedAmmo![0]!.held).toBe(true);
    expect(namedAmmoSummary(recoverAllNamedAmmo(s)).held).toBe(2);
  });

  it('renomme, corrige les compteurs sans passer sous 0, supprime', () => {
    let s = renameNamedAmmo(base, a!.id, 'Aiguille d’argent');
    expect(s.namedAmmo![0]!.name).toBe('Aiguille d’argent');
    expect(renameNamedAmmo(s, a!.id, '  ').namedAmmo![0]!.name).toBe('Aiguille d’argent');
    s = adjustNamedAmmo(s, a!.id, 'hits', -1);
    expect(s.namedAmmo![0]!.hits).toBe(0);
    s = adjustNamedAmmo(s, a!.id, 'misses', 2);
    expect(s.namedAmmo![0]!.misses).toBe(2);
    expect(removeNamedAmmo(s, a!.id).namedAmmo).toHaveLength(1);
  });

  it('ajoute, modifie et efface une note', () => {
    let s = setNamedAmmoNote(base, a!.id, '  Taillé dans un os de dragon ');
    expect(s.namedAmmo![0]!.note).toBe('Taillé dans un os de dragon');
    s = setNamedAmmoNote(s, a!.id, '');
    expect(s.namedAmmo![0]).not.toHaveProperty('note');
  });

  it('survit à un ré-import du personnage', () => {
    const s = fireNamedAmmo(base, a!.id, true);
    expect(reconcile(s, r.character).namedAmmo).toEqual(s.namedAmmo);
  });
});
