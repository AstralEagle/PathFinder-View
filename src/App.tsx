import { useEffect, useMemo, useState } from 'react';
import type { Character } from './pathbuilder/model.ts';
import { parsePathbuilderText } from './pathbuilder/parse.ts';
import type { GameState } from './game/state.ts';
import {
  addCharacter,
  findByName,
  removeCharacter,
  updateBuild,
  updateState,
  type Store,
} from './game/roster.ts';
import { loadStore, saveStore } from './storage.ts';
import { Home } from './components/Home.tsx';
import { ImportScreen } from './components/ImportScreen.tsx';
import { Sheet } from './components/Sheet.tsx';

type View = { screen: 'home' } | { screen: 'import' } | { screen: 'sheet'; id: string };

export default function App() {
  const [store, setStore] = useState<Store>(loadStore);
  const [view, setView] = useState<View>(() =>
    store.characters.length === 1
      ? { screen: 'sheet', id: store.characters[0]!.id }
      : { screen: 'home' },
  );

  // Sauvegarde automatique à chaque modification.
  useEffect(() => saveStore(store), [store]);

  const open =
    view.screen === 'sheet' ? store.characters.find((sc) => sc.id === view.id) : undefined;
  // Le build ne change qu'au ré-import : on ne le relit que si le JSON brut change.
  const openRaw = open?.raw;
  const openCharacter = useMemo(() => {
    if (!openRaw) return null;
    const r = parsePathbuilderText(openRaw);
    return r.ok ? r.character : null;
  }, [openRaw]);

  function onImported(c: Character, raw: string) {
    const existing = findByName(store, c.name);
    if (existing) {
      const ok = window.confirm(
        `« ${existing.name} » existe déjà sur cet appareil.\n\n` +
          'Mettre à jour son build ? Son état de jeu (PV, consommables…) sera conservé.',
      );
      if (!ok) return;
      setStore(updateBuild(store, existing.id, c, raw));
      setView({ screen: 'sheet', id: existing.id });
      return;
    }
    const added = addCharacter(store, c, raw);
    setStore(added.store);
    setView({ screen: 'sheet', id: added.id });
  }

  function onDelete(id: string) {
    const sc = store.characters.find((x) => x.id === id);
    if (!sc) return;
    if (!window.confirm(`Supprimer « ${sc.name} » de cet appareil ? Son état de jeu sera perdu.`))
      return;
    setStore(removeCharacter(store, id));
  }

  function onStateChange(id: string, next: GameState) {
    setStore((s) => updateState(s, id, next));
  }

  return (
    <div className={view.screen === 'sheet' ? 'app with-hp-bar' : 'app'}>
      <header className="app-header">
        <h1>Fiche PF2</h1>
      </header>

      <main className="app-main">
        {view.screen === 'home' && (
          <Home
            characters={store.characters}
            onOpen={(id) => setView({ screen: 'sheet', id })}
            onDelete={onDelete}
            onImport={() => setView({ screen: 'import' })}
          />
        )}

        {view.screen === 'import' && (
          <ImportScreen onImported={onImported} onCancel={() => setView({ screen: 'home' })} />
        )}

        {view.screen === 'sheet' && open && openCharacter && (
          <Sheet
            character={openCharacter}
            state={open.state}
            onStateChange={(next) => onStateChange(open.id, next)}
            onBack={() => setView({ screen: 'home' })}
          />
        )}

        {view.screen === 'sheet' && (!open || !openCharacter) && (
          <section className="card">
            <p className="error">Ce personnage est introuvable ou son build est illisible.</p>
            <button type="button" className="secondary" onClick={() => setView({ screen: 'home' })}>
              Retour à la liste
            </button>
          </section>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Outil de fan non officiel, non commercial. Pathfinder est une marque déposée de Paizo Inc.
          Cet outil n’est ni publié, ni approuvé, ni soutenu par Paizo ou Black Book Éditions.
          Traductions des noms : Black Book Éditions et communauté Pathfinder-fr.
        </p>
      </footer>
    </div>
  );
}
