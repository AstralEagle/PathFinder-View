import type { Character, EquipmentItem } from '../../pathbuilder/model.ts';
import { trCoreOr } from '../../i18n/translate.ts';
import { trName } from '../../i18n/names.ts';
import { armorName, weaponName } from '../../i18n/itemNames.ts';
import { Name } from '../Name.tsx';

function ItemList({ items }: { items: EquipmentItem[] }) {
  return (
    <ul className="items">
      {items.map((e, i) => (
        <li key={`${e.name}-${i}`}>
          <Name en={e.name} />
          {e.qty !== 1 && <span className="qty">× {e.qty}</span>}
        </li>
      ))}
    </ul>
  );
}

export function InventoryTab({ c }: { c: Character }) {
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
            <li key={`${w.name}-${i}`}>
              <Name {...weaponName(w, trName)} />
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
            <li key={`${a.name}-${i}`}>
              <Name {...armorName(a, trName)} />
              <span className="muted">
                {' '}
                · {trCoreOr('armorCategories', a.prof)}
                {a.worn ? ' · portée' : ''}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h3>Équipement</h3>
        {c.equipment.length === 0 && <p className="muted">Aucun objet.</p>}
        <ItemList items={loose} />
        {c.containers.map((ct) => {
          const inside = c.equipment.filter((e) => e.containerId === ct.id);
          return (
            <div key={ct.id} className="container">
              <h4>
                <Name en={ct.name} />
              </h4>
              {inside.length === 0 ? <p className="muted">Vide.</p> : <ItemList items={inside} />}
            </div>
          );
        })}
      </section>
    </>
  );
}
