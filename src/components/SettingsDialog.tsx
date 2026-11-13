import { useState } from 'react';
import type { Settings } from '../settings.ts';
import type { Dictionary } from '../i18n/lookup.ts';
import { clearSourcesCache } from '../sources/cache.ts';
import type { GroupStatus } from '../sources/useTranslationState.ts';
import { Modal } from './Modal.tsx';

interface Props {
  settings: Settings;
  onChange: (next: Settings) => void;
  /** Personnage ouvert, s'il y en a un. */
  characterName: string | null;
  onChangeCharacter: () => void;
  groupStatus: GroupStatus;
  onReloadGroup: () => void;
  localNames: Dictionary;
  onClearLocal: () => void;
  onClose: () => void;
}

function GroupBadge({ status }: { status: GroupStatus }) {
  switch (status.state) {
    case 'none':
      return <span className="badge">non configuré</span>;
    case 'loading':
      return <span className="badge">chargement…</span>;
    case 'ok':
      return (
        <span
          className="badge ok"
          title={`Mis à jour le ${new Date(status.fetchedAt).toLocaleString('fr-FR')}`}
        >
          {status.count} nom(s)
        </span>
      );
    case 'error':
      return (
        <span className="badge error" title={status.message}>
          injoignable{status.cachedCount ? ` (copie locale : ${status.cachedCount})` : ''}
        </span>
      );
  }
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
  groupStatus,
  onReloadGroup,
  localNames,
  onClearLocal,
  onClose,
}: Props) {
  const [cacheCleared, setCacheCleared] = useState(false);
  const [urlDraft, setUrlDraft] = useState(settings.groupUrl);

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
        <legend>Sources de traduction</legend>
        <ol className="source-list">
          <li>
            <strong>Fichier du groupe</strong> : noms officiels BBE{' '}
            <GroupBadge status={groupStatus} />
          </li>
          <li>
            <strong>Pathfinder-fr</strong> (module Foundry pf2-fr) : noms et descriptions
          </li>
          <li>
            <strong>Saisie locale</strong> : {Object.keys(localNames).length} traduction(s) sur cet
            appareil
          </li>
          <li>
            <strong>Pathfinder-fr</strong> (module Foundry lang-fr) : traits, langues, états
          </li>
          <li>
            <strong>Foundry pf2e</strong> : texte officiel anglais, niveau, traits
          </li>
        </ol>

        <form
          className="url-form"
          onSubmit={(e) => {
            e.preventDefault();
            onChange({ ...settings, groupUrl: urlDraft.trim() });
          }}
        >
          <label>
            <span>Adresse du fichier du groupe (Gist GitHub ou autre JSON)</span>
            <input
              type="url"
              inputMode="url"
              placeholder="https://gist.github.com/…"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
            />
          </label>
          <div className="actions">
            <button
              type="button"
              className="secondary"
              disabled={!settings.groupUrl || groupStatus.state === 'loading'}
              onClick={onReloadGroup}
            >
              Recharger
            </button>
            <button
              type="submit"
              className="primary"
              disabled={urlDraft.trim() === settings.groupUrl}
            >
              Enregistrer l’adresse
            </button>
          </div>
        </form>

        {Object.keys(localNames).length > 0 && (
          <details className="local-export">
            <summary>Voir mes traductions locales (à copier dans le fichier du groupe)</summary>
            <textarea readOnly rows={6} value={JSON.stringify(localNames, null, 2)} />
            <button
              type="button"
              className="secondary full"
              onClick={() => {
                if (window.confirm('Effacer toutes les traductions saisies sur cet appareil ?')) {
                  onClearLocal();
                }
              }}
            >
              Effacer mes traductions locales
            </button>
          </details>
        )}

        <button
          type="button"
          className="secondary full"
          disabled={cacheCleared}
          onClick={() => {
            void clearSourcesCache().then(() => setCacheCleared(true));
          }}
        >
          {cacheCleared ? 'Cache vidé' : 'Vider le cache des sources'}
        </button>
        <p className="legend">
          Les sources téléchargées sont gardées sur l’appareil pour le hors-ligne. Videz le cache
          pour récupérer leurs dernières versions.
        </p>
      </fieldset>

      <p className="legend">Les paramètres sont enregistrés sur cet appareil.</p>
    </Modal>
  );
}
