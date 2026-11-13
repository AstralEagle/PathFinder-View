import { createContext, useContext } from 'react';
import type { DetailKind } from './packs.ts';

export interface DetailRequest {
  kind: DetailKind;
  /** Nom anglais servant de clé de recherche. */
  en: string;
  /** Nom affiché dans la fiche (par ex. avec les runes d'une arme). */
  label?: string;
}

/** Ouvre la fenêtre de détail d'un élément. */
export const DetailContext = createContext<(req: DetailRequest) => void>(() => undefined);

export function useOpenDetail(): (req: DetailRequest) => void {
  return useContext(DetailContext);
}
