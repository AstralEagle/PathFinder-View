import type { ReactNode } from 'react';
import { useTr } from '../sources/TranslationContext.ts';
import { useSettings } from '../settings.ts';
import { useOpenDetail } from '../details/DetailContext.ts';
import type { DetailKind } from '../details/packs.ts';

interface Props {
  /** Nom anglais (VO), tel qu'exporté par Pathbuilder. */
  en: string;
  /** Traduction française. Si absente, elle est cherchée dans le dictionnaire des noms. */
  fr?: string | null;
  /**
   * Si fourni, le nom devient touchable et ouvre la description.
   * `en` permet de chercher un autre nom que celui affiché (ex. l'arme sans ses runes).
   */
  detail?: { kind: DetailKind; en?: string };
}

/**
 * Affiche un nom de jeu selon le réglage « Langue des noms » :
 * français (anglais entre parenthèses), français seul, ou anglais seul.
 * Un nom sans traduction s'affiche en anglais avec le marqueur « VO ».
 */
export function Name({ en, fr, detail }: Props) {
  const { nameDisplay } = useSettings();
  const openDetail = useOpenDetail();
  const trName = useTr();
  const translated = fr === undefined ? trName(en) : fr;

  let content: ReactNode;
  if (nameDisplay === 'en') {
    content = en;
  } else if (translated && translated !== en) {
    content = (
      <>
        {translated}
        {nameDisplay === 'both' && <span className="name-en"> ({en})</span>}
      </>
    );
  } else {
    content = (
      <>
        {en}
        {!translated && (
          <abbr className="vo" title="Pas encore traduit">
            VO
          </abbr>
        )}
      </>
    );
  }

  if (!detail) {
    return (
      <span className="name" title={nameDisplay === 'fr' && translated ? en : undefined}>
        {content}
      </span>
    );
  }

  const label = nameDisplay === 'en' ? en : (translated ?? en);
  return (
    <button
      type="button"
      className="name name-link"
      onClick={() => openDetail({ kind: detail.kind, en: detail.en ?? en, label })}
    >
      {content}
    </button>
  );
}
