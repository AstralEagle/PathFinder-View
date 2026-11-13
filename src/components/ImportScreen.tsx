import { useState, type ChangeEvent } from 'react';
import type { Character } from '../pathbuilder/model.ts';
import { parsePathbuilderText } from '../pathbuilder/parse.ts';

interface Props {
  onImported: (character: Character, rawJson: string) => void;
  onCancel: () => void;
}

export function ImportScreen({ onImported, onCancel }: Props) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  function tryImport(raw: string) {
    const result = parsePathbuilderText(raw);
    if (result.ok) {
      setError(null);
      onImported(result.character, raw);
    } else {
      setError(result.error);
    }
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      tryImport(await file.text());
    } catch {
      setError('Impossible de lire ce fichier.');
    }
  }

  return (
    <section className="card import">
      <h2>Importer un personnage</h2>
      <p>
        Dans Pathbuilder 2e : <em>Menu → Export → Export JSON</em>, puis collez le texte ici ou
        choisissez le fichier <code>.json</code>.
      </p>

      <label className="file-button">
        Choisir un fichier .json
        <input type="file" accept=".json,application/json" onChange={onFile} />
      </label>

      <label className="field">
        <span>Ou collez le JSON :</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder='{"success":true,"build":{…}}'
          spellCheck={false}
        />
      </label>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="actions">
        <button type="button" className="secondary" onClick={onCancel}>
          Annuler
        </button>
        <button type="button" className="primary" onClick={() => tryImport(text)}>
          Importer
        </button>
      </div>
      <p className="legend">
        Si un personnage du même nom existe déjà, son build sera mis à jour (après confirmation) en
        gardant ses PV et ses consommables.
      </p>
    </section>
  );
}
