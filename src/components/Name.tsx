interface Props {
  /** Nom anglais (VO), tel qu'exporté par Pathbuilder. */
  en: string;
  /** Traduction française, ou null si elle manque. */
  fr: string | null;
}

/** Affiche un nom de jeu traduit, avec l'anglais entre parenthèses, ou l'anglais marqué « VO ». */
export function Name({ en, fr }: Props) {
  if (fr && fr !== en) {
    return (
      <span className="name">
        {fr} <span className="name-en">({en})</span>
      </span>
    );
  }
  return (
    <span className="name">
      {en}
      {!fr && (
        <abbr className="vo" title="Pas encore traduit">
          VO
        </abbr>
      )}
    </span>
  );
}
