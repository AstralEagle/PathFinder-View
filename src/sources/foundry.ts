import { cached, fetchJson } from './cache.ts';
import { slugify } from './slug.ts';
import type { DetailKind } from '../details/packs.ts';

/**
 * Source n°5 : données officielles anglaises du système Foundry pf2e (texte Paizo).
 * Un fichier JSON par élément ; la liste d'un dossier vient de l'API GitHub
 * (limite : 60 requêtes/heure/appareil, d'où le cache).
 */
const REPO = 'foundryvtt/pf2e';
const API = `https://api.github.com/repos/${REPO}`;

type Folder =
  | 'feats'
  | 'heritages'
  | 'class-features'
  | 'ancestry-features'
  | 'actions'
  | 'equipment'
  | 'spells'
  | 'ancestries'
  | 'backgrounds'
  | 'classes';

export const FOLDERS_BY_KIND: Record<DetailKind, Folder[]> = {
  action: ['actions'],
  feat: ['feats', 'heritages', 'class-features', 'ancestry-features', 'actions'],
  special: ['class-features', 'ancestry-features', 'heritages', 'feats', 'actions'],
  item: ['equipment'],
  spell: ['spells'],
  heritage: ['heritages'],
  ancestry: ['ancestries'],
  background: ['backgrounds'],
  class: ['classes'],
};

export interface FoundryItem {
  name: string;
  level: number | null;
  rarity: string | null;
  traits: string[];
  /** 'action', 'reaction', 'free' ou 'passive'. */
  actionType: string | null;
  actions: number | null;
  prereq: string[];
  description: string;
}

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (v && typeof v === 'object' ? (v as Obj) : {});

/** Extrait les champs utiles d'un fichier d'élément Foundry. */
export function parseFoundryItem(data: unknown): FoundryItem {
  const d = obj(data);
  const s = obj(d.system);
  const traits = obj(s.traits);
  const level = obj(s.level).value;
  const actions = obj(s.actions).value;
  const prereq = Array.isArray(obj(s.prerequisites).value)
    ? (obj(s.prerequisites).value as unknown[])
        .map((p) => obj(p).value)
        .filter((v): v is string => typeof v === 'string' && !!v.trim())
    : [];
  return {
    name: typeof d.name === 'string' ? d.name : '',
    level: typeof level === 'number' ? level : null,
    rarity: typeof traits.rarity === 'string' && traits.rarity !== 'common' ? traits.rarity : null,
    traits: Array.isArray(traits.value)
      ? traits.value.filter((t): t is string => typeof t === 'string')
      : [],
    actionType:
      typeof obj(s.actionType).value === 'string' ? (obj(s.actionType).value as string) : null,
    actions: typeof actions === 'number' ? actions : null,
    prereq,
    description:
      typeof obj(s.description).value === 'string' ? (obj(s.description).value as string) : '',
  };
}

interface RepoInfo {
  branch: string;
  folders: Record<string, string>; // dossier → sha de l'arbre
}

function repoInfo(): Promise<RepoInfo> {
  return cached('foundry:repo', async () => {
    const repo = obj(await fetchJson(API));
    const branch = typeof repo.default_branch === 'string' ? repo.default_branch : 'master';
    const list = await fetchJson(`${API}/contents/packs/pf2e?ref=${encodeURIComponent(branch)}`);
    const folders: Record<string, string> = {};
    for (const e of Array.isArray(list) ? list : []) {
      const o = obj(e);
      if (o.type === 'dir' && typeof o.name === 'string' && typeof o.sha === 'string') {
        folders[o.name] = o.sha;
      }
    }
    return { branch, folders };
  });
}

/** Index d'un dossier : slug du fichier → chemin relatif au dossier. */
function folderIndex(folder: Folder): Promise<Record<string, string>> {
  return cached(`foundry:index:${folder}`, async () => {
    const { folders } = await repoInfo();
    const sha = folders[folder];
    if (!sha) return {};
    const tree = obj(await fetchJson(`${API}/git/trees/${sha}?recursive=1`));
    const index: Record<string, string> = {};
    for (const t of Array.isArray(tree.tree) ? tree.tree : []) {
      const o = obj(t);
      if (o.type !== 'blob' || typeof o.path !== 'string' || !o.path.endsWith('.json')) continue;
      const slug = o.path.slice(o.path.lastIndexOf('/') + 1, -5);
      if (!slug.startsWith('_') && !(slug in index)) index[slug] = o.path;
    }
    return index;
  });
}

/** Cherche un élément par son nom anglais. Null s'il n'existe pas ; erreur si le réseau échoue. */
export async function findFoundryItem(kind: DetailKind, en: string): Promise<FoundryItem | null> {
  const slug = slugify(en);
  if (!slug) return null;
  for (const folder of FOLDERS_BY_KIND[kind]) {
    const path = (await folderIndex(folder))[slug];
    if (!path) continue;
    return cached(`foundry:item:${folder}/${path}`, async () => {
      const { branch } = await repoInfo();
      const url = `https://raw.githubusercontent.com/${REPO}/${encodeURIComponent(branch)}/packs/pf2e/${folder}/${path}`;
      return parseFoundryItem(await fetchJson(url));
    });
  }
  return null;
}
