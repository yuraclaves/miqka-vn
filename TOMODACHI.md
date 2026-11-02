# Tomodachi — ajouter un ami de Miqka

Onglet **Miqka** → languette « Tomodachi » en bas → tiroir avec 3 emplacements.
Tant qu'un emplacement n'a pas de sprite, il reste verrouillé (« ??? », silhouette neutre identique, prix affiché, bouton « Bientôt »).
Aucun nom, aucune image, aucun indice n'existe dans le code ou le DOM pour ces emplacements.

## 1. Fichier image (fourni par toi)
- Uniquement la **tête** (pas de corps) : c'est tout ce qui s'affiche derrière Miqka.
- PNG ou WebP **transparent**, tête bien centrée, ~400 × 400 px (carré conseillé ; un ratio portrait jusqu'à 400 × 500 marche aussi).
- Image officielle/autorisée uniquement (pas d'IA, pas de fanart) ; ajoute la source dans SOURCES.md.
- Nom de fichier neutre : `assets/tomo/t1/head.webp` (t1, t2 ou t3).

## 2. Déclaration (js/city.js, tableau `TOMO`)
```js
var TOMO=[
  {k:"t1", price:250000, ready:true, name:"Nom affiché",
   head:"assets/tomo/t1/head.webp", w:400, h:400,
   anch:{ head:{ eyes:[xG,yG,xD,yD], mouth:[x,y], cheekL:[x,y], cheekR:[x,y], head:[x,y], hair:[x,y] } } },
  {k:"t2", price:2500000},
  {k:"t3", price:25000000}
];
```
- `k` : identifiant neutre (ne change pas, c'est lui qui est sauvegardé dans `S.tomo`).
- `price` : prix en Kwak Coin (élevé et croissant).
- `ready:true` : seulement quand l'image existe ; sinon l'emplacement reste verrouillé.
- `w`, `h` : taille réelle de l'image en px.
- `anch.head` : points d'ancrage **en pixels de l'image** (origine en haut à gauche), comme pour les poses de Miqka (`ANCH` dans js/wealth.js) :
  - `eyes` = centre œil gauche (x,y) puis œil droit (x,y) → lunettes, cernes, yeux « Kwak » ;
  - `mouth` → cigare ; `cheekL`/`cheekR` → pansements ; `head` = sommet du crâne → couronne, béret, haut-de-forme ; `hair` → barrette.
  - Les accessoires du corps (mains, cou, poignet) sont ignorés automatiquement puisque seule la tête est affichée.
- Une seule pose `head` est utilisée (le rebond/squish se fait en CSS, comme Miqka).

## 3. Ce qui est automatique
- Placement : derrière Miqka (z-index inférieur), plus petit, décalé sur les côtés ; emplacements testés contre les collisions (entre les têtes et avec le visage de Miqka). Miqka reste toujours devant.
- Clic : même squish/rebond, même son et mêmes particules que Miqka, +1 Kwak Coin.
- Paliers : chaque tête reçoit le même accessoire de palier que Miqka (via ses ancres).
- Sauvegarde : `S.tomo = ["t1", …]` dans la sauvegarde existante.

## 4. Mode test
`?debugTomo=1` dans l'URL : remplit les 3 emplacements avec des carrés gris « test 1/2/3 » (jamais visibles en jeu normal).
Ex. : `https://miqka-vn.onrender.com/?debugTomo=1` puis `CITY.state().coins=4e7` dans la console pour pouvoir les débloquer.
