import { trName } from '../i18n/names.ts';
import { useSettings } from '../settings.ts';

interface Props {
  /** Nom anglais (VO), tel qu'exporté par Pathbuilder. */
  en: string;
  /** Traduction française. Si absente, elle est cherchée dans le dictionnaire des noms. */
  fr?: string | null;
}

/**
 * Affiche un nom de jeu selon le réglage « Langue des noms » :
 * français (anglais entre parenthèses), français seul, ou anglais seul.
 * Un nom sans traduction s'affiche en anglais avec le marqueur « VO ».
 */
export function Name({ en, fr }: Props) {
  const { nameDisplay } = useSettings();
  const translated = fr === undefined ? trName(en) : fr;

  if (nameDisplay === 'en') {
    return <span className="name">{en}</span>;
  }
  if (translated && translated !== en) {
    return (
      <span className="name" title={nameDisplay === 'fr' ? en : undefined}>
        {translated}
        {nameDisplay === 'both' && <span className="name-en"> ({en})</span>}
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
