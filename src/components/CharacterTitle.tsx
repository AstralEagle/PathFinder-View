import type { Character } from '../pathbuilder/model.ts';
import { trCore } from '../i18n/translate.ts';
import { useTr } from '../sources/TranslationContext.ts';

/** Titre de l'en-tête : nom du personnage, puis classe, ascendance et niveau. */
export function CharacterTitle({ c }: { c: Character }) {
  const tr = useTr();
  const className = trCore('classes', c.className) ?? tr(c.className) ?? c.className;
  const ancestry = trCore('ancestries', c.ancestry) ?? tr(c.ancestry) ?? c.ancestry;

  return (
    <div className="header-title">
      <h1 title={c.name}>{c.name}</h1>
      <p>
        {className} {ancestry.toLowerCase()} · niveau {c.level}
      </p>
    </div>
  );
}
