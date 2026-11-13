/** Modificateur de caractéristique à partir du score exporté par Pathbuilder. */
export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/** Affiche un modificateur avec son signe : +4, +0, −1. */
export function formatModifier(value: number): string {
  return value < 0 ? `−${Math.abs(value)}` : `+${value}`;
}
