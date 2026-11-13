import { describe, expect, it } from 'vitest';
import { abilityModifier, formatModifier } from './abilities.ts';

describe('abilityModifier', () => {
  it.each([
    [10, 0],
    [12, 1],
    [18, 4],
    [9, -1],
    [8, -1],
    [7, -2],
  ])('score %i → modificateur %i', (score, expected) => {
    expect(abilityModifier(score)).toBe(expected);
  });
});

describe('formatModifier', () => {
  it('ajoute le signe', () => {
    expect(formatModifier(4)).toBe('+4');
    expect(formatModifier(0)).toBe('+0');
    expect(formatModifier(-1)).toBe('−1');
  });
});
