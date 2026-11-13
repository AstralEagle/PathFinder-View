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
- Code sur GitHub, site sur Render (_Static Site_, build `npm ci && npm run build`, dossier `dist`)

## Principes

- **Build** (JSON Pathbuilder, lecture seule) et **état de jeu** (modifié en partie) sont séparés.
- Tous les calculs vivent dans un **module pur et testé**, séparé de l'interface.
- Parser le JSON **de façon défensive** : champs absents, tableaux vides, valeurs comme `"Not set"` ou `"None selected"`.
- Traduction : ne jamais inventer un nom. Si un nom n'est pas traduit, afficher le nom anglais avec un marqueur « VO ».
- Aucun texte de règles recopié des livres, aucun visuel ni logo de Paizo.
- Interface en français. Confirmer toute action destructrice.

## Commandes et agents

- Gestionnaire de paquets : **npm** (workspaces).
- Utiliser des **commandes simples**, une par appel, qui correspondent aux autorisations de [.claude/settings.json](.claude/settings.json) : `npm …`, `npx …` (nest, prisma, expo), `git …`, `ls`, `mkdir`, etc.
- Éviter les chaînes (`&&`, `;`, `|`), les `cd` et les scripts inline ; préférer l'option du dossier de travail (`npm --prefix apps/api …`, `npm -w apps/api …`) ou des chemins.
- Préférer les outils Read / Edit / Write / Glob / Grep aux commandes shell pour lire et modifier les fichiers.
- Les tâches longues ou parallélisables peuvent être confiées à des **sous-agents** (ex : un agent pour l'API, un pour le mobile).
