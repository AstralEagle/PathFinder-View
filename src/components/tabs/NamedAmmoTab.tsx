import { useState } from 'react';
import type { GameState } from '../../game/state.ts';
import {
  addNamedAmmo,
  adjustNamedAmmo,
  fireNamedAmmo,
  namedAmmoSummary,
  recoverAllNamedAmmo,
  recoverNamedAmmo,
  removeNamedAmmo,
  renameNamedAmmo,
  setNamedAmmoNote,
  type NamedAmmo,
} from '../../game/namedAmmo.ts';

interface Props {
  state: GameState;
  onChange: (next: GameState) => void;
}

function AmmoRow({
  ammo,
  editing,
  state,
  onChange,
}: Props & { ammo: NamedAmmo; editing: boolean }) {
  if (editing) {
    return (
      <li className="ammo editing">
        <div className="ammo-edit-fields">
          <input
            aria-label="Nom"
            defaultValue={ammo.name}
            onBlur={(e) => onChange(renameNamedAmmo(state, ammo.id, e.target.value))}
          />
          <textarea
            aria-label={`Note pour ${ammo.name}`}
            rows={2}
            placeholder="Note (facultative)"
            defaultValue={ammo.note ?? ''}
            onBlur={(e) => onChange(setNamedAmmoNote(state, ammo.id, e.target.value))}
          />
        </div>
        <span className="ammo-adjust" aria-label="Touches">
          🎯
          <button
            type="button"
            onClick={() => onChange(adjustNamedAmmo(state, ammo.id, 'hits', -1))}
          >
            −
          </button>
          <strong>{ammo.hits}</strong>
          <button
            type="button"
            onClick={() => onChange(adjustNamedAmmo(state, ammo.id, 'hits', 1))}
          >
            +
          </button>
        </span>
        <span className="ammo-adjust" aria-label="Ratés">
          ✗
          <button
            type="button"
            onClick={() => onChange(adjustNamedAmmo(state, ammo.id, 'misses', -1))}
          >
            −
          </button>
          <strong>{ammo.misses}</strong>
          <button
            type="button"
            onClick={() => onChange(adjustNamedAmmo(state, ammo.id, 'misses', 1))}
          >
            +
          </button>
        </span>
        <button
          type="button"
          className="icon-button danger"
          aria-label={`Supprimer ${ammo.name}`}
          onClick={() => {
            if (window.confirm(`Supprimer « ${ammo.name} » ?`))
              onChange(removeNamedAmmo(state, ammo.id));
          }}
        >
          ✕
        </button>
      </li>
    );
  }

  return (
    <li className={ammo.held ? 'ammo' : 'ammo fired'}>
      <div className="ammo-info">
        <strong className="ammo-name" title={ammo.name}>
          {ammo.name}
        </strong>
        <span className="ammo-stats">
          {ammo.held ? 'Dans le carquois' : 'Tiré'} · 🎯 {ammo.hits} · ✗ {ammo.misses}
        </span>
        {ammo.note && (
          <span className="ammo-note" title={ammo.note}>
            {ammo.note}
          </span>
        )}
      </div>
      {ammo.held ? (
        <span className="ammo-actions">
          <button
            type="button"
            className="hp-btn plus"
            onClick={() => onChange(fireNamedAmmo(state, ammo.id, true))}
          >
            Touché
          </button>
          <button
            type="button"
            className="hp-btn minus"
            onClick={() => onChange(fireNamedAmmo(state, ammo.id, false))}
          >
            Raté
          </button>
        </span>
      ) : (
        <button
          type="button"
          className="secondary"
          onClick={() => onChange(recoverNamedAmmo(state, ammo.id))}
        >
          Récupérer
        </button>
      )}
    </li>
  );
}

export function NamedAmmoTab({ state, onChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [names, setNames] = useState('');
  const ammo = state.namedAmmo ?? [];
  const sum = namedAmmoSummary(state);
  const held = ammo.filter((a) => a.held);
  const fired = ammo.filter((a) => !a.held);

  return (
    <>
      <section className="card">
        <div className="card-head">
          <h3>Munitions nommées</h3>
          {ammo.length > 0 && (
            <button type="button" className="link-button" onClick={() => setEditing((e) => !e)}>
              {editing ? 'Terminer' : 'Modifier'}
            </button>
          )}
        </div>

        {ammo.length > 0 && (
          <p className="ammo-summary">
            <strong>{sum.held}</strong> / {sum.total} dans le carquois · 🎯 {sum.hits} touche(s) · ✗{' '}
            {sum.misses} raté(s)
          </p>
        )}

        {ammo.length === 0 && (
          <p className="muted">Aucune munition nommée. Ajoutez leurs noms ci-dessous.</p>
        )}

        {editing ? (
          <ul className="ammo-list">
            {ammo.map((a) => (
              <AmmoRow key={a.id} ammo={a} editing state={state} onChange={onChange} />
            ))}
          </ul>
        ) : (
          <>
            {held.length > 0 && (
              <ul className="ammo-list">
                {held.map((a) => (
                  <AmmoRow key={a.id} ammo={a} editing={false} state={state} onChange={onChange} />
                ))}
              </ul>
            )}
            {fired.length > 0 && (
              <>
                <div className="card-head ammo-fired-head">
                  <h4>Tirés ({fired.length})</h4>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => {
                      if (
                        window.confirm('Remettre toutes les munitions tirées dans le carquois ?')
                      ) {
                        onChange(recoverAllNamedAmmo(state));
                      }
                    }}
                  >
                    Tout récupérer
                  </button>
                </div>
                <ul className="ammo-list">
                  {fired.map((a) => (
                    <AmmoRow
                      key={a.id}
                      ammo={a}
                      editing={false}
                      state={state}
                      onChange={onChange}
                    />
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </section>

      <section className="card">
        <h3>Ajouter des munitions</h3>
        <form
          className="ammo-add"
          onSubmit={(e) => {
            e.preventDefault();
            const list = names.split('\n');
            if (list.some((n) => n.trim())) {
              onChange(addNamedAmmo(state, list));
              setNames('');
            }
          }}
        >
          <label className="field">
            <span>Un nom par ligne :</span>
            <textarea
              rows={4}
              value={names}
              onChange={(e) => setNames(e.target.value)}
              placeholder={'Aiguille\nBrise-Cœur\n…'}
            />
          </label>
          <button type="submit" className="primary" disabled={!names.trim()}>
            Ajouter
          </button>
        </form>
      </section>
    </>
  );
}
