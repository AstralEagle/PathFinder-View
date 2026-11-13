import type { Character } from '../pathbuilder/model.ts';
import type { GameState } from '../game/state.ts';
import { maxHp } from '../rules/character.ts';
import { trCore } from '../i18n/translate.ts';
import { useTr } from '../sources/TranslationContext.ts';
import { CombatTab } from './tabs/CombatTab.tsx';
import { SkillsTab } from './tabs/SkillsTab.tsx';
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
  const trName = useTr();
  const max = maxHp(c);
  const tabs = sheetTabs(c);
  const current = tabs.some((t) => t.key === tab) ? tab : 'combat';

  const className = trCore('classes', c.className) ?? trName(c.className) ?? c.className;
  const ancestry = trCore('ancestries', c.ancestry) ?? trName(c.ancestry) ?? c.ancestry;

  return (
    <div className="sheet">
      <div className="sheet-head">
        <h2 className="char-name">{c.name}</h2>
        <p className="char-sub">
          {className} {ancestry.toLowerCase()} · niveau {c.level}
        </p>
      </div>

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
        {current === 'skills' && <SkillsTab c={c} />}
        {current === 'feats' && <FeatsTab c={c} />}
        {current === 'inventory' && <InventoryTab c={c} state={state} onChange={onStateChange} />}
        {current === 'spells' && <SpellsTab />}
        {current === 'identity' && <IdentityTab c={c} />}
      </div>

      <HpBar state={state} max={max} onChange={onStateChange} />
    </div>
  );
}
