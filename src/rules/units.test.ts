import { describe, expect, it } from 'vitest';
import { feetToMeters, formatDistance } from './units.ts';

describe('distances', () => {
  it('convertit 5 pieds en 1,5 m', () => {
    expect(feetToMeters(5)).toBe(1.5);
    expect(feetToMeters(30)).toBe(9);
    expect(feetToMeters(25)).toBe(7.5);
  });

  it('formate selon l’unité choisie', () => {
    expect(formatDistance(30, 'ft')).toBe('30 pieds');
    expect(formatDistance(30, 'm')).toBe('9 m');
    expect(formatDistance(25, 'm')).toBe('7,5 m');
  });
});
