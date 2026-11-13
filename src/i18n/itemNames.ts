import type { Armor, Weapon } from '../pathbuilder/model.ts';
import type { Lookup } from './lookup.ts';
import { trCore } from './translate.ts';

export interface DisplayName {
  en: string;
  fr: string | null;
}

/**
 * Nom complet d'une arme ou d'une armure à runes, ex. « Arbalète lourde +1 de frappe ».
 * Si une partie n'est pas traduite, renvoie fr = null : on affiche alors le nom Pathbuilder en VO.
 */
function runedName(
  base: string,
  display: string,
  potency: number,
  fundamental: string,
  material: string | null,
  propertyRunes: string[],
  lookup: Lookup,
): DisplayName {
  const parts = [lookup(base)];
  if (potency > 0) parts.push(`+${potency}`);
  if (fundamental) parts.push(trCore('fundamentalRunes', fundamental));
  if (material) parts.push(lookup(material));
  for (const rune of propertyRunes) parts.push(lookup(rune));

  const complete = parts.every((p): p is string => p !== null);
  return { en: display, fr: complete ? parts.join(' ') : null };
}

export function weaponName(w: Weapon, lookup: Lookup): DisplayName {
  return runedName(w.name, w.display, w.potency, w.striking, w.material, w.runes, lookup);
}

export function armorName(a: Armor, lookup: Lookup): DisplayName {
  return runedName(a.name, a.display, a.potency, a.resilient, a.material, a.runes, lookup);
}
