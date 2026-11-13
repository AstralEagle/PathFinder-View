import { describe, expect, it } from 'vitest';
import flacon from '../../fixtures/flacon.json';
import { parsePathbuilder } from '../pathbuilder/parse.ts';
import type { FoundryItem } from '../sources/foundry.ts';
import { actionGlyph, characterActionCandidates, classifyAction } from './actions.ts';

const item = (over: Partial<FoundryItem>): FoundryItem => ({
  name: 'X',
  level: 1,
  rarity: null,
  traits: [],
  actionType: null,
  actions: null,
  prereq: [],
  description: '',
  ...over,
});

describe('classifyAction', () => {
  it('range chaque type', () => {
    expect(classifyAction(item({ actionType: 'action', actions: 1 }))).toBe('action');
    expect(classifyAction(item({ actionType: 'action', actions: 2 }))).toBe('activity');
    expect(classifyAction(item({ actionType: 'action', actions: 3 }))).toBe('activity');
    expect(classifyAction(item({ actionType: 'reaction' }))).toBe('reaction');
    expect(classifyAction(item({ actionType: 'free' }))).toBe('free');
    expect(classifyAction(item({ actionType: 'passive', traits: ['exploration'] }))).toBe(
      'activity',
    );
    expect(classifyAction(item({ actionType: 'passive', traits: ['general'] }))).toBeNull();
  });
});

describe('actionGlyph', () => {
  it('donne le symbole du coût', () => {
    expect(actionGlyph(item({ actionType: 'action', actions: 2 }))).toBe('◆◆');
    expect(actionGlyph(item({ actionType: 'reaction' }))).toBe('⟲');
    expect(actionGlyph(item({ actionType: 'free' }))).toBe('◇');
    expect(actionGlyph(item({ actionType: 'passive' }))).toBe('');
  });
});

describe('characterActionCandidates', () => {
  it('liste dons et capacités sans doublon', () => {
    const r = parsePathbuilder(flacon);
    if (!r.ok) throw new Error(r.error);
    const list = characterActionCandidates(r.character);
    expect(list.filter((x) => x.en === 'Tailed Goblin')).toHaveLength(1);
    expect(list).toContainEqual({ kind: 'feat', en: 'Running Reload', origin: 'feat' });
    expect(list).toContainEqual({ kind: 'special', en: 'Covered Reload', origin: 'special' });
  });
});
