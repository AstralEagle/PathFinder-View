# Fiche PF2

Application web qui affiche en français une fiche de personnage **Pathfinder 2e (Remaster)** à partir de l'export JSON de **Pathbuilder 2e**, et permet de suivre l'état de jeu à la table (PV, ressources, sorts).

Le périmètre et les décisions sont décrits dans [CADRAGE.md](CADRAGE.md).

## Lancer le projet en local

Prérequis : Node.js 22 ou plus récent.

```sh
npm install
npm run dev
```

Puis ouvrir l'adresse affichée (par défaut http://localhost:5173).

| Commande          | Rôle                             |
| ----------------- | -------------------------------- |
| `npm run dev`     | Serveur de développement         |
| `npm test`        | Tests unitaires (Vitest)         |
| `npm run lint`    | Vérification ESLint              |
| `npm run format`  | Mise en forme Prettier           |
| `npm run build`   | Build de production dans `dist/` |
| `npm run preview` | Sert le build localement         |

## Déployer sur Render

Le dépôt contient un fichier [render.yaml](render.yaml) (Blueprint).

1. Pousser le dépôt sur GitHub.
2. Sur Render : **New → Blueprint**, choisir le dépôt. Render crée le _Static Site_ `fiche-pf2`.
   - Ou bien, à la main : **New → Static Site**, commande de build `npm ci && npm run build`, dossier publié `dist`, variable `NODE_VERSION=22`, règle de réécriture `/*` → `/index.html`.
3. Chaque push sur `main` redéploie automatiquement le site.

## Compléter les traductions

L'appli interroge une **chaîne de sources** : si la première ne connaît pas l'élément, elle passe à la suivante.

| #   | Source                                                                                                        | Apporte                                                              |
| --- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1   | **Fichier du groupe** (adresse dans Paramètres) + `src/i18n/names.override.fr.json`                           | Noms officiels VF (Black Book Éditions), descriptions facultatives   |
| 2   | **Pathfinder-fr**, module Foundry [pf2-fr](https://github.com/pathfinder-fr/foundryvtt-pathfinder2-fr)        | Noms (embarqués dans `names.fr.json`) et descriptions (à la demande) |
| 3   | **Saisie locale** (fenêtre de détail d'un nom non traduit)                                                    | Vos corrections, sur l'appareil                                      |
| 4   | **Pathfinder-fr**, module Foundry [lang-fr](https://github.com/pathfinder-fr/foundryvtt-pathfinder2e-lang-fr) | Traits, langues, états                                               |
| 5   | **Foundry pf2e** ([anglais officiel](https://github.com/foundryvtt/pf2e))                                     | Description anglaise en dernier recours, niveau, traits, actions     |

Sinon, le nom anglais s'affiche avec le marqueur **VO**.

**Fichier du groupe** : un JSON `{ "Nom anglais": "Nom officiel" }`, voir [docs/fichier-groupe.exemple.json](docs/fichier-groupe.exemple.json). Le plus simple : créer un [Gist GitHub](https://gist.github.com), y coller le fichier, puis copier l'adresse du Gist dans Paramètres → Sources de traduction. Chaque joueur fait de même ; une modification du Gist est prise en compte au démarrage suivant (ou via « Recharger »). Les traductions saisies localement peuvent être copiées depuis les Paramètres pour être ajoutées au Gist.

Les termes de base (caractéristiques, compétences, rangs, runes…) sont dans `src/i18n/core.fr.json`.

| Commande                             | Rôle                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------ |
| `npm run i18n:missing`               | Liste les noms sans traduction des exports de `fixtures/`                |
| `npm run i18n:missing -- perso.json` | Même chose pour un export choisi                                         |
| `npm run i18n:import`                | Retélécharge les noms Pathfinder-fr (noms seulement, aucune description) |

**Descriptions** : toucher un don, un objet, une capacité, la classe, l'ascendance, l'héritage ou l'historique ouvre sa description. Les sources en ligne sont téléchargées une catégorie à la fois puis gardées en cache sur l'appareil pour le hors-ligne. Paramètres → « Vider le cache des sources » force un nouveau téléchargement.

Pour corriger ou compléter un nom, ajoutez une ligne `"Nom anglais": "Nom officiel"` dans `names.override.fr.json`.

Les traductions Pathfinder-fr ne sont pas toutes officielles et sont réservées à un usage non commercial (OGL / Pathfinder Community Use Policy). Crédits : l'équipe et les traducteurs de Pathfinder-fr.

## Mentions

Outil de fan non officiel et non commercial. Pathfinder est une marque déposée de Paizo Inc. Cet outil n'est ni publié, ni approuvé, ni soutenu par Paizo ou Black Book Éditions.
