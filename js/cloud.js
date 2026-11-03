/* Miqka City — sauvegarde par CODE (v10).
   Le joueur choisit un code (ex. MIQKA) ; on n'envoie au serveur qu'un hachage SHA-256 du code normalisé (majuscules, sans espaces autour, 4 caractères min.).
   Contenu synchronisé : toutes les clés localStorage « miqka_* » (Ville + VN + progression des scènes). localStorage reste la source ; envoi ~2,5 s après
   un changement, à la fermeture / changement d'onglet et au retour du réseau. Conflit : on garde la sauvegarde la plus avancée (Kwak Coin gagnés au total).
   v15 : un écart minuscule de progression ne recharge plus la page en boucle. */
(function(){
"use strict";
var API="https://ruuorgyqgtdgfpthanuq.supabase.co/rest/v1/rpc/", PK="sb_publishable_gS5NYQ6xyp-QsK5a1M3mZw_phtomiT0";
var CK="miqkacode.v1", FK="miqkacode.force", PFX="miqka_";
var OFF=/[?&]nocloud\b/.test(location.search);
var code=null, hash=null, last="", busy=false, timer=0;
function ls(k,v){ try{ if(v===undefined) return localStorage.getItem(k); if(v===null) localStorage.removeItem(k); else localStorage.setItem(k,v); }catch(e){} return null; }
function norm(c){ return String(c||"").trim().toUpperCase(); }
function bundle(){ var o={}; try{ for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); if(k && k.indexOf(PFX)===0) o[k]=localStorage.getItem(k); } }catch(e){} return o; }
function prog(b){ try{ var c=JSON.parse(b["miqka_city.v1"]||"null"); if(!c) return 0; return (+c.total||0)+((c.seen||[]).length+(c.ms||[]).length)*1e-3; }catch(e){ return 0; } }
function sha(s){ var d=new TextEncoder().encode("miqka-city:"+s); return crypto.subtle.digest("SHA-256",d).then(function(b){ return Array.prototype.map.call(new Uint8Array(b),function(x){ return ("0"+x.toString(16)).slice(-2); }).join(""); }); }
function rpc(fn,body,keep){ return fetch(API+fn,{method:"POST",keepalive:!!keep,headers:{"apikey":PK,"Authorization":"Bearer "+PK,"Content-Type":"application/json"},body:JSON.stringify(body)})
  .then(function(r){ if(!r.ok) throw new Error("HTTP "+r.status); return r.json(); }); }
function adopt(save){ /* remplace les clés locales par la sauvegarde distante, puis recharge une seule fois (jamais en boucle) */
  var stamp="";
  try{ stamp=(hash||"")+"|"+Math.round((prog(save)||0)*100); }catch(e){}
  try{ Object.keys(bundle()).forEach(function(k){ localStorage.removeItem(k); }); Object.keys(save||{}).forEach(function(k){ if(k.indexOf(PFX)===0 && typeof save[k]==="string") localStorage.setItem(k,save[k]); }); }catch(e){}
  try{ if(sessionStorage.getItem("mqAdopt")===stamp) return; sessionStorage.setItem("mqAdopt", stamp); }catch(e){}
  ls("miqkacode.msg","Sauvegarde du code récupérée"); location.reload(); }
function ahead(remoteP, localP){ return (+remoteP||0) > (+localP||0)+0.05; }
function push(keep){ if(!hash||OFF) return Promise.resolve(); var b=bundle(), s=JSON.stringify(b); if(s===last && !ls(FK)) return Promise.resolve();
  if(!navigator.onLine) return Promise.resolve(); if(busy && !keep) return Promise.resolve(); busy=true; var force=!!ls(FK);
  return rpc("miqka_put",{h:hash,s:b,p:prog(b),force:force},keep).then(function(r){ busy=false; if(r&&r.ok){ last=s; if(force) ls(FK,null); }
      else if(r && ahead(r.progress, prog(b))) return rpc("miqka_get",{h:hash}).then(function(g){ if(g&&g.save&&ahead(g.progress, prog(bundle()))) adopt(g.save); }); })
    .catch(function(){ busy=false; }); }
function sched(){ if(timer) return; timer=setTimeout(function(){ timer=0; push(false); },2500); }
/* attache un code : si le serveur a plus avancé → on le récupère, sinon la partie locale est envoyée sous ce code */
function attach(c){ return sha(c).then(function(h){ code=c; hash=h; ls(CK,c); last=""; setUI();
  if(!navigator.onLine) return "off";
  return rpc("miqka_get",{h:h}).then(function(g){ var b=bundle(); if(g && g.save && ahead(g.progress, prog(b))){ adopt(g.save); return "adopt"; } return push(false).then(function(){ return "push"; }); })
    .catch(function(){ return "err"; }); }); }
/* fenêtre du code (au premier lancement, ou « Changer de code » dans les Réglages) */
function ask(cancelable){
  var d=document.createElement("div"); d.className="cc-ov"; d.setAttribute("role","dialog"); d.setAttribute("aria-modal","true"); d.setAttribute("aria-labelledby","ccT");
  d.innerHTML='<form class="cc-card" novalidate><b id="ccT">Ton code de sauvegarde</b><p class="cc-sub">Choisis un code (4 caractères min., ex. MIQKA). Le même code sur un autre appareil y ramène ta partie. Garde-le pour toi : quiconque a le code a la partie.</p>'+
    '<input id="ccIn" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="32" placeholder="MIQKA" aria-label="Code de sauvegarde"><p class="cc-err" id="ccErr" aria-live="polite"></p>'+
    '<div class="cc-row">'+(cancelable?'<button type="button" class="pill" id="ccNo">Annuler</button>':'')+'<button type="submit" class="pill primary" id="ccOk">Continuer</button></div></form>';
  document.body.appendChild(d); var i=d.querySelector("#ccIn"), er=d.querySelector("#ccErr"); if(code) i.value=code; setTimeout(function(){ try{ if(!window.matchMedia||!matchMedia("(pointer:coarse)").matches) i.focus(); }catch(e){} },50);
  if(cancelable) d.querySelector("#ccNo").onclick=function(){ d.remove(); };
  d.querySelector("form").onsubmit=function(e){ e.preventDefault(); var c=norm(i.value); if(c.length<4){ er.textContent="4 caractères minimum."; return; }
    if(!(window.crypto&&crypto.subtle)){ er.textContent="Navigateur trop ancien pour la sauvegarde par code."; return; }
    var ok=d.querySelector("#ccOk"); ok.disabled=true; er.textContent="Connexion…";
    if(code!==c) last="";
    attach(c).then(function(r){ if(r==="adopt") return; d.remove(); toast(r==="err"||r==="off"?"Code enregistré · synchro dès que le réseau revient":"Partie liée au code "+c); }); };
}
function toast(t){ var b=document.createElement("div"); b.className="cc-toast"; b.textContent=t; document.body.appendChild(b); setTimeout(function(){ b.remove(); },2600); }
function setUI(){ var e=document.getElementById("ccCur"); if(e) e.textContent=code?code:"aucun"; }
/* Réglages : ligne « Code de sauvegarde » + « Changer de code » */
(function(){ var sb=document.querySelector(".sheet-body.settings"), rs=document.getElementById("btnReset"); if(!sb||!rs) return; var r=document.createElement("div"); r.className="row cn-row";
  r.innerHTML='<span>Code de sauvegarde <em id="ccCur"></em></span><button class="pill" id="ccChg" type="button">Changer de code</button>'; sb.insertBefore(r,rs);
  document.getElementById("ccChg").onclick=function(){ ask(true); }; })();
window.CLOUD={ force:function(){ ls(FK,"1"); sched(); }, push:push, code:function(){ return code; } };
if(OFF) return;
code=ls(CK)? norm(ls(CK)) : null; setUI();
var m=ls("miqkacode.msg"); if(m){ ls("miqkacode.msg",null); setTimeout(function(){ toast(m); },600); }
if(code) attach(code); else ask(false);
setInterval(function(){ if(hash && JSON.stringify(bundle())!==last) sched(); },1000);
addEventListener("pagehide",function(){ push(true); });
document.addEventListener("visibilitychange",function(){ if(document.visibilityState==="hidden") push(true); });
addEventListener("online",function(){ push(false); });
})();
