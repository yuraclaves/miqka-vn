# Miqka City : visual novel, interface (style Classique)

Une appli web **sans installation ni compilation** : de simples fichiers HTML/CSS/JS.
Elle marche **hors ligne** et s'ajoute à l'écran d'accueil de l'iPhone comme une vraie appli.

```
app/
├── index.html        ← la page (ne pas toucher, sauf pour changer la structure)
├── story.js          ← ★ TON HISTOIRE : c'est le seul fichier à modifier pour écrire
├── js/engine.js      ← le moteur (texte, choix, sauvegardes…)
├── css/style.css     ← le look « Classique »
├── sw.js             ← mode hors ligne (liste des fichiers mis en cache)
├── manifest.json     ← nom et icône de l'appli sur l'écran d'accueil
└── assets/
    ├── sprites/      ← poses de Miqka : excited, idea, pointing, shy, sweet
    ├── bg/           ← décors : toit, rue, cafe (SVG originaux)
    ├── fonts/        ← polices Nunito et Fredoka (licence libre OFL)
    └── icons/        ← icônes de l'appli
```

> ⚠ Le texte actuel de `story.js` est un **EXEMPLE** (marqué `[Exemple]`). Remplace-le par ton histoire.

---

## 1. Écrire des dialogues

Tout se passe dans `story.js`, dans `scenes`. Une scène, c'est une liste de **lignes** :

```js
scenes: {
  debut: {
    chapter: "Chapitre 1",          // (facultatif) affiche la carte de chapitre et la pastille en haut
    title: "Le toit",               // (facultatif) titre du chapitre
    background: "toit",             // décor au début de la scène
    lines: [
      { speaker: "miqka", pose: "excited", text: "Salut !" },
      { speaker: "miqka", pose: "idea", effect: "bounce", text: "J'ai une idée." },
      { text: "Une phrase de narration (pas de nom affiché)." },
      { speaker: "Inconnu", text: "Un personnage sans image : il suffit d'écrire son nom." }
    ]
  }
}
```

Ce qu'on peut mettre dans une ligne :

| Champ        | Rôle                                                                                   |
|--------------|-----------------------------------------------------------------------------------------|
| `text`       | Le texte affiché (machine à écrire).                                                    |
| `speaker`    | Qui parle : un id de `characters` (ex. `"miqka"`) **ou** n'importe quel nom. Absent = narration. |
| `pose`       | Change la pose : `excited`, `idea`, `pointing`, `shy`, `sweet`. Elle reste jusqu'au prochain changement. |
| `effect`     | Petit effet sur le sprite : `"bounce"`, `"shake"` ou `"hop"`.                          |
| `sprite`     | `false` pour faire disparaître le personnage (ou un chemin d'image direct).             |
| `background` | Change de décor en fondu : `"toit"`, `"rue"`, `"cafe"`… (alias : `bg`).                 |
| `music`      | Lance une musique de `music` (ex. `"theme"`), ou `null` pour l'arrêter.                |
| `goto`       | Saute directement à une autre scène : `{ goto: "scene2" }`.                             |
| `end`        | Fin du jeu : `{ end: true }` (retour à l'écran titre).                                  |

Quand une scène est terminée, on passe à `next: "autre_scene"` si tu l'indiques dans la scène. Sinon, c'est la fin.

## 2. Ajouter un choix

```js
{ text: "Que fais-tu ?",                // (facultatif) question affichée dans la boîte
  choices: [
    { text: "Rester sur le toit", goto: "toit_suite" },
    { text: "Descendre en ville", goto: "ville" }
] }
```

Chaque `goto` doit correspondre au nom d'une scène. Si tu n'indiques pas de `goto`, l'histoire continue simplement à la ligne suivante. Les choix sont numérotés automatiquement, et le téléphone vibre quand on touche un choix (sur les appareils qui le permettent).

## 3. Ajouter une pose

1. Mets l'image (PNG détouré, fond transparent, coupée en bas comme les autres) dans `assets/sprites/`, par exemple `angry.png`.
2. Déclare-la dans `story.js` :
   ```js
   characters: { miqka: { name: "Miqka", poses: { ..., angry: "assets/sprites/angry.png" } } }
   ```
3. Utilise-la : `{ speaker: "miqka", pose: "angry", text: "…" }`.

**Un nouveau personnage**, c'est la même chose : ajoute une entrée à `characters` (`lea: { name: "Léa", poses: {...} }`), puis `speaker: "lea"`.

## 4. Ajouter un décor

1. Mets une image dans `assets/bg/` (JPG, PNG, WEBP ou SVG, idéalement au format portrait, par exemple 1170×2532).
2. Déclare-la : `backgrounds: { ..., plage: "assets/bg/plage.jpg" }`.
3. Utilise-la : `background: "plage"` dans une scène ou une ligne.

Le cadrage est automatique : l'image est recadrée pour remplir l'écran.

## 5. Musique (facultatif)

Ajoute un fichier dans `assets/music/`, puis déclare-le : `music: { theme: "assets/music/theme.mp3" }`. Utilise-le ensuite avec `music: "theme"` dans une ligne ou une scène. Les effets sonores (petit « tic ») sont générés par le moteur, sans fichier.

## 6. ⚠ Après chaque modification

- Si tu ajoutes des fichiers (images, musiques), ajoute leur chemin dans la liste `FILES` de `sw.js`. Ils seront ainsi dispo hors ligne.
- **Change `VERSION` dans `sw.js`** (ex. `"vn-v2"`), sinon l'iPhone peut garder l'ancienne version en cache.

---

## 7. Scènes « duo » (v8) — embauches longues

Les scènes d'embauche sont dans `story-hires.js` (`hire_<id>`, prioritaires sur les anciennes `embauche_<id>`). Tous les textes sont **originaux**, écrits pour ce jeu. Le nom de la ville s'écrit toujours `{ville}` (remplacé par `CITY.fill`).

```js
ST.scenes.hire_x = { duo:true, chapter:"Embauche", title:"X — Métier", background:"parking", lines:[
  { card:"Plus tard…", bg:"conseil" },                       // carton noir + changement de fond instantané
  { speaker:"x", text:"…", left:"x:neutre", effect:"bounce" }, // perso à GAUCHE (left:"id:pose")
  { speaker:"miqka", text:"…", right:"surprise", scr:"shake" }, // Miqka à DROITE ; scr = shake | flash | zoom
  { speaker:"x", text:"…", leave:"L" },                        // le perso de gauche sort
]};
```
- `effect` : bounce, hop, shake, squish, nod, lean, jump. `trans:"black"` : fondu au noir.
- Pose objet : `{src, h, ax, lift, y}` → hauteur relative (h), ancrage horizontal (ax), remontée au-dessus de la boîte (lift).
- Le locuteur est mis en avant, l'autre est atténué. Barre de progression discrète (sans total affiché).
- Reprise après rechargement (`miqka_vn.seqpos`), Passer seulement sur les répliques déjà lues, rejouables dans Employés › Histoire.
- Les embauches se font dans l'ordre de la liste (l'histoire se suit).
- Sprites et fonds d'une scène ne sont chargés qu'à son lancement.

## 8. Cycle jour/nuit (onglet Ville)

`js/daynight.js` : **horloge de jeu de 10 minutes réelles** (aube ≈ 1 min, jour ≈ 3,5 min, couchant ≈ 1,5 min, nuit ≈ 3 min), calée sur l'heure de l'appareil, donc identique après rechargement. Choisie plutôt que l'heure réelle pour que le joueur voie la ville changer pendant une partie ; aucun réglage nécessaire.
Calques CSS seulement (ciel, assombrissement bleuté, lueur du couchant, étoiles discrètes, lune, fenêtres allumées, scintillement de la mer), animations en transform/opacity, `prefers-reduced-motion` respecté, purement visuel.
Test : `?dn=0.3` (jour), `?dn=0.56` (couchant), `?dn=0.8` (nuit), `?dn=0.02` (aube).

## Fonctions de l'interface

- **Écran titre** : Nouvelle partie, Continuer (reprend la sauvegarde automatique), Chargement et Réglages.
- **Dialogue** :
  - texte en machine à écrire : un toucher affiche toute la ligne, le toucher suivant passe à la ligne suivante ;
  - flèche qui clignote, nom du personnage et pastille de chapitre ;
  - fondu entre les poses et entre les décors.
- **Barre du bas** :
  - **Auto** : avance tout seul ; la vitesse se règle dans Réglages.
  - **Passer** : saute le texte déjà lu et s'arrête au premier texte nouveau ou au prochain choix.
  - **Historique**.
  - **Sauvegarder** : 6 emplacements, avec date, heure et miniature.
  - **Menu** : Reprendre, Sauvegarder, Charger, Réglages, Retour au titre.
- **Réglages** :
  - vitesse du texte et vitesse du mode Auto ;
  - volume de la musique et des effets ;
  - taille du texte S/M/L ;
  - passer aussi le texte non lu ;
  - vibrations ;
  - réinitialiser toutes les données.
- **Gestes** :
  - glisser vers le **haut** : historique ;
  - glisser vers le **bas**, bouton 👁 ou **appui long** : masquer l'interface (un toucher la fait revenir) ;
  - glisser une fenêtre vers le bas : la fermer.
- **Sur ordinateur** :
  - le jeu s'affiche dans un cadre de téléphone ;
  - Espace ou Entrée pour avancer ;
  - 1 à 9 pour choisir ;
  - Échap pour le menu ;
  - H pour masquer l'interface.
- **Données** : les sauvegardes et réglages sont stockés **sur l'appareil** (localStorage). Elles ne passent pas d'un téléphone à l'autre.

---

## Mettre le jeu sur ton iPhone

Le jeu doit être hébergé en ligne (en **https**) une première fois.

**Option la plus simple : Netlify Drop**
1. Sur un ordinateur, va sur https://app.netlify.com/drop.
2. Glisse-dépose le **dossier `app`** entier. Tu obtiens une adresse du type `https://xxxx.netlify.app`.

**Option : GitHub Pages**
1. Crée un dépôt et mets-y le contenu du dossier `app`.
2. Va dans Settings, puis Pages, et choisis « Deploy from branch » sur `main` / root.

**Ensuite, sur l'iPhone :**
1. Ouvre l'adresse dans **Safari**.
2. Touche le bouton **Partager** (carré avec une flèche), puis **« Sur l'écran d'accueil »** (« Ajouter à l'écran d'accueil »).
3. Lance le jeu depuis l'icône : il s'ouvre en plein écran, sans la barre de Safari. Après ce premier chargement, **il marche hors ligne**.

Pour tester sur ordinateur : dans le dossier `app`, lance `python3 -m http.server`, puis ouvre http://localhost:8000. Le mode hors ligne ne s'active qu'en http(s) ; ouvrir `index.html` en double-cliquant marche aussi, mais sans le mode hors ligne.
