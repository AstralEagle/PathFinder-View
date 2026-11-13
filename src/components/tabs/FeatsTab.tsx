import type { Character, Feat } from '../../pathbuilder/model.ts';
import { trCore } from '../../i18n/translate.ts';
import { Name } from '../Name.tsx';

const TYPE_ORDER = [
  'Heritage',
  'Ancestry Feat',
  'Class Feat',
  'Archetype Feat',
  'Skill Feat',
  'General Feat',
  'Awarded Feat',
];

function groupByType(feats: Feat[]): [string, Feat[]][] {
  const groups = new Map<string, Feat[]>();
  for (const f of feats) {
    const list = groups.get(f.type) ?? [];
    list.push(f);
    groups.set(f.type, list);
  }
  const rank = (t: string) => {
    const i = TYPE_ORDER.indexOf(t);
    return i === -1 ? TYPE_ORDER.length : i;
  };
  return [...groups.entries()]
    .sort(([a], [b]) => rank(a) - rank(b))
    .map(([type, list]) => [type, list.sort((x, y) => x.level - y.level)]);
}

export function FeatsTab({ c }: { c: Character }) {
  return (
    <>
      {groupByType(c.feats).map(([type, feats]) => (
        <section className="card" key={type}>
          <h3>{trCore('featTypes', type) ?? type}</h3>
          <ul className="feats">
            {feats.map((f, i) => (
              <li key={`${f.name}-${i}`}>
                <span className="feat-level">niv. {f.level}</span>
                <Name en={f.name} />
                {f.choice && <span className="muted"> : {f.choice}</span>}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="card">
        <h3>Capacités</h3>
        {c.specials.length === 0 && <p className="muted">Aucune capacité.</p>}
        <ul className="feats">
          {c.specials.map((s) => (
            <li key={s}>
              <Name en={s} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
