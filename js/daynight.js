/* Cycle jour/nuit de l'onglet Ville (v8).
   L'image de base (illustration de jour) n'est jamais modifiée : on superpose des couches simples de teinte et de lumière
   (dégradés CSS, points lumineux), animées uniquement par opacity/transform (performant sur iPhone).
   Horloge de jeu : un cycle complet = 10 minutes réelles, calé sur l'horloge de l'appareil (continu d'une session à l'autre).
   Phases (0 → 1) : aube ≈0,94–0,10 · jour 0,10–0,47 · couchant 0,47–0,64 · nuit 0,64–0,94 (≈ 1 min d'aube, 3,5 min de jour, 1,5 min de couchant, 3 min de nuit).
   Test : ajouter ?dn=0.3 (jour), 0.56 (couchant), 0.8 (nuit), 0.02 (aube) à l'adresse pour figer un moment. */
(function(){
"use strict";
var CYCLE = 10*60*1000;
var forced = (location.search.match(/[?&]dn=([0-9.]+)/)||[])[1];
function phase(){ return forced != null ? (+forced % 1) : (Date.now() % CYCLE) / CYCLE; }
function ss(a,b,x){ var t = Math.min(1, Math.max(0, (x-a)/(b-a))); return t*t*(3-2*t); }
function weights(p){
  var q = p < .3 ? p + 1 : p;                       // q ∈ [0,3 ; 1,3) : la nuit et l'aube enjambent minuit sans saut
  var n = ss(.56, .68, q) * (1 - ss(.92, 1.06, q)); // nuit
  var dusk = ss(.46, .55, q) * (1 - ss(.6, .7, q)); // couchant
  var dawn = ss(.9, .98, q) * (1 - ss(1.04, 1.12, q)) * (1 - n*.55); // aube
  return {n:n, dusk:dusk, dawn:Math.max(0, dawn)};
}
/* positions mesurées sur l'illustration (aperçu 1024 px de large) → % de l'image recadrée */
function P(x, y){ return [x/1024*100, (50 + y*615/420 - 62)/603*100]; }
var LIGHTS = [[550,150],[556,195],[548,235],[600,215],[640,225],[690,215],[735,205],[780,200],[760,235],[705,240],[886,95],[884,120],
  [838,190],[870,180],[930,170],[960,240],[945,265],[905,300],[940,330],[980,320],[760,240],[800,245],[845,260],[700,280],[740,285],
  [650,280],[610,300],[580,270],[680,320],[720,330],[840,305],[870,280],[590,355],[640,350],[700,345],[760,365],[905,355],[950,350],
  [795,355],[835,360],[810,390],[440,250],[470,243],[495,255],[515,240],[455,265],[315,262],[190,290],[250,305],[282,305]].map(function(a){ return P(a[0],a[1]); });
var BEACON = P(428,138), MOON = P(150,58);
function rnd(seed){ return function(){ seed = (seed*16807) % 2147483647; return (seed-1)/2147483646; }; }
function inSky(x, y){ return (x < 40 && y < 58) || (x < 55 && y < 30) || (x < 84 && y < 12) || y < 4; }
function el(tag, cls){ var e = document.createElement(tag); if(cls) e.className = cls; return e; }
var root = null, built = false;
function build(ti){
  if(built || !ti) return; built = true;
  root = el("div", "dn"); root.setAttribute("aria-hidden", "true");
  ["dn-dawn","dn-dusk","dn-night","dn-shade","dn-glow-dusk","dn-glow-dawn"].forEach(function(c){ root.appendChild(el("div", c)); });
  var stars = el("div", "dn-stars"), r = rnd(4242), k = 0, guard = 0;
  while(k < 46 && guard++ < 2000){ var x = r()*100, y = r()*60; if(!inSky(x, y)) continue;
    var s = el("i"); s.style.left = x.toFixed(2)+"%"; s.style.top = y.toFixed(2)+"%"; var z = r();
    s.style.setProperty("--s", (z < .8 ? 1.4 : 2.2)+"px"); s.style.animationDelay = (-r()*6).toFixed(2)+"s"; s.style.animationDuration = (3.5+r()*4).toFixed(2)+"s";
    stars.appendChild(s); k++; }
  root.appendChild(stars);
  var moon = el("div", "dn-moon"); moon.style.left = MOON[0]+"%"; moon.style.top = MOON[1]+"%"; root.appendChild(moon);
  var sea = el("div", "dn-sea"), r2 = rnd(77);
  for(var i=0;i<9;i++){ var g = el("i"); g.style.left = (2 + r2()*28).toFixed(1)+"%"; g.style.top = (72 + r2()*20).toFixed(1)+"%";
    g.style.width = (3 + r2()*6).toFixed(1)+"%"; g.style.animationDelay = (-r2()*5).toFixed(2)+"s"; sea.appendChild(g); }
  root.appendChild(sea);
  var moonpath = el("div", "dn-moonpath"); root.appendChild(moonpath);
  var lights = el("div", "dn-lights"), r3 = rnd(99);
  LIGHTS.forEach(function(p, i){ var l = el("i"); l.style.left = p[0].toFixed(2)+"%"; l.style.top = p[1].toFixed(2)+"%";
    l.style.setProperty("--t", (.15 + r3()*.6).toFixed(2)); l.style.animationDelay = (-r3()*9).toFixed(2)+"s"; lights.appendChild(l); });
  var b = el("i", "beacon"); b.style.left = BEACON[0]+"%"; b.style.top = BEACON[1]+"%"; b.style.setProperty("--t", ".05"); lights.appendChild(b);
  root.appendChild(lights);
  var pop = ti.querySelector(".town-pop"); ti.insertBefore(root, pop || null);
  tick(true);
}
var last = "";
function tick(now){
  var ti = document.getElementById("townImg"); if(!ti) return;
  if(!built) build(ti); if(!root || !root.isConnected){ built = false; build(ti); }
  var p = phase(), w = weights(p);
  var key = [w.n, w.dusk, w.dawn].map(function(v){ return v.toFixed(3); }).join(",");
  if(key === last) return; last = key;
  if(now === true) ti.classList.add("dn-instant");
  ti.style.setProperty("--n", w.n.toFixed(3)); ti.style.setProperty("--dusk", w.dusk.toFixed(3)); ti.style.setProperty("--dawn", w.dawn.toFixed(3));
  ti.dataset.dn = w.n > .6 ? "nuit" : w.dusk > .5 ? "couchant" : w.dawn > .5 ? "aube" : "jour";
  if(now === true) requestAnimationFrame(function(){ requestAnimationFrame(function(){ ti.classList.remove("dn-instant"); }); });
}
window.DAYNIGHT = {phase:phase, weights:weights, tick:tick};
function loop(){ if(!document.hidden) tick(); }
setInterval(loop, 2000);
document.addEventListener("visibilitychange", function(){ if(!document.hidden) tick(true); });
var tries = 0; (function wait(){ if(document.getElementById("townImg")) tick(true); else if(tries++ < 200) setTimeout(wait, 150); })();
})();
