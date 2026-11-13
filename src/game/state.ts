import type { Character, EquipmentItem } from '../pathbuilder/model.ts';
import { maxHp } from '../rules/character.ts';
import type { NamedAmmo } from './namedAmmo.ts';

/** État de jeu modifié en partie. Le build Pathbuilder, lui, reste en lecture seule. */
export interface GameState {
  hp: { current: number; temp: number };
  /** 0 à 3. */
  heroPoints: number;
  /** Clé = nom de l'objet (VO), valeur = quantité restante. */
  consumables: Record<string, number>;
  /** Rang de sort → nombre d'emplacements utilisés. */
  spellSlotsUsed: Record<number, number>;
  focusPointsUsed: number;
  /** Onglet optionnel « Munitions nommées » activé pour ce personnage. */
  namedAmmoEnabled?: boolean;
  /** Munitions nommées par le joueur (ex. carreaux baptisés). */
  namedAmmo?: NamedAmmo[];
  updatedAt: string;
}

export const MAX_HERO_POINTS = 3;

/**
 * Mots qui signalent un consommable ou une munition. Faute de traits dans l'export Pathbuilder,
 * on repère les consommables par leur nom, ou par une quantité supérieure à 1.
 */
const CONSUMABLE_PATTERNS = [
  /\b(potion|elixir|mutagen|oil|scroll|talisman|bomb|poison|tonic|draught|salve)\b/i,
  /\b(arrows?|bolts?|rounds?|darts?|sling bullets?|blowgun darts?|javelins?|shuriken)\b/i,
  /\b(rations?|torch(es)?|candles?|chalk|caltrops|healer'?s gloves)\b/i,
];

export function isConsumable(item: EquipmentItem): boolean {
  return item.qty > 1 || CONSUMABLE_PATTERNS.some((re) => re.test(item.name));
}

/** Consommables du build, regroupés par nom, avec leur quantité d'origine. */
export function consumableItems(c: Character): { name: string; qty: number }[] {
  const totals = new Map<string, number>();
  for (const item of c.equipment) {
    if (!isConsumable(item)) continue;
    totals.set(item.name, (totals.get(item.name) ?? 0) + item.qty);
  }
  return [...totals.entries()].map(([name, qty]) => ({ name, qty }));
}

function touch(s: Omit<GameState, 'updatedAt'>): GameState {
  return { ...s, updatedAt: new Date().toISOString() };
}

function clampInt(n: number, min: number, max = Number.POSITIVE_INFINITY): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

export function initialGameState(c: Character): GameState {
  return touch({
    hp: { current: maxHp(c), temp: 0 },
    heroPoints: 1,
    consumables: Object.fromEntries(consumableItems(c).map((i) => [i.name, i.qty])),
    spellSlotsUsed: {},
    focusPointsUsed: 0,
  });
}

/** Dégâts : les PV temporaires absorbent en premier. Les PV ne descendent pas sous 0. */
export function applyDamage(s: GameState, amount: number): GameState {
  const dmg = clampInt(amount, 0);
  const absorbed = Math.min(s.hp.temp, dmg);
  return touch({
    ...s,
    hp: { temp: s.hp.temp - absorbed, current: Math.max(0, s.hp.current - (dmg - absorbed)) },
  });
}

/** Soins : plafonnés aux PV max. */
export function applyHealing(s: GameState, amount: number, max: number): GameState {
  const heal = clampInt(amount, 0);
  return touch({ ...s, hp: { ...s.hp, current: Math.min(max, s.hp.current + heal) } });
}

export function setTempHp(s: GameState, temp: number): GameState {
  return touch({ ...s, hp: { ...s.hp, temp: clampInt(temp, 0) } });
}

export function setHeroPoints(s: GameState, n: number): GameState {
  return touch({ ...s, heroPoints: clampInt(n, 0, MAX_HERO_POINTS) });
}

export function adjustConsumable(s: GameState, name: string, delta: number): GameState {
  const current = s.consumables[name] ?? 0;
  return touch({
    ...s,
    consumables: { ...s.consumables, [name]: clampInt(current + delta, 0) },
  });
}

/**
 * Après un ré-import : garde l'état de jeu, mais recadre ce qui n'est plus valide.
 * - PV actuels plafonnés au nouveau max ;
 * - consommables disparus retirés, nouveaux consommables ajoutés avec leur quantité d'origine.
 */
export function reconcile(s: GameState, c: Character): GameState {
  const max = maxHp(c);
  const consumables: Record<string, number> = {};
  for (const item of consumableItems(c)) {
    consumables[item.name] = s.consumables[item.name] ?? item.qty;
  }
  return touch({
    ...s,
    hp: { current: clampInt(s.hp.current, 0, max), temp: clampInt(s.hp.temp, 0) },
    heroPoints: clampInt(s.heroPoints, 0, MAX_HERO_POINTS),
    consumables,
  });
}
