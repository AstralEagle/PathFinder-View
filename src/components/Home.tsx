import type { StoredCharacter } from '../game/roster.ts';
import { loadCharacter } from '../game/roster.ts';
import { maxHp } from '../rules/character.ts';
import { trCore } from '../i18n/translate.ts';
import { useTr } from '../sources/TranslationContext.ts';

interface Props {
  characters: StoredCharacter[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onImport: () => void;
}

export function Home({ characters, onOpen, onDelete, onImport }: Props) {
  const trName = useTr();
  return (
    <>
      <section className="card">
        <h3>Mes personnages</h3>
        {characters.length === 0 && (
          <p className="muted">Aucun personnage sur cet appareil. Importez-en un pour commencer.</p>
        )}
        <ul className="roster">
          {characters.map((sc) => {
            const c = loadCharacter(sc);
            const cls = c
              ? (trCore('classes', c.className) ?? trName(c.className) ?? c.className)
              : null;
            return (
              <li key={sc.id} className="roster-item">
                <button type="button" className="roster-open" onClick={() => onOpen(sc.id)}>
                  <strong>{sc.name}</strong>
                  <span className="muted">
                    {c ? `${cls} · niveau ${c.level}` : 'Build illisible'}
                    {c && ` · PV ${sc.state.hp.current}/${maxHp(c)}`}
                  </span>
                </button>
                <button
                  type="button"
                  className="icon-button danger"
                  aria-label={`Supprimer ${sc.name}`}
                  onClick={() => onDelete(sc.id)}
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <button type="button" className="primary" onClick={onImport}>
        Importer un personnage
      </button>
    </>
  );
}
