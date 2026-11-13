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

À venir (jalon 4) : dictionnaires `src/i18n/*.fr.json` et script `npm run i18n:missing`.

## Mentions

Outil de fan non officiel et non commercial. Pathfinder est une marque déposée de Paizo Inc. Cet outil n'est ni publié, ni approuvé, ni soutenu par Paizo ou Black Book Éditions.
