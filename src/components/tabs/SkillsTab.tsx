import { useMemo, useRef, useState } from 'react';
import type { Character } from '../../pathbuilder/model.ts';
import { lore, skill, SKILLS, type Check } from '../../rules/character.ts';
import { signed, trCoreOr } from '../../i18n/translate.ts';
import { useTr } from '../../sources/TranslationContext.ts';
import { useFitHeight } from '../useFitHeight.ts';
import { SkillDialog } from '../SkillDialog.tsx';
import { LORE_ACTIONS, SKILL_ACTIONS, type SkillAction } from '../../game/skillActions.ts';

const RANK_LETTER: Record<Check['rank'], string> = {
  untrained: '–',
  trained: 'Q',
  expert: 'E',
  master: 'M',
  legendary: 'L',
};

type SortBy = 'fr' | 'en';
const SORT_KEY = 'pf2.skillsSort';

function readSort(): SortBy {
  try {
    return localStorage.getItem(SORT_KEY) === 'en' ? 'en' : 'fr';
  } catch {
    return 'fr';
  }
}

interface SkillRow {
  id: string;
  fr: string;
  en: string;
  check: Check;
  actions: SkillAction[];
}

const capitalize = (s: string) => s[0]!.toUpperCase() + s.slice(1);

function Row({ row, showEn, onOpen }: { row: SkillRow; showEn: boolean; onOpen: () => void }) {
  const { check } = row;
  return (
    <li>
      <button
        type="button"
        className={check.proficiency === 0 ? 'skill untrained' : 'skill'}
        onClick={onOpen}
      >
        <span className="skill-name" title={`${row.fr} (${row.en})`}>
          {row.fr}
          {showEn && <span className="name-en"> ({row.en})</span>}
        </span>
        <span className="skill-ability">{trCoreOr('abilitiesShort', check.ability)}</span>
        <span className="rank" title={trCoreOr('ranks', check.rank)}>
          {RANK_LETTER[check.rank]}
        </span>
        <strong className="skill-total">{signed(check.total)}</strong>
      </button>
    </li>
  );
}

export function SkillsTab({ c }: { c: Character }) {
  const tr = useTr();
  const [sortBy, setSortBy] = useState<SortBy>(readSort);
  const listRef = useRef<HTMLUListElement>(null);
  // Sous la liste : légende, marges de la carte et de la page (~58 px).
  const maxHeight = useFitHeight(listRef, 58);

  const rows = useMemo(() => {
    const list: SkillRow[] = [
      ...SKILLS.map((s) => ({
        id: s.key,
        fr: trCoreOr('skills', s.key),
        en: capitalize(s.key),
        check: skill(c, s.key),
        actions: SKILL_ACTIONS[s.key],
      })),
      ...c.lores.flatMap((l) => {
        const check = lore(c, l.name);
        return check
          ? [
              {
                id: `lore-${l.name}`,
                fr: `Connaissance (${tr(l.name) ?? l.name})`,
                en: `${l.name} Lore`,
                check,
                actions: LORE_ACTIONS,
              },
            ]
          : [];
      }),
    ];
    const locale = sortBy === 'fr' ? 'fr' : 'en';
    return list.sort((a, b) => a[sortBy].localeCompare(b[sortBy], locale, { sensitivity: 'base' }));
  }, [c, tr, sortBy]);

  const [openId, setOpenId] = useState<string | null>(null);
  const opened = rows.find((r) => r.id === openId);

  function changeSort(next: SortBy) {
    setSortBy(next);
    try {
      localStorage.setItem(SORT_KEY, next);
    } catch {
      // préférence non mémorisée : sans conséquence
    }
  }

  return (
    <section className="card skills-card">
      <div className="card-head">
        <h3>Compétences</h3>
        <div className="segmented" role="group" aria-label="Trier par">
          {(['fr', 'en'] as const).map((s) => (
            <button
              key={s}
              type="button"
              className={sortBy === s ? 'active' : undefined}
              aria-pressed={sortBy === s}
              onClick={() => changeSort(s)}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <ul className="skills scroll-list" ref={listRef} style={{ maxHeight }}>
        {rows.map((r) => (
          <Row key={r.id} row={r} showEn={sortBy === 'en'} onOpen={() => setOpenId(r.id)} />
        ))}
      </ul>
      <p className="legend">
        Q qualifié · E expert · M maître · L légendaire · touchez pour le détail
      </p>

      {opened && (
        <SkillDialog
          c={c}
          title={opened.fr}
          en={opened.en}
          check={opened.check}
          actions={opened.actions}
          onClose={() => setOpenId(null)}
        />
      )}
    </section>
  );
}
