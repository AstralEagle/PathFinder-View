import { Modal } from './Modal.tsx';

/** Mentions légales et crédits. */
export function AboutDialog({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="À propos" onClose={onClose}>
      <div className="about">
        <p>
          <strong>Fiche PF2</strong> affiche en français une fiche de personnage Pathfinder 2e
          (Remaster) à partir de l’export JSON de Pathbuilder 2e.
        </p>

        <h3>Mentions</h3>
        <p>
          Outil de fan non officiel, non commercial. Pathfinder est une marque déposée de Paizo Inc.
          Cet outil n’est ni publié, ni approuvé, ni soutenu par Paizo ou Black Book Éditions.
        </p>

        <h3>Sources et crédits</h3>
        <ul>
          <li>Noms officiels VF : Black Book Éditions (via le fichier du groupe).</li>
          <li>
            Traductions communautaires :{' '}
            <a
              href="https://github.com/pathfinder-fr/foundryvtt-pathfinder2-fr"
              target="_blank"
              rel="noreferrer"
            >
              Pathfinder-fr
            </a>{' '}
            (modules Foundry pf2-fr et lang-fr), non officielles, usage non commercial.
          </li>
          <li>
            Textes anglais, niveaux et traits :{' '}
            <a href="https://github.com/foundryvtt/pf2e" target="_blank" rel="noreferrer">
              système Foundry pf2e
            </a>
            .
          </li>
          <li>Personnages : export JSON de Pathbuilder 2e.</li>
        </ul>
      </div>
    </Modal>
  );
}
