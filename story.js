/* =====================================================================
   story.js : TON HISTOIRE. C'est le seul fichier à modifier pour écrire.
   (Le mode d'emploi complet est dans README.md.)
   ===================================================================== */
window.STORY = {

  title: "Miqka City",
  subtitle: "Vraie ou fausse richesse ?",
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
    },
    /* Employés de la Ville : représentés par leur buste officiel recadré (une seule « pose » : buste) */
    estinien: {"name": "Estinien", "poses": {"buste": "assets/ville/estinien.webp"}},
    homer: {"name": "Homer", "poses": {"buste": "assets/ville/homer.webp"}},
    topaz: {"name": "Topaz", "poses": {"buste": "assets/ville/topaz.webp"}},
    zenos: {"name": "Zenos", "poses": {"buste": "assets/ville/zenos.webp"}},
    chiaki: {"name": "Chiaki", "poses": {"buste": "assets/ville/chiaki.webp"}},
    bigjim: {"name": "Big Jim", "poses": {"buste": "assets/ville/bigjim.webp"}},
    sinbad: {"name": "Sinbad", "poses": {"buste": "assets/ville/sinbad.webp"}},
    rin: {"name": "Rin", "poses": {"buste": "assets/ville/rin.webp"}},
    bakool: {"name": "Bakool Jaja", "poses": {"buste": "assets/ville/bakool.webp"}},
    aventurine: {"name": "Aventurine", "poses": {"buste": "assets/ville/aventurine.webp"}},
    fandaniel: {"name": "Fandaniel", "poses": {"buste": "assets/ville/fandaniel.webp"}},
    /* Hancock (prologue) : aucune image officielle détourable trouvée → pas de sprite (Miqka reste affichée), voir SOURCES.md */
    hancock: {"name": "Hancock", "poses": {}}
  },

  /* --- Décors : nom -> fichier (SVG, JPG, PNG ou WEBP) --- */
  backgrounds: {
    toit: "assets/bg/toit.webp",     // toit au coucher du soleil
    rue:  "assets/bg/rue.webp",      // rue de nuit
    cafe: "assets/bg/cafe.webp",     // intérieur de café
    prison: "assets/bg/prison.webp", // cellule de prison (photo Wikimedia Commons, crédits SOURCES.md), décor du prologue
    ville: "assets/ville/city.webp" // décor de la ville du joueur (crédits : SOURCES.md), séquences d'embauche
  },

  /* --- Musiques (facultatif) : nom -> fichier audio ---
     Exemple : theme: "assets/music/theme.mp3"  (puis  music: "theme"  dans une ligne) */
  music: {},

  /* ===================================================================
     SCÈNES. ⚠ CECI EST UN EXEMPLE (placeholder) : remplace-le par ton texte.
     =================================================================== */
  scenes: {

    /* ---- SÉQUENCES D'EMBAUCHE ⚠ EXEMPLES [Exemple] : une scène « embauche_<id> » par employé.
       Elle se joue à la PREMIÈRE embauche du perso ; à la fin, l'embauche est validée et on revient à la Ville.
       Rejouables depuis « Histoire ». Garde 5 à 8 répliques pour ne pas freiner le jeu. ---- */
    embauche_estinien: {
      "chapter": "Embauche",
      "title": "Estinien — Garde",
      "background": "ville",
      "lines": [
        {
          "speaker": "miqka",
          "pose": "pointing",
          "text": "[Exemple] Toi, là-haut sur le toit ! Tu cherches du travail ?"
        },
        {
          "speaker": "estinien",
          "pose": "buste",
          "text": "[Exemple] Je ne cherche rien. Je surveille. Les dragons, les voleurs… les pigeons.",
          "effect": "bounce"
        },
        {
          "speaker": "miqka",
          "pose": "idea",
          "text": "[Exemple] Parfait : Garde de {ville} ! Payé en Kwak Coin."
        },
        {
          "speaker": "estinien",
          "pose": "buste",
          "text": "[Exemple] …Y a-t-il un toit assez haut pour sauter ?"
        },
        {
          "speaker": "miqka",
          "pose": "excited",
          "text": "[Exemple] On en construira un exprès !"
        },
        {
          "speaker": "estinien",
          "pose": "buste",
          "text": "[Exemple] Marché conclu. *saute de façon dramatique*"
        },
        {
          "end": true
        }
      ]
    },

    embauche_homer: {
      "chapter": "Embauche",
      "title": "Homer — Donuts",
      "background": "ville",
      "lines": [
        {
          "speaker": "miqka",
          "pose": "excited",
          "text": "[Exemple] Monsieur Homer ! {ville} a besoin d'un expert."
        },
        {
          "speaker": "homer",
          "pose": "buste",
          "text": "[Exemple] Mmmh… un expert en quoi ? Je suis surtout expert en sieste.",
          "effect": "bounce"
        },
        {
          "speaker": "miqka",
          "pose": "idea",
          "text": "[Exemple] En donuts ! Un stand rose, avec des vermicelles."
        },
        {
          "speaker": "homer",
          "pose": "buste",
          "text": "[Exemple] Woo-hoo ! Et je peux goûter tout le stock ?"
        },
        {
          "speaker": "miqka",
          "pose": "shy",
          "text": "[Exemple] …Disons un donut sur deux ?"
        },
        {
          "speaker": "homer",
          "pose": "buste",
          "text": "[Exemple] Signé ! *bave sur le contrat*"
        },
        {
          "end": true
        }
      ]
    },

    embauche_topaz: {
      "chapter": "Embauche",
      "title": "Topaz — Gestionnaire",
      "background": "ville",
      "lines": [
        {
          "speaker": "miqka",
          "pose": "sweet",
          "text": "[Exemple] Bonjour ! J'ai entendu dire que tu adorais les tableurs."
        },
        {
          "speaker": "topaz",
          "pose": "buste",
          "text": "[Exemple] Les tableurs, les budgets, les audits surprises… Montre-moi tes comptes.",
          "effect": "bounce"
        },
        {
          "speaker": "miqka",
          "pose": "shy",
          "text": "[Exemple] Euh… ils sont écrits au feutre sur un carton."
        },
        {
          "speaker": "topaz",
          "pose": "buste",
          "text": "[Exemple] Hmm. Il y a du potentiel. Et beaucoup de travail."
        },
        {
          "speaker": "miqka",
          "pose": "excited",
          "text": "[Exemple] Donc tu acceptes d'être Gestionnaire ?"
        },
        {
          "speaker": "topaz",
          "pose": "buste",
          "text": "[Exemple] J'accepte. Premier rendez-vous : demain, sept heures. Apporte le carton."
        },
        {
          "end": true
        }
      ]
    },

    embauche_zenos: {
      "chapter": "Embauche",
      "title": "Zenos — Prince",
      "background": "ville",
      "lines": [
        {
          "speaker": "miqka",
          "pose": "pointing",
          "text": "[Exemple] Excusez-moi, Votre Altesse ! Un job de Prince, ça vous dit ?"
        },
        {
          "speaker": "zenos",
          "pose": "buste",
          "text": "[Exemple] Un prince ne travaille pas. Il cherche un adversaire digne de lui.",
          "effect": "bounce"
        },
        {
          "speaker": "miqka",
          "pose": "idea",
          "text": "[Exemple] On a une machine à pinces très coriace à la fête foraine !"
        },
        {
          "speaker": "zenos",
          "pose": "buste",
          "text": "[Exemple] …Enfin. Une véritable épreuve."
        },
        {
          "speaker": "miqka",
          "pose": "excited",
          "text": "[Exemple] Alors bienvenue dans l'équipe !"
        },
        {
          "speaker": "zenos",
          "pose": "buste",
          "text": "[Exemple] Je la vaincrai. Quel qu'en soit le prix. Même deux jetons."
        },
        {
          "end": true
        }
      ]
    },

    embauche_chiaki: {
      "chapter": "Embauche",
      "title": "Chiaki — Joueuse",
      "background": "ville",
      "lines": [
        {
          "speaker": "miqka",
          "pose": "sweet",
          "text": "[Exemple] Chiaki ? Tu dors ou tu joues ?"
        },
        {
          "speaker": "chiaki",
          "pose": "buste",
          "text": "[Exemple] Les deux… je suis au niveau 99 en sieste stratégique.",
          "effect": "bounce"
        },
        {
          "speaker": "miqka",
          "pose": "idea",
          "text": "[Exemple] Il nous faut une Joueuse officielle pour tester la ville !"
        },
        {
          "speaker": "chiaki",
          "pose": "buste",
          "text": "[Exemple] La ville a des quêtes secondaires ?"
        },
        {
          "speaker": "miqka",
          "pose": "excited",
          "text": "[Exemple] Plein ! Et une salle d'arcade !"
        },
        {
          "speaker": "chiaki",
          "pose": "buste",
          "text": "[Exemple] D'accord. Mais je garde ma manette."
        },
        {
          "end": true
        }
      ]
    },

    embauche_bigjim: {
      "chapter": "Embauche",
      "title": "Big Jim — Adjoint",
      "background": "ville",
      "lines": [
        {
          "speaker": "miqka",
          "pose": "pointing",
          "text": "[Exemple] Monsieur Big Jim ! La mairie recrute un Adjoint."
        },
        {
          "speaker": "bigjim",
          "pose": "buste",
          "text": "[Exemple] Un adjoint ? Moi, je suis plutôt du genre… à tout diriger.",
          "effect": "bounce"
        },
        {
          "speaker": "miqka",
          "pose": "shy",
          "text": "[Exemple] On a un très joli bureau. Avec une plante."
        },
        {
          "speaker": "bigjim",
          "pose": "buste",
          "text": "[Exemple] Une plante… et un tampon officiel ?"
        },
        {
          "speaker": "miqka",
          "pose": "excited",
          "text": "[Exemple] Deux tampons !"
        },
        {
          "speaker": "bigjim",
          "pose": "buste",
          "text": "[Exemple] Hmm. J'accepte, pour le bien de la communauté, évidemment."
        },
        {
          "end": true
        }
      ]
    },

    embauche_sinbad: {
      "chapter": "Embauche",
      "title": "Sinbad — Roi des Sept Mers",
      "background": "ville",
      "lines": [
        {
          "speaker": "miqka",
          "pose": "excited",
          "text": "[Exemple] Ohé ! Tu es le Roi des Sept Mers ?"
        },
        {
          "speaker": "sinbad",
          "pose": "buste",
          "text": "[Exemple] En personne ! Mais une ville sans port, c'est une aventure sans fin.",
          "effect": "bounce"
        },
        {
          "speaker": "miqka",
          "pose": "idea",
          "text": "[Exemple] On a une fontaine ! C'est presque une mer."
        },
        {
          "speaker": "sinbad",
          "pose": "buste",
          "text": "[Exemple] Ha ha ! J'aime ton audace, petite."
        },
        {
          "speaker": "miqka",
          "pose": "sweet",
          "text": "[Exemple] Alors tu rejoins {ville} ?"
        },
        {
          "speaker": "sinbad",
          "pose": "buste",
          "text": "[Exemple] Hissez les voiles ! Enfin… remplissez la fontaine."
        },
        {
          "end": true
        }
      ]
    },

    embauche_rin: {
      "chapter": "Embauche",
      "title": "Rin — Attaquante",
      "background": "ville",
      "lines": [
        {
          "speaker": "miqka",
          "pose": "pointing",
          "text": "[Exemple] Rin ! L'équipe de foot de la ville cherche une star."
        },
        {
          "speaker": "rin",
          "pose": "buste",
          "text": "[Exemple] Je ne joue pas pour être une star. Je joue pour être le meilleur.",
          "effect": "bounce"
        },
        {
          "speaker": "miqka",
          "pose": "idea",
          "text": "[Exemple] Tu pourrais être Attaquante… euh, Attaquant officiel !"
        },
        {
          "speaker": "rin",
          "pose": "buste",
          "text": "[Exemple] …Montre-moi le terrain."
        },
        {
          "speaker": "miqka",
          "pose": "shy",
          "text": "[Exemple] C'est un parking. Mais on a dessiné les lignes."
        },
        {
          "speaker": "rin",
          "pose": "buste",
          "text": "[Exemple] Ça ira. Je marquerai quand même."
        },
        {
          "end": true
        }
      ]
    },

    embauche_bakool: {
      "chapter": "Embauche",
      "title": "Bakool Jaja — Chef de tribu",
      "background": "ville",
      "lines": [
        {
          "speaker": "miqka",
          "pose": "excited",
          "text": "[Exemple] Bonjour à vous deux ! Vous êtes chef de tribu ?"
        },
        {
          "speaker": "bakool",
          "pose": "buste",
          "text": "[Exemple] Nous sommes Bakool Jaja ! Deux têtes, double prestige, double appétit !",
          "effect": "bounce"
        },
        {
          "speaker": "miqka",
          "pose": "idea",
          "text": "[Exemple] {ville} cherche un chef pour sa tribu de travailleurs !"
        },
        {
          "speaker": "bakool",
          "pose": "buste",
          "text": "[Exemple] Une tribu ? Des fidèles ? Des acclamations ?"
        },
        {
          "speaker": "miqka",
          "pose": "sweet",
          "text": "[Exemple] Au moins des applaudissements polis."
        },
        {
          "speaker": "bakool",
          "pose": "buste",
          "text": "[Exemple] Ça nous suffit ! Gloire à Bakool Jaja !"
        },
        {
          "end": true
        }
      ]
    },

    embauche_aventurine: {
      "chapter": "Embauche",
      "title": "Aventurine — Banquier",
      "background": "ville",
      "lines": [
        {
          "speaker": "miqka",
          "pose": "sweet",
          "text": "[Exemple] Bonjour ! On m'a dit que tu étais doué avec l'argent."
        },
        {
          "speaker": "aventurine",
          "pose": "buste",
          "text": "[Exemple] L'argent, les paris, les risques calculés… tout est une question de mise.",
          "effect": "bounce"
        },
        {
          "speaker": "miqka",
          "pose": "idea",
          "text": "[Exemple] La banque de {ville} a besoin d'un Banquier !"
        },
        {
          "speaker": "aventurine",
          "pose": "buste",
          "text": "[Exemple] Et si je double tes Kwak Coin à pile ou face ?"
        },
        {
          "speaker": "miqka",
          "pose": "shy",
          "text": "[Exemple] …On va dire non. Mais bienvenue quand même !"
        },
        {
          "speaker": "aventurine",
          "pose": "buste",
          "text": "[Exemple] Dommage. J'aurais gagné, bien sûr."
        },
        {
          "end": true
        }
      ]
    },

    embauche_fandaniel: {
      "chapter": "Embauche",
      "title": "Fandaniel — Événements",
      "background": "ville",
      "lines": [
        {
          "speaker": "miqka",
          "pose": "pointing",
          "text": "[Exemple] Toi, là, avec le grand sourire bizarre !"
        },
        {
          "speaker": "fandaniel",
          "pose": "buste",
          "text": "[Exemple] Moi ? Je suis un artiste de la fin du monde ! Enfin… des grandes fêtes.",
          "effect": "bounce"
        },
        {
          "speaker": "miqka",
          "pose": "idea",
          "text": "[Exemple] Parfait ! Il nous faut un responsable des Événements."
        },
        {
          "speaker": "fandaniel",
          "pose": "buste",
          "text": "[Exemple] Feux d'artifice ? Confettis ? Petits chaos rigolos ?"
        },
        {
          "speaker": "miqka",
          "pose": "shy",
          "text": "[Exemple] Sans le chaos, si possible."
        },
        {
          "speaker": "fandaniel",
          "pose": "buste",
          "text": "[Exemple] Ha ha ha ! On verra bien !"
        },
        {
          "end": true
        }
      ]
    },


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

    /* ---- PROLOGUE / TUTORIEL (narré par Miqka). Joué une fois à la Nouvelle partie, rejouable depuis « Histoire ».
       {ville} = nom de ville choisi par le joueur (inséré en texte brut). Les phases de clic (10 puis 50 Kwak Coin) sont gérées par js/city.js. ---- */
    tuto_1: {
      chapter: "Prologue", title: "Miqka en prison", background: "prison",
      lines: [
        { speaker: "miqka", pose: "shy", text: "Oh daaawg…" },
        { speaker: "miqka", pose: "shy", effect: "shake", text: "J'ai pris 67 ans de prison… J'aurais jamais dû voler ce Crousty…" },
        { speaker: "miqka", pose: "pointing", effect: "hop", text: "Eh, toi ! Le garde !" },
        { speaker: "miqka", pose: "idea", text: "Des Kwak Coin, ça te dit ?" },
        { speaker: "miqka", pose: "sweet", text: "Pssst… pour 10 Kwak Coin, tu me laisses filer ?" },
        { end: true }
      ]
    },
    tuto_2: {
      chapter: "Prologue", title: "La grande évasion", background: "prison",
      lines: [
        { speaker: "miqka", pose: "excited", effect: "bounce", text: "C'EST VRAI ? GÉNIAL !" },
        { end: true }
      ]
    },
    tuto_3: {
      chapter: "Prologue", title: "Un drôle de marchand", background: "ville",
      lines: [
        { speaker: "miqka", pose: "shy", effect: "shake", text: "Ouf… j'ai couru jusqu'ici mais… je suis où, maintenant, zebi ?" },
        { speaker: "hancock", character: "miqka", pose: "sweet", text: "*se frotte les mains* Vous m'avez l'air dans de beaux draps ! À la recherche d'une cachette ?" },
        { speaker: "hancock", character: "miqka", pose: "sweet", text: "J'ai pile ce qu'il vous faut ! Pour 15 Kwak Coin, je vous cède ce terrain, et vous pourrez y bâtir la ville de vos rêves ^^" },
        { speaker: "miqka", pose: "pointing", text: "O-oh… ouais, haha, pile ce qu'il me faut ! Combien de Kwak Coin pour votre sna-… bref. Oui ! Récoltons de la thune !" },
        { end: true }
      ]
    },
    tuto_4: {
      chapter: "Prologue", title: "Le terrain", background: "ville",
      lines: [
        { speaker: "hancock", character: "miqka", pose: "sweet", text: "15 Kwak Coin tout rond, un plaisir de faire affaire avec vous ! Et dites-moi… comment s'appellera votre ville ?" },
        { end: true }
      ]
    },
    tuto_5: {
      chapter: "Prologue", title: "Bienvenue à {ville}", background: "ville",
      lines: [
        { speaker: "miqka", pose: "excited", effect: "hop", text: "{ville}… Ça sonne bien ! Bon, c'est un terrain vague, mais c'est NOTRE terrain vague." },
        { speaker: "miqka", pose: "idea", text: "Le principe est simple : plus on a de Kwak Coin, plus on peut engager de personnages." },
        { speaker: "miqka", pose: "pointing", text: "Et chaque personnage engagé débloque un bout d'histoire… et fait grandir {ville} !" },
        { speaker: "miqka", pose: "excited", effect: "bounce", text: "Objectif : agrandir {ville}, rencontrer plein de personnages et profiter de l'histoire. C'est parti !" },
        { end: true }
      ]
    },
    tuto_nom: {
      chapter: "Prologue", title: "Un nom pour la ville", background: "ville",
      lines: [
        { speaker: "miqka", pose: "shy", text: "Dis… je viens de réaliser un truc gênant. Notre ville n'a toujours pas de nom !" },
        { speaker: "miqka", pose: "idea", text: "Choisis-en un, tu pourras le changer plus tard dans les Réglages." },
        { end: true }
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
