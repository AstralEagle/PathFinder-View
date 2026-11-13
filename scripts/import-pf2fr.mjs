/**
 * Construit src/i18n/names.fr.json à partir des fichiers Babele de la communauté Pathfinder-fr
 * (https://github.com/pathfinder-fr/foundryvtt-pathfinder2-fr).
 *
 * On ne garde QUE les noms (anglais → français), jamais les descriptions.
 * Ces traductions ne sont pas toutes officielles (VF Black Book Éditions) :
 * src/i18n/names.override.fr.json reste prioritaire.
 *
 * Usage : npm run i18n:import
 */
import { writeFile } from 'node:fs/promises';

const BASE =
  'https://raw.githubusercontent.com/pathfinder-fr/foundryvtt-pathfinder2-fr/master/babele/fr/';

// Ordre de priorité en cas de doublon : le premier fichier gagne.
const FILES = [
  'pf2e.classes.json',
  'pf2e.ancestries.json',
  'pf2e.heritages.json',
  'pf2e.backgrounds.json',
  'pf2e.classfeatures.json',
  'pf2e.ancestryfeatures.json',
  'pf2e.feats-srd.json',
  'pf2e.equipment-srd.json',
  'pf2e.spells-srd.json',
  'pf2e.actionspf2e.json',
  'pf2e.deities.json',
];

const OUT = new URL('../src/i18n/names.fr.json', import.meta.url);

function* pairs(entries) {
  if (Array.isArray(entries)) {
    for (const e of entries) yield [e?.id, e?.name];
  } else if (entries && typeof entries === 'object') {
    for (const [id, e] of Object.entries(entries)) yield [id, e?.name];
  }
}

const names = {};
for (const file of FILES) {
  const res = await fetch(BASE + file);
  if (!res.ok) {
    console.warn(`⚠ ${file} : HTTP ${res.status}, ignoré`);
    continue;
  }
  const data = await res.json();
  let added = 0;
  for (const [en, fr] of pairs(data.entries)) {
    if (typeof en !== 'string' || typeof fr !== 'string') continue;
    const key = en.trim();
    const value = fr.trim();
    if (!key || !value || key in names) continue;
    names[key] = value;
    added++;
  }
  console.log(`${file} : ${added} noms`);
}

const sorted = Object.fromEntries(
  Object.entries(names).sort(([a], [b]) => a.localeCompare(b, 'en')),
);
await writeFile(OUT, JSON.stringify(sorted, null, 1) + '\n', 'utf8');
console.log(`Total : ${Object.keys(sorted).length} noms écrits dans src/i18n/names.fr.json`);
