import type { Character } from '../pathbuilder/model.ts';
import type { GameState } from '../game/state.ts';
import { maxHp } from '../rules/character.ts';
import { CombatTab } from './tabs/CombatTab.tsx';
import { SkillsTab } from './tabs/SkillsTab.tsx';
import { ActionsTab } from './tabs/ActionsTab.tsx';
import { NamedAmmoTab } from './tabs/NamedAmmoTab.tsx';
import { FeatsTab } from './tabs/FeatsTab.tsx';
import { InventoryTab } from './tabs/InventoryTab.tsx';
import { SpellsTab } from './tabs/SpellsTab.tsx';
import { IdentityTab } from './tabs/IdentityTab.tsx';
import { HpBar } from './HpBar.tsx';
import { sheetTabs, type TabKey } from './sheetTabs.ts';

interface Props {
  character: Character;
  state: GameState;
  onStateChange: (next: GameState) => void;
  tab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export function Sheet({ character: c, state, onStateChange, tab, onTabChange }: Props) {
  const max = maxHp(c);
  const tabs = sheetTabs(c, state);
  const current = tabs.some((t) => t.key === tab) ? tab : 'combat';

  // Le nom, la classe et le niveau sont affichés dans l'en-tête de l'appli (CharacterTitle).
  return (
    <div className="sheet">
      {/* Onglets visibles sur grand écran ; sur mobile, la navigation passe par le menu burger. */}
      <nav className="tabs" aria-label="Sections de la fiche">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            className={t.key === current ? 'tab active' : 'tab'}
            aria-current={t.key === current ? 'page' : undefined}
            onClick={() => onTabChange(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <h2 className="mobile-tab-title">{tabs.find((t) => t.key === current)?.label}</h2>

      <div className="tab-panel">
        {current === 'combat' && <CombatTab c={c} state={state} onChange={onStateChange} />}
        {current === 'actions' && <ActionsTab c={c} />}
        {current === 'skills' && <SkillsTab c={c} />}
        {current === 'feats' && <FeatsTab c={c} />}
        {current === 'inventory' && <InventoryTab c={c} state={state} onChange={onStateChange} />}
        {current === 'ammo' && <NamedAmmoTab state={state} onChange={onStateChange} />}
        {current === 'spells' && <SpellsTab />}
        {current === 'identity' && <IdentityTab c={c} />}
      </div>

      <HpBar state={state} max={max} onChange={onStateChange} />
    </div>
  );
}
