import { Modal } from './Modal.tsx';
import type { TabDef, TabKey } from './sheetTabs.ts';

interface Props {
  /** Onglets de la fiche ouverte, ou null si aucune fiche n'est ouverte. */
  tabs: TabDef[] | null;
  currentTab: TabKey;
  onTab: (key: TabKey) => void;
  onCharacters: () => void;
  onImport: () => void;
  onSettings: () => void;
  onAbout: () => void;
  onClose: () => void;
}

export function MenuDrawer({
  tabs,
  currentTab,
  onTab,
  onCharacters,
  onImport,
  onSettings,
  onAbout,
  onClose,
}: Props) {
  // Chaque action ferme le menu.
  const run = (action: () => void) => () => {
    action();
    onClose();
  };

  return (
    <Modal title="Menu" variant="drawer" onClose={onClose}>
      {tabs && (
        <nav aria-label="Sections de la fiche">
          <p className="menu-section">Fiche</p>
          <ul className="menu-list">
            {tabs.map((t) => (
              <li key={t.key}>
                <button
                  type="button"
                  className={t.key === currentTab ? 'menu-item active' : 'menu-item'}
                  aria-current={t.key === currentTab ? 'page' : undefined}
                  onClick={run(() => onTab(t.key))}
                >
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <p className="menu-section">Application</p>
      <ul className="menu-list">
        <li>
          <button type="button" className="menu-item" onClick={run(onCharacters)}>
            Mes personnages
          </button>
        </li>
        <li>
          <button type="button" className="menu-item" onClick={run(onImport)}>
            Importer un personnage
          </button>
        </li>
        <li>
          <button type="button" className="menu-item" onClick={run(onSettings)}>
            Paramètres
          </button>
        </li>
        <li>
          <button type="button" className="menu-item" onClick={run(onAbout)}>
            À propos
          </button>
        </li>
      </ul>
    </Modal>
  );
}
