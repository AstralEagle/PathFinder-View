import type { Character, EquipmentItem } from '../../pathbuilder/model.ts';
import { adjustConsumable, isConsumable, type GameState } from '../../game/state.ts';
import { trCoreOr } from '../../i18n/translate.ts';
import { useTr } from '../../sources/TranslationContext.ts';
import { armorName, armorRunes, weaponName, weaponRunes } from '../../i18n/itemNames.ts';
import { Name } from '../Name.tsx';
import { Stepper } from '../Stepper.tsx';

interface Props {
  c: Character;
  state: GameState;
  onChange: (next: GameState) => void;
}

function ItemList({ items, state, onChange }: Omit<Props, 'c'> & { items: EquipmentItem[] }) {
  const trName = useTr();
  return (
    <ul className="items">
      {items.map((e, i) => {
        const tracked = isConsumable(e) && e.name in state.consumables;
        return (
          <li key={`${e.name}-${i}`} className={tracked ? 'item consumable' : 'item'}>
            <Name en={e.name} detail={{ kind: 'item' }} />
            {tracked ? (
              <Stepper
                value={state.consumables[e.name] ?? 0}
                label={trName(e.name) ?? e.name}
                onChange={(d) => onChange(adjustConsumable(state, e.name, d))}
              />
            ) : (
              e.qty !== 1 && <span className="qty">× {e.qty}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function InventoryTab({ c, state, onChange }: Props) {
  const trName = useTr();
  const loose = c.equipment.filter((e) => e.containerId === null);
  const m = c.money;

  return (
    <>
      <section className="card">
        <h3>Argent</h3>
        <p className="money">
          <span>{m.pp} pp</span>
          <span>{m.gp} po</span>
          <span>{m.sp} pa</span>
          <span>{m.cp} pc</span>
        </p>
      </section>

      <section className="card">
        <h3>Armes</h3>
        {c.weapons.length === 0 && <p className="muted">Aucune arme.</p>}
        <ul className="items">
          {c.weapons.map((w, i) => (
            <li key={`${w.name}-${i}`} className="item">
              <Name
                {...weaponName(w, trName)}
                detail={{ kind: 'item', en: w.name, runes: weaponRunes(w) }}
              />
              {w.qty !== 1 && <span className="qty">× {w.qty}</span>}
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h3>Armure</h3>
        {c.armor.length === 0 && <p className="muted">Aucune armure.</p>}
        <ul className="items">
          {c.armor.map((a, i) => (
            <li key={`${a.name}-${i}`} className="item">
              <span>
                <Name
                  {...armorName(a, trName)}
                  detail={{ kind: 'item', en: a.name, runes: armorRunes(a) }}
                />
                <span className="muted">
                  {' '}
                  · {trCoreOr('armorCategories', a.prof)}
                  {a.worn ? ' · portée' : ''}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h3>Équipement</h3>
        {c.equipment.length === 0 && <p className="muted">Aucun objet.</p>}
        <ItemList items={loose} state={state} onChange={onChange} />
        {c.containers.map((ct) => {
          const inside = c.equipment.filter((e) => e.containerId === ct.id);
          return (
            <div key={ct.id} className="container">
              <h4>
                <Name en={ct.name} />
              </h4>
              {inside.length === 0 ? (
                <p className="muted">Vide.</p>
              ) : (
                <ItemList items={inside} state={state} onChange={onChange} />
              )}
            </div>
          );
        })}
      </section>
    </>
  );
}
