/* Miqka City — mode création.
   Réglages → Créer des histoires. À l'enregistrement, l'histoire est en ligne
   pour tous les joueurs (onglet Histoire). Le téléphone n'est pas modifié. */
(function(){
"use strict";
var API="https://ruuorgyqgtdgfpthanuq.supabase.co/rest/v1/rpc/";
var PK="sb_publishable_gS5NYQ6xyp-QsK5a1M3mZw_phtomiT0";
var SLOT="miqka-builder-slot-v1-do-not-use";
var PASS="f15e08f9c8a99f30395b505e2241415df5bf8329d3069eff870e82f314975739";
var LS="mqbuilder.v1";
var POSES=[["excited","Contente"],["idea","Une idée"],["pointing","Elle montre"],["shy","Timide"],["sweet","Douce"]];
var BG_LABEL={toit:"Toit",rue:"Rue, la nuit",cafe:"Café",prison:"Prison",ville:"La ville",parking:"Parking",conseil:"Salle du conseil",grandrue:"Grande rue",montagne:"Montagne",donuts:"Boutique de donuts",centrale:"Centrale",bar:"Bar",salon:"Salon",bureau:"Bureau",casino:"Casino",theatre:"Théâtre",port:"Port",marche:"Marché",plage:"Plage",trone:"Trône",stade:"Stade",jungle:"Jungle",ruines:"Ruines",arcade:"Salle d'arcade",arene:"Arène",feux:"Feux d'artifice",strip:"Grande avenue",vestiaire:"Vestiaire"};
var DOC={rev:0,dirty:false,stories:[],images:{},sent:{}};
var view="lock", cur=null, step=0, sub=0, busy=false, root=null, ev=null;
var LOOK={
  miqka:{th:"pixel",anim:"twinkle"}, bigjim:{th:"dome",anim:"sway"}, estinien:{th:"drg",anim:"float"},
  homer:{th:"donut",anim:"bounce"}, chiaki:{th:"pixel",anim:"steps"}, rin:{th:"pitch",anim:"kick"},
  topaz:{th:"ipc",anim:"twinkle"}, bakool:{th:"tural",anim:"stomp"}, zenos:{th:"garlean",anim:"pulse"},
  aventurine:{th:"casino",anim:"chip"}, fandaniel:{th:"ember",anim:"flicker"}, sinbad:{th:"sea",anim:"wave"},
  hancock:{th:"casino",anim:"chip"}, eden:{th:"ipc",anim:"float"}, tropi:{th:"sea",anim:"wave"}
};
var POSE_LABEL={excited:"Contente",idea:"Une idée",pointing:"Elle montre",shy:"Timide",sweet:"Douce",neutre:"Normale",buste:"Portrait",garde:"En garde",calme:"Calme",joie:"Joie",pense:"Elle réfléchit",dodo:"Endormie",serieuse:"Sérieuse",serieuse:"Sérieuse"};
var SAY={miqka:"hop",bigjim:"nod",estinien:"lean",homer:"bounce",chiaki:"squish",rin:"jump",topaz:"hop",bakool:"shake",zenos:"shake",aventurine:"nod",fandaniel:"shake",sinbad:"lean",hancock:"nod",eden:"bounce",tropi:"nod"};
var FALLBACK=[{th:"dome",anim:"sway"},{th:"drg",anim:"float"},{th:"donut",anim:"bounce"},{th:"sea",anim:"wave"},{th:"casino",anim:"chip"},{th:"ember",anim:"flicker"}];

function el(tag, cls){ var n=document.createElement(tag); if(cls) n.className=cls; return n; }
function uid(){ return Math.random().toString(36).slice(2,8); }
function hex(buf){ return Array.prototype.map.call(new Uint8Array(buf), function(x){ return ("0"+x.toString(16)).slice(-2); }).join(""); }
function sha(s){ return crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)).then(hex); }
function rpc(fn, body){
  return fetch(API+fn,{method:"POST",headers:{"apikey":PK,"Authorization":"Bearer "+PK,"Content-Type":"application/json"},body:JSON.stringify(body)}).then(function(r){
    if(!r.ok) throw new Error("net");
    return r.json();
  });
}
function slotHash(extra){ return sha("miqka-city:"+SLOT+(extra||"")); }
function saveLocal(){
  try{ localStorage.setItem(LS, JSON.stringify(DOC)); }catch(e){}
}
function loadLocal(){
  try{ var v=JSON.parse(localStorage.getItem(LS)||"null"); if(v&&v.stories) DOC=v; }catch(e){}
  DOC.images=DOC.images||{}; DOC.sent=DOC.sent||{}; DOC.stories=DOC.stories||[];
}
function storyBy(id){ for(var i=0;i<DOC.stories.length;i++) if(DOC.stories[i].id===id) return DOC.stories[i]; return null; }
function touch(){ DOC.dirty=true; saveLocal(); }

function shrink(file, edge){
  return new Promise(function(res, rej){
    var img=new Image(), url=URL.createObjectURL(file);
    img.onload=function(){
      URL.revokeObjectURL(url);
      var w=img.naturalWidth||1, h=img.naturalHeight||1, s=Math.min(1, edge/Math.max(w,h));
      var c=document.createElement("canvas"); c.width=Math.max(1,Math.round(w*s)); c.height=Math.max(1,Math.round(h*s));
      c.getContext("2d").drawImage(img,0,0,c.width,c.height);
      var q=0.72, data=c.toDataURL("image/jpeg", q), guard=0;
      while(data.length>145000 && guard<6){
        guard++;
        if(c.width>420){ var c2=document.createElement("canvas"); c2.width=Math.round(c.width*0.8); c2.height=Math.round(c.height*0.8); c2.getContext("2d").drawImage(c,0,0,c2.width,c2.height); c=c2; }
        q=Math.max(0.45, q-0.08);
        data=c.toDataURL("image/jpeg", q);
      }
      if(data.length>170000) rej(new Error("big")); else res(data);
    };
    img.onerror=function(){ URL.revokeObjectURL(url); rej(new Error("img")); };
    img.src=url;
  });
}
function putImg(id, data){
  return slotHash("-img-"+id).then(function(h){
    return rpc("miqka_put",{h:h,s:{miqka_builder_img:data},p:Math.floor(Date.now()/1000),force:true});
  });
}
function getImg(id){
  return slotHash("-img-"+id).then(function(h){ return rpc("miqka_get",{h:h}); }).then(function(r){
    return (r&&r.save&&r.save.miqka_builder_img)||"";
  });
}
function storyText(st){
  return (st.lines||[]).some(function(ln){
    if(ln.kind==="choice") return (ln.options||[]).some(function(o){ return (o.text||"").trim(); });
    return !!(ln.text||"").trim();
  });
}
function isBlank(st){ return !(st.title||"").trim() && !storyText(st); }
function isPublic(st){ return !!(st&&st.pub&&(st.title||"").trim()&&storyText(st)); }
function dropBlanks(){
  var n=(DOC.stories||[]).length;
  DOC.stories=(DOC.stories||[]).filter(function(st){ return !isBlank(st); });
  if(DOC.stories.length!==n){ if(!DOC.stories.length) DOC.dirty=false; saveLocal(); }
}
function putDoc(){
  var ids=[], seen={};
  function addRef(s){ if(String(s||"").indexOf("img:")===0){ var id=s.slice(4); if(id&&!seen[id]){ seen[id]=1; ids.push(id); } } }
  var list=(DOC.stories||[]).filter(isPublic);
  list.forEach(function(st){
    addRef(st.bg); addRef(st.banner);
    (st.lines||[]).forEach(function(ln){ if(ln.img) addRef("img:"+ln.img); addRef(ln.bg); });
  });
  var cat={v:1,rev:Date.now(),stories:list,imageIds:ids};
  return slotHash("").then(function(h){
    return rpc("miqka_put",{h:h,s:{miqka_builder_doc:JSON.stringify(cat)},p:Math.floor(Date.now()/1000),force:true});
  }).then(function(){ DOC.rev=cat.rev; DOC.dirty=false; ids.forEach(function(id){ DOC.sent[id]=1; }); saveLocal(); });
}
function loadRemote(){
  return slotHash("").then(function(h){ return rpc("miqka_get",{h:h}); }).then(function(g){
    var cat=null;
    try{ cat=JSON.parse(g&&g.save&&g.save.miqka_builder_doc); }catch(e){ cat=null; }
    if(!cat||!cat.stories) return;
    if(DOC.dirty){ applyAll(); return; }
    var prev=DOC.images||{};
    return Promise.all((cat.imageIds||[]).map(function(id){
      if(prev[id]) return [id, prev[id]];
      return getImg(id).then(function(d){ return [id, d]; }).catch(function(){ return [id, ""]; });
    })).then(function(pairs){
      var images={}, sent={};
      pairs.forEach(function(p){ if(p[1]){ images[p[0]]=p[1]; sent[p[0]]=1; } });
      (cat.stories||[]).forEach(function(st){ st.pub=true; });
      DOC={rev:cat.rev||0,dirty:false,stories:cat.stories,images:images,sent:sent};
      saveLocal(); applyAll();
      var city=document.getElementById("city"), box=document.getElementById("journal");
      if(city&&city.dataset.view==="journal"&&box&&!box.querySelector("[data-bstory]")) journal(box);
    });
  }).catch(function(){});
}

function resolveBg(bg){
  if(!bg) return "";
  if(String(bg).indexOf("img:")===0) return DOC.images[bg.slice(4)]||"";
  return bg;
}
function applyAll(){
  var ST=window.STORY; if(!ST||!ST.scenes) return;
  Object.keys(ST.scenes).forEach(function(k){ if(k.indexOf("b_")===0) delete ST.scenes[k]; });
  ST.scenes.b__fin={lines:[{end:true}]};
  (DOC.stories||[]).filter(isPublic).forEach(function(st){
    var lines=[], sceneBg="";
    (st.lines||[]).forEach(function(ln){
      var bg=resolveBg(ln.bg||st.bg||"");
      if(ln.kind==="choice"){
        var ch=(ln.options||[]).filter(function(o){ return (o.text||"").trim(); }).map(function(o){
          var c={text:o.text.trim()};
          if(o.next==="end") c.goto="b__fin";
          else if(o.next&&o.next!=="next") c.goto="b_"+o.next;
          return c;
        });
        if(!ch.length) return;
        var q={text:(ln.text||"Que fais-tu ?").trim()||"Que fais-tu ?", choices:ch};
        if(bg) q.background=bg;
        lines.push(q); return;
      }
      var text=(ln.text||"").trim(); if(!text) return;
      var o={text:text};
      if(bg) o.background=bg;
      if(!sceneBg && bg) sceneBg=bg;
      if(ln.who && ln.who!=="narr" && ln.who!=="other" && ST.characters && ST.characters[ln.who]){
        o.speaker=ln.who;
        o.effect=SAY[ln.who]||"nod";
        if(ln.img&&DOC.images[ln.img]){
          var pose="bimg_"+ln.img;
          ST.characters[ln.who].poses=ST.characters[ln.who].poses||{};
          ST.characters[ln.who].poses[pose]=DOC.images[ln.img];
          o.pose=pose;
        } else if(ln.pose) o.pose=ln.pose;
      } else if(ln.who==="other"){
        var id="bp_"+(ln.charId||"x");
        var name=(ln.name||"Quelqu'un").trim()||"Quelqu'un";
        ST.characters[id]=ST.characters[id]||{name:name,poses:{}};
        ST.characters[id].name=name;
        if(ln.img&&DOC.images[ln.img]){ ST.characters[id].poses.photo=DOC.images[ln.img]; o.pose="photo"; }
        o.speaker=id;
        o.effect="nod";
      }
      lines.push(o);
    });
    if(!lines.length) lines.push({text:"…"});
    lines.push({end:true});
    var top=resolveBg(st.bg)||sceneBg||"toit";
    ST.scenes["b_"+st.id]={duo:true, chapter:"Événement", title:st.title||"Sans titre", background:top, lines:lines};
  });
  showNews();
}
var NEWSK="mqnews.v1", newsEl=null;
function seenNews(){
  try{ var a=JSON.parse(localStorage.getItem(NEWSK)||"[]"); return Array.isArray(a)?a:[]; }catch(e){ return []; }
}
function markNews(id){
  if(!id) return;
  var a=seenNews();
  if(a.indexOf(id)>=0) return;
  a.push(id);
  if(a.length>60) a=a.slice(-60);
  try{ localStorage.setItem(NEWSK, JSON.stringify(a)); }catch(e){}
}
function freshNews(){
  var seen={};
  seenNews().forEach(function(id){ seen[id]=1; });
  return (DOC.stories||[]).filter(isPublic).filter(function(st){ return st.id && !seen[st.id]; });
}
function inTuto(){
  try{ return !!(window.CITY && CITY.state && CITY.state().tuto); }catch(e){ return false; }
}
function showNews(){
  var pane=document.querySelector('.c-pane[data-p="town"]');
  if(!pane) return;
  var list=freshNews();
  if(!list.length || inTuto()){ if(newsEl) newsEl.hidden=true; return; }
  var st=list[list.length-1];
  if(!newsEl){
    newsEl=el("button","town-news");
    newsEl.type="button";
    newsEl.innerHTML='<i class="hk-shine"></i><span class="tn-kicker"></span><b class="tn-title"></b><small class="tn-go"></small><span class="tn-x" role="button" aria-label="Fermer">×</span>';
    newsEl.onclick=function(e){
      var id=newsEl.getAttribute("data-id");
      if(e.target.closest && e.target.closest(".tn-x")){ e.preventDefault(); markNews(id); showNews(); return; }
      if(id) play(id);
    };
    pane.appendChild(newsEl);
  }
  var same=newsEl.getAttribute("data-id")===st.id && !newsEl.hidden;
  newsEl.hidden=false;
  newsEl.setAttribute("data-id", st.id);
  newsEl.setAttribute("aria-label", "Nouvelle histoire : "+(st.title||"")+". Toucher pour la jouer.");
  newsEl.querySelector(".tn-kicker").textContent=list.length>1?"Nouvelles histoires":"Nouvelle histoire";
  newsEl.querySelector(".tn-title").textContent=st.title||"";
  newsEl.querySelector(".tn-go").textContent=list.length>1?"Touche pour jouer · encore "+(list.length-1)+" après":"Touche pour la jouer";
  if(!same){ newsEl.classList.remove("tn-pop"); void newsEl.offsetWidth; newsEl.classList.add("tn-pop"); }
}
function play(id){
  applyAll();
  if(!window.VN||!window.STORY||!STORY.scenes["b_"+id]) return;
  markNews(id);
  showNews();
  var app=document.getElementById("app");
  var backCity=app.classList.contains("mode-city");
  closeUI();
  if(ev) ev.hidden=true;
  app.classList.remove("mode-city","on-title");
  VN.playScene("b_"+id, function(){
    if(backCity) app.classList.add("mode-city");
    else VN.goTitle(true);
  });
}
function journal(box){
  var list=(DOC.stories||[]).filter(isPublic);
  if(!list.length) return;
  var head=el("p","jr-intro"); head.textContent="Histoires ajoutées"; box.appendChild(head);
  list.forEach(function(st){
    var b=el("button","jr"); b.type="button"; b.setAttribute("data-bstory","1");
    var t=el("span","jr-t"), nm=el("b"); nm.textContent=st.title||"Sans titre";
    var sm=el("small"); sm.textContent="Histoire ajoutée · tout le monde peut la jouer";
    t.appendChild(nm); t.appendChild(sm);
    var go=el("span","jr-go"); go.textContent="Jouer ▶";
    b.appendChild(t); b.appendChild(go);
    b.onclick=function(){ play(st.id); };
    box.appendChild(b);
  });
}

function bgOptions(){
  var ST=window.STORY, keys=ST&&ST.backgrounds?Object.keys(ST.backgrounds):["toit","rue","cafe"];
  var known=Object.keys(BG_LABEL).filter(function(k){ return keys.indexOf(k)>=0; });
  var rest=keys.filter(function(k){ return known.indexOf(k)<0; });
  return known.concat(rest);
}
function bgName(k){ return BG_LABEL[k]||k.replace(/_/g," "); }

function shell(){
  root=el("div","bd"); root.hidden=true;
  var card=el("div","bd-card");
  var top=el("div","bd-top");
  var back=el("button","bd-back"); back.id="bdBack"; back.type="button"; back.textContent="Retour"; back.hidden=true;
  var h=el("h2"); h.id="bdTitle"; h.textContent="Créer";
  var x=el("button","bd-x"); x.type="button"; x.textContent="Fermer";
  top.appendChild(back); top.appendChild(h); top.appendChild(x);
  var body=el("div","bd-body cscroll"); body.id="bdBody";
  card.appendChild(top); card.appendChild(body); root.appendChild(card);
  document.body.appendChild(root);
  x.onclick=closeUI;
  back.onclick=function(){ view="home"; cur=null; render(); };
}
function closeUI(){ if(root) root.hidden=true; document.querySelectorAll(".sheet-wrap.open").forEach(function(s){ s.classList.remove("open"); }); }
function openUI(){ root.hidden=false; render(); }
function render(){
  var body=document.getElementById("bdBody"), back=document.getElementById("bdBack"), title=document.getElementById("bdTitle");
  body.textContent="";
  back.hidden=view==="lock"||view==="home";
  title.textContent=view==="scene"?("Scène "+(step+1)):view==="finish"?"Terminer":"Créer";
  back.onclick=function(){
    if(view==="finish"){ view="scene"; sub=1; render(); return; }
    if(view==="scene" && sub>0){ sub=0; render(); return; }
    if(view==="scene"&&step>0){ step--; sub=1; render(); return; }
    leaveStory();
  };
  if(view==="lock") renderLock(body);
  else if(view==="home") renderHome(body);
  else if(view==="finish") renderFinish(body);
  else renderScene(body);
}
function leaveStory(){
  var st=storyBy(cur);
  if(st && !(st.title||"").trim() && !(st.lines||[]).some(lineFilled)){
    DOC.stories=DOC.stories.filter(function(s){ return s.id!==st.id; });
    saveLocal();
  }
  view="home"; cur=null; render();
}
function blankLine(prev){
  return {kind:"line", who:(prev&&prev.who)||"", pose:(prev&&prev.pose)||"", text:"", bg:(prev&&prev.bg)||"ville", img:null, name:(prev&&prev.who==="other"&&prev.name)||"", charId:""};
}
function lineFilled(ln){
  if(!ln) return false;
  if(ln.kind==="choice") return (ln.options||[]).some(function(o){ return (o.text||"").trim(); });
  return !!(ln.text||"").trim();
}
function castList(){
  var ST=window.STORY, out=[], seen={};
  if(!ST||!ST.characters) return out;
  ["miqka","bigjim","estinien","homer","hancock","chiaki","rin","topaz","bakool","zenos","aventurine","fandaniel","sinbad","eden","tropi"].concat(Object.keys(ST.characters)).forEach(function(id){
    if(seen[id]||id.indexOf("bp_")===0) return;
    var c=ST.characters[id]; if(!c||!c.name||!c.poses) return;
    seen[id]=1;
    var keys=Object.keys(c.poses).filter(function(k){ return k.indexOf("bimg_")!==0; });
    if(keys.length>1) keys=keys.filter(function(k){ return k!=="buste"; });
    out.push({id:id, name:c.name, poses:keys.map(function(k){ return [k, POSE_LABEL[k]||k]; }), src:function(pose){
      var v=c.poses[pose]||c.poses[keys[0]]; if(!v) return ""; return typeof v==="string"?v:v.src;
    }});
  });
  return out;
}
function castBy(id){ var all=castList(); for(var i=0;i<all.length;i++) if(all[i].id===id) return all[i]; return null; }
function renderHome(body){
  var p=el("p","bd-lead"); p.textContent="Une scène à la fois. Quand tu mets l'histoire en ligne, elle devient un bandeau au-dessus de Big Jim, dans la ville.";
  var add=el("button","pill primary bd-go"); add.type="button"; add.textContent="Nouvelle histoire";
  add.onclick=function(){
    var st={id:uid(), title:"", bg:"ville", banner:"", lines:[blankLine(null)]};
    DOC.stories.unshift(st); touch(); cur=st.id; step=0; sub=0; view="scene"; render();
  };
  body.appendChild(p); body.appendChild(add);
  if(!DOC.stories.length){ var n=el("p","bd-note"); n.textContent="Tu n'as pas encore d'histoire."; body.appendChild(n); return; }
  DOC.stories.forEach(function(st){
    var card=el("div","bd-story"), b=el("b"); b.textContent=st.title||"Sans titre";
    var sm=el("small"); sm.textContent=(st.lines||[]).length+" scène"+((st.lines||[]).length>1?"s":"");
    var row=el("div","bd-mini");
    var ed=el("button"); ed.type="button"; ed.textContent="Modifier";
    var pl=el("button"); pl.type="button"; pl.textContent="Jouer";
    ed.onclick=function(){ cur=st.id; step=0; sub=(st.lines&&st.lines[0]&&st.lines[0].who)?1:0; view="scene"; render(); };
    pl.onclick=function(){ play(st.id); };
    row.appendChild(ed); row.appendChild(pl);
    card.appendChild(b); card.appendChild(sm); card.appendChild(row);
    body.appendChild(card);
  });
}
function renderScene(body){
  var st=storyBy(cur); if(!st){ view="home"; render(); return; }
  if(!st.lines||!st.lines.length) st.lines=[blankLine(null)];
  if(step<0) step=0; if(step>=st.lines.length) step=st.lines.length-1;
  var ln=st.lines[step];
  var prog=el("p","bd-step"); prog.textContent="Scène "+(step+1)+(st.lines.length>1?" sur "+st.lines.length:"");
  body.appendChild(prog);
  if(ln.kind==="choice"){ body.appendChild(choiceFields(st, ln)); body.appendChild(sceneBar(st, ln)); return; }
  if(!sub || !ln.who){ body.appendChild(whoStep(ln)); return; }
  body.appendChild(speechFields(st, ln));
  body.appendChild(sceneBar(st, ln));
}
function whoStep(ln){
  var box=el("div"); box.style.display="flex"; box.style.flexDirection="column"; box.style.gap="12px";
  var p=el("p","bd-lead"); p.textContent="Qui parle dans cette scène ? Touche un personnage : son image se met toute seule.";
  box.appendChild(p);
  if(ln.who){
    var keep=el("button","pill primary bd-go"); keep.type="button";
    var curC=castBy(ln.who);
    keep.textContent="Continuer avec "+(curC?curC.name:(ln.who==="narr"?"le narrateur":(ln.name||"lui")));
    keep.onclick=function(){ sub=1; render(); };
    box.appendChild(keep);
  }
  var grid=el("div","bd-cast");
  castList().forEach(function(c){
    var b=el("button"); b.type="button";
    if(ln.who===c.id) b.className="on";
    var im=el("img"); im.alt=""; im.src=c.src(c.poses[0]&&c.poses[0][0])||"";
    var nm=el("span"); nm.textContent=c.name;
    b.appendChild(im); b.appendChild(nm);
    b.onclick=function(){ pickWho(ln, c.id); };
    grid.appendChild(b);
  });
  box.appendChild(grid);
  var nar=el("button","bd-quiet"); nar.type="button"; nar.textContent="Personne : juste un texte";
  nar.onclick=function(){ pickWho(ln, "narr"); };
  var oth=el("button","bd-quiet"); oth.type="button"; oth.textContent="Quelqu'un d'autre, pas dans la liste";
  oth.onclick=function(){ pickWho(ln, "other"); };
  box.appendChild(nar); box.appendChild(oth);
  return box;
}
function pickWho(ln, id){
  ln.who=id; ln.img=null; ln.kind="line";
  var c=castBy(id); ln.pose=c&&c.poses[0]?c.poses[0][0]:"";
  if(id==="other"){ if(!ln.charId) ln.charId=uid(); }
  else ln.name="";
  touch(); sub=1; render();
}
function sceneBar(st, ln){
  var err=el("p","bd-err"); err.id="bdErr";
  var bar=el("div","bd-save");
  var next=el("button","pill primary bd-go"); next.type="button"; next.textContent=step<st.lines.length-1?"Scène suivante":"Ajouter la scène suivante";
  var end=el("button","pill bd-go"); end.type="button"; end.textContent="C'est la fin";
  next.onclick=function(){
    if(!sceneOk(ln, err)) return;
    var fresh=step===st.lines.length-1;
    if(fresh){ st.lines.push(blankLine(ln)); touch(); }
    step++; sub=fresh?0:(st.lines[step]&&st.lines[step].text?1:0); render();
  };
  end.onclick=function(){ if(!sceneOk(ln, err)) return; view="finish"; render(); };
  var alt=el("button","bd-quiet"); alt.type="button";
  alt.textContent=ln.kind==="choice"?"Revenir à une phrase":"À la place : un choix";
  alt.onclick=function(){
    if(ln.kind==="choice"){ ln.kind="line"; }
    else { ln.kind="choice"; ln.options=(ln.options&&ln.options.length)?ln.options:[{text:"",next:"next"},{text:"",next:"end"}]; }
    touch(); render();
  };
  bar.appendChild(err); bar.appendChild(next); bar.appendChild(end); bar.appendChild(alt);
  if(st.lines.length>1){
    var cut=el("button","bd-quiet"); cut.type="button"; cut.textContent="Retirer cette scène";
    cut.onclick=function(){ st.lines.splice(step,1); if(step>=st.lines.length) step=st.lines.length-1; sub=1; touch(); render(); };
    bar.appendChild(cut);
  }
  return bar;
}
function speechFields(st, ln){
  var box=el("div"); box.style.display="flex"; box.style.flexDirection="column"; box.style.gap="14px";
  var person=castBy(ln.who);
  var row=el("div","bd-photo");
  if(person){
    var im=el("img","bd-who"); im.alt=""; im.src=(ln.img&&DOC.images[ln.img])||person.src(ln.pose)||"";
    row.appendChild(im);
  }
  var cap=el("div");
  var nm=el("b"); nm.textContent=person?person.name:(ln.who==="narr"?"Narrateur":(ln.name||"Quelqu'un"));
  var sm=el("small"); sm.textContent=person?"Son image et son mouvement sont déjà réglés.":"Écris le texte de cette scène.";
  cap.appendChild(nm); cap.appendChild(document.createElement("br")); cap.appendChild(sm);
  var ch=el("button","bd-quiet"); ch.type="button"; ch.textContent="Changer de personnage";
  ch.onclick=function(){ sub=0; render(); };
  row.appendChild(cap); box.appendChild(row); box.appendChild(ch);
  if(ln.who==="other"){
    var name=el("input"); name.placeholder="Son nom"; name.value=ln.name||"";
    name.oninput=function(){ ln.name=name.value; touch(); };
    box.appendChild(field("Son nom", name));
  }
  if(person && person.poses.length>1 && !ln.img){
    var pose=el("select");
    person.poses.forEach(function(p){ var o=el("option"); o.value=p[0]; o.textContent=p[1]; if((ln.pose||person.poses[0][0])===p[0]) o.selected=true; pose.appendChild(o); });
    pose.onchange=function(){ ln.pose=pose.value; touch(); render(); };
    box.appendChild(field("Son attitude", pose));
  }
  var tx=el("textarea"); tx.placeholder=ln.who==="narr"?"Le texte de la scène":"Ce qu'il dit"; tx.value=ln.text||"";
  tx.oninput=function(){ ln.text=tx.value; touch(); };
  box.appendChild(field("Le texte", tx));
  var fold=el("details","bd-fold");
  if(ln.img || String(ln.bg||"").indexOf("img:")===0) fold.open=true;
  var sum=el("summary"); sum.textContent="Décor ou photo (facultatif)";
  fold.appendChild(sum);
  var inn=el("div"); inn.style.display="flex"; inn.style.flexDirection="column"; inn.style.gap="12px"; inn.style.paddingTop="10px";
  if(ln.who && ln.who!=="narr"){
    inn.appendChild(fileBtn(ln.img?"Changer sa photo":"Importer une photo à la place de son image", 720, function(data){
      var id=uid(); DOC.images[id]=data; delete DOC.sent[id]; ln.img=id; touch(); render();
    }));
  }
  var bg=el("select");
  bgOptions().forEach(function(k){ var o=el("option"); o.value=k; o.textContent=bgName(k); if((ln.bg||st.bg)===k && String(ln.bg||"").indexOf("img:")!==0) o.selected=true; bg.appendChild(o); });
  var oimg=el("option"); oimg.value="img"; oimg.textContent="Ma photo de décor"; if(String(ln.bg||"").indexOf("img:")===0) oimg.selected=true; bg.appendChild(oimg);
  bg.onchange=function(){ if(bg.value!=="img"){ ln.bg=bg.value; st.bg=st.bg||bg.value; touch(); } };
  inn.appendChild(field("Décor", bg));
  if(String(ln.bg||"").indexOf("img:")===0 && DOC.images[ln.bg.slice(4)]){ var bim=el("img","bd-who"); bim.alt=""; bim.src=DOC.images[ln.bg.slice(4)]; inn.appendChild(bim); }
  inn.appendChild(fileBtn("Photo de décor", 1280, function(data){
    var id=uid(); DOC.images[id]=data; delete DOC.sent[id]; ln.bg="img:"+id; touch(); render();
  }));
  fold.appendChild(inn); box.appendChild(fold);
  return box;
}
function sceneOk(ln, err){
  if(ln.kind==="choice"){
    if(!lineFilled(ln)){ err.textContent="Écris au moins un choix."; return false; }
    err.textContent=""; return true;
  }
  if(!ln.who){ err.textContent="Choisis qui parle."; return false; }
  if(ln.who==="other" && !(ln.name||"").trim()){ err.textContent="Écris son nom."; return false; }
  if(!(ln.text||"").trim()){ err.textContent="Écris ce qu'il dit."; return false; }
  err.textContent=""; return true;
}
function choiceFields(st, ln){
  var box=el("div"); box.style.display="flex"; box.style.flexDirection="column"; box.style.gap="14px";
  var q=el("textarea"); q.placeholder="La question"; q.value=ln.text||"";
  q.oninput=function(){ ln.text=q.value; touch(); };
  box.appendChild(field("Question", q));
  (ln.options||[]).forEach(function(op, j){
    var t=el("input"); t.placeholder="Texte du bouton"; t.value=op.text||"";
    t.oninput=function(){ op.text=t.value; touch(); };
    var sel=el("select");
    [["next","Continuer"],["end","Fin de l'histoire"]].concat(DOC.stories.filter(function(s){ return s.id!==st.id; }).map(function(s){ return [s.id, "Aller à : "+(s.title||"Sans titre")]; })).forEach(function(pair){
      var o=el("option"); o.value=pair[0]; o.textContent=pair[1]; if((op.next||"next")===pair[0]) o.selected=true; sel.appendChild(o);
    });
    sel.onchange=function(){ op.next=sel.value; touch(); };
    box.appendChild(field("Choix "+(j+1), t));
    box.appendChild(field("Ensuite", sel));
  });
  return box;
}
function renderFinish(body){
  var st=storyBy(cur); if(!st){ view="home"; render(); return; }
  var p=el("p","bd-lead"); p.textContent="Donne un titre. Si tu veux, ajoute une image pour le bandeau. Le cadre doré et les effets se mettent tout seuls.";
  var title=el("input"); title.placeholder="Le titre de l'histoire"; title.value=st.title||"";
  title.oninput=function(){ st.title=title.value; touch(); };
  body.appendChild(p); body.appendChild(field("Titre", title));
  body.appendChild(ribbonButton(st, 0, true));
  body.appendChild(fileBtn(st.banner?"Changer l'image du bandeau":"Image du bandeau", 960, function(data){
    var id=uid(); DOC.images[id]=data; delete DOC.sent[id]; st.banner="img:"+id; touch(); render();
  }));
  var err=el("p","bd-err"); err.id="bdErr";
  var bar=el("div","bd-save");
  var pub=el("button","pill primary bd-go"); pub.type="button"; pub.textContent="Mettre en ligne";
  var trial=el("button","pill bd-go"); trial.type="button"; trial.textContent="Essayer";
  var del=el("button","pill"); del.type="button"; del.textContent="Effacer cette histoire";
  pub.onclick=function(){ publish(st, pub, err); };
  trial.onclick=function(){ if(!valid(st, err)) return; play(st.id); };
  del.onclick=function(){
    if(del.dataset.ok!=="1"){ del.dataset.ok="1"; del.textContent="Appuie encore pour effacer"; return; }
    DOC.stories=DOC.stories.filter(function(s){ return s.id!==st.id; });
    touch(); publishDocOnly(err).then(function(){ view="home"; cur=null; render(); });
  };
  bar.appendChild(err); bar.appendChild(pub); bar.appendChild(trial); bar.appendChild(del);
  body.appendChild(bar);
}
function firstSpeaker(st){
  var lines=st.lines||[];
  for(var i=0;i<lines.length;i++){ if(lines[i].who && lines[i].who!=="narr" && lines[i].who!=="other") return lines[i]; }
  return lines[0]||null;
}
function ribbonButton(st, i, preview){
  var ln=firstSpeaker(st)||{};
  var look=LOOK[ln.who]||FALLBACK[i%FALLBACK.length];
  var b=el("button","rb gold a-"+look.anim+" th-"+look.th); b.type="button";
  b.style.setProperty("--sdl",(-(i*1.3)%9).toFixed(1)+"s");
  b.innerHTML='<span class="rb-shd"></span><span class="rb-body bev"></span><span class="rb-art bev"><span class="rb-bg"></span><span class="rb-fx"></span><img class="rb-bust" alt=""><span class="rb-txt"><b class="rb-name"></b><span class="rb-job"></span></span></span><svg class="rb-frame" aria-hidden="true"><use href="#rbf"/></svg>';
  b.querySelector(".rb-name").textContent=st.title||"Sans titre";
  b.querySelector(".rb-job").textContent=preview?"Aperçu du bandeau":"Toucher pour jouer";
  var bust=b.querySelector(".rb-bust"), bg=b.querySelector(".rb-bg");
  var custom=String(st.banner||"").indexOf("img:")===0?DOC.images[st.banner.slice(4)]:"";
  var person=castBy(ln.who);
  var face=(ln.img&&DOC.images[ln.img])||(person?person.src(ln.pose):"");
  if(custom){ bg.classList.add("img"); bg.style.backgroundImage='url("'+custom.replace(/"/g,"%22")+'")'; }
  bust.src=face||custom||"assets/sprites/excited.png";
  if(!preview) b.onclick=function(){ if(ev) ev.hidden=true; play(st.id); };
  else b.style.pointerEvents="none";
  return b;
}
function openEvents(){
  if(!ev){
    ev=el("div","ev-menu"); ev.hidden=true;
    ev.innerHTML='<div class="ev-card"><div class="bd-top"><h2>Événements</h2><button type="button" class="bd-x" id="evX">Fermer</button></div><div class="ev-list cscroll" id="evList"></div></div>';
    document.body.appendChild(ev);
    ev.querySelector("#evX").onclick=function(){ ev.hidden=true; };
  }
  var list=document.getElementById("evList"); list.textContent="";
  var stories=(DOC.stories||[]).filter(isPublic);
  if(!stories.length){
    var n=el("p","bd-lead"); n.textContent="Pas encore d'histoire ici. Quand tu en mets une en ligne, elle apparaît pour tout le monde.";
    list.appendChild(n);
  } else stories.forEach(function(st, i){ list.appendChild(ribbonButton(st, i, false)); });
  ev.hidden=false;
}

function renderLock(body){
  var p=el("p","bd-lead"); p.textContent="Cet écran est à toi. Écris le mot de passe pour ajouter des images et des histoires.";
  var f=el("label","bd-field"), s=el("span"); s.textContent="Mot de passe";
  var i=el("input"); i.type="password"; i.autocomplete="off"; i.placeholder="Mot de passe";
  var err=el("p","bd-err");
  var btn=el("button","pill primary"); btn.type="button"; btn.textContent="Entrer";
  f.appendChild(s); f.appendChild(i);
  body.appendChild(p); body.appendChild(f); body.appendChild(err); body.appendChild(btn);
  function go(){
    sha(i.value).then(function(h){
      if(h===PASS){ view="home"; render(); }
      else err.textContent="Ce n'est pas le bon mot de passe.";
    });
  }
  btn.onclick=go;
  i.onkeydown=function(e){ if(e.key==="Enter"){ e.preventDefault(); go(); } };
  setTimeout(function(){ i.focus(); }, 50);
}

function field(label, node){ var f=el("label","bd-field"), s=el("span"); s.textContent=label; f.appendChild(s); f.appendChild(node); return f; }
function renderEdit(body){
  var st=storyBy(cur); if(!st){ view="home"; render(); return; }
  var title=el("input"); title.placeholder="Par exemple : La nuit sur le toit"; title.value=st.title||"";
  title.oninput=function(){ st.title=title.value; touch(); };
  var bg=el("select");
  bgOptions().forEach(function(k){ var o=el("option"); o.value=k; o.textContent=bgName(k); if(st.bg===k) o.selected=true; bg.appendChild(o); });
  var oimg=el("option"); oimg.value="img"; oimg.textContent="Ma photo"; if(String(st.bg||"").indexOf("img:")===0) oimg.selected=true; bg.appendChild(oimg);
  bg.onchange=function(){ if(bg.value!=="img"){ st.bg=bg.value; touch(); render(); } };
  body.appendChild(field("Titre", title));
  body.appendChild(field("Décor", bg));
  var photoRow=el("div","bd-photo");
  if(String(st.bg||"").indexOf("img:")===0 && DOC.images[st.bg.slice(4)]){ var im=el("img"); im.src=DOC.images[st.bg.slice(4)]; im.alt=""; photoRow.appendChild(im); }
  photoRow.appendChild(fileBtn(String(st.bg||"").indexOf("img:")===0?"Changer la photo du décor":"Photo du décor", 1280, function(data){
    var id=uid(); DOC.images[id]=data; delete DOC.sent[id]; st.bg="img:"+id; touch(); render();
  }));
  body.appendChild(photoRow);
  (st.lines||[]).forEach(function(ln, idx){ body.appendChild(lineCard(st, ln, idx)); });
  var row=el("div","bd-row");
  var addL=el("button","pill"); addL.type="button"; addL.textContent="Ajouter une phrase";
  var addC=el("button","pill"); addC.type="button"; addC.textContent="Ajouter un choix";
  addL.onclick=function(){ st.lines.push({kind:"line", who:"miqka", pose:"sweet", text:""}); touch(); render(); };
  addC.onclick=function(){ st.lines.push({kind:"choice", text:"", options:[{text:"",next:"next"},{text:"",next:"end"}]}); touch(); render(); };
  row.appendChild(addL); row.appendChild(addC); body.appendChild(row);
  var err=el("p","bd-err"); err.id="bdErr";
  var save=el("div","bd-save");
  var pub=el("button","pill primary"); pub.type="button"; pub.textContent="Mettre en ligne";
  var trial=el("button","pill"); trial.type="button"; trial.textContent="Essayer sans publier";
  var del=el("button","pill"); del.type="button"; del.textContent="Effacer cette histoire";
  pub.onclick=function(){ publish(st, pub, err); };
  trial.onclick=function(){ if(!valid(st, err)) return; play(st.id); };
  del.onclick=function(){
    if(del.dataset.ok!=="1"){ del.dataset.ok="1"; del.textContent="Appuie encore pour effacer"; return; }
    DOC.stories=DOC.stories.filter(function(s){ return s.id!==st.id; });
    touch(); publishDocOnly(err).then(function(){ view="home"; cur=null; render(); }).catch(function(){ view="home"; cur=null; render(); });
  };
  save.appendChild(err); save.appendChild(pub); save.appendChild(trial); save.appendChild(del);
  body.appendChild(save);
}
function fileBtn(label, edge, done){
  var lab=el("label","bd-file"); lab.textContent=label;
  var inp=el("input"); inp.type="file"; inp.accept="image/*";
  lab.appendChild(inp);
  inp.onchange=function(){
    var file=inp.files&&inp.files[0]; if(!file) return;
    shrink(file, edge).then(done).catch(function(){ var e=document.getElementById("bdErr"); if(e) e.textContent="Cette photo est trop lourde. Essaie une autre."; });
  };
  return lab;
}
function valid(st, err){
  if(!(st.title||"").trim()){ err.textContent="Donne un titre à l'histoire."; return false; }
  var n=(st.lines||[]).some(function(ln){ return ln.kind==="choice"?(ln.options||[]).some(function(o){ return (o.text||"").trim(); }):(ln.text||"").trim(); });
  if(!n){ err.textContent="Écris au moins une phrase."; return false; }
  err.textContent=""; return true;
}
function publish(st, btn, err){
  if(busy) return;
  if(!valid(st, err)) return;
  st.pub=true;
  busy=true; btn.disabled=true; btn.textContent="Envoi…";
  var ids=[], seen={};
  function add(id){ if(id&&DOC.images[id]&&!seen[id]){ seen[id]=1; ids.push(id); } }
  if(String(st.bg||"").indexOf("img:")===0) add(st.bg.slice(4));
  if(String(st.banner||"").indexOf("img:")===0) add(st.banner.slice(4));
  (st.lines||[]).forEach(function(ln){ add(ln.img); if(String(ln.bg||"").indexOf("img:")===0) add(ln.bg.slice(4)); });
  DOC.stories.forEach(function(other){
    if(other.id===st.id) return;
    if(String(other.bg||"").indexOf("img:")===0) add(other.bg.slice(4));
    if(String(other.banner||"").indexOf("img:")===0) add(other.banner.slice(4));
    (other.lines||[]).forEach(function(ln){ add(ln.img); if(String(ln.bg||"").indexOf("img:")===0) add(ln.bg.slice(4)); });
  });
  var chain=Promise.resolve();
  ids.forEach(function(id){ if(DOC.sent[id]) return; chain=chain.then(function(){ return putImg(id, DOC.images[id]); }); });
  chain.then(function(){ return putDoc(); }).then(function(){
    applyAll();
    btn.textContent="C'est en ligne";
    err.textContent="C'est en ligne pour tout le monde. Un bandeau apparaît dans la ville, avec le nom de l'histoire. S'ils avaient déjà le jeu ouvert, ils ferment et rouvrent la page.";
  }).catch(function(){
    st.pub=false;
    err.textContent="Pas de réseau. Ton texte reste sur cet appareil. Réessaie.";
    btn.textContent="Mettre en ligne";
  }).then(function(){ busy=false; btn.disabled=false; });
}
function publishDocOnly(err){
  busy=true;
  return putDoc().then(function(){ applyAll(); }).catch(function(){ if(err) err.textContent="Pas de réseau. L'effacement est gardé sur cet appareil."; }).then(function(){ busy=false; });
}

function mount(){
  var sb=document.querySelector(".sheet-body.settings");
  if(!sb||document.getElementById("btnBuilder")) return;
  var r=el("div","row");
  r.innerHTML='<span>Créer des histoires</span>';
  var b=el("button","pill"); b.id="btnBuilder"; b.type="button"; b.textContent="Ouvrir";
  r.appendChild(b); sb.insertBefore(r, sb.firstChild);
  b.onclick=function(){ view="lock"; openUI(); };
}
shell(); mount(); loadLocal(); dropBlanks(); applyAll();
window.BUILDER={journal:journal, openEvents:openEvents};
loadRemote();
setInterval(function(){ if(!DOC.dirty) loadRemote(); }, 60000);
setInterval(showNews, 2000);
})();
