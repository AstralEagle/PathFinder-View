import core from './core.fr.json';

type Section = Exclude<keyof typeof core, '_note'>;

/** Traduction d'un terme de base, ou null s'il n'est pas (encore) traduit. */
export function trCore(section: Section, key: string): string | null {
  const table = core[section] as Record<string, string>;
  return table[key] ?? null;
}

/** Traduction d'un terme de base, en gardant l'anglais si elle manque. */
export function trCoreOr(section: Section, key: string): string {
  return trCore(section, key) ?? key;
}

/** Dégâts supplémentaires Pathbuilder : « +2 precision » → « +2 précision ». */
export function extraDamageFr(s: string): string {
  return s.replace(/\bprecision\b/i, 'précision');
}

/** Signe typographique : +4, +0, −1. */
export function signed(n: number): string {
  return n < 0 ? `−${Math.abs(n)}` : `+${n}`;
}
