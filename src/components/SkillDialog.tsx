import type { Character } from '../pathbuilder/model.ts';
import { checkBreakdown, type Check } from '../rules/character.ts';
import type { SkillAction } from '../game/skillActions.ts';
import { signed, trCoreOr } from '../i18n/translate.ts';
import { Modal } from './Modal.tsx';
import { Name } from './Name.tsx';

interface Props {
  c: Character;
  title: string;
  en: string;
  check: Check;
  actions: SkillAction[];
  onClose: () => void;
}

/** Fenêtre d'une compétence : détail du bonus et actions qu'elle permet. */
export function SkillDialog({ c, title, en, check, actions, onClose }: Props) {
  const b = checkBreakdown(c, check);
  const trained = check.proficiency > 0;

  return (
    <Modal title={title} onClose={onClose}>
      <p className="detail-en">{en}</p>

      <div className="skill-total-big">
        <strong>{signed(b.total)}</strong>
        <span>{trCoreOr('ranks', check.rank)}</span>
      </div>

      <h3>Détail du bonus</h3>
      <dl className="breakdown">
        <div>
          <dt>{trCoreOr('abilities', check.ability)}</dt>
          <dd>{signed(b.abilityMod)}</dd>
        </div>
        <div>
          <dt>
            Maîtrise : {trCoreOr('ranks', check.rank).toLowerCase()}
            {trained && (
              <span className="muted">
                {' '}
                ({b.rankValue} + niveau {b.levelBonus})
              </span>
            )}
          </dt>
          <dd>{signed(b.proficiencyBonus)}</dd>
        </div>
        {b.other !== 0 && (
          <div>
            <dt>Malus d’armure et autres</dt>
            <dd>{signed(b.other)}</dd>
          </div>
        )}
        <div className="breakdown-total">
          <dt>Total</dt>
          <dd>{signed(b.total)}</dd>
        </div>
      </dl>
      <p className="legend">
        Les bonus d’objet, de circonstance et de statut ne sont pas inclus (Pathbuilder ne les
        exporte pas).
      </p>

      <h3>Ce que permet la compétence</h3>
      <ul className="skill-actions">
        {actions.map((a) => (
          <li key={a.en} className={a.trained && !trained ? 'locked' : undefined}>
            <Name en={a.en} detail={{ kind: 'action' }} />
            {a.trained && (
              <span className={trained ? 'badge' : 'badge error'}>
                {trained ? 'Qualifié' : 'Qualifié requis'}
              </span>
            )}
          </li>
        ))}
      </ul>
      <p className="legend">Touchez une action pour lire sa description.</p>
    </Modal>
  );
}
