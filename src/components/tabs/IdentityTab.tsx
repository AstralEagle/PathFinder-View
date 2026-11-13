import type { ReactNode } from 'react';
import { ABILITY_KEYS, type Character } from '../../pathbuilder/model.ts';
import { mod } from '../../rules/character.ts';
import { signed, trCore, trCoreOr } from '../../i18n/translate.ts';
import { Name } from '../Name.tsx';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="field-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

const EMPTY = <span className="muted">—</span>;

export function IdentityTab({ c }: { c: Character }) {
  return (
    <>
      <section className="card">
        <h3>Caractéristiques</h3>
        <div className="abilities">
          {ABILITY_KEYS.map((k) => (
            <div key={k} className={k === c.keyAbility ? 'ability key' : 'ability'}>
              <span className="ability-name">{trCoreOr('abilitiesShort', k)}</span>
              <strong className="ability-mod">{signed(mod(c, k))}</strong>
            </div>
          ))}
        </div>
        {c.keyAbility && (
          <p className="legend">Caractéristique clé : {trCoreOr('abilities', c.keyAbility)}</p>
        )}
      </section>

      <section className="card">
        <h3>Identité</h3>
        <dl className="fields">
          <Field label="Classe">
            <Name en={c.className} fr={trCore('classes', c.className)} />
          </Field>
          <Field label="Niveau">{c.level}</Field>
          <Field label="Ascendance">
            <Name en={c.ancestry} fr={trCore('ancestries', c.ancestry)} />
          </Field>
          <Field label="Héritage">{c.heritage ? <Name en={c.heritage} fr={null} /> : EMPTY}</Field>
          <Field label="Historique">
            {c.background ? (
              <Name en={c.background} fr={trCore('backgrounds', c.background)} />
            ) : (
              EMPTY
            )}
          </Field>
          <Field label="Taille">{c.sizeName ? trCoreOr('sizes', c.sizeName) : EMPTY}</Field>
          <Field label="Langues">
            {c.languages.length === 0
              ? EMPTY
              : c.languages.map((l, i) => (
                  <span key={l}>
                    {i > 0 && ', '}
                    <Name en={l} fr={null} />
                  </span>
                ))}
          </Field>
          <Field label="Divinité">{c.deity ?? EMPTY}</Field>
          <Field label="Âge">{c.age ?? EMPTY}</Field>
          <Field label="Genre">{c.gender ?? EMPTY}</Field>
        </dl>
      </section>
    </>
  );
}
