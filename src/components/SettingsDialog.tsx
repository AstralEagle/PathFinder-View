import { useState } from 'react';
import type { Settings } from '../settings.ts';
import { clearDetailsCache } from '../details/packs.ts';
import { Modal } from './Modal.tsx';

interface Props {
  settings: Settings;
  onChange: (next: Settings) => void;
  /** Personnage ouvert, s'il y en a un. */
  characterName: string | null;
  onChangeCharacter: () => void;
  onClose: () => void;
}

interface Option<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

function Choice<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
}: {
  name: string;
  legend: string;
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="setting">
      <legend>{legend}</legend>
      {options.map((o) => (
        <label key={o.value} className={o.value === value ? 'radio checked' : 'radio'}>
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={o.value === value}
            onChange={() => onChange(o.value)}
          />
          <span>
            {o.label}
            {o.hint && <span className="radio-hint">{o.hint}</span>}
          </span>
        </label>
      ))}
    </fieldset>
  );
}

export function SettingsDialog({
  settings,
  onChange,
  characterName,
  onChangeCharacter,
  onClose,
}: Props) {
  const [cacheCleared, setCacheCleared] = useState(false);

  return (
    <Modal title="Paramètres" onClose={onClose}>
      <Choice
        name="distance"
        legend="Distances"
        value={settings.distanceUnit}
        onChange={(distanceUnit) => onChange({ ...settings, distanceUnit })}
        options={[
          { value: 'ft', label: 'Pieds', hint: '30 pieds' },
          { value: 'm', label: 'Mètres', hint: '9 m (1,5 m par case de 5 pieds)' },
        ]}
      />

      <Choice
        name="names"
        legend="Langue des noms (dons, objets, sorts…)"
        value={settings.nameDisplay}
        onChange={(nameDisplay) => onChange({ ...settings, nameDisplay })}
        options={[
          { value: 'both', label: 'Français + anglais', hint: 'Chute féline (Cat Fall)' },
          { value: 'fr', label: 'Français seul', hint: 'Chute féline' },
          { value: 'en', label: 'Anglais seul', hint: 'Cat Fall' },
        ]}
      />

      <fieldset className="setting">
        <legend>Personnage</legend>
        {characterName && (
          <p className="muted">
            Fiche ouverte : <strong>{characterName}</strong>
          </p>
        )}
        <button
          type="button"
          className="secondary full"
          onClick={() => {
            onChangeCharacter();
            onClose();
          }}
        >
          Changer de personnage
        </button>
      </fieldset>

      <fieldset className="setting">
        <legend>Descriptions</legend>
        <p className="muted">
          Les descriptions viennent de Pathfinder-fr et sont gardées en cache pour le hors-ligne.
          Videz le cache pour récupérer les dernières traductions.
        </p>
        <button
          type="button"
          className="secondary full"
          disabled={cacheCleared}
          onClick={() => {
            void clearDetailsCache().then(() => setCacheCleared(true));
          }}
        >
          {cacheCleared ? 'Cache vidé' : 'Vider le cache des descriptions'}
        </button>
      </fieldset>

      <p className="legend">Les paramètres sont enregistrés sur cet appareil.</p>
    </Modal>
  );
}
