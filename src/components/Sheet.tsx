import { useState } from 'react';
import type { Character } from '../pathbuilder/model.ts';
import { maxHp } from '../rules/character.ts';
import { trCore } from '../i18n/translate.ts';
import { CombatTab } from './tabs/CombatTab.tsx';
import { SkillsTab } from './tabs/SkillsTab.tsx';
import { FeatsTab } from './tabs/FeatsTab.tsx';
import { InventoryTab } from './tabs/InventoryTab.tsx';
import { SpellsTab } from './tabs/SpellsTab.tsx';
import { IdentityTab } from './tabs/IdentityTab.tsx';

type TabKey = 'combat' | 'skills' | 'feats' | 'inventory' | 'spells' | 'identity';

interface Props {
  character: Character;
  onClose: () => void;
}

export function Sheet({ character: c, onClose }: Props) {
  const [tab, setTab] = useState<TabKey>('combat');

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'combat', label: 'Combat' },
    { key: 'skills', label: 'Compétences' },
    { key: 'feats', label: 'Dons' },
    { key: 'inventory', label: 'Inventaire' },
    ...(c.spellCasters.length > 0 ? [{ key: 'spells' as const, label: 'Sorts' }] : []),
    { key: 'identity', label: 'Identité' },
  ];

  const className = trCore('classes', c.className) ?? c.className;
  const ancestry = trCore('ancestries', c.ancestry) ?? c.ancestry;

  return (
    <div className="sheet">
      <div className="sheet-head">
        <div>
          <h2 className="char-name">{c.name}</h2>
          <p className="char-sub">
            {className} {ancestry.toLowerCase()} · niveau {c.level}
          </p>
        </div>
        <div className="hp-pill" title="Points de vie maximum">
          <span className="hp-label">PV</span>
          <strong>{maxHp(c)}</strong>
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
        {tab === 'combat' && <CombatTab c={c} />}
        {tab === 'skills' && <SkillsTab c={c} />}
        {tab === 'feats' && <FeatsTab c={c} />}
        {tab === 'inventory' && <InventoryTab c={c} />}
        {tab === 'spells' && <SpellsTab />}
        {tab === 'identity' && <IdentityTab c={c} />}
      </div>

      <button type="button" className="secondary close-sheet" onClick={onClose}>
        Changer de personnage
      </button>
    </div>
  );
}
