import names from './names.fr.json';
import overrides from './names.override.fr.json';
import { createLookup } from './lookup.ts';

/**
 * Traduction d'un nom de jeu (don, objet, sort, capacité, héritage…).
 * Priorité : surcharge officielle BBE, puis dictionnaire communautaire Pathfinder-fr.
 */
export const trName = createLookup(overrides, names);
