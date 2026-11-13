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
import { loadSettings, saveSettings, SettingsContext, type Settings } from './settings.ts';
import { Home } from './components/Home.tsx';
import { ImportScreen } from './components/ImportScreen.tsx';
import { Sheet } from './components/Sheet.tsx';
import { MenuDrawer } from './components/MenuDrawer.tsx';
import { SettingsDialog } from './components/SettingsDialog.tsx';
import { sheetTabs, type TabKey } from './components/sheetTabs.ts';
import { DetailDialog } from './components/DetailDialog.tsx';
import { AboutDialog } from './components/AboutDialog.tsx';
import { CharacterTitle } from './components/CharacterTitle.tsx';
import { DetailContext, type DetailRequest } from './details/DetailContext.ts';
import { TranslationContext } from './sources/TranslationContext.ts';
import { useTranslationState } from './sources/useTranslationState.ts';

type View = { screen: 'home' } | { screen: 'import' } | { screen: 'sheet'; id: string };

export default function App() {
  const [store, setStore] = useState<Store>(loadStore);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [view, setView] = useState<View>(() =>
    store.characters.length === 1
      ? { screen: 'sheet', id: store.characters[0]!.id }
      : { screen: 'home' },
  );
  const [tab, setTab] = useState<TabKey>('combat');
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [detail, setDetail] = useState<DetailRequest | null>(null);
  const { translation, groupStatus, reloadGroup, local, clearLocal } = useTranslationState(
    settings.groupUrl,
  );

  // Sauvegarde automatique à chaque modification.
  useEffect(() => saveStore(store), [store]);
  useEffect(() => saveSettings(settings), [settings]);

  const open =
    view.screen === 'sheet' ? store.characters.find((sc) => sc.id === view.id) : undefined;
  // Le build ne change qu'au ré-import : on ne le relit que si le JSON brut change.
  const openRaw = open?.raw;
  const openCharacter = useMemo(() => {
    if (!openRaw) return null;
    const r = parsePathbuilderText(openRaw);
    return r.ok ? r.character : null;
  }, [openRaw]);

  function openSheet(id: string) {
    setTab('combat');
    setView({ screen: 'sheet', id });
  }

  function onImported(c: Character, raw: string) {
    const existing = findByName(store, c.name);
    if (existing) {
      const ok = window.confirm(
        `« ${existing.name} » existe déjà sur cet appareil.\n\n` +
          'Mettre à jour son build ? Son état de jeu (PV, consommables…) sera conservé.',
      );
      if (!ok) return;
      setStore(updateBuild(store, existing.id, c, raw));
      openSheet(existing.id);
      return;
    }
    const added = addCharacter(store, c, raw);
    setStore(added.store);
    openSheet(added.id);
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

  const goHome = () => setView({ screen: 'home' });

  return (
    <SettingsContext.Provider value={settings}>
      <TranslationContext.Provider value={translation}>
        <DetailContext.Provider value={setDetail}>
          <div className={view.screen === 'sheet' ? 'app with-hp-bar' : 'app'}>
            <header className="app-header">
              {view.screen === 'sheet' && openCharacter ? (
                <CharacterTitle c={openCharacter} />
              ) : (
                <h1>Fiche PF2</h1>
              )}
              <button
                type="button"
                className="burger"
                aria-label="Ouvrir le menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(true)}
              >
                <span />
                <span />
                <span />
              </button>
            </header>

            <main className="app-main">
              {view.screen === 'home' && (
                <Home
                  characters={store.characters}
                  onOpen={openSheet}
                  onDelete={onDelete}
                  onImport={() => setView({ screen: 'import' })}
                />
              )}

              {view.screen === 'import' && (
                <ImportScreen onImported={onImported} onCancel={goHome} />
              )}

              {view.screen === 'sheet' && open && openCharacter && (
                <Sheet
                  character={openCharacter}
                  state={open.state}
                  onStateChange={(next) => onStateChange(open.id, next)}
                  tab={tab}
                  onTabChange={setTab}
                />
              )}

              {view.screen === 'sheet' && (!open || !openCharacter) && (
                <section className="card">
                  <p className="error">Ce personnage est introuvable ou son build est illisible.</p>
                  <button type="button" className="secondary" onClick={goHome}>
                    Retour à la liste
                  </button>
                </section>
              )}
            </main>

            {aboutOpen && <AboutDialog onClose={() => setAboutOpen(false)} />}

            {menuOpen && (
              <MenuDrawer
                tabs={openCharacter ? sheetTabs(openCharacter) : null}
                currentTab={tab}
                onTab={setTab}
                onCharacters={goHome}
                onImport={() => setView({ screen: 'import' })}
                onSettings={() => setSettingsOpen(true)}
                onAbout={() => setAboutOpen(true)}
                onClose={() => setMenuOpen(false)}
              />
            )}

            {settingsOpen && (
              <SettingsDialog
                settings={settings}
                onChange={setSettings}
                characterName={openCharacter?.name ?? null}
                onChangeCharacter={goHome}
                groupStatus={groupStatus}
                onReloadGroup={reloadGroup}
                localNames={local}
                onClearLocal={clearLocal}
                onClose={() => setSettingsOpen(false)}
              />
            )}

            {detail && (
              <DetailDialog
                key={`${detail.kind}|${detail.en}`}
                request={detail}
                onClose={() => setDetail(null)}
              />
            )}
          </div>
        </DetailContext.Provider>
      </TranslationContext.Provider>
    </SettingsContext.Provider>
  );
}
