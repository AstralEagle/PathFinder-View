/**
 * Les descriptions Pathfinder-fr viennent de Foundry VTT et contiennent des balises propres à Foundry :
 *   @Compendium[pf2e.actionspf2e.xxx]{Escalader}   @UUID[...]{Texte}
 *   @Check[type:reflex|dc:20|basic:true]           @Damage[2d6[fire]]
 *   @Template[type:burst|distance:20]              [[/r {1d8}[healing]]]{1d8 points de vie}
 * Ce module les remplace par du texte lisible. Fonction pure, sans DOM.
 */

const SAVES_FR: Record<string, string> = {
  fortitude: 'Vigueur',
  reflex: 'Réflexes',
  will: 'Volonté',
  perception: 'Perception',
  flat: 'nu',
};

const DAMAGE_FR: Record<string, string> = {
  fire: 'feu',
  cold: 'froid',
  electricity: 'électricité',
  acid: 'acide',
  sonic: 'son',
  poison: 'poison',
  mental: 'mental',
  bleed: 'saignement',
  force: 'force',
  vitality: 'vitalité',
  void: 'vide',
  spirit: 'esprit',
  piercing: 'perforants',
  slashing: 'tranchants',
  bludgeoning: 'contondants',
  precision: 'précision',
  healing: 'soins',
  persistent: 'persistants',
  splash: 'éclaboussure',
};

const TEMPLATE_FR: Record<string, string> = {
  burst: 'explosion',
  cone: 'cône',
  emanation: 'émanation',
  line: 'ligne',
};

/** Lit le contenu entre crochets équilibrés à partir de `start` (qui pointe sur « [ »). */
function readBracket(s: string, start: number, open = '[', close = ']'): [string, number] | null {
  if (s[start] !== open) return null;
  let depth = 0;
  for (let i = start; i < s.length; i++) {
    if (s[i] === open) depth++;
    else if (s[i] === close) {
      depth--;
      if (depth === 0) return [s.slice(start + 1, i), i + 1];
    }
  }
  return null;
}

/** « type:reflex|dc:20|basic:true » → { type: 'reflex', dc: '20', basic: 'true' } ; « reflex|dc:20 » aussi. */
function params(inner: string): Record<string, string> {
  const out: Record<string, string> = {};
  inner.split('|').forEach((part, i) => {
    const idx = part.indexOf(':');
    if (idx === -1) {
      if (i === 0) out.type = part.trim();
      else out[part.trim()] = 'true';
    } else {
      out[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
    }
  });
  return out;
}

/** « 2d6[fire] », « (2d6+4)[persistent,fire] » → « 2d6 feu », « (2d6+4) persistants feu ». */
function damageText(formula: string): string {
  return formula
    .replace(/\[([^\]]*)\]/g, (_, types: string) => {
      const words = types
        .split(',')
        .map((t) => DAMAGE_FR[t.trim()] ?? t.trim())
        .join(' ');
      return ` ${words}`;
    })
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function feetToMeters(feet: number): string {
  return `${String(Math.round((feet / 5) * 1.5 * 10) / 10).replace('.', ',')} m`;
}

function renderTag(tag: string, inner: string): string {
  switch (tag) {
    case 'Check': {
      const p = params(inner);
      const save = SAVES_FR[p.type ?? ''] ?? p.type ?? '';
      const basic = p.basic === 'true' ? ' basique' : '';
      return p.dc ? `${save} DD ${p.dc}${basic}` : `${save}${basic}`;
    }
    case 'Damage':
      return damageText(inner);
    case 'Template': {
      const p = params(inner);
      const shape = TEMPLATE_FR[p.type ?? ''] ?? p.type ?? 'zone';
      const dist = Number(p.distance);
      return Number.isFinite(dist) ? `${shape} de ${feetToMeters(dist)}` : shape;
    }
    default:
      // @UUID, @Compendium, @Localize… sans libellé : rien d'affichable.
      return '';
  }
}

export function cleanEnrichers(html: string): string {
  let out = '';
  let i = 0;
  while (i < html.length) {
    // Jets en ligne : [[/r 1d8]] ou [[/r {1d8}[healing]]]{libellé}
    if (html.startsWith('[[', i)) {
      const end = html.indexOf(']]', i + 2);
      if (end !== -1) {
        let close = end + 2;
        // Un « ] » supplémentaire peut fermer un type de dégâts : [[/r {1d8}[healing]]]
        while (html[close] === ']') close++;
        const body = html.slice(i + 2, close - 2);
        const label = readBracket(html, close, '{', '}');
        if (label) {
          out += label[0];
          i = label[1];
        } else {
          out += damageText(body.replace(/^\/(r|roll|br|gmr)\s*/, '').replace(/#.*$/, ''));
          i = close;
        }
        continue;
      }
    }

    // Balises @Tag[...]{libellé}
    const m = /^@([A-Za-z]+)\[/.exec(html.slice(i, i + 32));
    if (m) {
      const tag = m[1]!;
      const bracket = readBracket(html, i + tag.length + 1);
      if (bracket) {
        const [inner, after] = bracket;
        const label = readBracket(html, after, '{', '}');
        if (label) {
          out += label[0];
          i = label[1];
        } else {
          out += renderTag(tag, inner);
          i = after;
        }
        continue;
      }
    }

    out += html[i];
    i++;
  }
  // Paragraphes devenus vides après nettoyage.
  return out.replace(/<p>\s*<\/p>\s*/g, '');
}
