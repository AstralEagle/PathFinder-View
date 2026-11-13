import type { SkillKey } from '../rules/character.ts';

/** Action de compétence : nom anglais (clé des sources) et rang « qualifié » requis ou non. */
export interface SkillAction {
  en: string;
  trained?: boolean;
}

const recall = (skill: string): SkillAction => ({ en: `Recall Knowledge (${skill})` });

/** Actions permises par chaque compétence (règles Remaster). */
export const SKILL_ACTIONS: Record<SkillKey, SkillAction[]> = {
  acrobatics: [
    { en: 'Balance' },
    { en: 'Tumble Through' },
    { en: 'Maneuver in Flight', trained: true },
    { en: 'Squeeze', trained: true },
  ],
  arcana: [
    recall('Arcana'),
    { en: 'Borrow an Arcane Spell', trained: true },
    { en: 'Decipher Writing', trained: true },
    { en: 'Identify Magic', trained: true },
    { en: 'Learn a Spell', trained: true },
  ],
  athletics: [
    { en: 'Climb' },
    { en: 'Force Open' },
    { en: 'Grapple' },
    { en: 'High Jump' },
    { en: 'Long Jump' },
    { en: 'Reposition' },
    { en: 'Shove' },
    { en: 'Swim' },
    { en: 'Trip' },
    { en: 'Disarm', trained: true },
  ],
  crafting: [
    recall('Crafting'),
    { en: 'Repair' },
    { en: 'Craft', trained: true },
    { en: 'Identify Alchemy', trained: true },
  ],
  deception: [
    { en: 'Create a Diversion' },
    { en: 'Impersonate' },
    { en: 'Lie' },
    { en: 'Feint', trained: true },
  ],
  diplomacy: [{ en: 'Gather Information' }, { en: 'Make an Impression' }, { en: 'Request' }],
  intimidation: [{ en: 'Coerce' }, { en: 'Demoralize' }],
  medicine: [
    recall('Medicine'),
    { en: 'Administer First Aid' },
    { en: 'Treat Disease', trained: true },
    { en: 'Treat Poison', trained: true },
    { en: 'Treat Wounds', trained: true },
  ],
  nature: [
    recall('Nature'),
    { en: 'Command an Animal' },
    { en: 'Identify Magic', trained: true },
    { en: 'Learn a Spell', trained: true },
  ],
  occultism: [
    recall('Occultism'),
    { en: 'Decipher Writing', trained: true },
    { en: 'Identify Magic', trained: true },
    { en: 'Learn a Spell', trained: true },
  ],
  performance: [{ en: 'Perform' }],
  religion: [
    recall('Religion'),
    { en: 'Decipher Writing', trained: true },
    { en: 'Identify Magic', trained: true },
    { en: 'Learn a Spell', trained: true },
  ],
  society: [
    recall('Society'),
    { en: 'Subsist' },
    { en: 'Create Forgery', trained: true },
    { en: 'Decipher Writing', trained: true },
  ],
  stealth: [{ en: 'Avoid Notice' }, { en: 'Conceal an Object' }, { en: 'Hide' }, { en: 'Sneak' }],
  survival: [
    { en: 'Sense Direction' },
    { en: 'Subsist' },
    { en: 'Cover Tracks', trained: true },
    { en: 'Track', trained: true },
  ],
  thievery: [
    { en: 'Palm an Object' },
    { en: 'Steal' },
    { en: 'Disable Device', trained: true },
    { en: 'Pick a Lock', trained: true },
  ],
};

export const LORE_ACTIONS: SkillAction[] = [recall('Lore'), { en: 'Subsist' }];
