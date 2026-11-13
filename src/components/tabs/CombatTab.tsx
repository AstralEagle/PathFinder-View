import type { Character } from '../../pathbuilder/model.ts';
import {
  armorClass,
  classDC,
  damageFormula,
  maxHp,
  perception,
  save,
  SAVES,
  speed,
  weaponAttack,
} from '../../rules/character.ts';
import { extraDamageFr, signed, trCore, trCoreOr } from '../../i18n/translate.ts';
import { useTr } from '../../sources/TranslationContext.ts';
import { weaponName, weaponRunes } from '../../i18n/itemNames.ts';
import type { GameState } from '../../game/state.ts';
import { formatDistance } from '../../rules/units.ts';
import { useSettings } from '../../settings.ts';
import { Name } from '../Name.tsx';
import { HeroPoints } from '../HeroPoints.tsx';

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  );
}

const extraDamage = extraDamageFr;

interface Props {
  c: Character;
  state: GameState;
  onChange: (next: GameState) => void;
}

export function CombatTab({ c, state, onChange }: Props) {
  const { distanceUnit } = useSettings();
  const trName = useTr();
  const dc = classDC(c);
  const perc = perception(c);

  return (
    <>
      <HeroPoints state={state} onChange={onChange} />
      <section className="card">
        <h3>Défenses</h3>
        <div className="stats">
          <Stat label="CA" value={String(armorClass(c))} />
          <Stat label="PV max" value={String(maxHp(c))} />
          {SAVES.map((s) => {
            const r = save(c, s.key);
            return (
              <Stat
                key={s.key}
                label={trCoreOr('saves', s.key)}
                value={signed(r.total)}
                sub={trCoreOr('ranks', r.rank)}
              />
            );
          })}
        </div>
      </section>

      <section className="card">
        <h3>Sens et déplacement</h3>
        <div className="stats">
          <Stat label="Perception" value={signed(perc.total)} sub={trCoreOr('ranks', perc.rank)} />
          <Stat label="Vitesse" value={formatDistance(speed(c), distanceUnit)} />
          {dc !== null && <Stat label="DD de classe" value={String(dc)} />}
        </div>
      </section>

      <section className="card">
        <h3>Attaques</h3>
        {c.weapons.length === 0 && <p className="muted">Aucune arme.</p>}
        <ul className="attacks">
          {c.weapons.map((w, i) => {
            const a = weaponAttack(w);
            const type = trCore('damageTypes', a.damageType);
            const formula = damageFormula(a).replace(/ \S+$/, '');
            return (
              <li key={`${w.name}-${i}`} className="attack">
                <div className="attack-name">
                  <Name
                    {...weaponName(w, trName)}
                    detail={{ kind: 'item', en: w.name, runes: weaponRunes(w) }}
                  />
                </div>
                <div className="attack-line">
                  <strong className="attack-bonus">
                    {a.attack === null ? '—' : signed(a.attack)}
                  </strong>
                  <span>
                    {formula} {type ?? a.damageType}
                    {a.extra.map((e) => ` ${extraDamage(e)}`).join('')}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
