import { useState } from 'react';
import type { Character } from '../pathbuilder/model.ts';
import type { GameState } from '../game/state.ts';
import { maxHp } from '../rules/character.ts';
import { trCore } from '../i18n/translate.ts';
import { trName } from '../i18n/names.ts';
import { CombatTab } from './tabs/CombatTab.tsx';
import { SkillsTab } from './tabs/SkillsTab.tsx';
import { FeatsTab } from './tabs/FeatsTab.tsx';
import { InventoryTab } from './tabs/InventoryTab.tsx';
import { SpellsTab } from './tabs/SpellsTab.tsx';
import { IdentityTab } from './tabs/IdentityTab.tsx';
import { HpBar } from './HpBar.tsx';

type TabKey = 'combat' | 'skills' | 'feats' | 'inventory' | 'spells' | 'identity';

interface Props {
  character: Character;
  state: GameState;
  onStateChange: (next: GameState) => void;
  onBack: () => void;
}

export function Sheet({ character: c, state, onStateChange, onBack }: Props) {
  const [tab, setTab] = useState<TabKey>('combat');
  const max = maxHp(c);

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'combat', label: 'Combat' },
    { key: 'skills', label: 'Compétences' },
    { key: 'feats', label: 'Dons' },
    { key: 'inventory', label: 'Inventaire' },
    ...(c.spellCasters.length > 0 ? [{ key: 'spells' as const, label: 'Sorts' }] : []),
    { key: 'identity', label: 'Identité' },
  ];

  const className = trCore('classes', c.className) ?? trName(c.className) ?? c.className;
  const ancestry = trCore('ancestries', c.ancestry) ?? trName(c.ancestry) ?? c.ancestry;

  return (
    <div className="sheet">
      <div className="sheet-head">
        <button
          type="button"
          className="icon-button"
          aria-label="Retour à la liste"
          onClick={onBack}
        >
          ←
        </button>
        <div className="sheet-title">
          <h2 className="char-name">{c.name}</h2>
          <p className="char-sub">
            {className} {ancestry.toLowerCase()} · niveau {c.level}
          </p>
        </div>
      </div>

      <nav className="tabs" aria-label="Sections de la fiche">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            className={t.key === tab ? 'tab active' : 'tab'}
            aria-current={t.key === tab ? 'page' : undefined}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="tab-panel">
        {tab === 'combat' && <CombatTab c={c} state={state} onChange={onStateChange} />}
        {tab === 'skills' && <SkillsTab c={c} />}
        {tab === 'feats' && <FeatsTab c={c} />}
        {tab === 'inventory' && <InventoryTab c={c} state={state} onChange={onStateChange} />}
        {tab === 'spells' && <SpellsTab />}
        {tab === 'identity' && <IdentityTab c={c} />}
      </div>

      <HpBar state={state} max={max} onChange={onStateChange} />
    </div>
  );
}
