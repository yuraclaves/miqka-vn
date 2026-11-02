/* =====================================================================
   story.js : TON HISTOIRE. C'est le seul fichier à modifier pour écrire.
   (Le mode d'emploi complet est dans README.md.)
   ===================================================================== */
window.STORY = {

  title: "Miqka City",
  subtitle: "Vraie ou fausse richesse ?",
  titleBackground: "toit",          // décor affiché derrière l'écran titre
  start: "exemple",                 // première scène lancée par « Nouvelle partie »

  /* --- Personnages : id -> nom affiché + poses (fichiers image) --- */
  characters: {
    miqka: {
      name: "Miqka",
      poses: {
        excited:  "assets/sprites/excited.png",
        idea:     "assets/sprites/idea.png",
        pointing: "assets/sprites/pointing.png",
        shy:      "assets/sprites/shy.png",
        sweet:    "assets/sprites/sweet.png"
      }
    }
  },

  /* --- Décors : nom -> fichier (SVG, JPG, PNG ou WEBP) --- */
  backgrounds: {
    toit: "assets/bg/toit.svg",     // toit au coucher du soleil
    rue:  "assets/bg/rue.svg",      // rue de nuit
    cafe: "assets/bg/cafe.svg"      // intérieur de café
  },

  /* --- Musiques (facultatif) : nom -> fichier audio ---
     Exemple : theme: "assets/music/theme.mp3"  (puis  music: "theme"  dans une ligne) */
  music: {},

  /* ===================================================================
     SCÈNES. ⚠ CECI EST UN EXEMPLE (placeholder) : remplace-le par ton texte.
     =================================================================== */
  scenes: {

    exemple: {
      chapter: "Chapitre 1",
      title: "Titre du chapitre",
      background: "toit",
      lines: [
        { speaker: "miqka", pose: "excited", effect: "bounce", text: "[Exemple] Première réplique de Miqka. Touche l'écran pour continuer." },
        { speaker: "miqka", pose: "idea", text: "[Exemple] Deuxième réplique : la pose change avec un fondu doux." },
        { text: "[Exemple] Une ligne de narration, sans nom au-dessus." },
        { speaker: "miqka", pose: "pointing", effect: "shake", text: "[Exemple] Maintenant, un choix :" },
        { choices: [
            { text: "Choix A (exemple)", goto: "exemple_a" },
            { text: "Choix B (exemple)", goto: "exemple_b" }
        ] }
      ]
    },

    exemple_a: {
      background: "rue",
      lines: [
        { speaker: "miqka", pose: "shy", text: "[Exemple] Résultat du choix A : nouveau décor, nouvelle pose." },
        { end: true }
      ]
    },

    exemple_b: {
      background: "cafe",
      lines: [
        { speaker: "miqka", pose: "sweet", effect: "hop", text: "[Exemple] Résultat du choix B : nouveau décor, nouvelle pose." },
        { end: true }
      ]
    }
  }
};
