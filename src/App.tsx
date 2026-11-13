import { abilityModifier, formatModifier } from './rules/abilities.ts';

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Fiche PF2</h1>
        <p className="subtitle">Votre personnage Pathbuilder 2e, en français</p>
      </header>

      <main className="app-main">
        <section className="card">
          <h2>En construction</h2>
          <p>
            L’application est en cours de mise en place. Bientôt, vous pourrez importer l’export
            JSON de Pathbuilder et consulter votre fiche à la table.
          </p>
          <p className="demo">
            Dextérité 18 → modificateur <strong>{formatModifier(abilityModifier(18))}</strong>
          </p>
        </section>
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
