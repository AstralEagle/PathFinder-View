# Cadrage : Fiche PF2e en français (lecteur de JSON Pathbuilder 2e)

> Document de cadrage destiné à Claude Code. À placer à la racine du dépôt.
> Avant de commencer, lis ce document en entier et pose tes questions sur ce qui reste flou (voir « Questions ouvertes »).

---

## 1. Contexte et objectif

Je joue à **Pathfinder 2e (règles Remaster)**. Je crée mes personnages avec **Pathbuilder 2e**, qui exporte un **JSON** en anglais.

Je veux une **application web** qui :
1. **lit le JSON Pathbuilder** d'un personnage ;
2. **affiche la fiche en français**, avec les **noms officiels de la VF** (Black Book Éditions) ;
3. permet d'**interagir en partie** : PV, consommables, munitions, points d'héroïsme, emplacements de sorts.

Elle sert d'abord à moi, puis aux autres joueurs de mon groupe : chacun charge son propre personnage.

**Usage :**
- **Téléphone, à la table** : consultation rapide, suivi des PV et des ressources. Priorité n°1.
- **Ordinateur, en préparation** : import du JSON, relecture de la fiche.

---

## 2. Décisions déjà prises

| Sujet | Décision |
|---|---|
| Framework | **React + Vite**. TypeScript recommandé. |
| Hébergement du code | **GitHub** |
| Hébergement du site | **Render**, en *Static Site* (gratuit) construit depuis GitHub |
| Chargement d'un perso | **Coller le JSON** ou **importer un fichier `.json`**. Pas de récupération via le numéro d'export Pathbuilder en V1. |
| Plusieurs persos | **Oui** : une liste de personnages par appareil |
| Sauvegarde | **Locale à chaque appareil** (IndexedDB ou localStorage). Pas de compte, pas de synchro en ligne. |
| Transfert entre appareils | **Export/import d'un fichier de sauvegarde** (build + état de jeu) |
| Hors-ligne | **Oui** : PWA installable sur l'écran d'accueil, qui fonctionne sans réseau |
| Langue | **Français**, avec les **noms officiels VF (Black Book Éditions)** |
| Style visuel | **Inspiré de la fiche papier PF2** : tons parchemin et vert foncé. Ne réutiliser **aucun** logo ni visuel de Paizo. |
| Backend | **Aucun** en V1 |

---

## 3. Périmètre

### V1 (à livrer en premier)
- **Accueil** : liste des personnages enregistrés, bouton « Importer un personnage ».
- **Import** : coller le JSON ou choisir un fichier, avec validation et message d'erreur clair en français si le JSON est invalide.
- **Ré-import** d'un personnage existant (après un passage de niveau, par exemple) : mettre à jour le build **sans perdre l'état de jeu** (PV actuels, consommables…). Identifier le perso par son nom, et demander confirmation.
- **Fiche en français**, organisée en onglets adaptés au téléphone :
  1. **Combat** : PV, CA, sauvegardes, Perception, vitesse, DD de classe, attaques (bonus et dégâts), réactions et actions clés.
  2. **Compétences** : toutes les compétences avec leur total et leur rang de maîtrise, y compris les Connaissances (*Lore*).
  3. **Dons et capacités** : dons par type et par niveau, capacités de classe (*specials*).
  4. **Inventaire** : armes, armure, équipement, argent, consommables avec quantités.
  5. **Sorts** : seulement si le perso lance des sorts (tradition, DD et attaque de sort, sorts par rang, emplacements, tours de magie, sorts focalisés).
  6. **Identité** : ascendance, héritage, historique, classe, niveau, langues, divinité, âge, genre.
- **Noms anglais entre parenthèses** à côté des noms traduits, ou au toucher. Utile pour retrouver un élément dans Pathbuilder ou sur Archives of Nethys.
- **Interactions (état de jeu)** :
  - **PV** : actuels / max, PV temporaires, boutons dégâts et soins avec saisie rapide.
  - **Points d'héroïsme** : compteur de 0 à 3.
  - **Consommables et munitions** : boutons +/− sur les quantités (potions, carreaux, etc.).
  - **Emplacements de sorts** : cocher ou décocher les emplacements utilisés par rang, et les points de focalisation.
  - Bouton **« Repos / préparations quotidiennes »** : remet les emplacements de sorts et les points de focalisation au maximum, avec confirmation. Les PV ne sont **pas** remis automatiquement, ou seulement en option.
- **Sauvegarde locale automatique** de l'état de jeu, par personnage.
- **Export/import** d'une sauvegarde complète (fichier JSON) pour passer du PC au téléphone.
- **PWA** hors-ligne et installable.
- Une **barre de PV toujours visible** sur mobile (collée en haut ou en bas).

### V2 (plus tard, ne pas faire en V1)
- Chargement direct depuis le **numéro d'export Pathbuilder** : demandera probablement un petit serveur proxy sur Render, à cause du CORS.
- **États** (conditions : Effrayé, À terre, Pris au dépourvu…) avec leurs effets sur les bonus.
- **Lanceur de dés** (toucher une compétence ou une attaque pour lancer 1d20 + bonus).
- **Descriptions** des dons, objets et sorts en français.
- **Notes de personnage** modifiables (personnalité, notes de campagne).

### Hors périmètre
- Créer ou modifier un personnage : c'est le rôle de Pathbuilder.
- Comptes utilisateurs, synchronisation en ligne.
- Vue MJ, gestion du groupe.

---

## 4. Données d'entrée : le JSON Pathbuilder

Le format n'est pas documenté officiellement. Il faut l'**inférer à partir d'exports réels** et le parser **de façon défensive** : champs absents, tableaux vides, valeurs inattendues.

### Structure observée (extrait commenté)

```jsonc
{
  "success": true,
  "build": {
    "name": "…", "class": "Gunslinger", "level": 4,
    "ancestry": "Goblin", "heritage": "Tailed Goblin", "background": "Hunter",
    "deity": "Not set", "age": "Not set", "gender": "Not set",   // "Not set" = vide
    "size": 1, "sizeName": "Small", "keyability": "dex",
    "languages": ["None selected"],                              // à traiter comme vide
    "abilities": { "str": 12, "dex": 18, "con": 12, "int": 12, "wis": 12, "cha": 12, "breakdown": {…} },
    "attributes": { "ancestryhp": 6, "classhp": 8, "bonushp": 0, "bonushpPerLevel": 0, "speed": 25, "speedBonus": 5 },
    "proficiencies": { "perception": 4, "fortitude": 4, "stealth": 2, "acrobatics": 2, … },  // 0/2/4/6/8
    "feats": [ ["Nom du don", choix|null, "Type", niveau, "Libellé de l'emplacement", "standardChoice", parent|null ], … ],
    "specials": ["Way of the Sniper", "Darkvision", …],
    "lores": [["Tanning", 2]],
    "equipment": [ … ],          // format à confirmer avec un export qui contient de l'équipement
    "weapons": [ { "name": "Arbalest", "die": "d10", "pot": 0, "runes": [], "damageType": "P", "attack": 12, "damageBonus": 0, "extraDamage": ["+2 precision"], … } ],
    "armor": [ … ],
    "money": { "cp": 0, "sp": 0, "gp": 132, "pp": 0 },
    "acTotal": { "acProfBonus": 6, "acAbilityBonus": 4, "acItemBonus": 0, "acTotal": 20, "shieldBonus": null },
    "spellCasters": [ … ],       // format à confirmer avec l'export d'un lanceur de sorts (le Magicien du groupe)
    "focusPoints": 0, "focus": {},
    "pets": [], "familiars": []
  }
}
```

### Règles de calcul (PF2 Remaster)
- **Modificateur de caractéristique** : Pathbuilder exporte des **scores** (12, 18…). Modificateur = `floor((score - 10) / 2)`. On affiche le **modificateur** (+4), conformément au Remaster.
- **Bonus de maîtrise** : la valeur de `proficiencies` vaut 0 (non qualifié), 2 (qualifié), 4 (expert), 6 (maître) ou 8 (légendaire).
  - Si elle vaut 0 : bonus = 0, **sans le niveau**.
  - Sinon : bonus = valeur + **niveau**.
- **Compétence** = mod. de caractéristique + bonus de maîtrise + bonus d'objet − malus d'armure (pour les compétences de Force et de Dextérité, si l'armure en a un).
- **Perception** = Sag + maîtrise. **Sauvegardes** : Vigueur = Con, Réflexes = Dex, Volonté = Sag, + maîtrise.
- **PV max** = `ancestryhp` + (`classhp` + mod. Con + `bonushpPerLevel`) × niveau + `bonushp`.
- **Vitesse** = `speed` + `speedBonus`.
- **CA** : utiliser `acTotal.acTotal` quand il est fourni, sinon recalculer (10 + Dex plafonnée par l'armure + maîtrise + objet).
- **DD de classe** = 10 + mod. de la caractéristique clé + maîtrise de classe.
- **Attaques** : utiliser les valeurs de `weapons[]` (`attack`, dégâts) quand elles sont présentes.
- Tous les calculs vivent dans un **module pur et testé**, séparé de l'interface.

### Cas de référence pour les tests
Mon personnage, **Flacon « Œil-de-Taupe »**, Franc-tireur gobelin de niveau 4. Ce sont les valeurs attendues après mon dernier export ; ma fiche PDF fait foi.

| Statistique | Attendu |
|---|---|
| PV max | 42 |
| CA (armure de cuir) | 21 |
| Vigueur / Réflexes / Volonté | +9 / +12 / +9 |
| Perception | +9 |
| Vitesse | 30 pieds |
| DD de classe | 20 |
| Discrétion (expert) | +12 |
| Acrobaties, Vol | +10 |
| Athlétisme, Nature, Survie, Connaissance (Tannage) | +7 |
| Arbalète lourde +1 de frappe (*+1 Striking Arbalest*) | +13, 2d10 P + 2 de précision |

⚠️ Le JSON en annexe est un **ancien export**, d'avant que je change Discrétion et Athlétisme. **Demande-moi un export à jour** pour en faire le fichier de test (`fixtures/flacon.json`). Demande aussi l'export d'un **lanceur de sorts** (le Magicien du groupe) pour couvrir `spellCasters`.

---

## 5. Traduction (le point le plus délicat)

**Exigence : utiliser les noms officiels de la VF Black Book Éditions.**

### Stratégie proposée
1. **Dictionnaire de base écrit à la main** (`src/i18n/core.fr.json`) : caractéristiques, compétences, sauvegardes, rangs de maîtrise, types de dons, termes de l'interface, classes, ascendances, historiques courants, types de dégâts, monnaie.
2. **Dictionnaire des noms de jeu** (dons, objets, sorts, capacités, héritages) : `src/i18n/names.fr.json`, sous la forme `{ "Crossbow Crack Shot": "…" }`.
   - Point de départ possible : les traductions de la communauté **Pathfinder-fr** (module Foundry `pf2-fr`, dépôt GitHub `Pathfinder-Fr`). ⚠️ Ce n'est **pas** la traduction officielle, et certains noms diffèrent de la VF BBE.
   - Prévoir donc un **fichier de surcharge** `names.override.fr.json`, prioritaire, que je complète au fur et à mesure avec les noms officiels lus dans les livres BBE.
3. **Repli** : si un nom n'est pas traduit, afficher le nom anglais avec un petit marqueur « VO ». Ne jamais planter, ne jamais inventer de traduction.
4. Un **script de contrôle** (`npm run i18n:missing`) liste les noms d'un JSON importé qui n'ont pas de traduction, pour que je les complète.

### Termes de base
À **vérifier contre les livres BBE** avant de figer :

| Anglais | Français |
|---|---|
| Strength / Dexterity / Constitution / Intelligence / Wisdom / Charisma | Force / Dextérité / Constitution / Intelligence / Sagesse / Charisme |
| Fortitude / Reflex / Will | Vigueur / Réflexes / Volonté |
| Perception | Perception |
| Armor Class (AC) | Classe d'armure (CA) |
| Class DC | DD de classe |
| Hit Points | Points de vie (PV) |
| Hero Points | Points d'héroïsme |
| Acrobatics, Arcana, Athletics, Crafting | Acrobaties, Arcanes, Athlétisme, Artisanat |
| Deception, Diplomacy, Intimidation, Medicine | Duperie, Diplomatie, Intimidation, Médecine |
| Nature, Occultism, Performance, Religion | Nature, Occultisme, Représentation, Religion |
| Society, Stealth, Survival, Thievery | Société, Discrétion, Survie, Vol |
| Lore | Connaissance (…) |
| Trained / Expert / Master / Legendary | Qualifié / Expert / Maître / Légendaire |
| Gunslinger | Franc-tireur |
| Goblin / Hunter | Gobelin / Chasseur |

### Droits
- Outil **non commercial**, à usage personnel et pour mon groupe.
- V1 : on n'affiche que des **noms** et des **valeurs**, **pas de texte de règles** recopié des livres.
- Ajouter en pied de page la mention de Paizo (marques déposées) et préciser qu'il s'agit d'un outil de fan non officiel.

---

## 6. Modèle de données de l'application

Bien séparer deux choses :
- **Build** : le JSON Pathbuilder importé, en **lecture seule**. On le stocke tel quel et on le parse à l'affichage.
- **État de jeu** : ce que l'utilisateur modifie en partie. Exemple :

```ts
type GameState = {
  characterId: string;
  hp: { current: number; temp: number };
  heroPoints: number;                         // 0 à 3
  consumables: Record<string, number>;        // clé = nom de l'objet (VO), valeur = quantité restante
  spellSlotsUsed: Record<number, number>;     // rang -> nombre d'emplacements utilisés
  focusPointsUsed: number;
  updatedAt: string;
};
```

- Au ré-import, on **garde** l'état de jeu. On recadre les valeurs qui ne sont plus valides : PV actuels au-dessus du nouveau max, consommable disparu, etc.
- Le fichier de sauvegarde exporté contient la liste des builds et leurs états, avec un numéro de **version de schéma**.

---

## 7. Interface et expérience utilisateur

- **Mobile d'abord** : utilisable d'une main, cibles tactiles d'au moins 44 px, texte lisible sans zoomer.
- La **barre de PV** reste toujours visible, avec des boutons rapides −1, −5, +1, +5 et un champ de saisie libre.
- **Gros chiffres** pour les valeurs consultées en combat : CA, sauvegardes, Perception, attaque.
- **Style** : inspiré de la fiche papier, avec un fond parchemin clair, des titres et filets vert foncé, une typographie lisible. Contrastes accessibles (WCAG AA).
- Sur ordinateur, la fiche peut s'afficher sur plusieurs colonnes.
- Toujours **confirmer** les actions destructrices : supprimer un personnage, faire un repos, écraser un build par un ré-import.

---

## 8. Technique et hébergement

- **React + Vite + TypeScript**.
- **PWA** avec `vite-plugin-pwa` : manifeste (nom, icônes) et service worker en mode hors-ligne.
- **Stockage** : IndexedDB, par exemple via `idb-keyval`, ou localStorage si le volume reste petit.
- **Tests** : Vitest pour le module de calcul et le parseur JSON, avec le cas Flacon comme référence.
- **Qualité** : ESLint + Prettier.
- **Render** :
  - Type *Static Site*, relié au dépôt GitHub, avec déploiement automatique sur la branche `main`.
  - Commande de build `npm ci && npm run build`, dossier publié `dist`.
  - Si on utilise un routeur côté client : règle de réécriture `/*` → `/index.html`.
- Un **README** en français explique comment lancer le projet en local, déployer sur Render et compléter les traductions.

---

## 9. Jalons proposés

1. **Initialisation** : projet Vite + React + TS, ESLint, Vitest, premier déploiement Render d'une page vide.
2. **Parseur et calculs** : types TypeScript du JSON, module de calcul, tests sur le cas Flacon.
3. **Fiche en lecture** : onglets Combat, Compétences, Dons, Inventaire, Identité, avec les termes de base traduits.
4. **Traduction des noms** : dictionnaire, surcharge, repli « VO », script de contrôle des manquants.
5. **État de jeu** : PV, points d'héroïsme, consommables, sauvegarde locale, liste de personnages, ré-import.
6. **Sorts** : onglet Sorts, emplacements, focalisation, repos (avec l'export du Magicien).
7. **PWA et export/import** de sauvegarde, puis tests sur un vrai téléphone.

À chaque jalon : une version déployée sur Render que je peux tester.

---

## 10. Questions ouvertes

À me poser au fil du projet :
- **Exports réels** : il me faut un export à jour de Flacon, un export du Magicien (sorts) et, si possible, un export avec beaucoup d'équipement et de consommables.
- **Consommables** : comment les repérer de façon fiable dans le JSON ? Liste de noms connus, trait « consommable », ou réglage manuel par l'utilisateur ?
- **Noms officiels BBE** : je dois fournir ou valider la liste des traductions officielles des dons et objets de mon perso.
- **Repos** : faut-il aussi remettre les PV au maximum ? Je propose une option désactivée par défaut.
- **Icône et nom de l'appli** pour la PWA.

---

## Annexe : export Pathbuilder de référence (ancienne version)

> Sert à comprendre la structure. Les valeurs de Discrétion et Athlétisme y sont **obsolètes** : utiliser un export à jour pour les tests.

```json
{"success":true,"build":{"name":"Zbeuby","class":"Gunslinger","dualClass":null,"level":4,"xp":0,"ancestry":"Goblin","heritage":"Tailed Goblin","background":"Hunter","alignment":"N","gender":"Not set","age":"Not set","deity":"Not set","size":1,"sizeName":"Small","keyability":"dex","languages":["None selected"],"rituals":[],"resistances":[],"inventorMods":[],"abilities":{"str":12,"dex":18,"con":12,"int":12,"wis":12,"cha":12,"breakdown":{"ancestryFree":["Str"],"ancestryBoosts":["Dex","Cha"],"ancestryFlaws":["Wis"],"backgroundBoosts":["Dex","Wis"],"classBoosts":["Dex"],"mapLevelledBoosts":{"1":["Dex","Wis","Int","Con"]}}},"attributes":{"ancestryhp":6,"classhp":8,"bonushp":0,"bonushpPerLevel":0,"speed":25,"speedBonus":5},"proficiencies":{"classDC":2,"perception":4,"fortitude":4,"reflex":4,"will":4,"heavy":0,"medium":2,"light":2,"unarmored":2,"advanced":0,"martial":2,"simple":2,"unarmed":2,"castingArcane":0,"castingDivine":0,"castingOccult":0,"castingPrimal":0,"acrobatics":2,"arcana":0,"athletics":4,"crafting":0,"deception":0,"diplomacy":0,"intimidation":0,"medicine":0,"nature":2,"occultism":0,"performance":0,"religion":0,"society":0,"stealth":2,"survival":2,"thievery":2,"piloting":0,"computers":0},"mods":{},"feats":[["Combat Climber",null,"Awarded Feat",1],["Survey Wildlife",null,"Awarded Feat",1],["Tailed Goblin",null,"Heritage",1,"Heritage Feat","standardChoice",null],["Crossbow Crack Shot",null,"Class Feat",1,"Gunslinger Feat 1","standardChoice",null],["Very Sneaky",null,"Ancestry Feat",1,"Goblin Feat 1","standardChoice",null],["Cat Fall",null,"Skill Feat",2,"Skill Feat 2","standardChoice",null],["Hit the Dirt!",null,"Class Feat",2,"Gunslinger Feat 2","standardChoice",null],["Fleet",null,"General Feat",3,"General Feat 3","standardChoice",null],["Running Reload",null,"Class Feat",4,"Gunslinger Feat 4","standardChoice",null]],"specials":["Way of the Sniper","Slinger's Precision","Darkvision","Covered Reload","One Shot, One Kill","Stubborn","Tailed Goblin"],"lores":[["Tanning",2]],"equipmentContainers":{},"equipment":[],"specificProficiencies":{"trained":[],"expert":["Arbalest"],"master":[],"legendary":[]},"weapons":[{"name":"Arbalest","qty":1,"prof":"martial","die":"d10","pot":0,"str":"","mat":null,"display":"Arbalest","runes":[],"damageType":"P","attack":12,"damageBonus":0,"extraDamage":["+2 precision"],"increasedDice":false,"isInventor":false,"grade":""}],"money":{"cp":0,"sp":0,"gp":132,"pp":0},"armor":[],"spellCasters":[],"focusPoints":0,"focus":{},"formula":[],"acTotal":{"acProfBonus":6,"acAbilityBonus":4,"acItemBonus":0,"acTotal":20,"shieldBonus":null},"pets":[],"familiars":[]}}
```
