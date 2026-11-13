import {
  ABILITY_KEYS,
  type AbilityKey,
  type AcTotal,
  type Armor,
  type Character,
  type Container,
  type EquipmentItem,
  type Feat,
  type Lore,
  type Money,
  type ProficiencyValue,
  type SpecificProficiencies,
  type Weapon,
} from './model.ts';

export type ParseResult = { ok: true; character: Character } | { ok: false; error: string };

/** Valeurs que Pathbuilder utilise pour dire « non renseigné ». */
const EMPTY_MARKERS = new Set(['', 'not set', 'none selected', 'none']);

type Obj = Record<string, unknown>;

function isObj(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
  return fallback;
}

function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = num(v, NaN);
  return Number.isNaN(n) ? null : n;
}

function str(v: unknown, fallback = ''): string {
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number') return String(v);
  return fallback;
}

/** Chaîne optionnelle : null si absente ou marquée « Not set ». */
function optStr(v: unknown): string | null {
  const s = str(v);
  return EMPTY_MARKERS.has(s.toLowerCase()) ? null : s;
}

function strList(v: unknown): string[] {
  return asArray(v)
    .map((x) => str(x))
    .filter((s) => !EMPTY_MARKERS.has(s.toLowerCase()));
}

function proficiency(v: unknown): ProficiencyValue {
  const n = num(v);
  if (n >= 8) return 8;
  if (n >= 6) return 6;
  if (n >= 4) return 4;
  if (n >= 2) return 2;
  return 0;
}

function parseAbilityKey(v: unknown): AbilityKey | null {
  const s = str(v).toLowerCase().slice(0, 3);
  return (ABILITY_KEYS as readonly string[]).includes(s) ? (s as AbilityKey) : null;
}

function parseFeat(v: unknown): Feat | null {
  if (!Array.isArray(v)) return null;
  const name = str(v[0]);
  if (!name) return null;
  return {
    name,
    choice: optStr(v[1]),
    type: str(v[2], 'Feat'),
    level: num(v[3], 1),
    slot: optStr(v[4]),
    parent: optStr(v[6]),
  };
}

function parseLore(v: unknown): Lore | null {
  if (!Array.isArray(v)) return null;
  const name = str(v[0]);
  return name ? { name, proficiency: proficiency(v[1]) } : null;
}

function parseContainers(v: unknown): Container[] {
  if (!isObj(v)) return [];
  return Object.entries(v).map(([id, c]) => {
    const o = isObj(c) ? c : {};
    return { id, name: str(o.containerName, 'Contenant'), bagOfHolding: o.bagOfHolding === true };
  });
}

function parseEquipment(v: unknown, containerIds: Set<string>): EquipmentItem[] {
  const items: EquipmentItem[] = [];
  for (const entry of asArray(v)) {
    if (!Array.isArray(entry)) continue;
    const name = str(entry[0]);
    if (!name) continue;
    // Les éléments suivants la quantité sont des chaînes libres : on n'en retient que l'identifiant de contenant.
    const containerId =
      entry.slice(2).find((x): x is string => typeof x === 'string' && containerIds.has(x)) ?? null;
    items.push({ name, qty: num(entry[1], 1), containerId });
  }
  return items;
}

function parseWeapon(v: unknown): Weapon | null {
  if (!isObj(v)) return null;
  const name = str(v.name);
  if (!name) return null;
  return {
    name,
    display: str(v.display) || name,
    qty: num(v.qty, 1),
    prof: str(v.prof),
    die: str(v.die, 'd4'),
    potency: num(v.pot),
    striking: str(v.str),
    material: optStr(v.mat),
    runes: strList(v.runes),
    damageType: str(v.damageType),
    attack: numOrNull(v.attack),
    damageBonus: num(v.damageBonus),
    extraDamage: strList(v.extraDamage),
  };
}

function parseArmor(v: unknown): Armor | null {
  if (!isObj(v)) return null;
  const name = str(v.name);
  if (!name) return null;
  return {
    name,
    display: str(v.display) || name,
    qty: num(v.qty, 1),
    prof: str(v.prof),
    potency: num(v.pot),
    resilient: str(v.res),
    material: optStr(v.mat),
    worn: v.worn === true,
    runes: strList(v.runes),
  };
}

function parseMoney(v: unknown): Money {
  const o = isObj(v) ? v : {};
  return { cp: num(o.cp), sp: num(o.sp), gp: num(o.gp), pp: num(o.pp) };
}

function parseAcTotal(v: unknown): AcTotal | null {
  if (!isObj(v)) return null;
  const total = numOrNull(v.acTotal);
  if (total === null) return null;
  return {
    profBonus: num(v.acProfBonus),
    abilityBonus: num(v.acAbilityBonus),
    itemBonus: num(v.acItemBonus),
    total,
    shieldBonus: numOrNull(v.shieldBonus),
  };
}

function parseSpecificProficiencies(v: unknown): SpecificProficiencies {
  const o = isObj(v) ? v : {};
  return {
    trained: strList(o.trained),
    expert: strList(o.expert),
    master: strList(o.master),
    legendary: strList(o.legendary),
  };
}

function compact<T>(list: (T | null)[]): T[] {
  return list.filter((x): x is T => x !== null);
}

/**
 * Lit un export Pathbuilder 2e (objet déjà décodé) et renvoie un personnage normalisé.
 * Ne lève jamais d'exception : en cas de problème, renvoie un message d'erreur en français.
 */
export function parsePathbuilder(data: unknown): ParseResult {
  if (!isObj(data)) {
    return { ok: false, error: 'Le fichier ne contient pas un objet JSON.' };
  }
  if (data.success === false) {
    return {
      ok: false,
      error: 'Pathbuilder indique que cet export a échoué (« success »: false).',
    };
  }
  const b = data.build;
  if (!isObj(b)) {
    return {
      ok: false,
      error: 'Ce JSON ne ressemble pas à un export Pathbuilder 2e : le champ « build » est absent.',
    };
  }

  const name = str(b.name);
  if (!name) {
    return { ok: false, error: 'Le personnage n’a pas de nom (champ « build.name » absent).' };
  }
  const level = num(b.level, NaN);
  if (!Number.isInteger(level) || level < 1 || level > 20) {
    return {
      ok: false,
      error: 'Le niveau du personnage est absent ou invalide (attendu : 1 à 20).',
    };
  }

  const abilitiesRaw = isObj(b.abilities) ? b.abilities : {};
  const abilities = Object.fromEntries(
    ABILITY_KEYS.map((k) => [k, num(abilitiesRaw[k], 10)]),
  ) as Record<AbilityKey, number>;

  const attr = isObj(b.attributes) ? b.attributes : {};

  const profRaw = isObj(b.proficiencies) ? b.proficiencies : {};
  const proficiencies = Object.fromEntries(
    Object.entries(profRaw).map(([k, v]) => [k, proficiency(v)]),
  );

  const containers = parseContainers(b.equipmentContainers);

  const character: Character = {
    name,
    className: str(b.class, 'Inconnue'),
    dualClass: optStr(b.dualClass),
    level,
    ancestry: str(b.ancestry, 'Inconnue'),
    heritage: optStr(b.heritage),
    background: optStr(b.background),
    deity: optStr(b.deity),
    age: optStr(b.age),
    gender: optStr(b.gender),
    sizeName: optStr(b.sizeName),
    keyAbility: parseAbilityKey(b.keyability),
    languages: strList(b.languages),
    abilities,
    attributes: {
      ancestryHp: num(attr.ancestryhp),
      classHp: num(attr.classhp),
      bonusHp: num(attr.bonushp),
      bonusHpPerLevel: num(attr.bonushpPerLevel),
      speed: num(attr.speed, 25),
      speedBonus: num(attr.speedBonus),
    },
    proficiencies,
    specificProficiencies: parseSpecificProficiencies(b.specificProficiencies),
    feats: compact(asArray(b.feats).map(parseFeat)),
    specials: strList(b.specials),
    lores: compact(asArray(b.lores).map(parseLore)),
    equipment: parseEquipment(b.equipment, new Set(containers.map((c) => c.id))),
    containers,
    weapons: compact(asArray(b.weapons).map(parseWeapon)),
    armor: compact(asArray(b.armor).map(parseArmor)),
    money: parseMoney(b.money),
    acTotal: parseAcTotal(b.acTotal),
    spellCasters: asArray(b.spellCasters),
    focusPoints: num(b.focusPoints),
  };

  return { ok: true, character };
}

/** Variante qui part du texte brut (champ collé ou fichier importé). */
export function parsePathbuilderText(text: string): ParseResult {
  if (!text.trim()) {
    return { ok: false, error: 'Le texte est vide : collez l’export JSON de Pathbuilder.' };
  }
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return {
      ok: false,
      error: 'Ce texte n’est pas du JSON valide. Vérifiez que vous avez copié tout l’export.',
    };
  }
  return parsePathbuilder(data);
}
