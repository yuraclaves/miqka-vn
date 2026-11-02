/* Miqka City — jeu incrémental (onglets Ville, Miqka, Employés) + barre du bas « Histoire » / « Ville ».
   Le visual novel ne sert plus qu'aux SÉQUENCES D'EMBAUCHE (story.js, scènes « embauche_<id> ») : 1re embauche d'un perso → séquence → retour Ville.
   « Histoire » = journal des séquences déjà vues (rejouables). État séparé : localStorage « miqka_city.v1 » (le VN garde « miqka_vn.* » pour ses réglages).
   Images : bustes recadrés depuis des arts officiels (voir SOURCES du dossier de travail), décor de ville = capture officielle FFXIV (Limsa Lominsa). */
(function(){
"use strict";
var $=function(id){return document.getElementById(id);};
var app=$("app"), IMG="assets/ville/", MQ="assets/sprites/title/";
var KEY="miqka_city.v1", MKEY="miqka_city.mode";
/* fx/fy = centre du visage dans le buste (en %) pour les petites têtes ; anim = mini animation propre au bandeau */
var CH=[
 {id:"bigjim",name:"Big Jim",job:"Adjoint",th:"dome",anim:"sway",fx:50,fy:34,base:400,rate:.25},
 {id:"estinien",name:"Estinien",job:"Garde",th:"drg",anim:"float",fx:56,fy:27,base:900,rate:.4},
 {id:"homer",name:"Homer",job:"Donuts",th:"donut",anim:"bounce",fx:50,fy:30,base:2000,rate:.45},
 {id:"chiaki",name:"Chiaki",job:"Joueuse",th:"pixel",anim:"steps",fx:52,fy:40,base:4000,rate:.6},
 {id:"rin",name:"Rin",job:"Attaquante",th:"pitch",anim:"kick",fx:44,fy:18,base:7500,rate:.8},
 {id:"topaz",name:"Topaz",job:"Gestionnaire",th:"ipc",anim:"twinkle",fx:44,fy:30,base:13000,rate:1},
 {id:"bakool",name:"Bakool Jaja",job:"Chef de tribu",th:"tural",anim:"stomp",fx:42,fy:22,base:23000,rate:1.2},
 {id:"zenos",name:"Zenos",job:"Prince",th:"garlean",anim:"pulse",fx:44,fy:32,base:40000,rate:1.4},
 {id:"aventurine",name:"Aventurine",job:"Banquier",th:"casino",anim:"chip",fx:48,fy:28,base:70000,rate:1.6},
 {id:"fandaniel",name:"Fandaniel",job:"Événements",th:"ember",anim:"flicker",fx:50,fy:32,base:120000,rate:1.8},
 {id:"sinbad",name:"Sinbad",job:"Roi des Sept Mers",th:"sea",anim:"wave",fx:46,fy:30,base:200000,rate:2}
];
var BY={}; CH.forEach(function(c,i){BY[c.id]=c; c.k="p"+(i+1);});   /* k = id neutre exposé dans le DOM (perso-1…) */
/* perso « connu » = déjà engagé (ou séquence vue) ; sinon bandeau caché : silhouette floutée, « ??? », aucun nom dans le DOM */
function known(c){ return n(c.id)>0 || (S.seen||[]).indexOf(c.id)>=0; }
var SIL="assets/ville/sil/";
/* nouvelle partie : 40 Kwak Coin, personne d'engagé (la 1re embauche de chaque perso lance sa séquence) */
var DEMO={coins:40,total:40,hired:{},seen:[],t:0,mute:false,mode:"city",tab:"town"};
var S=load();
function fresh(){ var d=JSON.parse(JSON.stringify(DEMO)); d.t=Date.now(); d.seed=(Math.random()*1e9)|0; return d; }
function load(){ try{ var v=JSON.parse(localStorage.getItem(KEY)); if(v&&v.hired){ v.seen=v.seen||[]; if(v.total==null) v.total=v.coins; if(!v.seed) v.seed=(Math.random()*1e9)|0; return v; } }catch(e){} return fresh(); }
var started=hasSave();
function save(){ if(!started) return; S.t=Date.now(); delete S.fresh; try{ localStorage.setItem(KEY,JSON.stringify(S)); }catch(e){} }
function hasSave(){ try{ return !!localStorage.getItem(KEY); }catch(e){ return false; } }
function n(id){ return S.hired[id]||0; }
/* prix : base fortement croissante selon le rang + ×1,17 par exemplaire (calibré par simulation, ~18 h pour tout débloquer) */
var GROW=1.17;
function cost(c){ return Math.round(c.base*Math.pow(GROW,n(c.id))); }
/* production réelle d'un perso (même calcul que le revenu passif total : somme des crate = rate) */
function crate(c){ return c.rate*n(c.id); }
function rate(){ var r=0; CH.forEach(function(c){ r+=crate(c); }); return r; }
var UNITS=[[1e12,"T"],[1e9,"B"],[1e6,"M"],[1e3,"K"]];
function fmt(x){ x=Math.floor(x); if(x<1e4) return String(x); for(var i=0;i<UNITS.length;i++){ var u=UNITS[i]; if(x>=u[0]){ var v=x/u[0]; return v.toFixed(v<100?1:0).replace(".",",").replace(/,0$/,"")+"\u202f"+u[1]; } } return String(x); }
function fmtR(r){ return r>=1e4? fmt(r) : (Math.round(r*10)/10).toString().replace(".",","); }
/* gain passif (hors-ligne plafonné à 2 h) */
function earn(x){ S.coins+=x; S.total=(S.total||0)+x; }
(function(){ if(S.t){ var dt=Math.min(7200,Math.max(0,(Date.now()-S.t)/1000)); earn(rate()*dt); } S.t=Date.now(); })();
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
 '<button class="c-mute" id="cMute" aria-label="Couper le son"></button></div>'+
 '<div class="c-tabs" role="tablist"><button data-t="town" role="tab">Ville</button><button data-t="miqka" role="tab">Miqka</button><button data-t="staff" role="tab">Employés</button><i class="c-ind"></i></div><div class="c-jtitle"><button class="c-back" id="cBack" aria-label="Retour aux Employés"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></button><b>Histoire</b> · séquences d\'embauche</div></header>'+
 '<div class="c-pane" data-p="town"><div class="town cscroll" id="town"><div class="town-img" id="townImg"><img src="'+IMG+'city.webp" alt="Limsa Lominsa" decoding="async"><div class="town-pop" id="townPop"></div></div></div>'+
 '</div>'+
 '<div class="c-pane" data-p="miqka"><div class="mk" id="mk"><div class="mk-deco" id="mkDeco"><img class="dc" alt=""><img class="dc" alt=""></div><div class="mk-vig"></div><i class="mk-flash" id="mkFlash"></i><div class="mk-halo"></div><div class="tm-heads" id="tmHeads"></div><div class="mk-sq" id="mkSq"></div><div class="mk-rain" id="mkRain"></div><div class="mk-fx" id="mkFx"></div></div><p class="mk-st" id="mkSt" aria-live="polite"></p><p class="mk-hint" id="mkHint">Touche Miqka : +1 Kwak Coin</p><button class="tm-tab" id="tmTab" aria-expanded="false" aria-controls="tmDrawer"><span>Tomodachi</span></button><div class="tm-drawer" id="tmDrawer" role="dialog" aria-label="Tomodachi"><div class="tm-hd"><b>Tomodachi</b><small>Des amis pour Miqka</small><button class="tm-x" id="tmX" aria-label="Fermer">×</button></div><div class="tm-list" id="tmList"></div></div></div>'+
 '<div class="c-pane" data-p="staff"><div class="st-head"><button class="st-hist" id="cHist" aria-label="Histoire : revoir les scènes d\'embauche déjà vues"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5C4.7 20 4 19.3 4 18.5zM20 5.5c0-.8-.7-1.5-1.5-1.5H13v16h5.5c.8 0 1.5-.7 1.5-1.5z"/></svg><span>Histoire</span><small>scènes vues</small></button></div><div class="staff cscroll" id="staff"></div></div>'+
 '<div class="c-pane" data-p="journal"><div class="journal cscroll" id="journal"></div></div>';
app.appendChild(city); app.appendChild(bar); app.appendChild(seqCoin);

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
function enterGame(m){ app.classList.remove("on-title","ui-hidden","seq"); tab="town"; setMode("city"); }
function storyBtn(){ var none=!S.seen.length; $("mbStory").classList.toggle("dim",none); $("mbStory").title=none?"Aucune séquence vue pour l'instant":""; var h=$("cHist"); if(h){ h.classList.toggle("dim",none); h.title=none?"Aucune séquence vue pour l'instant":"Revoir les séquences d'embauche déjà vues"; } }
$("cHist").onclick=function(){ setMode("story"); blip(500,.05); };
$("cBack").onclick=function(){ tab="staff"; setMode("city"); blip(560,.05); };
$("mbStory").onclick=function(){ if(mode!=="story") setMode("story"); blip(500,.05); };
$("mbCity").onclick=function(){ if(mode!=="city") setMode("city"); blip(560,.05); };
$("cHome").onclick=function(){ save(); if(window.VN) VN.goTitle(true); };
/* séquence VN (moteur existant) : la monnaie continue de monter pendant ce temps (minuterie indépendante, voir plus bas) */
function playSeq(id, done){
  if(!window.VN || !VN.playScene || !(window.STORY&&STORY.scenes&&STORY.scenes["embauche_"+id])){ done(true); return; }
  app.classList.remove("mode-city"); renderCoins();
  VN.playScene("embauche_"+id, function(ok){ app.classList.add("mode-city"); done(ok); });
}
window.CITY={
  hasSave:hasSave,
  newGame:function(){ S=fresh(); started=true; tab="town"; built=false; open=null; $("staff").textContent=""; mkTier=-1; if($("tmHeads")) $("tmHeads").textContent=""; enterGame("city"); toastMsg("Nouvelle partie : 40 Kwak Coin pour démarrer !"); },
  resume:function(){ enterGame(S.mode==="story"?"story":"city"); },
  onTitle:function(){ if(pending){ pending=null; } save(); },
  state:function(){ return S; }, setMode:setMode, rate:rate, cost:function(id){ return cost(BY[id]); },
  setTab:function(t){ setTab(t); },
  reset:function(){ S=fresh(); started=false; try{ localStorage.removeItem(KEY); localStorage.removeItem(MKEY); }catch(e){} if(built){ CH.forEach(function(c){ updBanner(c); }); } renderTown(); renderCoins(); storyBtn(); },
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
  $("seqCoinN").textContent=fmt(S.coins); $("seqRate").textContent=rs; refreshBuy(); updGains(); checkTier(true); tomoBtns(); }
function bumpCoins(){ var c=$("cCoins"); c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump"); }
var lastTick=Date.now(), saveAcc=0;
setInterval(function(){ var now=Date.now(), dt=Math.min(5,(now-lastTick)/1000); lastTick=now; if(started) earn(rate()*dt);
  saveAcc+=dt; if(saveAcc>5){ saveAcc=0; save(); }
  if(!app.classList.contains("on-title") && !document.hidden) renderCoins(); },250);
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
$("cMute").onclick=function(){ S.mute=!S.mute; if(S.mute&&ac) ac.suspend(); muteUI(); save(); if(!S.mute) blip(660,.06); };
muteUI();

/* ---------- onglet Ville ---------- */
var SPOTS=[[22,74],[45,80],[12,70],[66,72],[35,88],[80,66],[52,68],[30,78],[88,76],[57,90],[74,84],[18,90],[40,70],[8,82],[62,80],[92,88],[27,66],[84,94],[48,94],[6,94],[70,92],[58,66],[38,82],[96,70]];
function townList(){ /* répartit les habitants : un par perso engagé à tour de rôle, max 24 */
  var pools=CH.map(function(c){ return {c:c,k:n(c.id)}; }), out=[];
  while(out.length<SPOTS.length){ var any=false; pools.forEach(function(p){ if(p.k>0 && out.length<SPOTS.length){ out.push(p.c); p.k--; any=true; } }); if(!any) break; }
  return out; }
function head(c,cls){ var h=el("i","hd "+(cls||"")); h.style.backgroundImage="url("+IMG+"av/"+c.id+".webp)"; return h; }
function renderTown(){ var pop=$("townPop"); pop.textContent=""; var L=townList(), tot=0; CH.forEach(function(c){ tot+=n(c.id); });
  L.forEach(function(c,i){ var s=SPOTS[i], w=el("div","tp"); w.style.left=s[0]+"%"; w.style.top=s[1]+"%"; w.style.setProperty("--d",(-(i*0.37)%2.2).toFixed(2)+"s");
    var h=head(c); w.appendChild(h); var lb=el("span","tp-n"); lb.textContent=c.name; w.appendChild(lb); pop.appendChild(w); });
  
  var t=$("town"); if(!t.dataset.c){ t.dataset.c=1; requestAnimationFrame(function(){ t.scrollLeft=(t.scrollWidth-t.clientWidth)*.45; }); } }

/* ---------- onglet Miqka ---------- */
var POSES=["excited","idea","pointing","shy","sweet"], pose=0, mkInit=false, mkTier=-1;
var RM=window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
/* chaque pose = image + calque d'overlays (PNG transparents) placé par points d'ancrage ; boîte au ratio exact du sprite 580×844 */
function initMiqka(){ if(mkInit) return; mkInit=true; var sq=$("mkSq");
  POSES.forEach(function(p,i){ var w=el("div","mk-pose"+(i===0?" on":"")); w.dataset.pose=p; var im=new Image(); im.src=MQ+p+".webp"; im.alt=""; im.className="mk-base"; w.appendChild(im);
    w.appendChild(el("div","mk-ov")); sq.appendChild(w); });
  sq.addEventListener("pointerdown",function(e){ e.preventDefault(); tapMiqka(e); });
  fitMiqka(); window.addEventListener("resize",function(){ fitMiqka(); decoFrag(); }); if(window.ResizeObserver) new ResizeObserver(fitMiqka).observe(sq);
  mkTier=-1; checkTier(false); renderTomo(); placeHeads(); }
function fitMiqka(){ var sq=$("mkSq"); if(!sq) return; var W=sq.clientWidth, H=sq.clientHeight; if(!W||!H) return; var h=Math.min(H, W*844/580), w=h*580/844;
  [].forEach.call(sq.children,function(p){ p.style.width=w+"px"; p.style.height=h+"px"; }); placeHeads(); }
/* décors par palier (SVG vectoriels codés à la main) : 2 calques en fondu enchaîné ; seuls le palier actuel et le suivant sont préchargés */
var DECO="assets/decor/t", decoCur=-1, decoLayer=0;
function decoSrc(t){ var m=$("mk"), port=m && m.clientWidth<m.clientHeight; return DECO+(t<10?"0":"")+t+".svg"+(port?"#p":""); }
function decoFrag(){ if(decoCur<0) return; var L=$("mkDeco").children[decoLayer], s=decoSrc(decoCur); if(L.getAttribute("src")!==s) L.src=s; }
function setDeco(t,anim){ var box=$("mkDeco"); if(!box) return; if(t===decoCur){ decoFrag(); return; } decoCur=t;
  var nx=anim?1-decoLayer:decoLayer, L=box.children[nx], O=box.children[1-nx];
  L.classList.remove("on"); L.src=decoSrc(t);
  var go=function(){ L.classList.add("on"); if(anim){ O.classList.remove("on"); var f=$("mkFlash"); f.classList.remove("go"); void f.offsetWidth; f.classList.add("go"); } };
  if(L.complete && L.naturalWidth) go(); else { L.onload=go; L.onerror=go; }
  decoLayer=nx;
  if(window.WEALTH && WEALTH.TIERS[t+1]){ var pre=new Image(); pre.src=DECO+(t+1<10?"0":"")+(t+1)+".svg"; } }
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
  var p=el("b","mk-p"); p.textContent="+1"; p.style.left=x+"px"; p.style.top=y+"px"; fx.appendChild(p); setTimeout(function(){ p.remove(); },900);
  var nb=RM?2:(5+lv*2);
  for(var i=0;i<nb;i++){ var coinP=lv>=1 && i%2===0, s=coinP?new Image():el("i","mk-s");
    if(coinP){ s.src="assets/overlays/coin.png"; s.alt=""; s.className="mk-s mk-c"; } else { s.textContent=lv>=2?(i%3?"✦":"★"):GL[(Math.random()*GL.length)|0]; s.style.color=lv>=2?"#ffd75e":COL[i%COL.length]; }
    s.style.left=x+"px"; s.style.top=y+"px";
    var a=Math.random()*Math.PI*2, d=50+Math.random()*(60+lv*25); s.style.setProperty("--x",(Math.cos(a)*d).toFixed(0)+"px"); s.style.setProperty("--y",(Math.sin(a)*d-30).toFixed(0)+"px");
    s.style.setProperty("--r",((Math.random()*160-80)|0)+"deg"); fx.appendChild(s); (function(s){ setTimeout(function(){ s.remove(); },850); })(s); }
  if(lv>=3 && !RM){ var m=$("mk"); m.classList.remove("shake"); void m.offsetWidth; m.classList.add("shake"); } }
function fxPos(e){ var r=$("mkFx").getBoundingClientRect(); return [(e.clientX||r.left+r.width/2)-r.left,(e.clientY||r.top+r.height/2)-r.top]; }
function tapMiqka(e){
  earn(1); renderCoins(); bumpCoins(); boing();
  var imgs=$("mkSq").children; imgs[pose].classList.remove("on"); pose=(pose+1)%imgs.length; imgs[pose].classList.add("on");
  var sq=$("mkSq"); sq.classList.remove("hit","hit2"); void sq.offsetWidth; sq.classList.add(Math.random()<.5?"hit":"hit2");
  var q=fxPos(e); burst(q[0],q[1]);
  if(navigator.vibrate) try{ navigator.vibrate(8); }catch(_){}
  S.taps=(S.taps||0)+1; if(S.taps===1) $("mkHint").textContent="Encore ! Chaque toucher = 1 Kwak Coin";
}

/* ---------- Tomodachi : amis de Miqka (têtes seules, derrière elle, uniquement dans l'onglet Miqka) ----------
   Aucun sprite fourni pour l'instant : 3 emplacements verrouillés, identiques, sans nom ni image (voir TOMODACHI.md pour en ajouter un).
   Un perso = { k, name, head:"assets/tomo/<id>/head.webp", w, h, anch:{ head:{eyes:[xG,yG,xD,yD], mouth:[x,y], cheekL, cheekR, head:[x,y], hair:[x,y]} } } ; ready:true quand les fichiers existent.
   Mode test : ?debugTomo=1 (sprites factices gris « test », jamais visibles en jeu normal). */
var TOMO=[{k:"t1",price:250000},{k:"t2",price:2500000},{k:"t3",price:25000000}];
var DBG_TOMO=/[?&]debugTomo=1\b/.test(location.search);
if(DBG_TOMO) TOMO.forEach(function(t,i){ var c=["#9a9aa2","#8a8f99","#a3a09a"][i];
  t.name="Test "+(i+1); t.w=400; t.h=400; t.ready=true;
  t.head="data:image/svg+xml,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect x="40" y="40" width="320" height="320" rx="60" fill="'+c+'" stroke="#555" stroke-width="10"/><text x="200" y="230" font-family="Arial" font-size="80" text-anchor="middle" fill="#fff">test '+(i+1)+'</text></svg>');
  t.anch={head:{eyes:[150,170,250,170],mouth:[200,270],cheekL:[130,220],cheekR:[270,220],head:[200,60],hair:[120,90]}}; });
function tomoOwned(t){ return (S.tomo||[]).indexOf(t.k)>=0 && t.ready; }
function renderTomo(){ var list=$("tmList"); if(!list) return; list.textContent="";
  TOMO.forEach(function(t){ var own=tomoOwned(t), li=el("div","tm-card"+(own?" own":" lock")), can=t.ready&&!own&&S.coins>=t.price;
    li.innerHTML='<i class="tm-av"></i><span class="tm-tx"><b></b><small></small></span><button class="tm-buy"></button>';
    var av=li.querySelector(".tm-av"); if(own){ av.style.backgroundImage='url("'+t.head+'")'; }
    li.querySelector("b").textContent=own?t.name:"???";
    li.querySelector("small").innerHTML=own?"Avec Miqka":'<i class="coin"></i> '+fmt(t.price)+' Kwak Coin';
    var bt=li.querySelector(".tm-buy"); bt._t=t; bt.textContent=own?"Ami·e":t.ready?"Débloquer":"Bientôt"; bt.disabled=own||!can;
    if(!t.ready) bt.title="Arrive bientôt"; 
    bt.onclick=function(){ if(!t.ready||tomoOwned(t)||S.coins<t.price) return; S.coins-=t.price; (S.tomo=S.tomo||[]).push(t.k); fanfare(); renderCoins(); renderTomo(); placeHeads(true); save(); toastMsg("Nouvel ami pour Miqka !"); };
    list.appendChild(li); }); }
function tomoBtns(){ var d=$("tmDrawer"); if(!d||!d.classList.contains("on")) return; [].forEach.call(d.querySelectorAll(".tm-buy"),function(b){ var t=b._t; b.disabled=!t.ready||tomoOwned(t)||S.coins<t.price; }); }
function tomoToggle(on){ var d=$("tmDrawer"), b=$("tmTab"); on=on==null?!d.classList.contains("on"):on; d.classList.toggle("on",on); b.setAttribute("aria-expanded",on); if(on) renderTomo(); }
/* têtes : derrière Miqka, plus petites, décalées ; emplacements testés contre les collisions (entre elles et avec le visage de Miqka) */
var SLOTS=[[.17,.30],[.83,.34],[.12,.60],[.88,.62],[.25,.12],[.75,.14]];
function placeHeads(pop){ var box=$("tmHeads"), mk=$("mk"); if(!box||!mk||!mkInit) return; var own=TOMO.filter(tomoOwned);
  var W=mk.clientWidth, H=mk.clientHeight; if(!W||!H) return;
  var sz=Math.min(W*.26,H*.2,150), face=(function(){ var p=$("mkSq").children[pose], r=p.getBoundingClientRect(), m=mk.getBoundingClientRect(); return {x:r.left-m.left+r.width*.3,y:r.top-m.top,w:r.width*.4,h:r.height*.28}; })();
  var placed=[face];
  own.forEach(function(t){ var h=box.querySelector('[data-k="'+t.k+'"]');
    if(!h){ h=el("div","tm-head"); h.dataset.k=t.k; h.innerHTML='<div class="tm-in"><img alt="" src="'+t.head+'"><div class="mk-ov"></div></div>'; h.querySelector("img").alt="";
      h.addEventListener("pointerdown",function(e){ e.preventDefault(); e.stopPropagation(); tapHead(h,e); }); box.appendChild(h); if(pop){ h.classList.add("pop"); setTimeout(function(){ h.classList.remove("pop"); },700); } }
    var hs=sz*(t.w>t.h?1:t.h/t.w), spot=null;
    for(var i=0;i<SLOTS.length && !spot;i++){ var r={x:SLOTS[i][0]*W-sz/2,y:SLOTS[i][1]*H-hs/2,w:sz,h:hs};
      if(r.x<2) r.x=2; if(r.x+r.w>W-2) r.x=W-2-r.w; if(r.y<4) r.y=4;
      if(!placed.some(function(o){ return r.x<o.x+o.w && r.x+r.w>o.x && r.y<o.y+o.h && r.y+r.h>o.y; })) spot=r; }
    if(!spot) spot={x:2,y:4,w:sz,h:hs};
    placed.push(spot); h.style.left=spot.x+"px"; h.style.top=spot.y+"px"; h.style.width=spot.w+"px"; h.style.height=spot.h+"px"; });
  [].forEach.call(box.children,function(h){ if(!own.some(function(t){ return t.k===h.dataset.k; })) h.remove(); });
  if(mkTier>=0) headsOverlays(WEALTH.pick(mkTier,S.seed||1),false); }
function headsOverlays(keys,pop){ var box=$("tmHeads"); if(!box) return;
  [].forEach.call(box.children,function(h){ var t=TOMO.filter(function(x){ return x.k===h.dataset.k; })[0]; if(!t||!t.anch) return;
    WEALTH.render(h.querySelector(".mk-ov"),"head",keys,pop,t.anch,t.w,t.h); }); }
function tapHead(h,e){ earn(1); renderCoins(); bumpCoins(); boing();
  var i=h.querySelector(".tm-in"); i.classList.remove("hit","hit2"); void i.offsetWidth; i.classList.add(Math.random()<.5?"hit":"hit2");
  var q=fxPos(e); burst(q[0],q[1]); }

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
    pending={id:c.id,cost:k}; save(); blip(700,.05);
    playSeq(c.id, function(ok){ var p=pending; pending=null;
      if(ok && p){ c._rev=true; if(!seen(c.id)) S.seen.push(c.id); var kk=Math.min(p.cost,S.coins); S.coins-=kk; S.hired[c.id]=n(c.id)+1; storyBtn(); }
      setMode("city"); setTab("staff"); if(open!==c.id) toggle(c.id);
      if(ok){ cash(); updBanner(c,true); toastMsg(c.name+" rejoint Miqka City !"); } else { updBanner(c); toastMsg("Embauche annulée"); }
      save(); });
    return; }
  S.coins-=k; S.hired[c.id]=n(c.id)+1; save(); cash(); renderCoins(); updBanner(c,true); toastMsg(c.name+" n°"+n(c.id)+" au travail !"); }
/* ---------- Histoire : journal des séquences d'embauche ---------- */
function renderJournal(){ var box=$("journal"); box.textContent=""; storyBtn();
  var head=el("p","jr-intro"); head.textContent=S.seen.length? "Rejoue une séquence d'embauche déjà vue. Ta ville continue de produire pendant ce temps." : "Aucune séquence vue pour l'instant. Engage un nouvel employé (onglet Ville › Employés) pour débloquer sa séquence ici.";
  box.appendChild(head);
  CH.forEach(function(c){ var ok=seen(c.id), b=el("button","jr"+(ok?"":" locked")); b.disabled=!ok;
    b.appendChild(head2(c)); var t=el("span","jr-t"); var nm=el("b"); nm.textContent=ok?c.name:"???"; var jb=el("small"); jb.textContent=ok? c.job+" · séquence vue" : "Verrouillé : engage ce perso mystère (Employés)"; t.appendChild(nm); t.appendChild(jb); b.appendChild(t);
    var go=el("span","jr-go"); go.textContent=ok?"Rejouer ▶":"🔒"; b.appendChild(go);
    if(ok) b.onclick=function(){ blip(640,.05); playSeq(c.id,function(){ setMode("city"); }); };
    box.appendChild(b); }); }
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
city.dataset.view="tabs"; showPane(tab); renderCoins(); storyBtn();
if(window.VN && VN.refreshTitle) VN.refreshTitle();
})();
