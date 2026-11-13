/**
 * Liste les noms d'un ou plusieurs exports Pathbuilder qui n'ont pas de traduction.
 *
 * Usage :
 *   npm run i18n:missing                         (tous les fichiers de fixtures/)
 *   npm run i18n:missing -- chemin/perso.json    (fichiers choisis)
 *
 * Pour compléter : ajouter "Nom anglais": "Nom officiel BBE" dans src/i18n/names.override.fr.json.
 */
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePathbuilderText } from '../src/pathbuilder/parse.ts';
import { collectNames } from '../src/i18n/collectNames.ts';
import { createLookup, type Dictionary } from '../src/i18n/lookup.ts';

async function readJson(path: string): Promise<Dictionary> {
  return JSON.parse(await readFile(path, 'utf8')) as Dictionary;
}

const root = fileURLToPath(new URL('..', import.meta.url));
const overrides = await readJson(join(root, 'src/i18n/names.override.fr.json'));
const names = await readJson(join(root, 'src/i18n/names.fr.json'));
const lookup = createLookup(overrides, names);

let files = process.argv.slice(2);
if (files.length === 0) {
  const dir = join(root, 'fixtures');
  files = (await readdir(dir)).filter((f) => f.endsWith('.json')).map((f) => join(dir, f));
}

let totalMissing = 0;
for (const file of files) {
  const result = parsePathbuilderText(await readFile(file, 'utf8'));
  if (!result.ok) {
    console.log(`✗ ${file} : ${result.error}`);
    continue;
  }
  const missing = collectNames(result.character).filter((e) => lookup(e.en) === null);
  totalMissing += missing.length;
  console.log(`\n${result.character.name} (${file})`);
  if (missing.length === 0) {
    console.log('  Tout est traduit.');
    continue;
  }
  for (const e of missing) console.log(`  [${e.kind}] ${e.en}`);
}

console.log(`\n${totalMissing} nom(s) sans traduction.`);
