import { trName } from '../i18n/names.ts';

interface Props {
  /** Nom anglais (VO), tel qu'exporté par Pathbuilder. */
  en: string;
  /** Traduction française. Si absente, elle est cherchée dans le dictionnaire des noms. */
  fr?: string | null;
}

/** Affiche un nom de jeu traduit, avec l'anglais entre parenthèses, ou l'anglais marqué « VO ». */
export function Name({ en, fr }: Props) {
  const translated = fr === undefined ? trName(en) : fr;
  if (translated && translated !== en) {
    return (
      <span className="name">
        {translated} <span className="name-en">({en})</span>
      </span>
    );
  }
  return (
    <span className="name">
      {en}
      {!translated && (
        <abbr className="vo" title="Pas encore traduit">
          VO
        </abbr>
      )}
    </span>
  );
}
