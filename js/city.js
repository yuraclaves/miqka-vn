/* Miqka City — jeu incrémental (onglets Ville, Miqka, Employés) + barre du bas « Histoire » / « Ville ».
   Le visual novel ne sert plus qu'aux SÉQUENCES D'EMBAUCHE (story.js, scènes « embauche_<id> ») : 1re embauche d'un perso → séquence → retour Ville.
   « Histoire » = journal des séquences déjà vues (rejouables). État séparé : localStorage « miqka_city.v1 » (le VN garde « miqka_vn.* » pour ses réglages).
   Images : bustes recadrés depuis des arts officiels (voir SOURCES du dossier de travail), décor de ville = capture officielle FFXIV (crédits dans SOURCES.md, jamais nommée en jeu : la ville porte le nom choisi par le joueur). */
(function(){
"use strict";
var $=function(id){return document.getElementById(id);};
var app=$("app"), IMG="assets/ville/", MQ="assets/sprites/title/";
var KEY="miqka_city.v1", MKEY="miqka_city.mode";
/* fx/fy = centre du visage dans le buste (en %) pour les petites têtes ; anim = mini animation propre au bandeau */
var CH=[
 {id:"bigjim",name:"Big Jim",job:"Adjoint",th:"dome",anim:"sway",fx:50,fy:34,base:80,first:70,rate:2},
 {id:"estinien",name:"Estinien",job:"Garde",th:"drg",anim:"float",fx:56,fy:27,base:2200,first:2200,rate:5},
 {id:"homer",name:"Homer",job:"Donuts",th:"donut",anim:"bounce",fx:50,fy:30,base:6300,first:6300,rate:12.5},
 {id:"chiaki",name:"Chiaki",job:"Joueuse",th:"pixel",anim:"steps",fx:52,fy:40,base:17000,first:17000,rate:31},
 {id:"rin",name:"Rin",job:"Attaquant",th:"pitch",anim:"kick",fx:44,fy:18,base:49000,first:49000,rate:78},
 {id:"topaz",name:"Topaz",job:"Gestionnaire",th:"ipc",anim:"twinkle",fx:44,fy:30,base:140000,first:140000,rate:195},
 {id:"bakool",name:"Bakool Jaja",job:"Chef de tribu",th:"tural",anim:"stomp",fx:42,fy:22,base:390000,first:390000,rate:490},
 {id:"zenos",name:"Zenos",job:"Prince",th:"garlean",anim:"pulse",fx:44,fy:32,base:1100000,first:1100000,rate:1220},
 {id:"aventurine",name:"Aventurine",job:"Banquier",th:"casino",anim:"chip",fx:48,fy:28,base:3000000,first:3100000,rate:3050},
 {id:"fandaniel",name:"Fandaniel",job:"Événements",th:"ember",anim:"flicker",fx:50,fy:32,base:8400000,first:15000000,rate:7600},
 {id:"sinbad",name:"Sinbad",job:"Roi des Sept Mers",th:"sea",anim:"wave",fx:46,fy:30,base:24000000,first:57000000,rate:19000}
];
var BY={}; CH.forEach(function(c,i){BY[c.id]=c; c.k="p"+(i+1);});   /* k = id neutre exposé dans le DOM (perso-1…) */
/* perso « connu » = déjà engagé (ou séquence vue) ; sinon bandeau caché : silhouette floutée, « ??? », aucun nom dans le DOM */
function known(c){ return n(c.id)>0 || (S.seen||[]).indexOf(c.id)>=0; }
var SIL="assets/ville/sil/";
/* nouvelle partie : 0 Kwak Coin, prologue/tutoriel en prison (S.tuto = étape en cours), personne d'engagé */
var DEMO={coins:0,total:0,hired:{},seen:[],t:0,mute:false,mode:"city",tab:"town",tuto:"t1"};
var S=load();
function fresh(){ var d=JSON.parse(JSON.stringify(DEMO)); d.t=Date.now(); d.seed=(Math.random()*1e9)|0; return d; }
function load(){ try{ var v=JSON.parse(localStorage.getItem(KEY)); if(v&&v.hired){ v.seen=v.seen||[]; if(v.total==null) v.total=v.coins; if(!v.seed) v.seed=(Math.random()*1e9)|0; if(v.tuto==null && !v.tutoDone) v.tutoDone=true; if(v.tuto==="intro") v.tuto="t3"; if(v.tuto==="t5"){ delete v.tuto; v.tutoDone=true; } /* anciennes sauvegardes : pas de tutoriel */ return v; } }catch(e){} return fresh(); }
var started=hasSave();
function save(){ if(!started) return; S.t=Date.now(); delete S.fresh; try{ localStorage.setItem(KEY,JSON.stringify(S)); }catch(e){} }
function hasSave(){ try{ return !!localStorage.getItem(KEY); }catch(e){ return false; } }
function n(id){ return S.hired[id]||0; }
/* prix : base fortement croissante selon le rang + ×1,17 par exemplaire (calibré par simulation, ~18 h pour tout débloquer) */
var GROW=1.15;   /* v10 : Big Jim 70, puis 80, 92, 106, 122… ; calibrage ≈ 15 h pour tout acheter */
/* début de partie un peu plus rapide (v7) : 1re embauche de Big Jim / Estinien à prix d'appel (first), les exemplaires suivants gardent l'ancienne courbe */
function cost(c){ var k=n(c.id); return k===0? c.first : Math.round(c.base*Math.pow(GROW,k-1)); }   /* 1er exemplaire = first, puis base ×1,15 par copie */
/* production réelle d'un perso (même calcul que le revenu passif total : somme des crate = rate) */
function crate(c){ return c.rate*n(c.id); }
/* coup de pouce de départ (v9) : +1/s qui s'estompe linéairement jusqu'à 0 à 2 500 Kwak Coin gagnés au total,
   et clic bonifié (+0,6 → 0 à 8 000 Kwak Coin gagnés). Hors tutoriel uniquement. Calibré par simulation (v9/sim) :
   Big Jim ~30 s, Estinien ~2 min, Homer ~8 min à 3 clics/s ; Topaz → Sinbad gardent des écarts proches de la v8. */
/* v10 : plus aucun bonus caché (clic = 1, pas de passif de départ) : tout le gain/s vient des employés. */
var BOOST=0, BOOST_CAP=2500, CLICK_B=0, CLICK_CAP=8000;
function clickVal(){ if(S.tuto) return 1; return 1+CLICK_B*Math.max(0,1-(S.total||0)/CLICK_CAP); }
function boost(){ if(S.tuto) return 0; return BOOST*Math.max(0,1-(S.total||0)/BOOST_CAP); }
function rate(){ var r=boost(); CH.forEach(function(c){ r+=crate(c); }); CHK.forEach(function(k){ r+=k.cps*chkN(k.id); }); return r; }
/* ---------- poussins de la boutique de Hancock : chacun clique sur Miqka X fois par seconde (1 clic = 1 KC), compté dans le gain/s ---------- */
var CHK=[{id:"jaune",name:"Poussin jaune",c:"#ffd23f",base:40,first:20,cps:.5},{id:"orange",name:"Poussin orange",c:"#ff9a3c",base:600,cps:4},{id:"rose",name:"Poussin rose",c:"#ff8fb1",base:7000,cps:30},
  {id:"bleu",name:"Poussin bleu",c:"#5fb8ff",base:80000,cps:200},{id:"vert",name:"Poussin vert",c:"#6fd36f",base:900000,cps:1200},{id:"rouge",name:"Poussin rouge",c:"#ff5a4f",base:9000000,cps:7000}];
function chkN(id){ return (S.chk&&S.chk[id])||0; }
function chkCost(k){ var q=chkN(k.id); return (q===0&&k.first)? k.first : Math.round(k.base*Math.pow(1.15,q)); }   /* 1er poussin jaune : 20 KC */
var UNITS=[[1e12,"T"],[1e9,"B"],[1e6,"M"],[1e3,"K"]];
function fmt(x){ x=Math.floor(x); if(x<1e4) return String(x); for(var i=0;i<UNITS.length;i++){ var u=UNITS[i]; if(x>=u[0]){ var v=x/u[0]; return v.toFixed(v<100?1:0).replace(".",",").replace(/,0$/,"")+"\u202f"+u[1]; } } return String(x); }
function fmtR(r){ return r>=1e4? fmt(r) : (Math.round(r*10)/10).toString().replace(".",","); }
/* gain passif (hors-ligne plafonné à 2 h) */
function earn(x){ S.coins+=x; S.total=(S.total||0)+x; }
/* ---------- nom de la ville (choisi par le joueur, stocké dans S.cityName ; toujours rendu en texte brut) ---------- */
var CITY_RANDOM=["Port-Kwak","Brisemarée","Villécume","Clochebrume","Roc-Pigeon","Havre-Doré","Pointe-Soupe","Bourg-Paillette","Mouettebourg","Anse-aux-Pièces","Fort-Couac","Belle-Escale"];
function cleanName(v){ return String(v==null?"":v).replace(/[\u0000-\u001f\u007f-\u009f\u200b\u200e\u200f\u2028-\u202e\u2066-\u2069\ufeff]/g,"").replace(/\s+/g," ").trim(); }
function nameLen(v){ return Array.from(v).length; }
function cityName(){ return S.cityName || "ta ville"; }
function fill(t){ var nm=cityName(); return String(t==null?"":t).replace(/\{ville\}/g,function(){ return nm; }); }
function applyCityName(){ var nm=cityName(); var tn=document.querySelector(".town-name"); if(tn) tn.hidden=!S.cityName; [].forEach.call(document.querySelectorAll("[data-city-name]"),function(e){ e.textContent=nm; });
  var ti=document.getElementById("townImg"), im=ti&&ti.querySelector("img"); if(im) im.alt="Vue de "+nm; }
(function(){ if(S.t){ var dt=Math.min(7200,Math.max(0,(Date.now()-S.t)/1000)); earn((rate()-boost())*dt); } S.t=Date.now(); })();   /* hors-ligne : sans le coup de pouce de départ */
/* mode debug : ?coins=1000000 (ou ?tier=8) dans l'URL, ou CITY.debugTier(n) dans la console */
(function(){ var q=new URLSearchParams(location.search), c=q.get("coins"), t=q.get("tier");
  if(c!=null && !isNaN(+c)){ S.coins=+c; S.total=Math.max(+c,S.total||0); }
  if(t!=null && window.WEALTH && WEALTH.TIERS[+t]){ S.total=WEALTH.TIERS[+t].at; } })();

/* ---------- DOM ---------- */
function el(tag,cls,html){ var e=document.createElement(tag); if(cls) e.className=cls; if(html!=null) e.innerHTML=html; return e; }
var bar=el("nav","modebar"); bar.id="modeBar";
bar.innerHTML='<button class="mb-btn" id="mbStory" data-m="story"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5C6.5 4 9.5 4 12 6c2.5-2 5.5-2 8-.5V19c-2.5-1.5-5.5-1.5-8 .5-2.5-2-5.5-2-8-.5z"/><path d="M12 6v13.5"/></svg><span>Histoire</span></button>'+
 '<button class="mb-btn" id="mbCity" data-m="city"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M3 20.5h18M5 20.5V10l4-3 4 3v10.5M13 20.5V6.5l3-2.5 3 2.5v14"/><path d="M8 13h2M8 16.5h2M15.5 10h1.5M15.5 13.5h1.5"/></svg><span>Ville</span></button>';
var seqCoin=el("div","seq-coin"); seqCoin.id="seqCoin"; seqCoin.innerHTML='<i class="coin"></i><b id="seqCoinN">0</b><em id="seqRate"></em>';
var city=el("section","city"); city.id="city";
city.innerHTML=
 '<header class="c-top"><div class="c-row1"><button class="c-home" id="cHome" aria-label="Retour au titre"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11l8-6.5 8 6.5M6.5 9.5V19h11V9.5"/></svg></button>'+
 '<div class="c-coins" id="cCoins"><i class="coin"></i><b id="cCoinN">0</b><span>Kwak Coin</span><em id="cRate"></em></div>'+
 '<button class="c-mute c-mus" id="cMus" aria-label="Couper la musique"></button><button class="c-mute" id="cMute" aria-label="Couper le son"></button></div>'+
 '<div class="c-tabs" role="tablist"><button data-t="town" role="tab">Ville</button><button data-t="miqka" role="tab">Miqka</button><button data-t="staff" role="tab">Employés</button><i class="c-ind"></i></div><div class="c-jtitle"><button class="c-back" id="cBack" aria-label="Retour aux Employés"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></button><b>Histoire</b> · séquences d\'embauche</div></header>'+
 '<div class="c-pane" data-p="town"><div class="town cscroll" id="town"><div class="town-img" id="townImg"><img src="'+IMG+'city.webp" alt="" decoding="async"><div class="town-pop" id="townPop"></div></div><div class="town-name"><small>Ta ville</small><b data-city-name></b></div></div>'+
 '</div>'+
 '<div class="c-pane" data-p="miqka"><div class="mk" id="mk"><div class="mk-deco" id="mkDeco"><img class="dc" alt=""><img class="dc" alt=""></div><div class="mk-vig"></div><i class="mk-flash" id="mkFlash"></i><div class="mk-halo"></div><div class="tm-heads" id="tmHeads"></div><div class="mk-sq" id="mkSq"></div><div class="mk-rain" id="mkRain"></div><div class="mk-fx" id="mkFx"></div></div><p class="mk-st" id="mkSt" aria-live="polite"></p><p class="mk-hint" id="mkHint">Touche Miqka : +1 Kwak Coin</p><button class="tm-tab" id="tmTab" aria-expanded="false" aria-controls="tmDrawer"><span>Tomodachi</span></button><div class="tm-drawer" id="tmDrawer" role="dialog" aria-label="Tomodachi"><div class="tm-hd"><b>Tomodachi</b><small>Des amis pour Miqka</small><button class="tm-x" id="tmX" aria-label="Fermer">×</button></div><div class="tm-list" id="tmList"></div></div></div>'+
 '<div class="c-pane" data-p="staff"><div class="st-head"><button class="st-hist" id="cHist" aria-label="Histoire : revoir les scènes d\'embauche déjà vues"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5C4.7 20 4 19.3 4 18.5zM20 5.5c0-.8-.7-1.5-1.5-1.5H13v16h5.5c.8 0 1.5-.7 1.5-1.5z"/></svg><span>Histoire</span><small>scènes vues</small></button></div><div class="staff cscroll" id="staff"></div></div>'+
 '<div class="c-pane" data-p="journal"><div class="journal cscroll" id="journal"></div></div>';
var cn=el("div","cn"); cn.id="cn"; cn.setAttribute("role","dialog"); cn.setAttribute("aria-modal","true"); cn.setAttribute("aria-labelledby","cnT");
cn.innerHTML='<form class="cn-card" id="cnF" novalidate><b id="cnT">Comment s\'appelle ta ville ?</b><p class="cn-sub">1 à 24 caractères. Tu pourras le changer dans les Réglages.</p>'+
 '<input id="cnIn" type="text" maxlength="80" autocomplete="off" autocapitalize="words" spellcheck="false" placeholder="Nom de ta ville" enterkeyhint="done" aria-describedby="cnErr">'+
 '<p class="cn-err" id="cnErr" aria-live="polite"></p><div class="cn-btns"><button type="button" class="pill" id="cnRnd">Au hasard</button><button type="submit" class="pill primary" id="cnOk">Valider</button></div>'+
 '<button type="button" class="cn-x" id="cnX">Annuler</button></form>';
app.appendChild(city); app.appendChild(bar); app.appendChild(seqCoin); app.appendChild(cn);
var tutoBtn=el("button","tuto-go"); tutoBtn.id="tutoGo"; tutoBtn.type="button"; $("mk").appendChild(tutoBtn);
var tfx=el("div","tuto-fx"); tfx.id="tutoFx"; app.appendChild(tfx);
var sale=el("div","town-sale"); sale.id="townSale"; sale.hidden=true; sale.innerHTML='<b>Terrain à vendre</b><span>Hancock te le cède pour '+15+' Kwak Coin. Gagne-les dans l\'onglet Miqka !</span><button type="button" class="pill primary" id="saleBuy" disabled></button>'; $("town").appendChild(sale);
var tip=el("div","tuto-tip"); tip.id="tutoTip"; tip.setAttribute("role","dialog"); tip.innerHTML='<b>Bienvenue dans le vrai jeu !</b><ul><li><em>Ville</em> : ta ville et ses habitants.</li><li><em>Miqka</em> : clique sur elle pour gagner des Kwak Coin.</li><li><em>Employés</em> : engage des personnages, ils produisent pour toi.</li></ul><button type="button" class="pill primary" id="tipOk">Compris !</button>'; city.appendChild(tip);

/* ---------- modes : « city » (jeu incrémental) / « story » (journal des séquences) ; séquence VN en cours = classe .seq ---------- */
var mode=null, tab=S.tab||"town", pending=null;
function setMode(m){
  started=true; mode=m; S.mode=m; try{ localStorage.setItem(MKEY,m); }catch(e){}
  app.classList.add("mode-city"); city.dataset.view = m==="story" ? "journal" : "tabs";
  $("mbStory").classList.toggle("on", m==="story"); $("mbCity").classList.toggle("on", m==="city");
  $("mbStory").setAttribute("aria-pressed", m==="story"); $("mbCity").setAttribute("aria-pressed", m==="city");
  if(m==="story"){ showPane("journal"); renderJournal(); } else setTab(tab);
  renderCoins(); save();
}
/* Nouvelle partie / Continuer : toujours la Ville (onglet Ville), la barre du bas n'existe plus */
function enterGame(m){ app.classList.remove("on-title","ui-hidden","seq"); tab="town"; applyCityName();
  if(!S.tuto && !S.cityName) S.tuto="nom";   /* sauvegarde sans nom de ville : petite scène pour le choisir (une fois) */
  if(S.tuto){ setMode("city"); tutoGo(); } else { tutoUI(); setMode("city");
    if(S.pend){ var pc=CH.filter(function(x){ return x.id===S.pend.id; })[0];
      if(pc && !n(pc.id) && !seen(pc.id)) startHire(pc,S.pend.cost,true); else { delete S.pend; save(); } } } }
/* ---------- PROLOGUE / TUTORIEL (dialogues fournis par l'auteur) :
   t1 (scène prison) → c10 (clic sur Miqka en prison, 10 KC) → t2 (« C'EST VRAI ? GÉNIAL ! ») → fondu → intro (mini-tuto des onglets, vrai jeu)
   → t3 (Hancock propose le terrain pour 15 KC) → c15 (jeu réel : récolter 15 KC) → t4 (achat, Hancock demande le nom) → name (saisie, −15 KC) → t5 (explications + objectif) → fin.
   « nom » = sauvegarde existante sans nom de ville. L'étape est sauvegardée dans S.tuto : un rechargement reprend à l'étape en cours. ---------- */
var TUTO_SC={t1:"tuto_1",t2:"tuto_2",t3:"tuto_3",t4:"tuto_4",t5:"tuto_5",nom:"tuto_nom"}, TUTO_NEXT={t1:"c10",t2:"t3",t3:"c15",t4:"name",t5:null,nom:"nameOnly"};
var LAND=15;
function prisonStep(t){ return t==="t1"||t==="c10"||t==="t2"; }
function tutoUI(){ var t=S.tuto||""; city.dataset.tuto = !t ? "" : prisonStep(t) ? "prison" : "on"; app.classList.toggle("tuto",!!t); tutoCheck(); musUI(); }
function tutoStep(st){ if(st) S.tuto=st; else { delete S.tuto; S.tutoDone=true; } save(); tutoGo(); }
function playTuto(id,done){ if(!window.VN || !VN.playScene || !(window.STORY&&STORY.scenes&&STORY.scenes[id])){ done(true); return; }
  app.classList.remove("mode-city"); renderCoins(); VN.playScene(id,function(ok){ app.classList.add("mode-city"); done(ok); }); }
function tutoFade(cb){ var f=$("tutoFx"); f.classList.remove("go"); void f.offsetWidth; f.classList.add("go"); setTimeout(cb, RM?0:380); }
function tutoGo(){ var st=S.tuto; tutoUI(); $("tutoTip").classList.remove("on");
  if(!st){ return tutoEnd(); }
  if(TUTO_SC[st]) return playTuto(TUTO_SC[st],function(){ if(S.tuto!==st) return; var nx=TUTO_NEXT[st];
      if(nx==="nameOnly") askName(false,function(){ tutoStep(null); });
      else if(st==="t2") tutoFade(function(){ tutoStep(nx); });
      else tutoStep(nx); });
  if(st==="intro"){ tab="town"; setTab("town"); $("tutoTip").classList.add("on"); return; }
  if(st==="name") return askName(false,function(){ S.coins=Math.max(0,S.coins-LAND); tutoStep(null); });   /* v10 : plus d'écran d'explication, on arrive directement dans le jeu */
  if(st==="nameOnly") return askName(false,function(){ tutoStep(null); });
  if(st==="c10"||st==="c15"){ tab="miqka"; setTab("miqka"); mkTier=-1; checkTier(false); decoCur=-1; setDeco(mkTier<0?0:mkTier,false);
    tutoHint(); tutoCheck(); } }
function tutoHint(){ var st=S.tuto; if(st==="c10"){ $("mkSt").textContent="En prison (pour 67 ans)"; $("mkHint").textContent="(Clique sur moi pour gagner un Kwak Coin · "+Math.min(10,Math.floor(S.coins))+"/10)"; }
  else if(st==="c15"){ $("mkHint").textContent="(Récolte "+LAND+" Kwak Coin pour acheter le terrain · "+Math.min(LAND,Math.floor(S.coins))+"/"+LAND+")"; } }
function tutoCheck(){ var b=$("tutoGo"), s2=$("townSale"); if(!b) return; var st=S.tuto;
  if(st==="c10"){ tutoHint(); if(S.coins>=10 && !tutoCheck.lock){ tutoCheck.lock=true; setTimeout(function(){ tutoCheck.lock=false; if(S.tuto==="c10"){ fanfare(); tutoStep("t2"); } },350); } }
  var on=st==="c15" && S.coins>=LAND; if(st==="c15") tutoHint();
  b.textContent="Acheter le terrain · "+LAND+" KC"; if(on!==b.classList.contains("on")){ b.classList.toggle("on",on); if(on) fanfare(); }
  if(s2){ var show=st==="c15"; s2.hidden=!show; var sb=$("saleBuy"); sb.disabled=!on; sb.textContent=on?"Acheter le terrain ("+LAND+" Kwak Coin)":"Encore "+Math.max(0,Math.ceil(LAND-S.coins))+" Kwak Coin…"; } }
function buyLand(){ if(S.tuto==="c15"&&S.coins>=LAND){ $("tutoGo").classList.remove("on"); cash(); tutoStep("t4"); } }
function tutoEnd(){ tutoUI(); $("mkHint").textContent="Touche Miqka : +"+fmtR(clickVal())+" Kwak Coin"; mkTier=-1; if(mkInit){ checkTier(false); } decoCur=-1; if(mkInit) setDeco(Math.max(0,mkTier),false);
  tab="town"; setMode("city"); applyCityName(); var ti=$("townImg"); if(ti){ ti.classList.remove("built"); void ti.offsetWidth; ti.classList.add("built"); } toastMsg("Bienvenue à "+cityName()+" !"); music(); }
$("tutoGo").onclick=buyLand; $("saleBuy").onclick=buyLand;
$("tipOk").onclick=function(){ if(S.tuto==="intro"){ blip(640,.05); tutoStep("t3"); } };
/* fenêtre de saisie du nom : trim, espaces normalisés, caractères de contrôle retirés, 1 à 24 caractères ; jamais d'innerHTML */
var nameCb=null;
function askName(cancellable,cb){ nameCb=cb; var i=$("cnIn"); i.value=S.cityName||""; $("cnErr").textContent=""; $("cnX").hidden=!cancellable; cn.classList.add("on"); setTimeout(function(){ try{ i.focus(); }catch(e){} },60); }
$("cnRnd").onclick=function(){ var cur=$("cnIn").value, v; do{ v=CITY_RANDOM[(Math.random()*CITY_RANDOM.length)|0]; }while(v===cur); $("cnIn").value=v; $("cnErr").textContent=""; blip(620,.04); };
$("cnX").onclick=function(){ cn.classList.remove("on"); nameCb=null; };
$("cnF").onsubmit=function(e){ e.preventDefault(); var v=cleanName($("cnIn").value), n=nameLen(v);
  if(!n){ $("cnErr").textContent="Il faut un nom (au moins 1 caractère)."; nope(); return; }
  if(n>24){ $("cnErr").textContent="24 caractères maximum ("+n+" actuellement)."; nope(); return; }
  S.cityName=v; save(); applyCityName(); cn.classList.remove("on"); var c=nameCb; nameCb=null; cash(); if(c) c(); };
function storyBtn(){ var none=!S.seen.length && !(S.tomo||[]).length; $("mbStory").classList.toggle("dim",none); $("mbStory").title=none?"Aucune séquence vue pour l'instant":""; var h=$("cHist"); if(h){ h.classList.toggle("dim",none); h.title=none?"Aucune séquence vue pour l'instant":"Revoir les séquences d'embauche déjà vues"; } }
$("cHist").onclick=function(){ setMode("story"); blip(500,.05); };
$("cBack").onclick=function(){ tab="staff"; setMode("city"); blip(560,.05); };
$("mbStory").onclick=function(){ if(mode!=="story") setMode("story"); blip(500,.05); };
$("mbCity").onclick=function(){ if(mode!=="city") setMode("city"); blip(560,.05); };
$("cHome").onclick=function(){ save(); if(window.VN) VN.goTitle(true); };
/* séquence VN (moteur existant) : la monnaie continue de monter pendant ce temps (minuterie indépendante, voir plus bas) */
/* scène longue « hire_<id> » (story-hires.js) si elle existe, sinon l'ancienne « embauche_<id> ». opts.track/resume : reprise après rechargement */
function seqId(id){ var sc=window.STORY&&STORY.scenes; return sc ? (sc["hire_"+id] ? "hire_"+id : sc["embauche_"+id] ? "embauche_"+id : null) : null; }
function playSeq(id, done, opts){
  var sid=seqId(id);
  if(!window.VN || !VN.playScene || !sid){ done(true); return; }
  app.classList.remove("mode-city"); renderCoins();
  VN.playScene(sid, function(ok){ app.classList.add("mode-city"); done(ok); }, opts);
}
window.CITY={ mus:function(){ return [curMus].concat(Object.keys(AUD).filter(function(n){ return !AUD[n].paused; })); },
  hasSave:hasSave,
  newGame:function(){ if(window.CLOUD) CLOUD.force(); S=fresh(); started=true; tab="town"; built=false; open=null; $("staff").textContent=""; mkTier=-1; if($("tmHeads")) $("tmHeads").textContent=""; BODIES=[]; CK.forEach(function(o){ o.el.remove(); }); CK=[]; enterGame("city"); },
  getCityName:function(){ return cityName(); }, fill:fill, rename:function(){ if(!S.cityName){ toastMsg("Lance d'abord une partie."); return false; } askName(true,function(){ toastMsg("Ta ville s'appelle désormais "+cityName()+"."); }); return true; },
  resume:function(){ enterGame(S.mode==="story"?"story":"city"); },
  onTitle:function(){ if(pending){ pending=null; } if(S.pend){ delete S.pend; } save(); },
  state:function(){ return S; }, setMode:setMode, rate:rate, cost:function(id){ return cost(BY[id]); },
  setTab:function(t){ setTab(t); },
  reset:function(){ if(window.CLOUD) CLOUD.force(); S=fresh(); started=false; try{ localStorage.removeItem(KEY); localStorage.removeItem(MKEY); }catch(e){} if(built){ CH.forEach(function(c){ updBanner(c); }); } renderTown(); renderCoins(); storyBtn(); },
  debugTier:function(t,seed){ if(seed!=null) S.seed=seed; S.total=window.WEALTH?WEALTH.TIERS[Math.max(0,Math.min(WEALTH.TIERS.length-1,t))].at:0; mkTier=-1; checkTier(false); return WEALTH&&WEALTH.TIERS[mkTier]; },
  debugPose:function(i){ var imgs=$("mkSq").children; [].forEach.call(imgs,function(p,k){ p.classList.toggle("on",k===i); }); pose=i; }
};

/* ---------- onglets ---------- */
var tabs=[].slice.call(city.querySelectorAll(".c-tabs button"));
function showPane(p){ [].forEach.call(city.querySelectorAll(".c-pane"),function(x){ x.classList.toggle("on",x.dataset.p===p); }); }
function setTab(t){ tab=t; S.tab=t; city.dataset.tab=t;
  tabs.forEach(function(b,i){ var on=b.dataset.t===t; b.classList.toggle("on",on); b.setAttribute("aria-selected",on); if(on) city.querySelector(".c-ind").style.transform="translateX("+(i*100)+"%)"; });
  showPane(t);
  if(t==="town") renderTown(); if(t==="staff") renderStaff(); if(t==="miqka") initMiqka();
}
tabs.forEach(function(b){ b.onclick=function(){ setTab(b.dataset.t); save(); blip(520,.05); }; });

/* ---------- pièces ---------- */
function renderCoins(){ var r=rate(), rs=r?"+"+fmtR(r)+"/s":""; $("cCoinN").textContent=fmt(S.coins); $("cRate").textContent=rs;
  $("seqCoinN").textContent=fmt(S.coins); $("seqRate").textContent=rs; refreshBuy(); updGains(); checkTier(true); tomoBtns(); hkBtns(); if(S.tuto) tutoCheck(); }
function bumpCoins(){ var c=$("cCoins"); c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump"); }
var lastTick=Date.now(), saveAcc=0;
setInterval(function(){ var now=Date.now(), dt=Math.min(5,(now-lastTick)/1000); lastTick=now; if(started && !S.tuto) earn(rate()*dt);
  saveAcc+=dt; if(saveAcc>5){ saveAcc=0; save(); }
  if(!app.classList.contains("on-title") && !document.hidden){ renderCoins(); if(started && !S.tuto) msTick(); } },250);
document.addEventListener("visibilitychange",function(){ if(document.hidden) save(); else lastTick=Date.now(); });
window.addEventListener("pagehide",save);

/* ---------- son (WebAudio synthétique, démarré au 1er geste) ---------- */
var ac=null;
function audio(){ if(S.mute) return null; if(!ac){ try{ ac=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return null; } } if(ac.state==="suspended") ac.resume(); return ac; }
function tone(type,f0,f1,dur,vol,delay){ var c=audio(); if(!c) return; var t=c.currentTime+(delay||0), o=c.createOscillator(), g=c.createGain();
  o.type=type; o.frequency.setValueAtTime(f0,t); if(f1) o.frequency.exponentialRampToValueAtTime(f1,t+dur*.8);
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+.008); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g); g.connect(c.destination); o.start(t); o.stop(t+dur+.02); }
function blip(f,v){ tone("sine",f,f*1.3,.08,v||.05); }
function boing(){ var b=180+Math.random()*120; tone("sine",b,b*2.6,.16,.16); tone("triangle",b*2.6,b*1.2,.22,.07,.1); tone("square",1320,0,.05,.025,.05); tone("square",1760,0,.07,.02,.1); }
function fanfare(){ [523,659,784,1047].forEach(function(f,i){ tone("triangle",f,0,.18,.08,i*.09); }); }
function cash(){ tone("triangle",988,0,.09,.09); tone("triangle",1319,0,.16,.09,.08); }
function nope(){ tone("sawtooth",220,140,.18,.05); }
function muteUI(){ var b=$("cMute"); b.classList.toggle("off",!!S.mute); b.setAttribute("aria-label",S.mute?"Activer le son":"Couper le son");
  b.innerHTML=S.mute?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>'
   :'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/></svg>'; }
$("cMute").onclick=function(){ S.mute=!S.mute; if(S.mute&&ac) ac.suspend(); muteUI(); save(); if(!S.mute) blip(660,.06); music(); };
/* ---------- musique (v11) : pistes hébergées (AAC ~96 kbps, boucles fondues), une seule jouée à la fois, fondu enchaîné au changement d'ambiance.
   Seulement après le tutoriel (jamais pendant la prison), démarrée par un geste (iOS), coupable (♫, S.musicOff), pause quand l'onglet est masqué.
   Chargement paresseux (preload none) ; le service worker garde en cache les pistes déjà écoutées. Crédits : Réglages › Crédits, SOURCES.md.
   Une scène peut déclarer  music: "casino"  (ou une ligne) ; sinon SCENE_MUS ; sinon thème de ville (jour / nuit). ---------- */
var MUS_DIR="assets/music/", TRACKS={jour:1,nuit:1,calme:1,comique:1,casino:1,tension:1,boss:1,melancolie:1,sombre:1};
var SCENE_MUS={hire_bigjim:"comique",hire_estinien:"tension",hire_homer:"comique",hire_chiaki:"comique",hire_rin:"jour",hire_topaz:"calme",hire_bakool:"comique",
  hire_zenos:"boss",hire_aventurine:"casino",hire_fandaniel:"sombre",hire_sinbad:"casino",hire_eden:"jour",hire_tropi:"calme",
  ms_10:"comique",ms_30:"jour",ms_100:"melancolie",ms_300:"comique",ms_600:"melancolie",ms_1000:"jour"};
var BGM_VOL=.32, SCN_VOL=.26, AUD={}, curMus=null, lastNight=false;
function musicWanted(){ return started && !S.tuto && S.tutoDone!==false && !S.musicOff && !S.mute && !document.hidden && !app.classList.contains("on-title"); }
function inSeq(){ return app.classList.contains("seq") && window.VN && VN.inScene && VN.inScene(); }
function isNight(){ try{ var w=DAYNIGHT.weights(DAYNIGHT.phase()); if(w.n>.6) lastNight=true; else if(w.n<.3) lastNight=false; }catch(e){} return lastNight; }
function curMood(){ var hk=$("hkShop"); if(hk && !hk.hidden) return "casino";
  if(inSeq()){ var st=VN.state()||{}, sc=window.STORY&&STORY.scenes&&STORY.scenes[st.scene]; if(st.music && TRACKS[st.music]) return st.music; if(sc && TRACKS[sc.music]) return sc.music; if(SCENE_MUS[st.scene]) return SCENE_MUS[st.scene]; }
  return tab==="staff" && !inSeq() ? "calme" : (isNight()?"nuit":"jour"); }
function ramp(a,to,ms,done){ clearInterval(a._f); var from=a.volume, t0=Date.now(); a._f=setInterval(function(){ var k=Math.min(1,(Date.now()-t0)/ms); try{ a.volume=Math.max(0,Math.min(1,from+(to-from)*k)); }catch(e){} if(k>=1){ clearInterval(a._f); if(done) done(); } },50); }
function track(n){ var a=AUD[n]; if(!a){ a=AUD[n]=new Audio(); a.preload="none"; a.loop=true; a.src=MUS_DIR+n+".m4a"; a.volume=0; } return a; }
function music(){ var want=musicWanted()? curMood() : null, vol=inSeq()? SCN_VOL : BGM_VOL;
  Object.keys(AUD).forEach(function(n){ var a=AUD[n]; if(n!==want && !a.paused && !a._out){ a._out=1; ramp(a,0,want?1800:450,function(){ a._out=0; if(curMus!==n||!musicWanted()) a.pause(); }); } });
  if(want){ var a=track(want); a._out=0; curMus=want; if(a.paused){ var p=a.play(); if(p&&p.catch) p.catch(function(){}); } ramp(a,vol,a.volume>0?600:1800); }
  else curMus=null;
  musUI(); }
var mPrev="";
setInterval(function(){ var k=musicWanted()? curMood()+(inSeq()?"s":"") : ""; if(k!==mPrev){ mPrev=k; music(); } },700);
function musUI(){ var b=$("cMus"); if(!b) return; var off=!!S.musicOff; b.classList.toggle("off",off); b.hidden=!!S.tuto; b.setAttribute("aria-label",off?"Activer la musique":"Couper la musique"); b.setAttribute("aria-pressed",!off);
  b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>'+(off?'<path d="M3 3l18 18"/>':'')+'</svg>';
  var t=$("tgBgm"); if(t){ t.classList.toggle("on",!off); t.setAttribute("aria-checked",!off); } }
$("cMus").onclick=function(){ S.musicOff=!S.musicOff; save(); music(); blip(600,.05); };
document.addEventListener("visibilitychange",music);
document.addEventListener("pointerdown",function(){ if(musicWanted() && (!curMus||!AUD[curMus]||AUD[curMus].paused)) music(); },true);
if(window.MutationObserver) new MutationObserver(function(){ mPrev=""; }).observe(app,{attributes:true,attributeFilter:["class"]});
muteUI();

/* ---------- onglet Ville ---------- */
var SPOTS=[[36,86],[56,74],[44,90],[66,82],[60,92],[78,74],[52,66],[48,82],[88,82],[70,90],[74,64],[40,78],[54,96],[92,72],[64,70],[84,92],[46,70],[72,80],[58,84],[95,88],[82,64],[38,94],[80,84],[62,62]];   /* sur la terre ferme (illustration v8 : mer à gauche) */
function townList(){ /* v10 : UN seul buste par personnage engagé, quel que soit le nombre d'exemplaires (le nombre reste affiché dans Employés) */
  return CH.filter(function(c){ return n(c.id)>0; }).slice(0,SPOTS.length); }
function head(c,cls){ var h=el("i","hd "+(cls||"")); h.style.backgroundImage="url("+IMG+"av/"+c.id+".webp)"; return h; }
function renderTown(){ var pop=$("townPop"); pop.textContent=""; var L=townList(), tot=0; CH.forEach(function(c){ tot+=n(c.id); });
  L.forEach(function(c,i){ var s=SPOTS[i], w=el("div","tp"); w.style.left=s[0]+"%"; w.style.top=s[1]+"%"; w.style.setProperty("--d",(-(i*0.37)%2.2).toFixed(2)+"s");
    var h=head(c); w.appendChild(h); var lb=el("span","tp-n"); lb.textContent=c.name; w.appendChild(lb);
    if(c.id==="bigjim" && !S.tuto){ w.classList.add("has-ev"); var ev=el("button","ev-logo"); ev.type="button"; ev.setAttribute("aria-label","Événements");
      ev.innerHTML='<i class="hk-shine"></i><b>Évén.</b>';
      ev.onclick=function(e){ e.stopPropagation(); if(window.BUILDER&&BUILDER.openEvents) BUILDER.openEvents(); };
      w.appendChild(ev); }
    pop.appendChild(w); });
  /* v10 : Miqka et ses Tomodachi rencontrés (bustes) ; « ! » au-dessus des persos d'une petite histoire disponible */
  var own=TOMO.filter(tomoOwned);
  if(own.length && !S.tuto){ var av=msAvail(), who=av?["miqka"].concat(av.need):[], G=[["miqka",MQ+"excited.webp","Miqka",[64,70]]];
    own.forEach(function(t,i){ G.push([t.id,t.av,t.name,[[58,84],[72,78]][i]||[54,96]]); });
    G.forEach(function(g){ var w=el("div","tp tp-tomo"+(g[0]==="miqka"?" tp-mq":"")); w.style.left=g[3][0]+"%"; w.style.top=g[3][1]+"%";
      var h=el("i","hd"); h.style.backgroundImage='url("'+g[1]+'")'; w.appendChild(h); var lb=el("span","tp-n"); lb.textContent=g[2]; w.appendChild(lb);
      if(who.indexOf(g[0])>=0){ var x=el("button","tp-ex"); x.type="button"; x.textContent="!"; x.setAttribute("aria-label","Petite histoire : "+av.t); x.onclick=function(e){ e.stopPropagation(); playMs(av); }; w.appendChild(x); w.classList.add("has-ex"); }
      pop.appendChild(w); }); }
  /* boutique de Hancock (après le tutoriel) : sprite cliquable + logo de boutique brillant */
  if(!S.tuto){ var hw=el("button","tp-hk"); hw.type="button"; hw.style.left="68%"; hw.style.top="63%"; hw.setAttribute("aria-label","Boutique de Hancock");
    hw.innerHTML='<span class="hk-logo" aria-hidden="true"><svg viewBox="0 0 32 28"><path d="M3 10h26l-2 15H5z" fill="#f4e6c4" stroke="#5a3b12" stroke-width="1.6"/><path d="M2 4h28l-1 6H3z" fill="#d94b3f" stroke="#5a3b12" stroke-width="1.6"/><path d="M8 4l-1 6M14 4v6M18 4v6M24 4l1 6" stroke="#fff3d6" stroke-width="2.4"/><circle cx="16" cy="18" r="4" fill="#e9b949" stroke="#5a3b12" stroke-width="1.4"/><text x="16" y="20.3" font-size="6" text-anchor="middle" fill="#5a3b12" font-family="Arial" font-weight="700">K</text></svg><i class="hk-shine"></i></span><img alt="" src="assets/chars/hancock.webp"><span class="tp-n">Hancock</span>';
    hw.onclick=function(e){ e.stopPropagation(); shopOpen(true); }; pop.appendChild(hw); }
  var nx=msNext(), chip=$("townMs"); if(!chip){ chip=el("p","town-ms"); chip.id="townMs"; $("town").appendChild(chip); }
  chip.hidden=!!S.tuto || !nx; if(nx) chip.textContent="Prochaine petite histoire à "+fmt(nx.n)+" KC/s · actuellement "+fmtR(rate())+" KC/s";
  
  var t=$("town"); if(!t.dataset.c){ t.dataset.c=1; requestAnimationFrame(function(){ t.scrollLeft=(t.scrollWidth-t.clientWidth)*.62; }); } }

/* ---------- onglet Miqka ---------- */
var POSES=["excited","idea","pointing","shy","sweet"], pose=0, mkInit=false, mkTier=-1;
var RM=window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
/* chaque pose = image + calque d'overlays (PNG transparents) placé par points d'ancrage ; boîte au ratio exact du sprite 580×844 */
function initMiqka(){ if(mkInit) return; mkInit=true; var sq=$("mkSq");
  POSES.forEach(function(p,i){ var w=el("div","mk-pose"+(i===0?" on":"")); w.dataset.pose=p; var im=new Image(); im.src=MQ+p+".webp"; im.alt=""; im.className="mk-base"; w.appendChild(im);
    w.appendChild(el("div","mk-ov")); sq.appendChild(w); });
  sq.addEventListener("pointerdown",function(e){ e.preventDefault(); tapMiqka(e); });
  fitMiqka(); window.addEventListener("resize",function(){ fitMiqka(); decoFrag(); }); if(window.ResizeObserver) new ResizeObserver(fitMiqka).observe(sq);
  mkTier=-1; checkTier(false); renderTomo(); placeHeads(); placeChicks(); }
function fitMiqka(){ var sq=$("mkSq"); if(!sq) return; var W=sq.clientWidth, H=sq.clientHeight; if(!W||!H) return; var h=Math.min(H, W*844/580), w=h*580/844;
  [].forEach.call(sq.children,function(p){ p.style.width=w+"px"; p.style.height=h+"px"; }); placeHeads(); placeChicks(); }
/* décors par palier : photos libres de droits (crédits : SOURCES.md / Réglages › Crédits), recadrées paysage (l, 1600×1000) et portrait (p, ≤900×1600) en WebP ;
   2 calques en fondu enchaîné ; seuls le palier actuel et le suivant sont chargés (préchargement du suivant, même orientation) */
var DECO="assets/decor/photo/t", decoCur=-1, decoLayer=0;
function decoSrc(t){ var m=$("mk"), port=m && m.clientWidth<m.clientHeight; if(t==="P") return "assets/bg/prison"+(port?"_p":"")+".webp"; return DECO+(t<10?"0":"")+t+(port?"p":"l")+".webp"; }
function decoFrag(){ if(decoCur<0) return; var L=$("mkDeco").children[decoLayer], s=decoSrc(decoCur); if(L.getAttribute("src")!==s) L.src=s; }
function setDeco(t,anim){ var box=$("mkDeco"); if(!box) return; if(S.tuto==="c10"||S.tuto==="t1"||S.tuto==="t2") t="P"; if(t===decoCur){ decoFrag(); return; } decoCur=t;
  var nx=anim?1-decoLayer:decoLayer, L=box.children[nx], O=box.children[1-nx];
  L.classList.remove("on"); L.src=decoSrc(t);
  var go=function(){ L.classList.add("on"); if(anim){ O.classList.remove("on"); var f=$("mkFlash"); f.classList.remove("go"); void f.offsetWidth; f.classList.add("go"); } };
  if(L.complete && L.naturalWidth) go(); else { L.onload=go; L.onerror=go; }
  decoLayer=nx;
  if(t!=="P" && window.WEALTH && WEALTH.TIERS[t+1]){ var pre=new Image(); pre.src=decoSrc(t+1); } }
function checkTier(anim){ if(!window.WEALTH || !mkInit) return; var t=WEALTH.tierOf(S.total||0); if(t===mkTier) return;
  var up=mkTier>=0 && t>mkTier; mkTier=t; if(anim&&up) S.seed=(Math.random()*1e9)|0;   /* nouvelles variantes à chaque palier franchi */
  var keys=WEALTH.pick(t,S.seed||1), T=WEALTH.TIERS[t];
  [].forEach.call($("mkSq").children,function(p){ WEALTH.render(p.querySelector(".mk-ov"),p.dataset.pose,keys,anim&&up); });
  headsOverlays(keys,anim&&up);
  $("mk").style.setProperty("--aura",T.aura||"#c9b48e"); $("mkSt").textContent=T.st;
  setDeco(t,anim&&up); rain(T.rain||0);
  if(anim&&up){ var sq=$("mkSq"); sq.classList.remove("lvl"); void sq.offsetWidth; sq.classList.add("lvl"); fanfare();
    var st=$("mkSt"); st.classList.remove("new"); void st.offsetWidth; st.classList.add("new");
    toastMsg("Nouveau statut : "+T.st); }
  save(); }
function rain(n){ var fx=$("mkRain"); if(!fx) return; if(+fx.dataset.n===n) return; fx.dataset.n=n; fx.textContent=""; var k=RM?0:n===2?14:n===1?7:0;
  for(var i=0;i<k;i++){ var im=new Image(); im.alt=""; im.src="assets/overlays/"+(i%4===3?"bill":"coin")+".png"; im.className="rain-i"+(i%4===3?" bill":"");
    im.style.left=(4+Math.random()*92).toFixed(1)+"%"; im.style.animationDuration=(2.2+Math.random()*1.8).toFixed(2)+"s"; im.style.animationDelay=(-Math.random()*4).toFixed(2)+"s";
    im.style.setProperty("--rr",((Math.random()*360)|0)+"deg"); fx.appendChild(im); } }
var GL=["★","✦","♥","✧","♪","+1"], COL=["#ffd59a","#f2a7c8","#9fe6ff","#bff0c8","#fff"];
/* effets de clic : plus forts aux paliers élevés (pièces, étincelles dorées, léger tremblement) ; transform/opacity uniquement */
function burst(x,y){ var fx=$("mkFx"), T=window.WEALTH&&WEALTH.TIERS[Math.max(0,mkTier)]||{}, lv=T.fx||0;
  var p=el("b","mk-p"); p.textContent="+"+fmtR(clickVal()); p.style.left=x+"px"; p.style.top=y+"px"; fx.appendChild(p); setTimeout(function(){ p.remove(); },900);
  var nb=RM?2:(5+lv*2);
  for(var i=0;i<nb;i++){ var coinP=lv>=1 && i%2===0, s=coinP?new Image():el("i","mk-s");
    if(coinP){ s.src="assets/overlays/coin.png"; s.alt=""; s.className="mk-s mk-c"; } else { s.textContent=lv>=2?(i%3?"✦":"★"):GL[(Math.random()*GL.length)|0]; s.style.color=lv>=2?"#ffd75e":COL[i%COL.length]; }
    s.style.left=x+"px"; s.style.top=y+"px";
    var a=Math.random()*Math.PI*2, d=50+Math.random()*(60+lv*25); s.style.setProperty("--x",(Math.cos(a)*d).toFixed(0)+"px"); s.style.setProperty("--y",(Math.sin(a)*d-30).toFixed(0)+"px");
    s.style.setProperty("--r",((Math.random()*160-80)|0)+"deg"); fx.appendChild(s); (function(s){ setTimeout(function(){ s.remove(); },850); })(s); }
  if(lv>=3 && !RM){ var m=$("mk"); m.classList.remove("shake"); void m.offsetWidth; m.classList.add("shake"); } }
function fxPos(e){ var r=$("mkFx").getBoundingClientRect(); return [(e.clientX||r.left+r.width/2)-r.left,(e.clientY||r.top+r.height/2)-r.top]; }
function tapMiqka(e){
  earn(clickVal()); renderCoins(); bumpCoins(); boing();
  var imgs=$("mkSq").children; imgs[pose].classList.remove("on"); pose=(pose+1)%imgs.length; imgs[pose].classList.add("on");
  var sq=$("mkSq"); sq.classList.remove("hit","hit2"); void sq.offsetWidth; sq.classList.add(Math.random()<.5?"hit":"hit2");
  var q=fxPos(e); burst(q[0],q[1]);
  if(navigator.vibrate) try{ navigator.vibrate(8); }catch(_){}
  S.taps=(S.taps||0)+1; if(S.taps===1 && !S.tuto) $("mkHint").textContent="Encore ! Chaque toucher = "+fmtR(clickVal())+" Kwak Coin";
}

/* ---------- Tomodachi : amis de Miqka (v10 : personnages ENTIERS derrière elle, qui rebondissent et ricochent entre eux, uniquement dans l'onglet Miqka) ----------
   Eden puis Tropi (captures FFXIV fournies par le joueur, détourées) ; 3e emplacement verrouillé et censuré (aucune donnée tant que l'image n'existe pas).
   Achat = rencontre : scène « hire_eden » / « hire_tropi » (story-tomo.js), rejouable dans Histoire. Voir TOMODACHI.md (hors dépôt). */
var TOMO=[
  {k:"t1",id:"eden",price:100,ready:true,name:"Eden",img:"assets/tomo/eden.webp",av:"assets/tomo/eden_av.webp",w:575,h:900,sc:.64},
  {k:"t2",id:"tropi",price:400,ready:true,name:"Tropi",img:"assets/tomo/tropi.webp",av:"assets/tomo/tropi_av.webp",w:332,h:900,sc:.76},
  {k:"t3",price:25000000}];
var DBG_TOMO=/[?&]debugTomo=1\b/.test(location.search);
function tomoOwned(t){ return (S.tomo||[]).indexOf(t.k)>=0 && t.ready; }
function tomoById(id){ return TOMO.filter(function(t){ return t.id===id; })[0]; }
function renderTomo(){ var list=$("tmList"); if(!list) return; list.textContent="";
  TOMO.forEach(function(t,i){ var own=tomoOwned(t), prevOk=i===0||tomoOwned(TOMO[i-1]), li=el("div","tm-card"+(own?" own":" lock")), can=t.ready&&!own&&prevOk&&S.coins>=t.price;
    li.innerHTML='<i class="tm-av"></i><span class="tm-tx"><b></b><small></small></span><button class="tm-buy"></button>';
    var av=li.querySelector(".tm-av"); if(own){ av.style.backgroundImage='url("'+t.av+'")'; }
    li.querySelector("b").textContent=own?t.name:"???";
    li.querySelector("small").innerHTML=own?"Avec Miqka":'<i class="coin"></i> <b class="tm-pr">'+fmt(t.price)+'</b> Kwak Coin · achat unique';
    var bt=li.querySelector(".tm-buy"); bt._t=t; bt._i=i; bt.textContent=own?"Ami·e":!t.ready?"Bientôt":prevOk?"Rencontrer":"Plus tard"; bt.disabled=own||!can;
    if(!t.ready) bt.title="Arrive bientôt"; else if(!prevOk) bt.title="Rencontre d'abord le Tomodachi précédent";
    bt.onclick=function(){ buyTomo(t,i); };
    list.appendChild(li); }); }
function buyTomo(t,i){ if(!t.ready||tomoOwned(t)||S.coins<t.price||(i>0&&!tomoOwned(TOMO[i-1]))) return;
  S.coins-=t.price; (S.tomo=S.tomo||[]).push(t.k); save(); cash(); renderCoins(); tomoToggle(false);
  playSeq(t.id,function(){ setMode("city"); setTab("miqka"); fanfare(); renderTomo(); placeHeads(true); renderTown(); toastMsg(t.name+" devient l'ami·e de Miqka !"); save(); }); }
function tomoBtns(){ var d=$("tmDrawer"); if(!d||!d.classList.contains("on")) return; [].forEach.call(d.querySelectorAll(".tm-buy"),function(b){ var t=b._t, i=b._i; b.disabled=!t.ready||tomoOwned(t)||S.coins<t.price||(i>0&&!tomoOwned(TOMO[i-1])); }); }
function tomoToggle(on){ var d=$("tmDrawer"), b=$("tmTab"); on=on==null?!d.classList.contains("on"):on; d.classList.toggle("on",on); b.setAttribute("aria-expanded",on); if(on) renderTomo(); }
/* corps entiers : derrière Miqka (z-index inférieur), hauteur proportionnelle à celle de Miqka, haut du crâne un peu sous le sien ;
   déplacement horizontal continu dans une zone centrée sur Miqka, rebond sur les bords et ricochet entre eux ; petit saut CSS ; clic = même squish que Miqka */
var BODIES=[], tmRaf=0, tmLast=0;
function placeHeads(pop){ var box=$("tmHeads"), mk=$("mk"); if(!box||!mk||!mkInit) return; var own=TOMO.filter(tomoOwned);
  var W=mk.clientWidth, H=mk.clientHeight; if(!W||!H) return;
  var p=$("mkSq").children[pose], r=p.getBoundingClientRect(), m=mk.getBoundingClientRect(), mh=r.height||H*.8, mtop=r.top-m.top;
  var RW=Math.min(W,Math.max(r.width*2.6,Math.min(W,H*1.1))), RX=(W-RW)/2;
  own.forEach(function(t,i){ var h=box.querySelector('[data-k="'+t.k+'"]');
    if(!h){ h=el("div","tm-head tm-body"); h.dataset.k=t.k; h.innerHTML='<div class="tm-hop"><div class="tm-in"><img alt="" draggable="false" src="'+t.img+'"></div></div>';
      h.addEventListener("pointerdown",function(e){ e.preventDefault(); e.stopPropagation(); tapHead(h,e); }); box.appendChild(h);
      h.style.setProperty("--hd",(-(i*.7)).toFixed(2)+"s");
      if(pop){ h.classList.add("pop"); setTimeout(function(){ h.classList.remove("pop"); },700); } }
    var bh=mh*t.sc, bw=bh*t.w/t.h; h.style.width=bw+"px"; h.style.height=bh+"px"; h.style.top=(mtop+mh*.05)+"px";
    var b=BODIES.filter(function(o){ return o.k===t.k; })[0];
    if(!b){ b={k:t.k,el:h,x:RX+RW*(i%2?.78:.22),v:(i%2?-1:1)*(28+i*9)}; BODIES.push(b); }
    b.el=h; b.w=bw; b.min=RX+bw/2; b.max=RX+RW-bw/2; if(b.max<b.min){ b.min=b.max=W/2; } b.x=Math.max(b.min,Math.min(b.max,b.x)); h.style.left=(b.x-bw/2)+"px"; });
  [].forEach.call(box.children,function(h){ if(!own.some(function(t){ return t.k===h.dataset.k; })) h.remove(); });
  BODIES=BODIES.filter(function(b){ return own.some(function(t){ return t.k===b.k; }); });
  if(BODIES.length && !tmRaf && !RM){ tmLast=0; tmRaf=requestAnimationFrame(tmStep); } }
function tmStep(ts){ tmRaf=0; if(!BODIES.length) return; var dt=tmLast?Math.min(.05,(ts-tmLast)/1000):0; tmLast=ts;
  var vis=tab==="miqka" && !document.hidden && $("mk").offsetParent;
  if(vis){ BODIES.forEach(function(b){ b.x+=b.v*dt; if(b.x<b.min){ b.x=b.min; b.v=Math.abs(b.v); } if(b.x>b.max){ b.x=b.max; b.v=-Math.abs(b.v); } });
    for(var i=0;i<BODIES.length;i++) for(var j=i+1;j<BODIES.length;j++){ var a=BODIES[i], c=BODIES[j], d=(a.w+c.w)*.32;
      if(Math.abs(a.x-c.x)<d && (a.x-c.x)*(a.v-c.v)<0){ var tv=a.v; a.v=c.v; c.v=tv; [a,c].forEach(function(o){ var e=o.el.querySelector(".tm-in"); e.classList.remove("hit","hit2"); void e.offsetWidth; e.classList.add("hit2"); }); } }
    BODIES.forEach(function(b){ b.el.style.transform="translateX("+((b.x-b.w/2)-parseFloat(b.el.style.left||0)).toFixed(1)+"px)"; b.el.classList.toggle("flip",b.v<0); }); }
  tmRaf=requestAnimationFrame(tmStep); }
function headsOverlays(){}
function tapHead(h,e){ earn(clickVal()); renderCoins(); bumpCoins(); boing();
  var i=h.querySelector(".tm-in"); i.classList.remove("hit","hit2"); void i.offsetWidth; i.classList.add(Math.random()<.5?"hit":"hit2");
  var b=BODIES.filter(function(o){ return o.k===h.dataset.k; })[0]; if(b) b.v=-b.v;
  var q=fxPos(e); burst(q[0],q[1]); }

/* ---------- petites histoires des paliers de gain/s (ligne directrice du jeu) ----------
   Dès que le gain/s total (affiché en haut) atteint un palier ET que les Tomodachi concernés ont été rencontrés, un « ! » apparaît au-dessus d'eux dans l'onglet Ville.
   Clic = petite scène (story-tomo.js) ; lue → le « ! » disparaît (S.ms), rejouable dans Histoire. S.peak = meilleur gain/s atteint (ne redescend jamais). */
var MS=[{n:10,id:"ms_10",need:["eden"],t:"La tirelire Crousty"},{n:30,id:"ms_30",need:["eden","tropi"],t:"La première sortie à trois"},{n:100,id:"ms_100",need:["eden","tropi"],t:"Le secret de Tropi"},
  {n:300,id:"ms_300",need:["eden","tropi"],t:"La guerre des sauces"},{n:600,id:"ms_600",need:["eden","tropi"],t:"Le feu d'artifice"},{n:1000,id:"ms_1000",need:["eden","tropi"],t:"Mille par seconde"}];
function msRead(m){ return (S.ms||[]).indexOf(m.id)>=0; }
function msOk(m){ return (S.peak||0)>=m.n && m.need.every(function(id){ return tomoOwned(tomoById(id)); }); }
function msAvail(){ return MS.filter(function(m){ return msOk(m) && !msRead(m); })[0]; }
function msNext(){ return MS.filter(function(m){ return (S.peak||0)<m.n; })[0]; }
var msSig="";
function msTick(){ var r=rate(); if(r>(S.peak||0)) S.peak=r; var a=msAvail(), sig=(a?a.id:"")+"|"+(S.tomo||[]).join(",");
  if(sig!==msSig){ var was=msSig; msSig=sig; if(tab==="town") renderTown(); if(a && was) toastMsg("Nouvelle petite histoire dans la Ville !"); } }
function playMs(m){ if(!window.VN||!VN.playScene||!(window.STORY&&STORY.scenes[m.id])) return; blip(700,.05);
  app.classList.remove("mode-city"); renderCoins();
  VN.playScene(m.id,function(ok){ app.classList.add("mode-city"); if(ok!==false && !msRead(m)){ (S.ms=S.ms||[]).push(m.id); } save(); setMode("city"); setTab("town"); }); }

/* ---------- boutique de Hancock : panneau vertical à droite, Hancock + réplique drôle sur le reste de l'écran ---------- */
var HK_SAY=["Bienvenue ! Ici tout est à vendre. Deux fois, si possible.","Des poussins cliqueurs ! Ils cliquent sur Miqka à votre place. Garantis vendus une seule fois. Enfin, presque.",
  "Ce poussin ? Neuf. Jamais servi. Enfin, il a servi une fois. Chez le voisin. Mais il a été lavé.","Garantie « satisfait ou satisfait ». Il n'y a pas d'autre option.",
  "Vous voulez aussi votre terrain ? Ah, vous l'avez déjà. Je vous le revends quand même ? Prix d'ami.","Le Crousty ? Non, ça je ne vends pas. On me l'a déjà volé une fois. Vous voyez de qui je parle.",
  "Je vous offre le reçu. Le deuxième reçu est payant."];
var HK_BUY=["Excellent choix ! Je vous vends son jumeau dans cinq minutes.","Il picore, il clique, il ne pose pas de questions. Le salarié idéal.","Vendu ! Et je note votre nom pour vous le revendre demain.","Un de plus ! Big Jim va vouloir un permis de poulailler, je vous le vends aussi."];
var HK_POOR=["Pas assez de Kwak Coin ? Je vous vends un prêt. À soixante-sept pour cent. Comme la prison, mais en intérêts.","Revenez avec plus de Kwak Coin. Ou avec un objet à me revendre. N'importe lequel."];
function hkLine(a){ var t=$("hkSay"); if(!t) return; t.textContent=a[(Math.random()*a.length)|0]; t.classList.remove("pop"); void t.offsetWidth; t.classList.add("pop"); }
(function(){ var d=el("div","hk-shop"); d.id="hkShop"; d.setAttribute("role","dialog"); d.setAttribute("aria-modal","true"); d.setAttribute("aria-label","Boutique de Hancock"); d.hidden=true;
  d.innerHTML='<div class="hk-stage"><p class="hk-say" id="hkSay" aria-live="polite"></p><img class="hk-spr" alt="Hancock" src="assets/chars/hancock.webp" decoding="async"></div>'+
   '<aside class="hk-panel"><div class="hk-hd"><b>Chez Hancock</b><small>Poussins cliqueurs · chaque clic = 1 Kwak Coin</small><button type="button" class="hk-x" id="hkX" aria-label="Fermer la boutique">×</button></div><div class="hk-list cscroll" id="hkList"></div><p class="hk-fine">Prix +15 % par poussin. Aucun remboursement, aucun échange, aucun poussin ne sera vendu deux fois*.<br><small>* sauf ceux-là.</small></p></aside>';
  city.appendChild(d); $("hkX").onclick=function(){ shopOpen(false); }; d.addEventListener("click",function(e){ if(e.target===d||e.target.classList.contains("hk-stage")) shopOpen(false); }); })();
var CHK_SVG=function(c){ return '<svg viewBox="0 0 40 40" aria-hidden="true"><g class="ck-b" style="--c:'+c+'"><path d="M14 33l-2 5M22 33l1 5" stroke="#e8862a" stroke-width="2" stroke-linecap="round"/><ellipse cx="18" cy="25" rx="13" ry="10.5" fill="var(--c)"/><ellipse cx="14" cy="25" rx="6" ry="4" fill="#000" opacity=".14"/><circle cx="27" cy="14" r="8" fill="var(--c)"/><circle cx="29.5" cy="12.5" r="1.7" fill="#222"/><path d="M34 13.5l5.5 2-5.5 2z" fill="#f39a1d"/><path d="M24 6.5c1-3 3-3.5 4-1.5" stroke="var(--c)" stroke-width="2" fill="none" stroke-linecap="round"/></g></svg>'; };
function shopOpen(on){ var d=$("hkShop"); if(!d) return; d.hidden=!on; if(on){ renderShop(); hkLine(HK_SAY); blip(620,.05); } }
function renderShop(){ var L=$("hkList"); if(!L) return; L.textContent="";
  CHK.forEach(function(k){ var r=el("div","hk-it"); r.innerHTML='<i class="hk-ck">'+CHK_SVG(k.c)+'</i><span class="hk-tx"><b></b><small></small><em></em></span><button type="button" class="pill primary hk-buy"><i class="coin"></i><b></b></button>';
    r.querySelector(".hk-tx b").textContent=k.name; r.querySelector(".hk-tx small").textContent="+"+fmtR(k.cps)+" clic/s sur Miqka (+"+fmtR(k.cps)+" KC/s)";
    var bt=r.querySelector(".hk-buy"); bt._k=k; bt.onclick=function(){ buyChick(k,bt); }; L.appendChild(r); });
  hkBtns(); }
function hkBtns(){ var L=$("hkList"); if(!L||$("hkShop").hidden) return; [].forEach.call(L.querySelectorAll(".hk-it"),function(r,i){ var k=CHK[i], c=chkCost(k), b=r.querySelector(".hk-buy");
  b.querySelector("b").textContent=fmt(c); b.classList.toggle("poor",S.coins<c); r.querySelector(".hk-tx em").textContent=chkN(k.id)? "Possédés : "+chkN(k.id)+" · +"+fmtR(k.cps*chkN(k.id))+" KC/s" : "Aucun pour l'instant"; }); }
function buyChick(k,bt){ var c=chkCost(k); if(S.coins<c){ bt.classList.remove("shake"); void bt.offsetWidth; bt.classList.add("shake"); nope(); hkLine(HK_POOR); return; }
  S.coins-=c; S.chk=S.chk||{}; S.chk[k.id]=chkN(k.id)+1; cash(); hkLine(HK_BUY); renderCoins(); hkBtns(); placeChicks(); save(); }
/* poussins visibles dans l'onglet Miqka : 12 max (les plus « chers » d'abord), derrière Miqka, trottinent au sol et donnent un coup de bec (petit +N) à leur rythme de clic */
var CK=[], ckRaf=0, ckLast=0, CK_MAX=12;
function placeChicks(){ var mk=$("mk"); if(!mk||!mkInit) return; var L=$("ckL"); if(!L){ L=el("div","ck-l"); L.id="ckL"; mk.insertBefore(L,$("mkSq")); }
  var want=[]; for(var i=CHK.length-1;i>=0 && want.length<CK_MAX;i--){ var k=CHK[i], nn=chkN(k.id); for(var j=0;j<nn && want.length<CK_MAX;j++) want.push(k); }
  var W=mk.clientWidth, H=mk.clientHeight; if(!W||!H) return; var sq=$("mkSq").getBoundingClientRect(), m=mk.getBoundingClientRect(), p=$("mkSq").children[pose].getBoundingClientRect();
  var ground=Math.min(H-4,(p.bottom||sq.bottom)-m.top), sz=Math.max(26,Math.min(64,(p.height||H)*.075)), RW=Math.min(W,Math.max(p.width*2.4,W*.6)), RX=(W-RW)/2;
  while(CK.length>want.length){ var o=CK.pop(); o.el.remove(); }
  want.forEach(function(k,i){ var o=CK[i]; if(!o){ var e=el("i","ck"); L.appendChild(e); o={el:e,x:RX+Math.random()*RW,v:(Math.random()<.5?-1:1)*(14+Math.random()*22),t:Math.random()*2}; CK.push(o); }
    if(o.k!==k.id){ o.k=k.id; o.el.innerHTML=CHK_SVG(k.c); o.per=Math.max(.7,Math.min(4,want.filter(function(x){ return x.id===k.id; }).length/(k.cps*chkN(k.id))*1.0||1)); }
    o.min=RX+sz/2; o.max=RX+RW-sz/2; o.sz=sz; o.el.style.width=o.el.style.height=sz+"px"; o.el.style.top=(ground-sz*(.92+(i%3)*.06))+"px"; o.y0=i%3; o.el.style.zIndex=3+(i%3); });
  if(CK.length && !ckRaf && !RM){ ckLast=0; ckRaf=requestAnimationFrame(ckStep); } }
function ckStep(ts){ ckRaf=0; if(!CK.length) return; var dt=ckLast?Math.min(.05,(ts-ckLast)/1000):0; ckLast=ts;
  if(tab==="miqka" && !document.hidden && $("mk").offsetParent){ CK.forEach(function(o){ o.x+=o.v*dt; if(o.x<o.min){ o.x=o.min; o.v=Math.abs(o.v); } if(o.x>o.max){ o.x=o.max; o.v=-Math.abs(o.v); }
      if(Math.random()<dt*.15) o.v=-o.v;
      o.el.style.transform="translateX("+(o.x-o.sz/2).toFixed(1)+"px)"+(o.v<0?" scaleX(-1)":"");
      o.t-=dt; if(o.t<=0){ o.t=o.per*(0.85+Math.random()*.3); var g=o.el.firstChild; if(g){ o.el.classList.remove("peck"); void o.el.offsetWidth; o.el.classList.add("peck"); }
        var f=$("mkFx"); if(f && f.childElementCount<40){ var b=el("b","ck-p"); var r=o.el.getBoundingClientRect(), fr=f.getBoundingClientRect(); b.textContent="+"+fmtR(CHK.filter(function(k){ return k.id===o.k; })[0].cps*chkN(o.k)/Math.max(1,CK.filter(function(z){ return z.k===o.k; }).length)*o.per|0||1);
          b.style.left=(r.left-fr.left+r.width/2)+"px"; b.style.top=(r.top-fr.top)+"px"; f.appendChild(b); setTimeout(function(){ b.remove(); },800); } } }); }
  ckRaf=requestAnimationFrame(ckStep); }

/* ---------- onglet Employés ---------- */
var built=false, open=null;
function renderStaff(){ if(built){ CH.forEach(function(c){ updBanner(c); }); return; } built=true; var box=$("staff");
  CH.forEach(function(c,i){
    var w=el("div","rb-wrap"); w.dataset.k=c.k; c._w=w;
    var b=el("button","rb "+(i%2?"silver":"gold")); b.setAttribute("aria-expanded","false");
    b.innerHTML='<span class="rb-shd"></span><span class="rb-body bev"></span><span class="rb-art bev"><span class="rb-bg"></span><span class="rb-fx"></span>'+
      '<img class="rb-bust" alt="" decoding="async"><span class="rb-txt"><b class="rb-name"></b><span class="rb-job"></span><span class="rb-meta"><span class="rb-price"><i class="coin"></i><b></b></span><span class="rb-cnt"></span><span class="rb-gain"></span></span></span></span>'+
      '<svg class="rb-frame" aria-hidden="true"><use href="#rbf"/></svg>';
    b.style.setProperty("--sdl",(-(i*1.3)%9).toFixed(1)+"s");
    var d=el("div","rb-drawer"); d.innerHTML='<div class="rb-dr-in"><div class="rb-panel"><div class="rb-stats"><span class="rb-n"></span><span class="rb-inc"></span></div>'+
      '<div class="rb-crew"></div><button class="pill primary rb-buy"><span>Engager</span><em><i class="coin"></i><b></b></em></button></div></div>';
    b.onclick=function(){ toggle(c.id); };
    d.querySelector(".rb-buy").onclick=function(ev){ ev.stopPropagation(); hire(c, ev.currentTarget); };
    w.appendChild(b); w.appendChild(d); box.appendChild(w); updBanner(c);
  }); }
function crewHTML(c,box,fresh){ var k=n(c.id), show=Math.min(k,12); box.textContent="";
  if(!k){ var e=el("span","rb-empty"); e.textContent="Personne pour l'instant. Engage le premier !"; box.appendChild(e); return; }
  for(var i=0;i<show;i++){ var h=head(c,"crew"); h.style.setProperty("--d",(-(i*0.23)%1.1).toFixed(2)+"s"); if(fresh && i===show-1) h.classList.add("new"); box.appendChild(h); }
  if(k>12){ var m=el("span","rb-more"); m.textContent="+"+(k-12); box.appendChild(m); } }
var BGS=["p2","p7","p8","p10"];
function reveal(c,w,anim){ var on=known(c); if(w.dataset.rev===(on?"1":"0")) return; w.dataset.rev=on?"1":"0";
  var b=w.querySelector(".rb"), im=w.querySelector(".rb-bust");
  b.className="rb "+(CH.indexOf(c)%2?"silver":"gold")+(on? " a-"+c.anim+" th-"+c.th : " unk");
  im.src= on? IMG+c.id+".webp" : SIL+c.k+".webp";
  /* fond du bandeau : capture officielle du lieu de l'œuvre (voir SOURCES.md), chargée seulement après l'embauche ; sinon dégradé neutre */
  var bg=w.querySelector(".rb-bg"), hasBg=on && BGS.indexOf(c.k)>=0; bg.classList.toggle("img",hasBg); bg.style.backgroundImage=hasBg? 'url("assets/ville/bg/'+c.k+'.webp")' : "";
  w.querySelector(".rb-name").textContent=on?c.name:"???"; w.querySelector(".rb-job").textContent=on?c.job:"???";
  anim=anim||c._rev; c._rev=false;
  if(on&&anim){ b.classList.remove("revealing"); void b.offsetWidth; b.classList.add("revealing"); setTimeout(function(){ b.classList.remove("revealing"); },1300); } }
function updBanner(c,fresh){ var w=c._w; if(!w) return; var k=n(c.id); reveal(c,w,fresh);
  w.querySelector(".rb-cnt").textContent=k? "× "+k+(k>1?" engagés":" engagé") : "à recruter";
  w.querySelector(".rb-cnt").classList.toggle("zero",!k); updGain(c,w);
  w.querySelector(".rb-n").textContent=known(c)? k+" "+c.name+(k>1&&!/s$/.test(c.name)?"s":"")+" au travail" : "Perso mystère · à découvrir";
  w.querySelector(".rb-inc").textContent="+"+fmtR(c.rate)+"/s chacun";
  w.querySelector(".rb-buy b").textContent=fmt(cost(c)); w.querySelector(".rb-price b").textContent=fmt(cost(c)); w.querySelector(".rb-price").title=(k?"Prix d'un exemplaire de plus : ":"Prix pour engager : ")+fmt(cost(c))+" Kwak Coin";
  if(open===c.id) crewHTML(c,w.querySelector(".rb-crew"),fresh); refreshBuy(); }
function updGain(c,w){ w=w||c._w; if(!w) return; var g=w.querySelector(".rb-gain"), r=crate(c), t=r>0? "+"+fmtR(r)+"/s" : "";
  if(g.textContent!==t){ g.textContent=t; g.classList.toggle("off",!t); } }
function updGains(){ if(built) CH.forEach(function(c){ updGain(c); }); }
function refreshBuy(){ if(!built) return; CH.forEach(function(c){ var w=c._w; if(w) w.querySelector(".rb-buy").classList.toggle("poor",S.coins<cost(c)); }); }
function toggle(id){ var prev=open; open=(open===id)?null:id;
  [].forEach.call($("staff").children,function(w){ var on=!!open && w===BY[open]._w; w.classList.toggle("open",on); w.querySelector(".rb").setAttribute("aria-expanded",on); });
  if(open){ var c=BY[open], w=c._w; crewHTML(c,w.querySelector(".rb-crew"));
    setTimeout(function(){ var box=$("staff"), r=w.getBoundingClientRect(), br=box.getBoundingClientRect(); if(r.bottom+170>br.bottom) box.scrollBy({top:Math.min(r.top-br.top-8, r.bottom+170-br.bottom),behavior:"smooth"}); },60); }
  blip(open?640:440,.05); }
function seen(id){ return S.seen.indexOf(id)>=0; }
function hire(c,btn){ var k=cost(c);
  if(S.coins<k){ btn.classList.remove("shake"); void btn.offsetWidth; btn.classList.add("shake"); nope(); toastMsg("Pas assez de Kwak Coin ("+fmt(k)+" requis)"); return; }
  if(!n(c.id) && !seen(c.id)){            /* 1re embauche : séquence VN, embauche validée seulement à la fin */
    var i=CH.indexOf(c), prev=(i>0&&i<=2)?CH[i-1]:null;   /* ordre imposé seulement pour Big Jim → Estinien → Homer ; ensuite, ordre libre */
    if(prev && !known(prev)){ btn.classList.remove("shake"); void btn.offsetWidth; btn.classList.add("shake"); nope(); toastMsg("Engage d'abord "+prev.name+" : l'histoire se suit dans l'ordre"); return; }
    startHire(c,k,false); return; }
  S.coins-=k; S.hired[c.id]=n(c.id)+1; save(); cash(); renderCoins(); updBanner(c,true); toastMsg(c.name+" n°"+n(c.id)+" au travail !"); }
/* séquence d'embauche ; S.pend est sauvegardé : après un rechargement, la séquence reprend à la réplique en cours */
function startHire(c,k,resume){
    pending={id:c.id,cost:k}; S.pend={id:c.id,cost:k}; save(); blip(700,.05);
    playSeq(c.id, function(ok){ var p=pending; pending=null; delete S.pend;
      if(ok && p){ c._rev=true; if(!seen(c.id)) S.seen.push(c.id); var kk=Math.min(p.cost,S.coins); S.coins-=kk; S.hired[c.id]=n(c.id)+1; storyBtn(); }
      setMode("city"); setTab("staff"); if(open!==c.id) toggle(c.id);
      if(ok){ cash(); updBanner(c,true); toastMsg(c.name+" rejoint "+cityName()+" !"); } else { updBanner(c); toastMsg("Embauche annulée"); }
      save(); }, {track:true, resume:!!resume});
}
/* ---------- Histoire : journal des séquences d'embauche ---------- */
function renderJournal(){ var box=$("journal"); box.textContent=""; storyBtn();
  var head=el("p","jr-intro"); head.textContent=S.seen.length? "Rejoue une séquence d'embauche déjà vue. Ta ville continue de produire pendant ce temps." : "Aucune séquence vue pour l'instant. Engage un nouvel employé (onglet Ville › Employés) pour débloquer sa séquence ici.";
  box.appendChild(head);
  var pb=el("button","jr jr-pro"), pi=el("i","hd jr-hd jr-mq"); pi.style.backgroundImage="url("+MQ+"excited.webp)"; pb.appendChild(pi);
  var pt=el("span","jr-t"), pn=el("b"); pn.textContent="Prologue"; var ps=el("small"); ps.textContent="Miqka en prison · tutoriel"; pt.appendChild(pn); pt.appendChild(ps); pb.appendChild(pt);
  var pg=el("span","jr-go"); pg.textContent="Rejouer ▶"; pb.appendChild(pg);
  pb.onclick=function(){ blip(640,.05); var L=["tuto_1","tuto_2","tuto_3","tuto_4"], k=0; (function nx(ok){ if(ok===false || k>=L.length){ setMode("story"); return; } playTuto(L[k++],nx); })(); };
  box.appendChild(pb);
  CH.forEach(function(c){ var ok=seen(c.id), b=el("button","jr"+(ok?"":" locked")); b.disabled=!ok;
    b.appendChild(head2(c)); var t=el("span","jr-t"); var nm=el("b"); nm.textContent=ok?c.name:"???"; var jb=el("small"); jb.textContent=ok? c.job+" · séquence vue" : "Verrouillé : engage ce perso mystère (Employés)"; t.appendChild(nm); t.appendChild(jb); b.appendChild(t);
    var go=el("span","jr-go"); go.textContent=ok?"Rejouer ▶":"🔒"; b.appendChild(go);
    if(ok) b.onclick=function(){ blip(640,.05); playSeq(c.id,function(){ setMode("city"); }); };
    box.appendChild(b); });
  /* v10 : rencontres des Tomodachi + petites histoires des paliers déjà lues */
  var JT=[]; TOMO.forEach(function(t){ if(tomoOwned(t)) JT.push([t.av,t.name,"Tomodachi · rencontre",function(){ playSeq(t.id,function(){ setMode("story"); }); }]); });
  MS.forEach(function(m){ if(msRead(m)) JT.push([MQ+"excited.webp",m.t,"Petite histoire · palier "+fmt(m.n)+" KC/s",function(){ app.classList.remove("mode-city"); VN.playScene(m.id,function(){ app.classList.add("mode-city"); setMode("story"); }); }]); });
  JT.forEach(function(j){ var b=el("button","jr"), h=el("i","hd jr-hd"); h.style.backgroundImage='url("'+j[0]+'")'; b.appendChild(h);
    var t=el("span","jr-t"), nm=el("b"); nm.textContent=j[1]; var sm=el("small"); sm.textContent=j[2]; t.appendChild(nm); t.appendChild(sm); b.appendChild(t);
    var go=el("span","jr-go"); go.textContent="Rejouer ▶"; b.appendChild(go); b.onclick=function(){ blip(640,.05); j[3](); }; box.appendChild(b); });
  if(window.BUILDER&&BUILDER.journal) BUILDER.journal(box); }
function head2(c){ if(seen(c.id)) return head(c,"jr-hd"); var h=el("i","hd jr-hd gray sil"); h.style.backgroundImage="url("+SIL+c.k+".webp)"; return h; }
function toastMsg(m){ var t=$("toast"); if(!t) return; t.textContent=m; t.classList.add("on"); clearTimeout(toastMsg.t); toastMsg.t=setTimeout(function(){ t.classList.remove("on"); },1600); }

/* cadre SVG des bandeaux (filets + coins ornés), défini une fois */
document.body.insertAdjacentHTML("afterbegin",'<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="rbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffbe9"/><stop offset=".4" stop-color="#e7c98a"/><stop offset=".7" stop-color="#fff4d2"/><stop offset="1" stop-color="#c9a05e"/></linearGradient>'+
 '<symbol id="rbf" viewBox="0 0 300 100" preserveAspectRatio="none"><path d="M6 1.5H294L298.5 6V94L294 98.5H6L1.5 94V6Z" fill="none" stroke="url(#rbg)" stroke-width="1"/>'+
 '<path d="M9 5H291L295 9V91L291 95H9L5 91V9Z" fill="none" stroke="rgba(255,244,214,.55)" stroke-width=".5"/>'+
 '<path d="M5 20V9L9 5H24M276 95H291L295 91V80" fill="none" stroke="#fff3cf" stroke-width="1.3"/><path d="M295 20V9L291 5H276M24 95H9L5 91V80" fill="none" stroke="#fff3cf" stroke-width=".8" opacity=".75"/>'+
 '<path d="M150 2.6L153 5L150 7.4L147 5Z M150 92.6L153 95L150 97.4L147 95Z" fill="url(#rbg)"/></symbol></defs></svg>');

function renderAll(){ renderCoins(); setTab(tab); }
$("tmTab").onclick=function(){ tomoToggle(); blip(600,.05); }; $("tmX").onclick=function(){ tomoToggle(false); };
city.dataset.tab=tab;
// démarrage : on n'affiche la barre et la ville qu'en jeu (CSS : #app:not(.on-title))
city.dataset.view="tabs"; showPane(tab); renderCoins(); storyBtn(); applyCityName();
/* Réglages : renommer la ville */
(function(){ var sb=document.querySelector(".sheet-body.settings"), rs=$("btnReset"); if(!sb||!rs) return; var r=el("div","row cn-row");
  r.innerHTML='<span>Nom de la ville <em data-city-name></em></span><button class="pill" id="setCity" type="button">Renommer</button>'; sb.insertBefore(r,rs);
  var r2=el("div","row"); r2.innerHTML='<span>Musique de la ville</span><button class="toggle" id="tgBgm" role="switch" type="button"></button>'; sb.insertBefore(r2,rs);
  $("tgBgm").onclick=function(){ S.musicOff=!S.musicOff; save(); music(); }; musUI();
  $("setCity").onclick=function(){ CITY.rename(); }; applyCityName(); })();
/* Réglages : crédits des photos de décor (Wikimedia Commons ; CC BY = attribution obligatoire). Rendu en textContent. */
var MUS_CREDITS=[["Crimson Sunrise (Kugane, jour)","chaîne M D","ville de jour"],["The Source (Lakeland)","chaîne M D","ville de nuit"],["Knowledge Never Sleeps (Crystarium #2)","chaîne M D","calme"],
  ["Pain in Pleasure (Eulmore, Everlasting Light)","chaîne M D","comique"],["Indulgence (Eulmore #1)","chaîne M D","casino / boutique"],["Melt (Heavensward Battle Theme)","chaîne M D","tension"],
  ["Triumph (Stormblood Boss Theme)","chaîne M D","Zenos"],["Eternal Wind (Crystal Tower Ending / FF3)","chaîne M D","mélancolie"],["Neath Dark Waters (Amaurot)","chaîne M D","sombre / Fandaniel"]];
var PHOTO_CREDITS=[["Dirty alley (5108469769).jpg", "Steve Collis from Melbourne, Australia", "CC BY 2.0", "https://commons.wikimedia.org/wiki/File:Dirty_alley_(5108469769).jpg"], ["Puddle Treading in the City (52528741786).jpg", "Terry  Kearney from liverpool, merseyside", "CC0", "https://commons.wikimedia.org/wiki/File:Puddle_Treading_in_the_City_(52528741786).jpg"], ["Washington Bridge, RI - underside of the George Redman Linear Park.jpg", "Waz8", "CC0", "https://commons.wikimedia.org/wiki/File:Washington_Bridge,_RI_-_underside_of_the_George_Redman_Linear_Park.jpg"], ["Inside an abandoned building in Berlin (147264934).jpg", "Till Krech from Berlin, Germany", "CC BY 2.0", "https://commons.wikimedia.org/wiki/File:Inside_an_abandoned_building_in_Berlin_(147264934).jpg"], ["Gaite subway station, Paris (France) - panoramio.jpg", "Tommie Hansen", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Gaite_subway_station,_Paris_(France)_-_panoramio.jpg"], ["Small room - interior.JPG", "Alanthebox", "CC0", "https://commons.wikimedia.org/wiki/File:Small_room_-_interior.JPG"], ["Modern living room with stylish furniture and a view of the outdoors in a cozy apartment setting.jpg", "Shixart1985", "CC BY 2.0", "https://commons.wikimedia.org/wiki/File:Modern_living_room_with_stylish_furniture_and_a_view_of_the_outdoors_in_a_cozy_apartment_setting.jpg"], ["Living Room Mid-City New Orleans.jpg", "Bart Everson", "CC BY 2.0", "https://commons.wikimedia.org/wiki/File:Living_Room_Mid-City_New_Orleans.jpg"], ["Gfp-office-desk-area.jpg", "Yinan Chen", "Public Domain", "https://commons.wikimedia.org/wiki/File:Gfp-office-desk-area.jpg"], ["F9424 Paris 17e rue de la Terrasse rwk.jpg", "Mbzt", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:F9424_Paris_17e_rue_de_la_Terrasse_rwk.jpg"], ["A LOFT IN SAO PAULO CITY.jpg", "Pedu0303", "CC0", "https://commons.wikimedia.org/wiki/File:A_LOFT_IN_SAO_PAULO_CITY.jpg"], ["DSC33262, Crystals Retail and Entertainment, City Center, Las Vegas, Nevada, USA (5594087280).jpg", "Jim G from Silicon Valley, CA, USA", "CC BY 2.0", "https://commons.wikimedia.org/wiki/File:DSC33262,_Crystals_Retail_and_Entertainment,_City_Center,_Las_Vegas,_Nevada,_USA_(5594087280).jpg"], ["Swimming Pool of Lembongan Cliff Villas - 2015.03 - panoramio.jpg", "rheins", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Swimming_Pool_of_Lembongan_Cliff_Villas_-_2015.03_-_panoramio.jpg"], ["Victoria Kiosk at sunset on Dufferin Terrace 2.jpg", "Wilfredor", "CC0", "https://commons.wikimedia.org/wiki/File:Victoria_Kiosk_at_sunset_on_Dufferin_Terrace_2.jpg"], ["Penthouse. Architect Andrey Kurochkin. Riga.jpg", "Andrey Kurochkin", "CC0", "https://commons.wikimedia.org/wiki/File:Penthouse._Architect_Andrey_Kurochkin._Riga.jpg"], ["Le yacht de luxe IJE (IMO 1013004) à quai à Monaco (4 novembre 2021).jpg", "Benoît Prieur", "CC0", "https://commons.wikimedia.org/wiki/File:Le_yacht_de_luxe_IJE_(IMO_1013004)_%C3%A0_quai_%C3%A0_Monaco_(4_novembre_2021).jpg"], ["Jet Airways 777 Premiere seat.jpg", "schuey from London, London", "CC BY 2.0", "https://commons.wikimedia.org/wiki/File:Jet_Airways_777_Premiere_seat.jpg"], ["Williams Cay, Great Exuma, Bahamas - panoramio.jpg", "Kenneth Sams", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Williams_Cay,_Great_Exuma,_Bahamas_-_panoramio.jpg"], ["Golden Drawing Room.jpg", "Alexander Kolb", "Public domain", "https://commons.wikimedia.org/wiki/File:Golden_Drawing_Room.jpg"], ["Throne Room (Royal Palace of Madrid) 3.jpg", "Joseolgon", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:Throne_Room_(Royal_Palace_of_Madrid)_3.jpg"], ["Gold bullion bars.jpg", "Stevebidmead", "CC0", "https://commons.wikimedia.org/wiki/File:Gold_bullion_bars.jpg"], ["Prison Tour jail cell.jpg", "Steve Mays", "CC BY 2.0", "https://commons.wikimedia.org/wiki/File:Prison_Tour_jail_cell.jpg"], ["Rooftop (139487531).jpeg", "Andres Franco", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Rooftop_(139487531).jpeg"], ["2024 - Photo of the street Koningsstraat and square Nieuwmarkt with Christmas lights by night in Amsterdam city in winter - free image of street photography in The Netherlands by Fons Heijnsbroek.jpg", "Fons Heijnsbroek", "CC0", "https://commons.wikimedia.org/wiki/File:2024_-_Photo_of_the_street_Koningsstraat_and_square_Nieuwmarkt_with_Christmas_lights_by_night_in_Amsterdam_city_in_winter_-_free_image_of_street_photography_in_The_Netherlands_by_Fons_Heijnsbroek.jpg"], ["Empty coffee shop interior with wooden table and water skis.jpg", "Drew Coffman", "CC0", "https://commons.wikimedia.org/wiki/File:Empty_coffee_shop_interior_with_wooden_table_and_water_skis.jpg"], ["Toyota AE86 Trueno 21-09-2024.jpg", "BWard 1997", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:Toyota_AE86_Trueno_21-09-2024.jpg"], ["Tallulah City Council meeting room.jpg", "Ktkvtsh", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:Tallulah_City_Council_meeting_room.jpg"], ["Many Kinds of Doughnuts on Disolay At the Doughnut Shop West of Melbourne.jpg", "Brassluff", "CC0", "https://commons.wikimedia.org/wiki/File:Many_Kinds_of_Doughnuts_on_Disolay_At_the_Doughnut_Shop_West_of_Melbourne.jpg"], ["Dombay, Dzhuguturlyuchat massif and glacier, Caucasus Mountains, Karachay-Cherkessia.jpg", "Vyacheslav Argenberg", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:Dombay,_Dzhuguturlyuchat_massif_and_glacier,_Caucasus_Mountains,_Karachay-Cherkessia.jpg"], ["Small-Town Drive (15230746066).jpg", "Nicholas A. Tonelli from Northeast Pennsylvania, USA", "CC BY 2.0", "https://commons.wikimedia.org/wiki/File:Small-Town_Drive_(15230746066).jpg"], ["Watts Bar Nuclear Plant Cooling Towers (2) - Rhea County, Tennessee - March 15, 2015.jpg", "David Ratledge", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:Watts_Bar_Nuclear_Plant_Cooling_Towers_(2)_-_Rhea_County,_Tennessee_-_March_15,_2015.jpg"], ["Ye Grapes Pub, Shepherd Market, London - Interior 2022-08-14.jpg", "David", "CC BY 2.0", "https://commons.wikimedia.org/wiki/File:Ye_Grapes_Pub,_Shepherd_Market,_London_-_Interior_2022-08-14.jpg"], ["Museum of the Moving Image - 23784723.jpg", "Jason \"Textfiles\" Scott", "CC BY 2.0", "https://commons.wikimedia.org/wiki/File:Museum_of_the_Moving_Image_-_23784723.jpg"], ["DisneyQuest arcade machines, Florida.jpg", "Steven Miller", "CC BY 2.0", "https://commons.wikimedia.org/wiki/File:DisneyQuest_arcade_machines,_Florida.jpg"], ["Kwu Tung Grass Pitch 201708.jpg", "Wpcpey", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:Kwu_Tung_Grass_Pitch_201708.jpg"], ["Globe Life Field Visitor Locker Room (2023).jpg", "Chew", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:Globe_Life_Field_Visitor_Locker_Room_(2023).jpg"], ["LOOM office workspaces.jpg", "Loominade", "CC0", "https://commons.wikimedia.org/wiki/File:LOOM_office_workspaces.jpg"], ["Palenque, Temple of the Inscriptions (20498755918).jpg", "Arian Zwegers from Brussels, Belgium", "CC BY 2.0", "https://commons.wikimedia.org/wiki/File:Palenque,_Temple_of_the_Inscriptions_(20498755918).jpg"], ["South Brazil - In Explore 06-23-2015 - Flickr - Doug Scortegagna.jpg", "Douglas  Scortegagna from Flores da Cunha, Brasil", "CC BY 2.0", "https://commons.wikimedia.org/wiki/File:South_Brazil_-_In_Explore_06-23-2015_-_Flickr_-_Doug_Scortegagna.jpg"], ["The arena, interior, Nîmes, France-LCCN2001698490.jpg", "Photochrom Print Collection", "Public domain", "https://commons.wikimedia.org/wiki/File:The_arena,_interior,_N%C3%AEmes,_France-LCCN2001698490.jpg"], ["Throne Room of the Palace of the Grand Dukes of Lithuania in Vilnius, Lithuania (wide).jpg", "Hayden Soloviev", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:Throne_Room_of_the_Palace_of_the_Grand_Dukes_of_Lithuania_in_Vilnius,_Lithuania_(wide).jpg"], ["Model T Casino interior.jpg", "Mx. Granger", "CC0", "https://commons.wikimedia.org/wiki/File:Model_T_Casino_interior.jpg"], ["Las Vegas Strip panorama.jpg", "Matthew Field, http://www.photography.mattfield.com", "CC BY 2.5", "https://commons.wikimedia.org/wiki/File:Las_Vegas_Strip_panorama.jpg"], ["Lewes Bonfire Night 2013 South Street fireworks display 12.JPG", "Editor5807", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Lewes_Bonfire_Night_2013_South_Street_fireworks_display_12.JPG"], ["Sousse, Tunisia - sailing ship.jpg", "Sharon Hahn Darlin", "CC BY 2.0", "https://commons.wikimedia.org/wiki/File:Sousse,_Tunisia_-_sailing_ship.jpg"], ["Fox Theatre May 2024 interior stage.jpg", "Sgerbic", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:Fox_Theatre_May_2024_interior_stage.jpg"], ["HK 佐敦 Jordan 廟街 Temple Street 夜市 market food stalls night December 2023 R12S 57.jpg", "ZhuWahDaSeeMcYanSze", "CC0", "https://commons.wikimedia.org/wiki/File:HK_%E4%BD%90%E6%95%A6_Jordan_%E5%BB%9F%E8%A1%97_Temple_Street_%E5%A4%9C%E5%B8%82_market_food_stalls_night_December_2023_R12S_57.jpg"]];
(function(){ var sb=document.querySelector(".sheet-body.settings"), rs=$("btnReset"); if(!sb||!rs) return; var d=el("details","credits"), sm=el("summary"); sm.textContent="Crédits photos (décors)"; d.appendChild(sm);
  var ol=el("ol"); PHOTO_CREDITS.forEach(function(c){ var li=el("li"), a=el("a"); a.href=c[3]; a.target="_blank"; a.rel="noopener"; a.textContent=c[0].replace(/\.(jpe?g|png)$/i,""); li.appendChild(a);
    li.appendChild(document.createTextNode(" — "+c[1]+" · "+c[2])); ol.appendChild(li); }); d.appendChild(ol);
  var n=el("p","hint"); n.textContent="Photos via Wikimedia Commons (décors et fonds de scènes), recadrées, redimensionnées et converties en WebP. Licences : CC0 / domaine public / CC BY 2.0, 2.5, 3.0, 4.0 (creativecommons.org/licenses)."; d.appendChild(n);
  var n2=el("p","hint"); n2.textContent="Personnages et illustration de la ville : images officielles ou captures (fournies par le joueur pour certaines), © SQUARE ENIX (FINAL FANTASY XIV), © CBS (Under the Dome), © 20th Television (Les Simpson), © HoYoverse (Honkai: Star Rail), © Spike Chunsoft (Danganronpa), © Muneyuki Kaneshiro, Yusuke Nomura / Kodansha (Blue Lock), © Shinobu Ohtaka / Shogakukan (Magi) — usage de fan non commercial. Tomodachi Eden et Tropi : captures FFXIV des personnages du joueur (© SQUARE ENIX), fournies par lui. Textes des scènes : écrits pour ce jeu."; d.appendChild(n2);
  sb.insertBefore(d,rs.nextSibling);
  /* musique (v11) : pistes tirées de la playlist YouTube du joueur, usage personnel non commercial, extraits en boucle */
  var md=el("details","credits"), ms=el("summary"); ms.textContent="Crédits musique"; md.appendChild(ms); var mo=el("ol");
  MUS_CREDITS.forEach(function(c){ var li=el("li"); li.textContent=c[0]+" — "+c[1]+" · ambiance « "+c[2]+" »"; mo.appendChild(li); }); md.appendChild(mo);
  var mh=el("p","hint"); mh.textContent="Musiques de FINAL FANTASY XIV © SQUARE ENIX (compositeur principal : Masayoshi Soken ; « Eternal Wind » : Nobuo Uematsu), extraits en boucle depuis des vidéos YouTube de la playlist du joueur (chaîne indiquée), usage personnel non commercial."; md.appendChild(mh);
  d.parentNode.insertBefore(md,d.nextSibling); })();
if(window.VN && VN.refreshTitle) VN.refreshTitle();
})();
