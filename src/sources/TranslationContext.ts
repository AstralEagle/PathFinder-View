import { createContext, useContext } from 'react';
import type { Lookup } from '../i18n/lookup.ts';
import { EMPTY_GROUP, type GroupData } from './groupFile.ts';
import type { LangTable } from './langFr.ts';
import { buildNameLookup, type NameSources } from './chain.ts';

export interface Translation {
  /** Traduit un nom anglais selon la chaîne des sources, ou null. */
  tr: Lookup;
  sources: NameSources;
  group: GroupData;
  lang: LangTable | null;
  /** Enregistre une traduction saisie dans l'appli (source n°3). */
  setLocalName: (en: string, fr: string) => void;
}

const empty: NameSources = { group: EMPTY_GROUP, local: {}, lang: null };

export const TranslationContext = createContext<Translation>({
  tr: buildNameLookup(empty),
  sources: empty,
  group: EMPTY_GROUP,
  lang: null,
  setLocalName: () => undefined,
});

export function useTranslation(): Translation {
  return useContext(TranslationContext);
}

/** Raccourci : la fonction de traduction des noms. */
export function useTr(): Lookup {
  return useContext(TranslationContext).tr;
}
