import { describe, expect, it } from 'vitest';
import flacon from '../../fixtures/flacon.json';
import { addCharacter, emptyStore, updateState } from './roster.ts';
import { applyDamage, setHeroPoints } from './state.ts';
import { addNamedAmmo, fireNamedAmmo, setNamedAmmoNote } from './namedAmmo.ts';
import {
  backupFileName,
  EXT_KEY,
  exportAllData,
  exportCharacterData,
  parseImportText,
} from './backup.ts';
import { parsePathbuilder } from '../pathbuilder/parse.ts';

const r = parsePathbuilder(flacon);
if (!r.ok) throw new Error(r.error);
const raw = JSON.stringify(flacon);

function playedStore() {
  const added = addCharacter(emptyStore(), r.ok ? r.character : (null as never), raw);
  let s = added.store.characters[0]!.state;
  s = applyDamage(s, 10);
  s = setHeroPoints(s, 3);
  s = addNamedAmmo(s, ['Aiguille']);
  s = fireNamedAmmo(s, s.namedAmmo![0]!.id, true);
  s = setNamedAmmoNote(s, s.namedAmmo![0]!.id, 'Os de dragon');
  s = { ...s, namedAmmoEnabled: true };
  return updateState(added.store, added.id, s);
}

describe('export', () => {
  it('garde le format Pathbuilder et ajoute le bloc pf2Viewer', () => {
    const data = exportCharacterData(playedStore().characters[0]!, { Common: 'Commun' });
    expect(data.success).toBe(true);
    expect(data.build).toEqual(flacon.build);
    expect(data[EXT_KEY]).toMatchObject({
      app: 'Fiche PF2',
      version: 1,
      localNames: { Common: 'Commun' },
    });
  });

  it('nomme le fichier d’après le personnage', () => {
    expect(backupFileName('Flacon "Oeil de Taupe"')).toBe('flacon-oeil-de-taupe.json');
  });
});

describe('import', () => {
  it('restaure l’état de jeu et les traductions (aller-retour)', () => {
    const store = playedStore();
    const text = JSON.stringify(exportCharacterData(store.characters[0]!, { Common: 'Commun' }));
    const res = parseImportText(text);
    if (!res.ok) throw new Error(res.error);
    const [e] = res.entries;
    expect(e!.character.name).toBe('Flacon "Oeil de Taupe"');
    expect(JSON.parse(e!.raw)).toEqual(flacon);
    expect(e!.state).toMatchObject({
      hp: { current: 36, temp: 0 },
      heroPoints: 3,
      namedAmmoEnabled: true,
      namedAmmo: [{ name: 'Aiguille', held: false, hits: 1, misses: 0, note: 'Os de dragon' }],
    });
    expect(res.localNames).toEqual({ Common: 'Commun' });
  });

  it('accepte un export Pathbuilder ordinaire (sans état)', () => {
    const res = parseImportText(raw);
    if (!res.ok) throw new Error(res.error);
    expect(res.entries[0]!.state).toBeNull();
  });

  it('accepte plusieurs personnages (tableau)', () => {
    const res = parseImportText(JSON.stringify(exportAllData(playedStore(), {})));
    expect(res.ok && res.entries.length).toBe(1);
  });

  it('recadre un état incohérent', () => {
    const res = parseImportText(
      JSON.stringify({
        ...flacon,
        [EXT_KEY]: {
          state: { hp: { current: 999 }, heroPoints: 9, namedAmmo: [{ name: '' }, 'x'] },
        },
      }),
    );
    if (!res.ok) throw new Error(res.error);
    expect(res.entries[0]!.state).toMatchObject({
      hp: { current: 46, temp: 0 },
      heroPoints: 3,
      namedAmmo: [],
    });
  });

  it('signale une erreur en précisant le personnage fautif', () => {
    const res = parseImportText(JSON.stringify([flacon, { build: { level: 2 } }]));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain('n° 2');
  });
});
