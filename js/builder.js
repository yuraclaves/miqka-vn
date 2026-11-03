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
var view="lock", cur=null, busy=false, root=null;

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
function putDoc(){
  var ids=[], seen={};
  DOC.stories.forEach(function(st){
    if(String(st.bg||"").indexOf("img:")===0){ var b=st.bg.slice(4); if(!seen[b]){ seen[b]=1; ids.push(b); } }
    (st.lines||[]).forEach(function(ln){ if(ln.img && !seen[ln.img]){ seen[ln.img]=1; ids.push(ln.img); } });
  });
  var cat={v:1,rev:Date.now(),stories:DOC.stories,imageIds:ids};
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
      DOC={rev:cat.rev||0,dirty:false,stories:cat.stories,images:images,sent:sent};
      saveLocal(); applyAll();
      var city=document.getElementById("city"), box=document.getElementById("journal");
      if(city&&city.dataset.view==="journal"&&box&&!box.querySelector("[data-bstory]")) journal(box);
    });
  }).catch(function(){});
}

function applyAll(){
  var ST=window.STORY; if(!ST||!ST.scenes) return;
  ST.scenes.b__fin={lines:[{end:true}]};
  (DOC.stories||[]).forEach(function(st){
    var lines=[];
    (st.lines||[]).forEach(function(ln){
      if(ln.kind==="choice"){
        var ch=(ln.options||[]).filter(function(o){ return (o.text||"").trim(); }).map(function(o){
          var c={text:o.text.trim()};
          if(o.next==="end") c.goto="b__fin";
          else if(o.next&&o.next!=="next") c.goto="b_"+o.next;
          return c;
        });
        if(ch.length) lines.push({text:(ln.text||"Que fais-tu ?").trim()||"Que fais-tu ?", choices:ch});
        return;
      }
      var text=(ln.text||"").trim(); if(!text) return;
      var o={text:text};
      if(ln.who==="miqka"){
        o.speaker="miqka";
        if(ln.img&&DOC.images[ln.img]&&ST.characters&&ST.characters.miqka){
          var pose="bimg_"+ln.img;
          ST.characters.miqka.poses[pose]=DOC.images[ln.img];
          o.pose=pose;
        } else if(ln.pose) o.pose=ln.pose;
      } else if(ln.who==="other"){
        var id="bp_"+(ln.charId||"x");
        var name=(ln.name||"Quelqu'un").trim()||"Quelqu'un";
        ST.characters[id]=ST.characters[id]||{name:name,poses:{}};
        ST.characters[id].name=name;
        if(ln.img&&DOC.images[ln.img]){ ST.characters[id].poses.photo=DOC.images[ln.img]; o.pose="photo"; }
        o.speaker=id;
      }
      lines.push(o);
    });
    lines.push({end:true});
    var bg=st.bg||"toit";
    if(String(bg).indexOf("img:")===0){ var im=DOC.images[bg.slice(4)]; bg=im||"toit"; }
    ST.scenes["b_"+st.id]={chapter:"Histoire", title:st.title||"Sans titre", background:bg, lines:lines};
  });
}
function play(id){
  applyAll();
  if(!window.VN||!window.STORY||!STORY.scenes["b_"+id]) return;
  var app=document.getElementById("app");
  var backCity=app.classList.contains("mode-city");
  closeUI();
  app.classList.remove("mode-city","on-title");
  VN.playScene("b_"+id, function(){
    if(backCity) app.classList.add("mode-city");
    else VN.goTitle(true);
  });
}
function journal(box){
  if(!DOC.stories.length) return;
  var head=el("p","jr-intro"); head.textContent="Histoires ajoutées"; box.appendChild(head);
  DOC.stories.forEach(function(st){
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
  body.textContent=""; back.hidden=view!=="edit";
  title.textContent=view==="edit"?"Ton histoire":"Créer";
  if(view==="lock") renderLock(body);
  else if(view==="home") renderHome(body);
  else renderEdit(body);
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
function renderHome(body){
  var p=el("p","bd-lead"); p.textContent="Écris une histoire, ajoute des photos si tu veux, puis appuie sur Mettre en ligne. Elle apparaît dans Histoire, pour tout le monde.";
  var add=el("button","pill primary"); add.type="button"; add.textContent="Nouvelle histoire";
  add.onclick=function(){
    var st={id:uid(), title:"", bg:"toit", lines:[{kind:"line", who:"miqka", pose:"sweet", text:""}]};
    DOC.stories.unshift(st); touch(); cur=st.id; view="edit"; render();
  };
  body.appendChild(p); body.appendChild(add);
  if(!DOC.stories.length){ var n=el("p","bd-note"); n.textContent="Tu n'as pas encore d'histoire."; body.appendChild(n); return; }
  DOC.stories.forEach(function(st){
    var card=el("div","bd-story"), b=el("b"); b.textContent=st.title||"Sans titre";
    var sm=el("small"); sm.textContent=(st.lines||[]).length+" réplique"+((st.lines||[]).length>1?"s":"");
    var row=el("div","bd-mini");
    var ed=el("button"); ed.type="button"; ed.textContent="Modifier";
    var pl=el("button"); pl.type="button"; pl.textContent="Jouer";
    ed.onclick=function(){ cur=st.id; view="edit"; render(); };
    pl.onclick=function(){ play(st.id); };
    row.appendChild(ed); row.appendChild(pl);
    card.appendChild(b); card.appendChild(sm); card.appendChild(row);
    body.appendChild(card);
  });
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
function lineCard(st, ln, idx){
  var card=el("div","bd-line");
  var head=el("span"); head.style.color="var(--gold,#ffd59a)"; head.style.fontWeight="700"; head.textContent=ln.kind==="choice"?"Choix":"Phrase "+(idx+1);
  card.appendChild(head);
  if(ln.kind==="choice"){
    var q=el("textarea"); q.placeholder="La question, par exemple : Tu le suis ?"; q.value=ln.text||"";
    q.oninput=function(){ ln.text=q.value; touch(); };
    card.appendChild(field("Question", q));
    (ln.options||[]).forEach(function(op, j){
      var t=el("input"); t.placeholder="Texte du bouton"; t.value=op.text||"";
      t.oninput=function(){ op.text=t.value; touch(); };
      var sel=el("select");
      [["next","Continuer l'histoire"],["end","Fin de l'histoire"]].concat(DOC.stories.filter(function(s){ return s.id!==st.id; }).map(function(s){ return [s.id, "Aller à : "+(s.title||"Sans titre")]; })).forEach(function(pair){
        var o=el("option"); o.value=pair[0]; o.textContent=pair[1]; if(op.next===pair[0]) o.selected=true; sel.appendChild(o);
      });
      sel.onchange=function(){ op.next=sel.value; touch(); };
      card.appendChild(field("Choix "+(j+1), t));
      card.appendChild(field("Ensuite", sel));
    });
    if((ln.options||[]).length<3){
      var more=el("button","bd-mini"); more.type="button"; more.textContent="Ajouter un 3e bouton";
      more.onclick=function(){ ln.options.push({text:"",next:"end"}); touch(); render(); };
      card.appendChild(more);
    }
  } else {
    var who=el("select");
    [["miqka","Miqka"],["narr","Narrateur (pas de nom)"],["other","Quelqu'un d'autre"]].forEach(function(pair){
      var o=el("option"); o.value=pair[0]; o.textContent=pair[1]; if((ln.who||"miqka")===pair[0]) o.selected=true; who.appendChild(o);
    });
    who.onchange=function(){ ln.who=who.value; if(ln.who==="other"&&!ln.charId) ln.charId=uid(); touch(); render(); };
    card.appendChild(field("Qui parle", who));
    if(ln.who==="other"){
      var name=el("input"); name.placeholder="Son nom"; name.value=ln.name||"";
      name.oninput=function(){ ln.name=name.value; touch(); };
      card.appendChild(field("Nom", name));
    }
    if((ln.who||"miqka")==="miqka"){
      var chips=el("div","bd-chips");
      POSES.forEach(function(p){
        var b=el("button"); b.type="button"; b.textContent=p[1]; if((ln.pose||"sweet")===p[0]&&!ln.img) b.className="on";
        b.onclick=function(){ ln.pose=p[0]; ln.img=null; touch(); render(); };
        chips.appendChild(b);
      });
      card.appendChild(chips);
    }
    if(ln.who!=="narr"){
      var ph=el("div","bd-photo");
      if(ln.img&&DOC.images[ln.img]){ var im=el("img"); im.src=DOC.images[ln.img]; im.alt=""; ph.appendChild(im); }
      ph.appendChild(fileBtn(ln.img?"Changer la photo":"Importer une photo", 720, function(data){
        var id=uid(); DOC.images[id]=data; delete DOC.sent[id]; ln.img=id; if(ln.who==="other"&&!ln.charId) ln.charId=uid(); touch(); render();
      }));
      card.appendChild(ph);
    }
    var tx=el("textarea"); tx.placeholder="Ce que dit le personnage"; tx.value=ln.text||"";
    tx.oninput=function(){ ln.text=tx.value; touch(); };
    card.appendChild(field("Texte", tx));
  }
  var mv=el("div","bd-mini");
  var up=el("button"); up.type="button"; up.textContent="Monter"; up.disabled=idx===0;
  var down=el("button"); down.type="button"; down.textContent="Descendre"; down.disabled=idx===st.lines.length-1;
  var rm=el("button"); rm.type="button"; rm.textContent="Retirer";
  up.onclick=function(){ var a=st.lines[idx-1]; st.lines[idx-1]=ln; st.lines[idx]=a; touch(); render(); };
  down.onclick=function(){ var a=st.lines[idx+1]; st.lines[idx+1]=ln; st.lines[idx]=a; touch(); render(); };
  rm.onclick=function(){ st.lines.splice(idx,1); if(!st.lines.length) st.lines.push({kind:"line", who:"miqka", pose:"sweet", text:""}); touch(); render(); };
  mv.appendChild(up); mv.appendChild(down); mv.appendChild(rm);
  card.appendChild(mv);
  return card;
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
  busy=true; btn.disabled=true; btn.textContent="Envoi…";
  var ids=[], seen={};
  function add(id){ if(id&&DOC.images[id]&&!seen[id]){ seen[id]=1; ids.push(id); } }
  if(String(st.bg||"").indexOf("img:")===0) add(st.bg.slice(4));
  (st.lines||[]).forEach(function(ln){ add(ln.img); });
  DOC.stories.forEach(function(other){
    if(other.id===st.id) return;
    if(String(other.bg||"").indexOf("img:")===0) add(other.bg.slice(4));
    (other.lines||[]).forEach(function(ln){ add(ln.img); });
  });
  var chain=Promise.resolve();
  ids.forEach(function(id){ if(DOC.sent[id]) return; chain=chain.then(function(){ return putImg(id, DOC.images[id]); }); });
  chain.then(function(){ return putDoc(); }).then(function(){
    applyAll();
    btn.textContent="C'est en ligne";
    err.textContent="Tout le monde la trouve dans Histoire. S'ils avaient déjà le jeu ouvert, ils ferment et rouvrent la page.";
  }).catch(function(){
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
shell(); mount(); loadLocal(); applyAll();
window.BUILDER={journal:journal};
loadRemote();
setInterval(function(){ if(!DOC.dirty) loadRemote(); }, 60000);
})();
