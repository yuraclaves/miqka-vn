/* Moteur de visual novel : lit window.STORY (story.js). Il n'y a rien à modifier ici pour écrire l'histoire. */
(function(){
"use strict";
const S = window.STORY || {scenes:{}};
const $ = id => document.getElementById(id);
const app = $("app");
const KEY = "miqka_vn.";
const store = {
  get(k, d){ try{ const v = localStorage.getItem(KEY+k); return v==null ? d : JSON.parse(v); }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(KEY+k, JSON.stringify(v)); }catch(e){} },
  clear(){ try{ Object.keys(localStorage).filter(k=>k.startsWith(KEY)).forEach(k=>localStorage.removeItem(k)); }catch(e){} }
};

/* ---------- Réglages ---------- */
const DEF = {text:6, auto:5, music:70, sfx:60, size:"m", skipUnread:false, vib:true};
let cfg = Object.assign({}, DEF, store.get("settings", {}));
const saveCfg = () => store.set("settings", cfg);
const charDelay = () => [0,70,58,47,38,30,23,17,12,7,0][cfg.text];   // 10 = instantané
const autoDelay = len => (3400 - cfg.auto*260) + len*(42 - cfg.auto*3);

/* ---------- État ---------- */
let st = null;           // {scene, idx, bg, pose, char, chapter, chapTitle, music}
let logArr = [];
let read = new Set(store.get("read", []));
let playing = false, typing = false, waitingChoice = false, busy = false;
let full = "", shown = 0, typeTimer = 0, autoTimer = 0, skipTimer = 0;
let autoOn = false, skipOn = false;
let curBg = null, curSprite = null, bgFlip = false, spFlip = false;
let music = null, musicName = null;

/* ---------- Audio (effets générés, aucun fichier) ---------- */
let actx = null;
function ac(){ if(!actx){ try{ actx = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } if(actx && actx.state==="suspended") actx.resume(); return actx; }
function sfx(kind){
  if(!cfg.sfx) return; const c = ac(); if(!c) return;
  const o = c.createOscillator(), g = c.createGain(), t = c.currentTime, v = cfg.sfx/100*.12;
  o.type = "sine"; o.frequency.setValueAtTime(kind==="choice"?660:kind==="open"?520:880, t);
  if(kind==="choice") o.frequency.exponentialRampToValueAtTime(990, t+.12);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t+.01); g.gain.exponentialRampToValueAtTime(.0001, t+(kind==="choice"?.22:.09));
  o.connect(g).connect(c.destination); o.start(t); o.stop(t+.25);
}
function setMusic(name){
  if(name === undefined) return;
  if(name === musicName) return;
  musicName = name || null;
  if(music){ const m = music; fade(m, 0, 600, ()=>m.pause()); music = null; }
  const src = name && S.music && S.music[name];
  if(!src) return;
  music = new Audio(src); music.loop = true; music.volume = 0;
  music.play().then(()=>fade(music, cfg.music/100, 800)).catch(()=>{});
}
function fade(a, to, ms, done){ const from = a.volume, t0 = performance.now();
  (function f(){ const k = Math.min(1,(performance.now()-t0)/ms); a.volume = from+(to-from)*k; if(k<1) requestAnimationFrame(f); else done&&done(); })(); }
const vibrate = ms => { if(cfg.vib && navigator.vibrate) try{ navigator.vibrate(ms); }catch(e){} };

/* ---------- Affichage scène ---------- */
function bgUrl(name){ return (S.backgrounds && S.backgrounds[name]) || name; }
function showBg(name, instant){
  if(!name || name === curBg) return; curBg = name;
  const a = $(bgFlip?"bgA":"bgB"), b = $(bgFlip?"bgB":"bgA"); bgFlip = !bgFlip;
  a.style.backgroundImage = `url("${bgUrl(name)}")`;
  if(instant){ a.style.transition = b.style.transition = "none"; }
  a.classList.add("on"); b.classList.remove("on");
  if(instant) requestAnimationFrame(()=>{ a.style.transition = b.style.transition = ""; });
}
function poseUrl(ch, pose){ const c = S.characters && S.characters[ch]; return c && c.poses && (c.poses[pose] || Object.values(c.poses)[0]); }
function showSprite(url, effect){
  const a = $(spFlip?"spA":"spB"), b = $(spFlip?"spB":"spA");
  if(!url){ $("spA").classList.remove("on"); $("spB").classList.remove("on"); curSprite = null; return; }
  if(url === curSprite){ if(effect) fx(b, effect); return; }
  curSprite = url; spFlip = !spFlip;
  a.src = url; a.classList.add("on"); b.classList.remove("on");
  if(effect) fx(a, effect);
}
function fx(el, e){ el.classList.remove("fx-bounce","fx-shake","fx-hop"); void el.offsetWidth; el.classList.add("fx-"+e);
  setTimeout(()=>el.classList.remove("fx-"+e), 700); }
function chapHTML(){ const c = st.chapter, t = st.chapTitle; const el = $("chap"); el.textContent = "";
  if(c){ const b = document.createElement("b"); b.textContent = c; el.appendChild(b); }
  if(t){ el.appendChild(document.createTextNode((c?" · ":"") + t)); } }

/* ---------- Déroulement ---------- */
function sceneOf(id){ return S.scenes && S.scenes[id]; }
function lineKey(){ return st.scene+":"+st.idx; }

function enterScene(id, cb){
  const sc = sceneOf(id);
  if(!sc){ toast("Scène introuvable : "+id); return seqEnd ? endSeq(true) : goTitle(true); }
  st.scene = id; st.idx = 0;
  if(sc.background){ st.bg = sc.background; showBg(st.bg); }
  if(sc.music !== undefined){ st.music = sc.music; setMusic(sc.music); }
  const newChap = sc.chapter && (sc.chapter !== st.chapter || sc.title !== st.chapTitle);
  if(sc.chapter !== undefined){ st.chapter = sc.chapter; st.chapTitle = sc.title || ""; chapHTML(); }
  if(newChap && !skipOn) chapterCard(sc.chapter, sc.title, cb); else cb();
}
function chapterCard(k, t, cb){
  busy = true; $("ccK").textContent = k || ""; $("ccT").textContent = t || "";
  const cc = $("chapcard"); cc.classList.add("on");
  let done = false; const fin = ()=>{ if(done) return; done = true; cc.classList.remove("on"); busy = false; setTimeout(cb, 250); };
  setTimeout(fin, 1700); cardSkip = fin;
}
let cardSkip = null;

function showLine(){
  clearTimers();
  const sc = sceneOf(st.scene); if(!sc) return goTitle(true);
  const ln = sc.lines[st.idx];
  if(!ln){ return sc.next ? enterScene(sc.next, showLine) : endGame(); }
  if(ln.goto){ return enterScene(ln.goto, showLine); }
  if(ln.end){ return endGame(); }

  const bgName = ln.background || ln.bg; if(bgName){ st.bg = bgName; showBg(bgName); }
  if(ln.music !== undefined){ st.music = ln.music; setMusic(ln.music); }
  const isChar = ln.speaker && S.characters && S.characters[ln.speaker];
  if(ln.sprite === false || ln.pose === null){ st.char = null; st.pose = null; }
  else if(ln.pose || ln.sprite){ st.char = ln.character || (isChar ? ln.speaker : st.char || Object.keys(S.characters||{})[0]); st.pose = ln.sprite || ln.pose; }
  showSprite(st.pose ? (poseUrl(st.char, st.pose) || st.pose) : null, ln.effect);

  const choices = ln.choices || ln.choice;
  if(choices){
    if(ln.text) setText(ln.speaker, ln.text, true); else { $("next").classList.remove("on"); }
    return showChoices(choices);
  }
  setText(ln.speaker, ln.text || "", false);
  autosave();
}
function speakerName(sp){ if(!sp) return null; const c = S.characters && S.characters[sp]; return c ? c.name : sp; }
function setText(sp, text, noArrow){
  const nm = speakerName(sp); const box = $("box");
  box.classList.toggle("narr", !nm); if(nm) $("name").textContent = nm;
  logArr.push({who:nm, text}); if(logArr.length > 300) logArr.shift();
  full = text; shown = 0; $("next").classList.remove("on");
  const wasRead = read.has(lineKey()); read.add(lineKey()); persistRead();
  const d = charDelay();
  if(skipOn || d === 0){ shown = full.length; render(); return lineDone(noArrow, wasRead); }
  typing = true; render();
  let acc = 0, last = performance.now();
  typeTimer = setInterval(()=>{ const now = performance.now(); acc += now-last; last = now;
    const n = Math.floor(acc/d); if(n>0){ acc -= n*d; shown = Math.min(full.length, shown+n); render(); }
    if(shown >= full.length){ clearInterval(typeTimer); typing = false; lineDone(noArrow, wasRead); } }, 16);
  lineDone.wasRead = wasRead;
}
function render(){ const t = $("txt"); t.textContent = "";
  const v = document.createElement("span"); v.textContent = full.slice(0, shown);
  const g = document.createElement("span"); g.className = "ghost"; g.textContent = full.slice(shown);
  t.append(v, g); }
function completeText(){ clearInterval(typeTimer); typing = false; shown = full.length; render(); lineDone(false, lineDone.wasRead); }
function lineDone(noArrow, wasRead){
  if(!noArrow && !waitingChoice) $("next").classList.add("on");
  if(skipOn && !waitingChoice){
    if(wasRead || cfg.skipUnread) skipTimer = setTimeout(advance, 70);
    else setSkip(false);
  } else if(autoOn && !waitingChoice){ autoTimer = setTimeout(advance, autoDelay(full.length)); }
}
function advance(){
  if(!playing || busy || waitingChoice) return;
  if(typing){ completeText(); return; }
  sfx("tick"); st.idx++; showLine();
}
function showChoices(list){
  waitingChoice = true; setSkip(false); clearTimers();
  const box = $("choices"); box.textContent = "";
  list.forEach((c, i)=>{ const b = document.createElement("button"); b.className = "choice"; b.style.animationDelay = (i*60)+"ms";
    const n = document.createElement("span"); n.textContent = i+1; b.append(n, document.createTextNode(c.text));
    b.addEventListener("click", e=>{ e.stopPropagation(); pick(c, b); }); box.appendChild(b); });
  autosave();
}
function pick(c, el){
  if(!waitingChoice) return; waitingChoice = false;
  el.classList.add("pressed"); vibrate(18); sfx("choice");
  logArr.push({who:null, text:"➜ "+c.text, pick:true});
  if(c.set && typeof c.set === "object"){ st.vars = Object.assign(st.vars||{}, c.set); }
  setTimeout(()=>{ $("choices").textContent = ""; if(c.goto) enterScene(c.goto, showLine); else { st.idx++; showLine(); } }, 260);
}
function clearTimers(){ clearInterval(typeTimer); clearTimeout(autoTimer); clearTimeout(skipTimer); typing = false; }
let seqEnd = null;          // séquence d'embauche en cours : rappel vers le jeu Ville
function endSeq(ok){ const cb = seqEnd; seqEnd = null; clearTimers(); playing = false; setAuto(false); setSkip(false); waitingChoice = false; busy = false;
  closeAll(); $("choices").textContent = ""; showSprite(null); app.classList.remove("seq","ui-hidden"); setMusic(null); if(cb) cb(ok); }
function playScene(id, cb){
  closeAll(); clearTimers(); setAuto(false); setSkip(false); st = freshState(); logArr = []; playing = true; waitingChoice = false; busy = false;
  seqEnd = cb || (()=>{}); $("choices").textContent = ""; $("txt").textContent = ""; $("chap").textContent = ""; curSprite = null; showSprite(null);
  app.classList.add("seq"); app.classList.remove("on-title","ui-hidden");
  enterScene(id, showLine);
}
function endGame(){
  if(seqEnd){ $("next").classList.remove("on"); return endSeq(true); }
  clearTimers(); playing = false; setAuto(false); setSkip(false);
  store.set("saves", Object.assign(store.get("saves", {}), {auto: undefined}));
  toast("Fin de la démo"); setTimeout(()=>goTitle(true), 900);
}
function persistRead(){ clearTimeout(persistRead.t); persistRead.t = setTimeout(()=>store.set("read", [...read].slice(-5000)), 400); }

/* ---------- Auto / Passer ---------- */
function setAuto(on){ autoOn = on; $("btnAuto").classList.toggle("on", on);
  if(on){ setSkip(false); if(!typing && playing && !waitingChoice && !busy) autoTimer = setTimeout(advance, 600); } else clearTimeout(autoTimer); }
function setSkip(on){ skipOn = on; $("btnSkip").classList.toggle("on", on); clearTimeout(skipTimer);
  if(on){ autoOn && setAuto(false); if(waitingChoice){ setSkip(false); return; }
    if(!read.has(lineKey()) && !cfg.skipUnread){ toast("Rien de déjà lu à passer"); skipOn = false; $("btnSkip").classList.remove("on"); return; }
    advance(); } }

/* ---------- Partie / Titre ---------- */
function freshState(){ return {scene:null, idx:0, bg:null, pose:null, char:null, chapter:null, chapTitle:"", music:null, vars:{}}; }
function startGame(){
  closeAll(); st = freshState(); logArr = []; playing = true; waitingChoice = false; busy = false;
  $("choices").textContent = ""; $("txt").textContent = ""; $("chap").textContent = "";
  showSprite(null); app.classList.remove("on-title","ui-hidden");
  enterScene(S.start || Object.keys(S.scenes)[0], showLine);
}
function goTitle(skipConfirm){
  const go = ()=>{ if(seqEnd){ seqEnd = null; app.classList.remove("seq"); } if(window.CITY && CITY.onTitle) CITY.onTitle(); clearTimers(); setAuto(false); setSkip(false); playing = false; waitingChoice = false; busy = false;
    closeAll(); $("choices").textContent = ""; showSprite(null); showBg(S.titleBackground || Object.keys(S.backgrounds||{})[0]);
    setMusic(S.titleMusic || null); app.classList.add("on-title"); app.classList.remove("ui-hidden"); refreshTitle(); };
  if(skipConfirm === true) go(); else confirmBox(seqEnd ? "Retourner à l'écran titre ? La ville est sauvegardée ; cette séquence sera interrompue (embauche annulée)." : "Retourner à l'écran titre ? Ta ville est sauvegardée automatiquement.", go);
}
function savedKeys(){ const sv = store.get("saves", {}); return Object.keys(sv).filter(k=>sv[k]); }
function refreshTitle(){ $("tCont").disabled = !(window.CITY && CITY.hasSave()); }   // « Continuer » : la partie (ville + séquences vues) est sauvegardée en continu   // « Continuer » actif dès qu'une sauvegarde existe

/* ---------- Sauvegardes ---------- */
const SLOTS = 6;
function snapshot(){ return {st: JSON.parse(JSON.stringify(st)), log: logArr.slice(-120), time: Date.now(),
  preview: (full||"").slice(0, 90), text: full||"", who: $("box").classList.contains("narr") ? null : $("name").textContent }; }
function autosave(){ if(!playing || seqEnd) return; clearTimeout(autosave.t);
  autosave.t = setTimeout(()=>{ const sv = store.get("saves", {}); sv.auto = snapshot(); store.set("saves", sv); }, 150); }
function saveTo(slot){ const sv = store.get("saves", {}); sv[slot] = snapshot(); store.set("saves", sv); renderSlots(); toast("Sauvegardé dans l'emplacement "+slot); }
function loadFrom(slot){
  const d = store.get("saves", {})[slot]; if(!d) return;
  closeAll(); clearTimers(); setAuto(false); setSkip(false);
  st = Object.assign(freshState(), d.st); logArr = (d.log||[]).slice();
  const sc0 = sceneOf(st.scene), ln0 = sc0 && sc0.lines[st.idx];
  if(ln0 && (ln0.choices || ln0.choice) && !ln0.text){        // choix sans texte : on remet la dernière réplique dans la boîte
    full = d.text || ""; shown = full.length; render(); $("box").classList.toggle("narr", !d.who); if(d.who) $("name").textContent = d.who;
  } else if(logArr.length) logArr.pop();                        // la ligne sera ré-affichée (et ré-ajoutée à l'historique)
  playing = true; waitingChoice = false; busy = false; $("choices").textContent = "";
  app.classList.remove("on-title","ui-hidden");
  curBg = null; showBg(st.bg, true); musicName = undefined; setMusic(st.music || null);
  chapHTML();
  curSprite = null; showLine();
  toast(slot === "auto" ? "Reprise de la partie" : "Emplacement "+slot+" chargé");
}
let savesMode = "save";
function openSaves(mode){ savesMode = playing ? mode : "load"; renderSlots(); openSheet("shSaves"); }
function renderSlots(){
  $("savesTitle").textContent = savesMode === "save" ? "Sauvegarder" : "Charger";
  [...$("savesSeg").children].forEach(b=>{ b.classList.toggle("on", b.dataset.m === savesMode); b.disabled = !playing && b.dataset.m === "save"; });
  const sv = store.get("saves", {}); const box = $("slots"); box.textContent = "";
  const keys = (savesMode === "load" && sv.auto ? ["auto"] : []).concat(Array.from({length:SLOTS}, (_, i)=>String(i+1)));
  keys.forEach(k=>{
    const d = sv[k]; const b = document.createElement("button"); b.className = "slot"+(d?"":" emptyslot")+(k==="auto"?" auto":"");
    const th = document.createElement("div"); th.className = "th";
    const no = document.createElement("span"); no.className = "no"; no.textContent = k === "auto" ? "Auto" : "N° "+k;
    if(d){ th.style.backgroundImage = `url("${bgUrl(d.st.bg)}")`;
      const u = d.st.pose && (poseUrl(d.st.char, d.st.pose) || d.st.pose); if(u){ const im = document.createElement("img"); im.src = u; im.alt = ""; th.appendChild(im); } }
    th.appendChild(no); b.appendChild(th);
    const m = document.createElement("div"); m.className = "meta";
    if(d){ const t = document.createElement("b"); t.textContent = [d.st.chapter, d.st.chapTitle].filter(Boolean).join(" · ") || d.st.scene;
      const s = document.createElement("small"); s.textContent = fmtDate(d.time);
      const p = document.createElement("p"); p.textContent = (d.who ? d.who+" : " : "") + (d.preview||"");
      m.append(t, s, p); }
    else { const s = document.createElement("small"); s.textContent = savesMode === "save" ? "Emplacement vide : toucher pour sauvegarder" : "Vide"; m.appendChild(s); }
    b.appendChild(m);
    if(savesMode === "load" && !d) b.disabled = true;
    b.addEventListener("click", ()=>{ sfx("open");
      if(savesMode === "save"){ d ? confirmBox("Écraser la sauvegarde n° "+k+" ?", ()=>saveTo(k)) : saveTo(k); }
      else if(d){ playing ? confirmBox("Charger cette sauvegarde ? La progression actuelle sera remplacée.", ()=>loadFrom(k)) : loadFrom(k); } });
    box.appendChild(b);
  });
}
function fmtDate(t){ const d = new Date(t), p = n=>String(n).padStart(2,"0");
  return `${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()} · ${p(d.getHours())}:${p(d.getMinutes())}`; }

/* ---------- Historique ---------- */
function openLog(){
  const b = $("logBody"); b.textContent = "";
  if(!logArr.length){ const e = document.createElement("div"); e.className = "empty"; e.textContent = "Rien pour l'instant."; b.appendChild(e); }
  logArr.forEach(l=>{ const it = document.createElement("div"); it.className = "log-item"+(l.pick?" pick":l.who?"":" narr");
    if(l.who){ const n = document.createElement("b"); n.textContent = l.who; it.appendChild(n); }
    const p = document.createElement("p"); p.textContent = l.text; it.appendChild(p); b.appendChild(it); });
  openSheet("shLog"); requestAnimationFrame(()=>{ b.scrollTop = b.scrollHeight; });
}

/* ---------- Feuilles / modale / toast ---------- */
let sheetStack = [];
function openSheet(id){ pauseFlow(); const el = $(id);
  if(!sheetStack.includes(id)) sheetStack.push(id);
  el.style.zIndex = 50 + sheetStack.length; el.classList.add("open"); sfx("open"); }
function closeSheet(id){ $(id).classList.remove("open"); sheetStack = sheetStack.filter(x=>x!==id); if(!sheetStack.length) resumeFlow(); }
function closeAll(){ sheetStack.slice().forEach(closeSheet); }
let pausedAuto = false;
function pauseFlow(){ if(!sheetStack.length){ pausedAuto = autoOn; clearTimeout(autoTimer); if(skipOn) setSkip(false); } }
function resumeFlow(){ if(pausedAuto && playing){ pausedAuto = false; setAuto(true); } }
document.querySelectorAll(".sheet-wrap").forEach(w=>{
  w.querySelector(".backdrop").addEventListener("click", ()=>closeSheet(w.id));
  w.querySelector(".close").addEventListener("click", ()=>closeSheet(w.id));
  // glisser la poignée/l'en-tête vers le bas pour fermer
  const sh = w.querySelector(".sheet"); let y0 = null;
  sh.addEventListener("pointerdown", e=>{ if(e.target.closest(".sheet-body")) return; y0 = e.clientY; });
  sh.addEventListener("pointerup", e=>{ if(y0 !== null && e.clientY - y0 > 60) closeSheet(w.id); y0 = null; });
});
let confirmCb = null;
function confirmBox(msg, cb){ $("mText").textContent = msg; confirmCb = cb; $("modal").classList.add("on"); }
$("mYes").onclick = ()=>{ $("modal").classList.remove("on"); const c = confirmCb; confirmCb = null; c && c(); };
$("mNo").onclick = ()=>{ $("modal").classList.remove("on"); confirmCb = null; };
function toast(m){ const t = $("toast"); t.textContent = m; t.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(()=>t.classList.remove("on"), 1800); }

/* ---------- Réglages UI ---------- */
function setRange(id, val, label, fmt){ const r = $(id); r.value = val; const upd = ()=>{ const p = (r.value-r.min)/(r.max-r.min)*100; r.style.setProperty("--p", p+"%"); $(label).textContent = fmt(+r.value); }; upd(); return upd; }
function initSettings(){
  const bind = (id, key, label, fmt, after)=>{ const upd = setRange(id, cfg[key], label, fmt);
    $(id).oninput = ()=>{ cfg[key] = +$(id).value; upd(); saveCfg(); after && after(); }; };
  bind("sText", "text", "vText", v=> v===10 ? "Instantané" : v+"/10", previewType);
  bind("sAuto", "auto", "vAuto", v=> v+"/10");
  bind("sMus", "music", "vMus", v=> v+" %", ()=>{ if(music) music.volume = cfg.music/100; });
  bind("sSfx", "sfx", "vSfx", v=> v+" %", ()=>sfx("tick"));
  [...$("segSize").children].forEach(b=>{ b.classList.toggle("on", b.dataset.v === cfg.size);
    b.onclick = ()=>{ cfg.size = b.dataset.v; saveCfg(); applySize(); [...$("segSize").children].forEach(x=>x.classList.toggle("on", x===b)); }; });
  const tg = (id, key)=>{ $(id).classList.toggle("on", !!cfg[key]); $(id).setAttribute("aria-checked", !!cfg[key]);
    $(id).onclick = ()=>{ cfg[key] = !cfg[key]; saveCfg(); $(id).classList.toggle("on", cfg[key]); $(id).setAttribute("aria-checked", cfg[key]); if(key==="vib") vibrate(15); }; };
  tg("tgUnread", "skipUnread"); tg("tgVib", "vib");
  applySize();
}
function applySize(){ app.classList.remove("size-s","size-m","size-l"); app.classList.add("size-"+cfg.size); }
let pvT = 0;
function previewType(){ clearInterval(pvT); const el = $("preview"), txt = "Aperçu : voici la taille et la vitesse du texte."; const d = charDelay();
  if(!d){ el.textContent = txt; return; } let i = 0; pvT = setInterval(()=>{ i++; el.textContent = txt.slice(0,i); if(i>=txt.length) clearInterval(pvT); }, d); }
$("btnReset").onclick = ()=> confirmBox("Effacer toutes les sauvegardes, le texte lu et les réglages ?", ()=>{
  store.clear(); if(window.CITY) CITY.reset(); cfg = Object.assign({}, DEF); read = new Set(); initSettings(); refreshTitle(); toast("Données réinitialisées"); });

/* ---------- Commandes ---------- */
$("btnAuto").onclick = e=>{ e.stopPropagation(); setAuto(!autoOn); };
$("btnSkip").onclick = e=>{ e.stopPropagation(); setSkip(!skipOn); };
$("btnLog").onclick = e=>{ e.stopPropagation(); openLog(); };
$("btnSave").onclick = e=>{ e.stopPropagation(); openSaves("save"); };
$("btnMenu").onclick = e=>{ e.stopPropagation(); openSheet("shMenu"); };
$("btnEye").onclick = e=>{ e.stopPropagation(); hideUI(true); };
[...$("savesSeg").children].forEach(b=> b.onclick = ()=>{ savesMode = b.dataset.m; renderSlots(); });
$("shMenu").querySelectorAll("[data-act]").forEach(b=> b.onclick = ()=>{
  const a = b.dataset.act;
  if(a==="resume") closeSheet("shMenu");
  if(a==="save") openSaves("save");
  if(a==="load") openSaves("load");
  if(a==="settings"){ previewType(); openSheet("shSet"); }
  if(a==="title") goTitle();
  if(a==="leave" && seqEnd) endSeq(false);
});
$("tNew").onclick = ()=>{ ac(); if(!window.CITY) return startGame();
  CITY.hasSave() ? confirmBox("Commencer une nouvelle partie ? Ta ville actuelle (Kwak Coin, employés, séquences vues) sera remise à zéro.", ()=>CITY.newGame()) : CITY.newGame(); };
// « Continuer » : une seule sauvegarde → on la charge directement ; plusieurs → liste des emplacements en mode chargement
$("tCont").onclick = ()=>{ ac(); if(window.CITY && CITY.hasSave()) CITY.resume(); };
$("tSet").onclick = ()=>{ ac(); previewType(); openSheet("shSet"); };

function hideUI(on){ app.classList.toggle("ui-hidden", on); if(on){ clearTimeout(autoTimer); } else if(autoOn && !typing && !waitingChoice) autoTimer = setTimeout(advance, 800); }

/* ---------- Gestes : toucher = avancer, glisser haut = historique, glisser bas / appui long = masquer ---------- */
let g = null, lpTimer = 0;
function gameSurface(t){ return playing && !app.classList.contains("mode-city") && !sheetStack.length && !$("modal").classList.contains("on") && !t.closest("button,.sheet-wrap,.title,.modal,.city,.modebar"); }
app.addEventListener("pointerdown", e=>{
  if(!gameSurface(e.target)) { g = null; return; }
  g = {x:e.clientX, y:e.clientY, t:performance.now(), long:false};
  clearTimeout(lpTimer); lpTimer = setTimeout(()=>{ if(g){ g.long = true; hideUI(!app.classList.contains("ui-hidden")); vibrate(10); } }, 550);
});
app.addEventListener("pointermove", e=>{ if(g && Math.hypot(e.clientX-g.x, e.clientY-g.y) > 12) clearTimeout(lpTimer); });
app.addEventListener("pointercancel", ()=>{ clearTimeout(lpTimer); g = null; });
app.addEventListener("pointerup", e=>{
  clearTimeout(lpTimer); if(!g) return; const d = g; g = null; if(d.long) return;
  const dx = e.clientX-d.x, dy = e.clientY-d.y;
  if(Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx)){
    if(app.classList.contains("ui-hidden")){ hideUI(false); return; }
    if(dy < 0) openLog(); else hideUI(true); return; }
  if(Math.abs(dx) > 12 || Math.abs(dy) > 12) return;
  if(app.classList.contains("ui-hidden")){ hideUI(false); return; }
  if(busy && cardSkip){ cardSkip(); return; }
  if(skipOn){ setSkip(false); return; }
  advance();
});
document.addEventListener("keydown", e=>{
  if($("modal").classList.contains("on")){ if(e.key==="Escape") $("mNo").click(); if(e.key==="Enter") $("mYes").click(); return; }
  if(sheetStack.length){ if(e.key==="Escape") closeSheet(sheetStack[sheetStack.length-1]); return; }
  if(!playing || app.classList.contains("mode-city")) return;
  if(e.key===" "||e.key==="Enter"){ e.preventDefault(); if(busy&&cardSkip) cardSkip(); else advance(); }
  else if(/^[1-9]$/.test(e.key) && waitingChoice){ const b = $("choices").children[+e.key-1]; b && b.click(); }
  else if(e.key==="Escape") openSheet("shMenu");
  else if(e.key==="h") hideUI(!app.classList.contains("ui-hidden"));
});
// Empêcher zoom / tirer-pour-rafraîchir / défilement de la page
document.addEventListener("touchmove", e=>{ if(!e.target.closest(".sheet-body,.cscroll") && !e.target.closest("input[type=range]")) e.preventDefault(); }, {passive:false});
["gesturestart","gesturechange","dblclick"].forEach(ev=>document.addEventListener(ev, e=>e.preventDefault(), {passive:false}));
app.addEventListener("contextmenu", e=>e.preventDefault());
document.addEventListener("visibilitychange", ()=>{ if(document.hidden){ autosave(); music && music.pause(); } else if(music) music.play().catch(()=>{}); });

/* ---------- Démarrage ---------- */
document.title = [S.title || "Miqka City", S.subtitle].filter(Boolean).join(" – ");
$("gameTitle").textContent = S.title || "Miqka City";
$("gameSub").textContent = S.subtitle || "";
// précharger les images
Object.values(S.backgrounds||{}).concat(...Object.values(S.characters||{}).map(c=>Object.values(c.poses||{}))).forEach(u=>{ const i = new Image(); i.src = u; });
initSettings(); goTitle(true);
if("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register("sw.js").catch(()=>{});
window.VN = {advance, state:()=>st, startGame, loadFrom, saveTo, goTitle, refreshTitle, playScene, confirm:confirmBox, toast,
  inScene:()=>!!seqEnd, abortScene:()=>{ if(seqEnd) endSeq(false); }};   // pratique pour déboguer
})();
