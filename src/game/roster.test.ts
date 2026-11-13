import { describe, expect, it } from 'vitest';
import flacon from '../../fixtures/flacon.json';
import { parsePathbuilder } from '../pathbuilder/parse.ts';
import {
  addCharacter,
  emptyStore,
  findByName,
  loadCharacter,
  removeCharacter,
  updateBuild,
  updateState,
} from './roster.ts';
import { applyDamage } from './state.ts';

const raw = JSON.stringify(flacon);
const r = parsePathbuilder(flacon);
if (!r.ok) throw new Error(r.error);
const c = r.character;

describe('roster', () => {
  it('ajoute, retrouve par nom et relit un personnage', () => {
    const { store, id } = addCharacter(emptyStore(), c, raw);
    expect(store.characters).toHaveLength(1);
    expect(findByName(store, '  flacon "oeil de taupe" ')?.id).toBe(id);
    expect(loadCharacter(store.characters[0]!)?.level).toBe(4);
  });

  it('le ré-import conserve l’état de jeu', () => {
    const added = addCharacter(emptyStore(), c, raw);
    const hurt = applyDamage(added.store.characters[0]!.state, 10);
    const store = updateState(added.store, added.id, hurt);

    const levelled = { ...c, level: 5 };
    const updated = updateBuild(store, added.id, levelled, raw);
    expect(updated.characters).toHaveLength(1);
    expect(updated.characters[0]!.state.hp.current).toBe(36);
  });

  it('supprime un personnage', () => {
    const { store, id } = addCharacter(emptyStore(), c, raw);
    expect(removeCharacter(store, id).characters).toEqual([]);
  });
});
