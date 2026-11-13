# CLAUDE.md

## Projet

**PathFinder 2 Viewer** : application web qui lit l'export JSON de **Pathbuilder 2e** (Pathfinder 2e, règles Remaster) et affiche la fiche du personnage **en français**, avec les **noms officiels de la VF Black Book Éditions**. Elle permet aussi de suivre l'état de jeu en partie : PV, points d'héroïsme, consommables, munitions, emplacements de sorts et points de focalisation.

- Usage principal : **téléphone à la table** (mobile d'abord, PWA hors-ligne et installable). Usage secondaire : ordinateur, en préparation.
- Plusieurs personnages par appareil, sauvegarde **locale** (IndexedDB / localStorage), sans compte ni backend.
- Transfert entre appareils par export/import d'un fichier de sauvegarde.

Le document de référence complet est [CADRAGE.md](CADRAGE.md) : périmètre V1/V2, format du JSON, règles de calcul, stratégie de traduction, jalons. **Le lire avant toute tâche importante.**

## Stack

- React + Vite + TypeScript
- `vite-plugin-pwa` pour la PWA
- Vitest pour les tests (module de calcul et parseur, cas de référence « Flacon »)
- ESLint + Prettier
- Code sur GitHub, site sur Render (_Static Site_, build `npm ci && npm run build`, dossier `dist`) : hébergement prévu plus tard

## Organisation du code

- `src/pathbuilder/` : types et parseur défensif du JSON Pathbuilder (renvoie un modèle `Character` normalisé).
- `src/rules/` : calculs purs (modificateurs, maîtrise, PV, CA, sauvegardes, compétences, attaques).
- `src/i18n/` : termes de base, dictionnaire des noms embarqué (hors-ligne), surcharge BBE.
- `src/sources/` : chaîne des sources de traduction, dans l'ordre : 1. fichier du groupe (URL, Gist) + `names.override.fr.json`, 2. Pathfinder-fr module Foundry `pf2-fr`, 3. Pathfinder-fr module Foundry `lang-fr` (traits, langues), 4. saisie locale, 5. Foundry pf2e anglais officiel (description, niveau, traits). Cache commun dans `cache.ts`.
- `src/details/` : descriptions détaillées récupérées à la demande depuis Pathfinder-fr (raw.githubusercontent.com), mises en cache (Cache Storage) ; nettoyage des balises Foundry (`enrichers.ts`). Toujours passer le HTML par DOMPurify avant affichage.
- `fixtures/` : exports Pathbuilder réels utilisés par les tests (`flacon.json`).

## Principes

- **Build** (JSON Pathbuilder, lecture seule) et **état de jeu** (modifié en partie) sont séparés.
- Tous les calculs vivent dans un **module pur et testé**, séparé de l'interface.
- Parser le JSON **de façon défensive** : champs absents, tableaux vides, valeurs comme `"Not set"` ou `"None selected"`.
- Traduction : ne jamais inventer un nom. Si un nom n'est pas traduit, afficher le nom anglais avec un marqueur « VO ».
- Aucun texte de règles recopié des livres, aucun visuel ni logo de Paizo.
- Interface en français. Confirmer toute action destructrice.

## Commandes

- Gestionnaire de paquets : **npm** (un seul projet à la racine, pas de workspaces).
- Scripts : `npm run dev`, `npm test`, `npm run lint`, `npm run format`, `npm run build`.
- **Chaque commande n'exécute qu'une seule action**, une par appel, en accord avec les autorisations de [.claude/settings.json](.claude/settings.json) : `npm …`, `npx …`, `node …`, `git …`, `ls`, `mkdir`, `cp`, etc.
- **Jamais de chaînes ni de combinaisons** : pas de `|`, `&`, `&&`, `;`, pas de `cd` ni de script inline. Utiliser des chemins.
- Préférer les outils Read / Edit / Write / Glob / Grep aux commandes shell pour lire et modifier les fichiers.
