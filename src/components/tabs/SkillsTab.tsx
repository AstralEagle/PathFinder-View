import type { ReactNode } from 'react';
import type { Character } from '../../pathbuilder/model.ts';
import { lore, skill, SKILLS, type Check } from '../../rules/character.ts';
import { signed, trCoreOr } from '../../i18n/translate.ts';
import { Name } from '../Name.tsx';

const RANK_LETTER: Record<Check['rank'], string> = {
  untrained: '–',
  trained: 'Q',
  expert: 'E',
  master: 'M',
  legendary: 'L',
};

function Row({ label, check }: { label: ReactNode; check: Check }) {
  return (
    <li className={check.proficiency === 0 ? 'skill untrained' : 'skill'}>
      <span className="skill-name">{label}</span>
      <span className="skill-ability">{trCoreOr('abilitiesShort', check.ability)}</span>
      <span className="rank" title={trCoreOr('ranks', check.rank)}>
        {RANK_LETTER[check.rank]}
      </span>
      <strong className="skill-total">{signed(check.total)}</strong>
    </li>
  );
}

export function SkillsTab({ c }: { c: Character }) {
  return (
    <section className="card">
      <h3>Compétences</h3>
      <ul className="skills">
        {SKILLS.map((s) => (
          <Row key={s.key} label={trCoreOr('skills', s.key)} check={skill(c, s.key)} />
        ))}
        {c.lores.map((l) => {
          const check = lore(c, l.name);
          return check ? (
            <Row
              key={`lore-${l.name}`}
              label={
                <>
                  Connaissance (<Name en={l.name} fr={null} />)
                </>
              }
              check={check}
            />
          ) : null;
        })}
      </ul>
      <p className="legend">Q qualifié · E expert · M maître · L légendaire</p>
    </section>
  );
}
