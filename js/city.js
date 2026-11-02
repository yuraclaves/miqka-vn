/* Miqka City — jeu incrémental (onglets Ville, Miqka, Employés) + barre du bas « Histoire » / « Ville ».
   Le visual novel ne sert plus qu'aux SÉQUENCES D'EMBAUCHE (story.js, scènes « embauche_<id> ») : 1re embauche d'un perso → séquence → retour Ville.
   « Histoire » = journal des séquences déjà vues (rejouables). État séparé : localStorage « miqka_city.v1 » (le VN garde « miqka_vn.* » pour ses réglages).
   Images : bustes recadrés depuis des arts officiels (voir SOURCES du dossier de travail), décor de ville = capture officielle FFXIV. */
(function(){
"use strict";
var $=function(id){return document.getElementById(id);};
var app=$("app"), IMG="assets/ville/", MQ="assets/sprites/title/";
var KEY="miqka_city.v1", MKEY="miqka_city.mode";
/* fx/fy = centre du visage dans le buste (en %) pour les petites têtes ; anim = mini animation propre au bandeau */
var CH=[
 {id:"estinien",name:"Estinien",job:"Garde",th:"drg",anim:"float",fx:56,fy:27,base:12,rate:.4},
 {id:"homer",name:"Homer",job:"Donuts",th:"donut",anim:"bounce",fx:50,fy:30,base:8,rate:.25},
 {id:"topaz",name:"Topaz",job:"Gestionnaire",th:"ipc",anim:"twinkle",fx:44,fy:30,base:30,rate:1},
 {id:"zenos",name:"Zenos",job:"Prince",th:"garlean",anim:"pulse",fx:44,fy:32,base:45,rate:1.6},
 {id:"chiaki",name:"Chiaki",job:"Joueuse",th:"pixel",anim:"steps",fx:52,fy:40,base:14,rate:.45},
 {id:"bigjim",name:"Big Jim",job:"Adjoint",th:"dome",anim:"sway",fx:50,fy:34,base:20,rate:.7},
 {id:"sinbad",name:"Sinbad",job:"Roi des Sept Mers",th:"sea",anim:"wave",fx:46,fy:30,base:60,rate:2},
 {id:"rin",name:"Rin",job:"Attaquante",th:"pitch",anim:"kick",fx:44,fy:18,base:24,rate:.8},
 {id:"bakool",name:"Bakul Jaja",job:"Chef de tribu",th:"tural",anim:"stomp",fx:42,fy:22,base:40,rate:1.4},
 {id:"aventurine",name:"Aventurine",job:"Banquier",th:"casino",anim:"chip",fx:48,fy:28,base:35,rate:1.2},
 {id:"fandaniel",name:"Fandaniel",job:"Événements",th:"ember",anim:"flicker",fx:50,fy:32,base:18,rate:.6}
];
var BY={}; CH.forEach(function(c){BY[c.id]=c;});
/* nouvelle partie : 40 Mikua Coin, personne d'engagé (la 1re embauche de chaque perso lance sa séquence) */
var DEMO={coins:40,total:40,hired:{},seen:[],t:0,mute:false,mode:"city",tab:"town"};
var S=load();
function fresh(){ var d=JSON.parse(JSON.stringify(DEMO)); d.t=Date.now(); d.seed=(Math.random()*1e9)|0; return d; }
function load(){ try{ var v=JSON.parse(localStorage.getItem(KEY)); if(v&&v.hired){ v.seen=v.seen||[]; if(v.total==null) v.total=v.coins; if(!v.seed) v.seed=(Math.random()*1e9)|0; return v; } }catch(e){} return fresh(); }
var started=hasSave();
function save(){ if(!started) return; S.t=Date.now(); delete S.fresh; try{ localStorage.setItem(KEY,JSON.stringify(S)); }catch(e){} }
function hasSave(){ try{ return !!localStorage.getItem(KEY); }catch(e){ return false; } }
function n(id){ return S.hired[id]||0; }
function cost(c){ return Math.round(c.base*Math.pow(1.18,n(c.id))); }
function rate(){ var r=0; CH.forEach(function(c){ r+=c.rate*n(c.id); }); return r; }
function fmt(x){ x=Math.floor(x); return x<1e4? String(x) : x<1e6? (x/1e3).toFixed(x<1e5?1:0).replace(".",",")+" k" : (x/1e6).toFixed(1).replace(".",",")+" M"; }
function fmtR(r){ return (Math.round(r*10)/10).toString().replace(".",","); }
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
 '<div class="c-coins" id="cCoins"><i class="coin"></i><b id="cCoinN">0</b><span>Mikua Coin</span><em id="cRate"></em></div>'+
 '<button class="c-mute" id="cMute" aria-label="Couper le son"></button></div>'+
 '<div class="c-tabs" role="tablist"><button data-t="town" role="tab">Ville</button><button data-t="miqka" role="tab">Miqka</button><button data-t="staff" role="tab">Employés</button><i class="c-ind"></i></div><div class="c-jtitle"><b>Histoire</b> · séquences d\'embauche</div></header>'+
 '<div class="c-pane" data-p="town"><div class="town cscroll" id="town"><div class="town-img" id="townImg"><img src="'+IMG+'city.webp" alt="Tuliyollal" decoding="async"><div class="town-pop" id="townPop"></div></div></div>'+
 '<div class="town-info"><b id="townN">0</b> habitants recrutés <span class="town-hint">· engage des employés pour peupler la ville</span><small>Décor : capture officielle FINAL FANTASY XIV (Tuliyollal) © SQUARE ENIX</small></div></div>'+
 '<div class="c-pane" data-p="miqka"><div class="mk" id="mk"><div class="mk-halo"></div><div class="mk-sq" id="mkSq"></div><div class="mk-rain" id="mkRain"></div><div class="mk-fx" id="mkFx"></div><div class="mk-tier" id="mkTier"></div></div><p class="mk-hint" id="mkHint">Touche Miqka : +1 Mikua Coin</p></div>'+
 '<div class="c-pane" data-p="staff"><div class="staff cscroll" id="staff"></div></div>'+
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
function enterGame(m){ app.classList.remove("on-title","ui-hidden","seq"); setMode(m||"city"); }
function storyBtn(){ var none=!S.seen.length; $("mbStory").classList.toggle("dim",none); $("mbStory").title=none?"Aucune séquence vue pour l'instant":""; }
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
  newGame:function(){ S=fresh(); started=true; tab="town"; built=false; open=null; $("staff").textContent=""; mkTier=-1; enterGame("city"); toastMsg("Nouvelle partie : 40 Mikua Coin pour démarrer !"); },
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
  $("seqCoinN").textContent=fmt(S.coins); $("seqRate").textContent=rs; refreshBuy(); checkTier(true); }
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
var SPOTS=[[22,55],[45,62],[12,63],[66,42],[35,72],[80,45],[50,48],[30,49],[88,58],[57,70],[76,68],[18,90],[40,88],[72,30],[60,60],[92,40],[28,84],[85,82],[48,31],[8,78],[70,86],[58,22],[38,56],[62,93]];
function townList(){ /* répartit les habitants : un par perso engagé à tour de rôle, max 24 */
  var pools=CH.map(function(c){ return {c:c,k:n(c.id)}; }), out=[];
  while(out.length<SPOTS.length){ var any=false; pools.forEach(function(p){ if(p.k>0 && out.length<SPOTS.length){ out.push(p.c); p.k--; any=true; } }); if(!any) break; }
  return out; }
function head(c,cls){ var h=el("i","hd "+(cls||"")); h.style.backgroundImage="url("+IMG+c.id+".webp)"; h.style.backgroundPosition=c.fx+"% "+c.fy+"%"; return h; }
function renderTown(){ var pop=$("townPop"); pop.textContent=""; var L=townList(), tot=0; CH.forEach(function(c){ tot+=n(c.id); });
  L.forEach(function(c,i){ var s=SPOTS[i], w=el("div","tp"); w.style.left=s[0]+"%"; w.style.top=s[1]+"%"; w.style.setProperty("--d",(-(i*0.37)%2.2).toFixed(2)+"s");
    var h=head(c); w.appendChild(h); var lb=el("span","tp-n"); lb.textContent=c.name; w.appendChild(lb); pop.appendChild(w); });
  $("townN").textContent=tot;
  var t=$("town"); if(!t.dataset.c){ t.dataset.c=1; requestAnimationFrame(function(){ t.scrollLeft=(t.scrollWidth-t.clientWidth)*.45; }); } }

/* ---------- onglet Miqka ---------- */
var POSES=["excited","idea","pointing","shy","sweet"], pose=0, mkInit=false, mkTier=-1;
/* chaque pose = image + calque d'overlays (PNG transparents) placé par points d'ancrage ; boîte au ratio exact du sprite 580×844 */
function initMiqka(){ if(mkInit) return; mkInit=true; var sq=$("mkSq");
  POSES.forEach(function(p,i){ var w=el("div","mk-pose"+(i===0?" on":"")); w.dataset.pose=p; var im=new Image(); im.src=MQ+p+".webp"; im.alt=""; im.className="mk-base"; w.appendChild(im);
    w.appendChild(el("div","mk-ov")); sq.appendChild(w); });
  $("mk").addEventListener("pointerdown",function(e){ e.preventDefault(); tapMiqka(e); });
  fitMiqka(); window.addEventListener("resize",fitMiqka); if(window.ResizeObserver) new ResizeObserver(fitMiqka).observe(sq);
  mkTier=-1; checkTier(false); }
function fitMiqka(){ var sq=$("mkSq"); if(!sq) return; var W=sq.clientWidth, H=sq.clientHeight; if(!W||!H) return; var h=Math.min(H, W*844/580), w=h*580/844;
  [].forEach.call(sq.children,function(p){ p.style.width=w+"px"; p.style.height=h+"px"; }); }
function checkTier(anim){ if(!window.WEALTH || !mkInit) return; var t=WEALTH.tierOf(S.total||0); if(t===mkTier) return;
  var up=mkTier>=0 && t>mkTier; mkTier=t; if(anim&&up) S.seed=(Math.random()*1e9)|0;   /* nouvelles variantes à chaque palier franchi */
  var keys=WEALTH.pick(t,S.seed||1);
  [].forEach.call($("mkSq").children,function(p){ WEALTH.render(p.querySelector(".mk-ov"),p.dataset.pose,keys,anim&&up); });
  var T=WEALTH.TIERS[t]; $("mk").dataset.tier=t; $("mkTier").innerHTML='<b>Palier '+(t+1)+'/'+WEALTH.TIERS.length+'</b> · '+T.name;
  rain(T.rain||0);
  if(anim&&up){ var sq=$("mkSq"); sq.classList.remove("lvl"); void sq.offsetWidth; sq.classList.add("lvl"); fanfare();
    toastMsg("Palier "+(t+1)+" : "+T.name+" ! "+T.msg); }
  save(); }
function rain(n){ var fx=$("mkRain"); if(!fx) return; if(+fx.dataset.n===n) return; fx.dataset.n=n; fx.textContent=""; var k=n===2?16:n===1?7:0;
  for(var i=0;i<k;i++){ var im=new Image(); im.alt=""; im.src="assets/overlays/"+(i%4===3?"bill":"coin")+".png"; im.className="rain-i"+(i%4===3?" bill":"");
    im.style.left=(4+Math.random()*92).toFixed(1)+"%"; im.style.animationDuration=(2.2+Math.random()*1.8).toFixed(2)+"s"; im.style.animationDelay=(-Math.random()*4).toFixed(2)+"s";
    im.style.setProperty("--rr",((Math.random()*360)|0)+"deg"); fx.appendChild(im); } }
var GL=["★","✦","♥","✧","♪","+1"], COL=["#ffd59a","#f2a7c8","#b89cff","#9fe6ff","#fff"];
function tapMiqka(e){
  earn(1); renderCoins(); bumpCoins(); boing();
  var imgs=$("mkSq").children; imgs[pose].classList.remove("on"); pose=(pose+1)%imgs.length; imgs[pose].classList.add("on");
  var sq=$("mkSq"); sq.classList.remove("hit","hit2"); void sq.offsetWidth; sq.classList.add(Math.random()<.5?"hit":"hit2");
  var fx=$("mkFx"), r=fx.getBoundingClientRect(), x=(e.clientX||r.left+r.width/2)-r.left, y=(e.clientY||r.top+r.height/2)-r.top;
  var p=el("b","mk-p"); p.textContent="+1"; p.style.left=x+"px"; p.style.top=y+"px"; fx.appendChild(p); setTimeout(function(){ p.remove(); },900);
  for(var i=0;i<5;i++){ var s=el("i","mk-s"); s.textContent=GL[(Math.random()*GL.length)|0]; s.style.left=x+"px"; s.style.top=y+"px"; s.style.color=COL[i%COL.length];
    var a=Math.random()*Math.PI*2, d=50+Math.random()*60; s.style.setProperty("--x",(Math.cos(a)*d).toFixed(0)+"px"); s.style.setProperty("--y",(Math.sin(a)*d-30).toFixed(0)+"px");
    s.style.setProperty("--r",((Math.random()*80-40)|0)+"deg"); fx.appendChild(s); (function(s){ setTimeout(function(){ s.remove(); },800); })(s); }
  if(navigator.vibrate) try{ navigator.vibrate(8); }catch(_){}
  S.taps=(S.taps||0)+1; if(S.taps===1) $("mkHint").textContent="Encore ! Chaque toucher = 1 Mikua Coin";
}

/* ---------- onglet Employés ---------- */
var built=false, open=null;
function renderStaff(){ if(built){ CH.forEach(function(c){ updBanner(c); }); return; } built=true; var box=$("staff");
  CH.forEach(function(c,i){
    var w=el("div","rb-wrap"); w.dataset.id=c.id;
    var b=el("button","rb "+(i%2?"silver":"gold")+" a-"+c.anim+" th-"+c.th); b.setAttribute("aria-expanded","false");
    b.innerHTML='<span class="rb-shd"></span><span class="rb-body bev"></span><span class="rb-art bev"><span class="rb-bg"></span><span class="rb-fx"></span>'+
      '<img class="rb-bust" src="'+IMG+c.id+'.webp" alt="" loading="lazy" decoding="async"><span class="rb-txt"><b class="rb-name"></b><span class="rb-job"></span><span class="rb-cnt"></span></span></span>'+
      '<svg class="rb-frame" aria-hidden="true"><use href="#rbf"/></svg>';
    b.querySelector(".rb-name").textContent=c.name; b.querySelector(".rb-job").textContent=c.job;
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
function updBanner(c,fresh){ var w=$("staff").querySelector('[data-id="'+c.id+'"]'); if(!w) return; var k=n(c.id);
  w.querySelector(".rb-cnt").textContent=k? "× "+k+(k>1?" engagés":" engagé") : "à recruter";
  w.querySelector(".rb-cnt").classList.toggle("zero",!k);
  w.querySelector(".rb-n").textContent=k+" "+c.name+(k>1&&!/s$/.test(c.name)?"s":"")+" au travail";
  w.querySelector(".rb-inc").textContent="+"+fmtR(c.rate)+"/s chacun";
  w.querySelector(".rb-buy b").textContent=fmt(cost(c));
  if(open===c.id) crewHTML(c,w.querySelector(".rb-crew"),fresh); refreshBuy(); }
function refreshBuy(){ if(!built) return; CH.forEach(function(c){ var w=$("staff").querySelector('[data-id="'+c.id+'"]'); if(w) w.querySelector(".rb-buy").classList.toggle("poor",S.coins<cost(c)); }); }
function toggle(id){ var prev=open; open=(open===id)?null:id;
  [].forEach.call($("staff").children,function(w){ var on=w.dataset.id===open; w.classList.toggle("open",on); w.querySelector(".rb").setAttribute("aria-expanded",on); });
  if(open){ var c=BY[open], w=$("staff").querySelector('[data-id="'+open+'"]'); crewHTML(c,w.querySelector(".rb-crew"));
    setTimeout(function(){ var box=$("staff"), r=w.getBoundingClientRect(), br=box.getBoundingClientRect(); if(r.bottom+170>br.bottom) box.scrollBy({top:Math.min(r.top-br.top-8, r.bottom+170-br.bottom),behavior:"smooth"}); },60); }
  blip(open?640:440,.05); }
function seen(id){ return S.seen.indexOf(id)>=0; }
function hire(c,btn){ var k=cost(c);
  if(S.coins<k){ btn.classList.remove("shake"); void btn.offsetWidth; btn.classList.add("shake"); nope(); toastMsg("Pas assez de Mikua Coin ("+fmt(k)+" requis)"); return; }
  if(!n(c.id) && !seen(c.id)){            /* 1re embauche : séquence VN, embauche validée seulement à la fin */
    pending={id:c.id,cost:k}; save(); blip(700,.05);
    playSeq(c.id, function(ok){ var p=pending; pending=null;
      if(ok && p){ if(!seen(c.id)) S.seen.push(c.id); var kk=Math.min(p.cost,S.coins); S.coins-=kk; S.hired[c.id]=n(c.id)+1; storyBtn(); }
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
    b.appendChild(head2(c)); var t=el("span","jr-t"); var nm=el("b"); nm.textContent=c.name; var jb=el("small"); jb.textContent=ok? c.job+" · séquence vue" : "Verrouillé : engage "+c.name; t.appendChild(nm); t.appendChild(jb); b.appendChild(t);
    var go=el("span","jr-go"); go.textContent=ok?"Rejouer ▶":"🔒"; b.appendChild(go);
    if(ok) b.onclick=function(){ blip(640,.05); playSeq(c.id,function(){ setMode("city"); }); };
    box.appendChild(b); }); }
function head2(c){ return head(c,"jr-hd"+(seen(c.id)?"":" gray")); }
function toastMsg(m){ var t=$("toast"); if(!t) return; t.textContent=m; t.classList.add("on"); clearTimeout(toastMsg.t); toastMsg.t=setTimeout(function(){ t.classList.remove("on"); },1600); }

/* cadre SVG des bandeaux (filets + coins ornés), défini une fois */
document.body.insertAdjacentHTML("afterbegin",'<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="rbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffbe9"/><stop offset=".4" stop-color="#e7c98a"/><stop offset=".7" stop-color="#fff4d2"/><stop offset="1" stop-color="#c9a05e"/></linearGradient>'+
 '<symbol id="rbf" viewBox="0 0 300 100" preserveAspectRatio="none"><path d="M6 1.5H294L298.5 6V94L294 98.5H6L1.5 94V6Z" fill="none" stroke="url(#rbg)" stroke-width="1"/>'+
 '<path d="M9 5H291L295 9V91L291 95H9L5 91V9Z" fill="none" stroke="rgba(255,244,214,.55)" stroke-width=".5"/>'+
 '<path d="M5 20V9L9 5H24M276 95H291L295 91V80" fill="none" stroke="#fff3cf" stroke-width="1.3"/><path d="M295 20V9L291 5H276M24 95H9L5 91V80" fill="none" stroke="#fff3cf" stroke-width=".8" opacity=".75"/>'+
 '<path d="M150 2.6L153 5L150 7.4L147 5Z M150 92.6L153 95L150 97.4L147 95Z" fill="url(#rbg)"/></symbol></defs></svg>');

function renderAll(){ renderCoins(); setTab(tab); }
city.dataset.tab=tab;
// démarrage : on n'affiche la barre et la ville qu'en jeu (CSS : #app:not(.on-title))
city.dataset.view="tabs"; showPane(tab); renderCoins(); storyBtn();
if(window.VN && VN.refreshTitle) VN.refreshTitle();
})();
