/**
 * Stockage provisoire : un seul personnage, gardé en JSON brut.
 * Sera remplacé au jalon 5 par une liste de personnages avec état de jeu.
 */
const KEY = 'pf2.lastCharacter';

export function loadLastCharacter(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function saveLastCharacter(json: string): void {
  try {
    localStorage.setItem(KEY, json);
  } catch {
    // Stockage indisponible (navigation privée…) : on continue sans sauvegarde.
  }
}

export function clearLastCharacter(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignoré
  }
}
