/* Miqka v2 : change de pose toutes les 4 s avec un « squish » — version sans clignotement (iPhone/Safari).
   Changement (440 ms, squish appliqué au conteneur .mq-sq, origine en bas) :
     0–140 ms   l'ancienne pose s'écrase : scaleX 1→1.10, scaleY 1→0.88 (ease-out)
     140 ms     ÉCHANGE ATOMIQUE dans la même frame : nouvelle pose opacity 1, ancienne 0 ; le conteneur passe en
                étirement (scaleX 0.92 / scaleY 1.12)
     140–440 ms rebond amorti vers 1 : s = 0.12·e^(−4v)·cos(3πv)·(1−v) ; scaleY = 1+s, scaleX = 1−0.7·s
   => à chaque frame, exactement UNE pose est visible à 100 % : jamais de transparence, jamais de trou.
   prefers-reduced-motion : pas de squish ; la nouvelle pose apparaît en fondu 200 ms PAR-DESSUS l'ancienne,
   qui reste à 100 % puis est masquée d'un coup quand la nouvelle est opaque.
   Robustesse : 5 <img> créés une fois (src jamais modifié), decoding="sync" + decode() avant de démarrer,
   un seul minuteur (setTimeout OU requestAnimationFrame, jamais les deux), arrêt/reprise propre sur visibilitychange.
   Test : ?t=12 démarre l'horloge à 12 s, &pause=1 fige l'image à cet instant. */
(function(){
  var DIR=window.MIQKA_DIR||'assets/sprites/title/', POSES=['excited','idea','pointing','shy','sweet'], EVERY=4, SW=0.14, D=0.44;
  var root=document.getElementById('miqka'); if(!root) return;
  var q=new URLSearchParams(location.search), T0=parseFloat(q.get('t')||'0'), PAUSE=q.get('pause')==='1';
  var reduce=matchMedia('(prefers-reduced-motion: reduce)');
  var sq=document.createElement('div'); sq.className='mq-sq'; root.appendChild(sq);
  var imgs=POSES.map(function(p,i){var im=document.createElement('img'); im.decoding='sync'; im.alt=i?'':'Miqka';
    im.draggable=false; im.src=DIR+p+'.webp'; sq.appendChild(im); return im;});
  root.style.setProperty('--mqfd',(-T0)+'s'); if(PAUSE) root.classList.add('paused');
  // état appliqué (on n'écrit dans le DOM que ce qui change -> aucune invalidation inutile)
  var shown=[-1,-1,-1,-1,-1], zs=[-1,-1,-1,-1,-1], lastTf='';
  function op(i,v){ if(shown[i]!==v){ imgs[i].style.opacity=v===1?'1':v===0?'0':v.toFixed(3); shown[i]=v; } }
  function z(i,v){ if(zs[i]!==v){ imgs[i].style.zIndex=v; zs[i]=v; } }
  function tf(sx,sy){ var s='translateZ(0) scale('+sx.toFixed(4)+','+sy.toFixed(4)+')'; if(s!==lastTf){ sq.style.transform=s; lastTf=s; } }
  function clamp(x){return x<0?0:x>1?1:x}
  function render(t){            // renvoie true tant qu'un changement est en cours
    var k=Math.floor(t/EVERY), u=t-k*EVERY, n=POSES.length, cur=k%n, prev=(k+n-1)%n, i;
    for(i=0;i<n;i++) if(i!==cur&&i!==prev) op(i,0);
    z(cur,2); z(prev,1);
    if(k===0||u>=D){ op(cur,1); op(prev,0); tf(1,1); return false; }
    if(reduce.matches){
      var f=clamp(u/0.2); tf(1,1);
      if(f<1){ op(prev,1); op(cur,f); return true; }
      op(cur,1); op(prev,0); return false;
    }
    if(u<SW){                    // écrasement de l'ancienne pose (encore seule visible)
      var a=1-Math.pow(1-u/SW,3); op(prev,1); op(cur,0); tf(1+0.10*a,1-0.12*a); return true;
    }
    op(cur,1); op(prev,0);       // échange atomique (même frame)
    var v=clamp((u-SW)/(D-SW)), s=0.12*Math.exp(-4*v)*Math.cos(3*Math.PI*v)*(1-v);
    tf(1-0.7*s,1+s); return true;
  }
  if(PAUSE){ render(T0); return; }
  var start=performance.now()/1000-T0, raf=0, tm=0, alive=false;
  function now(){return performance.now()/1000-start}
  function stop(){ if(tm){clearTimeout(tm);tm=0;} if(raf){cancelAnimationFrame(raf);raf=0;} }
  function frame(){ raf=0; if(!alive) return; if(render(now())) raf=requestAnimationFrame(frame); else wait(); }
  function wait(){ stop(); var t=now(), next=(Math.floor(t/EVERY)+1)*EVERY;
    // réveil ~1 frame avant le changement, puis rAF : le 1er rendu du changement tombe sur une vraie frame
    tm=setTimeout(function(){ tm=0; if(alive) raf=requestAnimationFrame(frame); },Math.max(0,(next-t)*1000-20)); }
  function go(){ stop(); alive=true; raf=requestAnimationFrame(frame); }
  render(now());
  // ne tourne que si la page est visible ET que l'écran titre est affiché (#app.on-title) : économie de batterie en jeu
  var app=document.getElementById('app'), ready=false;
  function active(){ return ready && !document.hidden && (!app || app.classList.contains('on-title')); }
  function sync(){ if(active()){ if(!alive) go(); } else { alive=false; stop(); } }
  Promise.all(imgs.map(function(im){return im.decode?im.decode().catch(function(){}):0})).then(function(){ ready=true; sync(); });
  document.addEventListener('visibilitychange',sync);
  if(app && window.MutationObserver) new MutationObserver(sync).observe(app,{attributes:true,attributeFilter:['class']});
  window.__miqka={render:render,imgs:imgs,sq:sq,running:function(){return alive;}};
})();
