import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { parsePathbuilderText } from './pathbuilder/parse.ts';
import type { Dictionary } from './i18n/lookup.ts';
import {
  backupFileName,
  exportAllData,
  exportCharacterData,
  type ImportEntry,
} from './game/backup.ts';
import { downloadJson } from './components/download.ts';
import type { GameState } from './game/state.ts';
import { setNamedAmmoEnabled } from './game/namedAmmo.ts';
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
import { usePublishHeight } from './components/usePublishHeight.ts';
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
  // Hauteur réelle de l'en-tête (--header-h) : les éléments collants se placent juste dessous.
  const headerRef = useRef<HTMLElement>(null);
  usePublishHeight(headerRef, '--header-h');
  // Historique des fenêtres de détail : ouvrir une description depuis une autre l'empile (← y revient).
  const [details, setDetails] = useState<DetailRequest[]>([]);
  const detail = details.length > 0 ? details[details.length - 1]! : null;
  const openDetail = useCallback(
    (req: DetailRequest) => setDetails((stack) => [...stack, req]),
    [],
  );
  const { translation, groupStatus, reloadGroup, local, clearLocal, mergeLocal } =
    useTranslationState(settings.groupUrl);

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

  function onImported(entries: ImportEntry[], importedNames: Dictionary) {
    let next = store;
    let lastId: string | null = null;
    let count = 0;
    for (const { character, raw, state } of entries) {
      const existing = findByName(next, character.name);
      if (existing) {
        const ok = window.confirm(
          `« ${existing.name} » existe déjà sur cet appareil.\n\n` +
            (state
              ? 'Remplacer son build ET son état de jeu (PV, consommables, munitions…) par ceux du fichier ?'
              : 'Mettre à jour son build ? Son état de jeu (PV, consommables…) sera conservé.'),
        );
        if (!ok) continue;
        next = updateBuild(next, existing.id, character, raw);
        if (state) next = updateState(next, existing.id, state);
        lastId = existing.id;
      } else {
        const added = addCharacter(next, character, raw);
        next = added.store;
        if (state) next = updateState(next, added.id, state);
        lastId = added.id;
      }
      count++;
    }
    if (Object.keys(importedNames).length > 0) mergeLocal(importedNames);
    if (count === 0) return;
    setStore(next);
    if (count === 1 && lastId) openSheet(lastId);
    else goHome();
  }

  function exportOne(id: string) {
    const sc = store.characters.find((x) => x.id === id);
    if (sc) downloadJson(exportCharacterData(sc, local), backupFileName(sc.name));
  }

  function exportAll() {
    const date = new Date().toISOString().slice(0, 10);
    downloadJson(exportAllData(store, local), `fiche-pf2-sauvegarde-${date}.json`);
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
        <DetailContext.Provider value={openDetail}>
          <div className={view.screen === 'sheet' ? 'app with-hp-bar' : 'app'}>
            <header className="app-header" ref={headerRef}>
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
                  onExport={exportOne}
                  onExportAll={exportAll}
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
                tabs={openCharacter ? sheetTabs(openCharacter, open?.state) : null}
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
                namedAmmoEnabled={open?.state.namedAmmoEnabled ?? false}
                onToggleNamedAmmo={
                  open && openCharacter
                    ? (enabled) => {
                        onStateChange(open.id, setNamedAmmoEnabled(open.state, enabled));
                        if (enabled) setTab('ammo');
                      }
                    : undefined
                }
                onChangeCharacter={goHome}
                onExportCharacter={open ? () => exportOne(open.id) : undefined}
                groupStatus={groupStatus}
                onReloadGroup={reloadGroup}
                localNames={local}
                onClearLocal={clearLocal}
                onClose={() => setSettingsOpen(false)}
              />
            )}

            {detail && (
              <DetailDialog
                key={`${details.length}|${detail.kind}|${detail.en}`}
                request={detail}
                onClose={() => setDetails([])}
                onBack={
                  details.length > 1 ? () => setDetails((stack) => stack.slice(0, -1)) : undefined
                }
              />
            )}
          </div>
        </DetailContext.Provider>
      </TranslationContext.Provider>
    </SettingsContext.Provider>
  );
}
