import { useState } from 'react';
import type { Character } from './pathbuilder/model.ts';
import { parsePathbuilderText } from './pathbuilder/parse.ts';
import { clearLastCharacter, loadLastCharacter, saveLastCharacter } from './storage.ts';
import { ImportScreen } from './components/ImportScreen.tsx';
import { Sheet } from './components/Sheet.tsx';

function initialCharacter(): Character | null {
  const raw = loadLastCharacter();
  if (!raw) return null;
  const result = parsePathbuilderText(raw);
  return result.ok ? result.character : null;
}

export default function App() {
  const [character, setCharacter] = useState<Character | null>(initialCharacter);

  function onImported(c: Character, raw: string) {
    saveLastCharacter(raw);
    setCharacter(c);
  }

  function onClose() {
    if (!window.confirm('Retirer ce personnage de l’appareil ?')) return;
    clearLastCharacter();
    setCharacter(null);
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Fiche PF2</h1>
      </header>

      <main className="app-main">
        {character ? (
          <Sheet character={character} onClose={onClose} />
        ) : (
          <ImportScreen onImported={onImported} />
        )}
      </main>

      <footer className="app-footer">
        <p>
          Outil de fan non officiel, non commercial. Pathfinder est une marque déposée de Paizo Inc.
          Cet outil n’est ni publié, ni approuvé, ni soutenu par Paizo ou Black Book Éditions.
        </p>
      </footer>
    </div>
  );
}
