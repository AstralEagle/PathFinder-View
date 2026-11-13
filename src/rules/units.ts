export type DistanceUnit = 'ft' | 'm';

/** Conversion de la VF : 5 pieds = 1,5 mètre (une case). */
export function feetToMeters(feet: number): number {
  return Math.round((feet / 5) * 1.5 * 10) / 10;
}

/** « 30 pieds » ou « 9 m ». */
export function formatDistance(feet: number, unit: DistanceUnit): string {
  if (unit === 'm') {
    return `${feetToMeters(feet).toLocaleString('fr-FR')} m`;
  }
  return `${feet} pieds`;
}
