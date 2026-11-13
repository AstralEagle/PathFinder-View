import type { Character } from '../pathbuilder/model.ts';

export interface NamedEntry {
  en: string;
  /** D'où vient le nom, pour le rapport des traductions manquantes. */
  kind: string;
}

/** Liste tous les noms de jeu d'un personnage qui passent par le dictionnaire des noms. */
export function collectNames(c: Character): NamedEntry[] {
  const out: NamedEntry[] = [];
  const add = (kind: string, en: string | null) => {
    if (en) out.push({ kind, en });
  };

  add('Classe', c.className);
  add('Ascendance', c.ancestry);
  add('Héritage', c.heritage);
  add('Historique', c.background);
  add('Divinité', c.deity);
  c.feats.forEach((f) => add('Don', f.name));
  c.specials.forEach((s) => add('Capacité', s));
  c.weapons.forEach((w) => add('Arme', w.name));
  c.armor.forEach((a) => add('Armure', a.name));
  c.equipment.forEach((e) => add('Équipement', e.name));
  c.containers.forEach((ct) => add('Contenant', ct.name));
  c.languages.forEach((l) => add('Langue', l));

  const seen = new Set<string>();
  return out.filter((e) => {
    const key = `${e.kind}|${e.en}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
