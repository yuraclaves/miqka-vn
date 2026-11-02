/* Miqka City — paliers de richesse de Miqka (onglet « Miqka »).
   Overlays = vrais PNG transparents (assets/overlays/*.png) dessinés à la main en SVG puis rasterisés ; AUCUNE image générée par IA.
   Placés sur chacune des 5 poses grâce à des points d'ancrage par pose (coordonnées en px du sprite 580×844). */
(function(){
"use strict";
var DIR="assets/overlays/", SW=580, SH=844;
/* [largeur, hauteur, ancreX, ancreY] en px du sprite (PNG rasterisés à ×2) */
var IT={"bandage_a":[48,48,0.5,0.5],"bandage_b":[52,24,0.5,0.5],"smudge":[34,22,0.5,0.5],"dust":[220,90,0.5,0.95],"fly":[34,26,0.5,0.5],"ticket":[56,36,0.3,0.6],"coin_holed":[38,38,0.5,0.5],"patch_a":[44,40,0.5,0.5],"patch_b":[40,40,0.5,0.5],"clip_a":[34,34,0.5,0.5],"clip_b":[34,34,0.5,0.5],"glasses_round":[100,36,0.5,0.5],"glasses_rect":[100,36,0.5,0.5],"sun_a":[104,40,0.5,0.45],"sun_b":[104,40,0.5,0.45],"eye_dollar":[100,40,0.5,0.5],"scarf":[130,120,0.5,0.18],"watch":[40,30,0.5,0.5],"bag_small":[64,76,0.5,0.1],"beret":[110,52,0.5,0.85],"tophat":[96,94,0.5,0.8],"pearls":[100,56,0.5,0.12],"bag_lux":[86,92,0.5,0.1],"chain":[130,120,0.5,0.04],"cash":[100,92,0.32,0.78],"bill":[60,32,0.5,0.5],"cigar":[96,36,0.06,0.5],"smoke":[80,100,0.35,0.95],"crown":[116,84,0.5,0.84],"coin":[32,32,0.5,0.5],"carton":[120,92,0.45,0.55],"cernes":[100,30,0.5,0.2],"pigeon":[70,60,0.5,0.95],"bling":[40,40,0.5,0.5]};
/* points d'ancrage par pose : yeux [xG,yG,xD,yD], bouche, joues, sommet de tête, cheveux, cou, poitrine, mains, poignet, hanche, pieds, jupe */
var ANCH={
 excited:{eyes:[292,133,335,133],mouth:[307,183],cheekL:[281,162],cheekR:[337,160],head:[300,52],hair:[262,92],neck:[303,238],chest:[300,335],handA:[215,262],handB:[380,262],wrist:[380,298],hip:[398,520],feet:[305,808],skirtA:[235,650],skirtB:[372,712]},
 idea:   {eyes:[285,142,335,137],mouth:[315,188],cheekL:[287,167],cheekR:[341,162],head:[303,56],hair:[262,96],neck:[305,250],chest:[312,345],handA:[486,168],handB:[232,598],wrist:[474,222],hip:[238,560],feet:[318,808],skirtA:[270,660],skirtB:[380,720]},
 pointing:{eyes:[300,145,347,132],mouth:[335,186],cheekL:[305,170],cheekR:[356,160],head:[308,58],hair:[272,98],neck:[332,255],chest:[360,350],handA:[236,280],handB:[432,500],wrist:[250,325],hip:[432,520],feet:[330,826],skirtA:[290,660],skirtB:[410,720]},
 shy:    {eyes:[282,145,332,145],mouth:[307,195],cheekL:[276,172],cheekR:[338,172],head:[305,54],hair:[262,92],neck:[305,262],chest:[300,335],handA:[232,246],handB:[376,246],wrist:[240,262],hip:[402,520],feet:[320,795],skirtA:[255,640],skirtB:[370,700]},
 sweet:  {eyes:[265,155,312,145],mouth:[295,200],cheekL:[262,180],cheekR:[318,172],head:[290,54],hair:[250,96],neck:[305,248],chest:[312,330],handA:[340,440],handB:[300,452],wrist:[318,455],hip:[245,470],feet:[330,748],skirtA:[255,600],skirtB:[380,660]}
};
var HEADY={eyes:1,mouth:1,cheekL:1,cheekR:1,head:1,hair:1};
/* accessoires (i = fichier, at = ancre, dx/dy décalage (repère de la tête pour les ancres de tête), r rotation, s échelle, c classe d'animation) */
var A={
 bandA:{i:"bandage_a",at:"hair",r:-10,s:1.5}, bandB:{i:"bandage_b",at:"hair",r:-28,s:1.4}, bandC:{i:"bandage_b",at:"cheekR",r:24,s:.95},
 smL:{i:"smudge",at:"cheekL",s:1.25}, smR:{i:"smudge",at:"cheekR",s:1.15,r:15}, dust:{i:"dust",at:"feet",s:1.2}, fly:{i:"fly",at:"head",dx:66,dy:0,s:1.6,c:"buzz"},
 ticket:{i:"ticket",at:"handA",r:-6,s:1.6}, holed:{i:"coin_holed",at:"handB",s:1.6}, holedA:{i:"coin_holed",at:"handA",s:1.6},
 patchA:{i:"patch_a",at:"skirtA",s:1.5}, patchB:{i:"patch_b",at:"skirtB",s:1.5}, patchC:{i:"patch_b",at:"chest",dx:-46,dy:6,s:1.2},
 clipA:{i:"clip_a",at:"hair",s:1.5}, clipB:{i:"clip_b",at:"hair",s:1.5},
 glR:{i:"glasses_round",at:"eyes"}, glQ:{i:"glasses_rect",at:"eyes"}, scarf:{i:"scarf",at:"neck",dy:-10,s:1.12}, watch:{i:"watch",at:"wrist",r:-10,s:1.4},
 bagS:{i:"bag_small",at:"hip",s:1.5}, beret:{i:"beret",at:"head",dx:-6,dy:20,r:-14,s:1.15}, tophat:{i:"tophat",at:"head",dy:24,s:1.15,r:7},
 pearls:{i:"pearls",at:"neck",dy:-4,s:1}, bagL:{i:"bag_lux",at:"hip",s:1.4},
 sunA:{i:"sun_a",at:"eyes"}, sunB:{i:"sun_b",at:"eyes",s:1.05}, dollar:{i:"eye_dollar",at:"eyes",c:"dz"},
 chain:{i:"chain",at:"neck",dy:-8,s:1.25}, cash:{i:"cash",at:"handA",s:1.6,c:"wig"}, cash2:{i:"cash",at:"handB",s:1.4,r:18,c:"wig"},
 cigar:{i:"cigar",at:"mouth",dx:5,dy:3,s:1.3}, smoke:{i:"smoke",at:"mouth",dx:112,dy:-2,s:1.25,c:"puff"},
 fly2:{i:"fly",at:"head",dx:-80,dy:40,s:1.4,c:"buzz"}, carton:{i:"carton",at:"handA",dy:30,s:1.5}, cernes:{i:"cernes",at:"eyes",dy:16},
 crown:{i:"crown",at:"head",dy:32,s:1.3,c:"bob"}, bl1:{i:"bling",at:"head",dx:-92,dy:40,s:1.5,c:"tw"}, bl2:{i:"bling",at:"head",dx:96,dy:80,s:1.2,c:"tw2"}, bl3:{i:"bling",at:"chest",dx:-120,dy:60,s:1.3,c:"tw"}
};
/* PALIERS (21) : chaque palier est INDÉPENDANT = une seule idée d'accessoire/effet (variantes aléatoires de la même idée), rien ne se cumule.
   Seuils en Kwak Coin cumulés (S.total, ne redescend jamais), calés sur la simulation de l'économie (~18 h pour tout débloquer).
   Aucun numéro ni total n'est affiché en jeu : seulement le petit texte de statut « st ».
   aura = couleur sobre du halo, fx = niveau d'effets de clic (0 normal, 1 pièces, 2 étincelles dorées, 3 + léger tremblement), rain = pluie de pièces. */
var TIERS=[
 {at:0,        st:"Elle est dans la merde.",                    v:[["fly"],["fly","fly2"],["fly2"]], aura:"#8a8f86"},
 {at:60,       st:"Même le pigeon la plaint.",                  v:[["bandA"],["bandB"],["bandA","bandC"]], aura:"#9a9384"},
 {at:130,      st:"Dort dans un carton (avec poignées).",       v:[["carton"]], aura:"#a08a6a"},
 {at:250,      st:"Cernes jusqu'aux genoux.",                    v:[["cernes"]], aura:"#8d8aa0"},
 {at:600,      st:"Fraude le métro avec élégance.",             v:[["ticket"]], aura:"#b9a35a"},
 {at:1200,     st:"Une pièce trouée ! C'est un début.",         v:[["holed"],["holedA"]], aura:"#b08a5a"},
 {at:2500,     st:"Raccommode ses trous au scotch.",            v:[["patchA"],["patchB"],["patchC"]], aura:"#7f9bb5"},
 {at:5000,     st:"Barrette à 1 Kwak, regard à 1 million.",     v:[["clipA"],["clipB"]], aura:"#c79bb0"},
 {at:9000,     st:"Lunettes de comptable activées.",            v:[["glR"],["glQ"]], aura:"#86a9a0"},
 {at:16000,    st:"Écharpe de mamie, chaleur garantie.",        v:[["scarf"]], aura:"#c7816f"},
 {at:30000,    st:"Béret : elle a lu un livre.",                v:[["beret"]], aura:"#b5707a"},
 {at:55000,    st:"Un sac ! Dedans : un autre sac.",            v:[["bagS"],["bagL"]], aura:"#c9a36b"},
 {at:100000,   st:"Des perles. Vraies ? On ne demande pas.",    v:[["pearls"]], aura:"#d8d2c4"},
 {at:180000,   st:"Sa montre donne l'heure… en or.",            v:[["watch"]], aura:"#d6b86a"},
 {at:320000,   st:"Haut-de-forme. L'ego aussi.",                v:[["tophat"]], aura:"#9fb0c8"},
 {at:550000,   st:"Lunettes de soleil, surtout la nuit.",       v:[["sunA"],["sunB"]], aura:"#e3b45a", fx:1},
 {at:900000,   st:"Chaîne en or : 3 kg de réussite.",           v:[["chain"]], aura:"#e8c25a", fx:1},
 {at:1500000,  st:"Agite des billets sans raison.",             v:[["cash"],["cash2"]], aura:"#8fc59a", fx:2},
 {at:2500000,  st:"Cigare en chocolat. On espère.",             v:[["cigar","smoke"]], aura:"#c99a6a", fx:2},
 {at:5000000,  st:"Elle voit des Kwak partout.",                v:[["dollar"]], aura:"#f0cf5a", fx:3},
 {at:10000000, st:"Reine de tout. Même des pigeons.",           v:[["crown"],["crown","bl1"]], aura:"#ffd75e", fx:3, rain:2}
];
function tierOf(total){ var t=0; for(var i=0;i<TIERS.length;i++) if(total>=TIERS[i].at) t=i; return t; }
function rng(seed){ var s=(seed>>>0)||1; return function(){ s^=s<<13; s^=s>>>17; s^=s<<5; return ((s>>>0)%10000)/10000; }; }
function pick(t,seed){ var r=rng(seed+t*7919), v=TIERS[t].v; return v[(r()*v.length)|0].slice(); }
function place(pose,key,anch){ var a=A[key]; if(!a) return null; var P=(anch||ANCH)[pose], m=IT[a.i]; if(!P||!m||!P[a.at]||!P.eyes) return null;
  var e=P.eyes, ang=Math.atan2(e[3]-e[1],e[2]-e[0]), deg=ang*180/Math.PI, s=a.s||1, x, y, rot=a.r||0;
  if(a.at==="eyes"){ x=(e[0]+e[2])/2; y=(e[1]+e[3])/2; s*=Math.max(.9,Math.min(1.12,Math.hypot(e[2]-e[0],e[3]-e[1])/46)); }
  else { var p=P[a.at]; x=p[0]; y=p[1]; }
  var dx=a.dx||0, dy=a.dy||0;
  if(HEADY[a.at]){ x+=dx*Math.cos(ang)-dy*Math.sin(ang); y+=dx*Math.sin(ang)+dy*Math.cos(ang); rot+=deg; } else { x+=dx; y+=dy; }
  return {src:DIR+a.i+".png", x:x, y:y, w:m[0]*s, h:m[1]*s, ax:m[2], ay:m[3], r:rot, c:a.c||""}; }
/* render(boîte, pose, accessoires, animer, [ancres, largeur, hauteur du sprite]) : mêmes accessoires sur n'importe quel perso ayant des ancres par pose */
function render(box,pose,keys,pop,anch,sw,sh){ box.textContent=""; var SW=sw||580, SH=sh||844;
  keys.forEach(function(k,i){ var q=place(pose,k,anch); if(!q) return; var im=new Image(); im.alt=""; im.decoding="async"; im.src=q.src; im.className="ov"+(q.c?" ov-"+q.c:"")+(pop?" ov-pop":"");
    var st=im.style; st.left=(q.x/SW*100)+"%"; st.top=(q.y/SH*100)+"%"; st.width=(q.w/SW*100)+"%";
    st.setProperty("--tx",(-q.ax*100)+"%"); st.setProperty("--ty",(-q.ay*100)+"%"); st.setProperty("--r",q.r.toFixed(1)+"deg"); st.transformOrigin=(q.ax*100)+"% "+(q.ay*100)+"%";
    if(pop) st.animationDelay=(i*55)+"ms"; box.appendChild(im); }); }
window.WEALTH={TIERS:TIERS, ANCH:ANCH, ITEMS:A, tierOf:tierOf, pick:pick, render:render, files:Object.keys(IT)};
})();
