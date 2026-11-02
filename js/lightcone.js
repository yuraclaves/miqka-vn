/* Bannière « cônes de lumière » — même règle de mélange que banner.js :
   2 groupes disjoints (A = 6 persos, B = 5) en rangées alternées -> jamais le même perso dans deux rangées voisines ;
   dans une rangée, chaque perso une fois par séquence -> jamais deux fois côte à côte (bouclage compris). */
(function(){
  var IMG='assets/cones/';
  var A=[['aventurine','zenos','chiaki','bigjim','thancred','rin'],
         ['chiaki','rin','zenos','thancred','aventurine','bigjim'],
         ['bigjim','aventurine','rin','chiaki','zenos','thancred'],
         ['thancred','chiaki','aventurine','rin','bigjim','zenos']];
  var B=[['topaz','oishi','estinien','fandaniel','homer'],
         ['homer','estinien','topaz','oishi','fandaniel'],
         ['fandaniel','topaz','homer','estinien','oishi'],
         ['oishi','homer','fandaniel','topaz','estinien']];
  function rowOrder(r){ return r%2===0 ? A[(r/2)%A.length] : B[((r-1)/2)%B.length]; }
  // cadre SVG partagé (viewBox 72x100 = ratio de la carte), défini une seule fois
  var NS='http://www.w3.org/2000/svg';
  var DEFS='<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>'+
   '<linearGradient id="lcg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffbe9"/><stop offset=".35" stop-color="#e7c98a"/>'+
   '<stop offset=".6" stop-color="#fff4d2"/><stop offset="1" stop-color="#c9a05e"/></linearGradient>'+
   '<symbol id="lcf" viewBox="0 0 72 100" preserveAspectRatio="none">'+
   // filet extérieur clair + filet intérieur fin (biseautés)
   '<path d="M4.3 .4H67.7L71.6 4.3V95.7L67.7 99.6H4.3L.4 95.7V4.3Z" fill="none" stroke="url(#lcg)" stroke-width=".8"/>'+
   '<path d="M6.2 4.4H65.8L68.4 7V93L65.8 95.6H6.2L3.6 93V7Z" fill="none" stroke="rgba(255,244,214,.75)" stroke-width=".45"/>'+
   '<path d="M8 6.2H64L66.6 8.8V91.2L64 93.8H8L5.4 91.2V8.8Z" fill="none" stroke="rgba(255,244,214,.28)" stroke-width=".3"/>'+
   // coins ornés (équerres)
   '<path d="M3.6 14V7L6.2 4.4H13 M58.6 95.6H65.8L68.4 93V86" fill="none" stroke="#fff3cf" stroke-width="1"/>'+
   '<path d="M68.4 14V7L65.8 4.4H59 M13.4 95.6H6.2L3.6 93V86" fill="none" stroke="#fff3cf" stroke-width=".6" opacity=".8"/>'+
   // losanges au milieu des bords haut et bas
   '<path d="M36 1.6L38.4 4.4L36 7.2L33.6 4.4Z M36 92.8L38.4 95.6L36 98.4L33.6 95.6Z" fill="url(#lcg)" stroke="#5b4220" stroke-width=".25"/>'+
   // étoile à 4 branches (coin haut droit) + petite étoile + point
   '<path d="M62.5 9.2L63.4 13.1L67.3 14L63.4 14.9L62.5 18.8L61.6 14.9L57.7 14L61.6 13.1Z" fill="#fffaf0"/>'+
   '<path d="M57.4 19.6L57.8 21.1L59.3 21.5L57.8 21.9L57.4 23.4L57 21.9L55.5 21.5L57 21.1Z" fill="#fff3cf" opacity=".85"/>'+
   '<circle cx="9.5" cy="89.5" r="1.1" fill="#fff3cf" opacity=".9"/><circle cx="12.6" cy="91.6" r=".55" fill="#fff3cf" opacity=".7"/>'+
   // arc décoratif (coin bas gauche)
   '<path d="M5.4 80A12 12 0 0 0 18 93.8" fill="none" stroke="rgba(255,244,214,.6)" stroke-width=".4"/>'+
   '</symbol></defs></svg>';
  document.body.insertAdjacentHTML('afterbegin',DEFS);

  function build(root){
    var q=new URLSearchParams(location.search), T=parseFloat(q.get('t')||'0');
    if(q.get('pause')==='1') root.classList.add('b-paused');
    var w=root.clientWidth,h=root.clientHeight;
    var th=Math.round(Math.max(130,Math.min(210,Math.min(w,h)*0.44)));   // hauteur de carte
    var gap=Math.round(th*0.11), tw=th*0.72;
    var rad=18*Math.PI/180, cw=w*Math.cos(rad)+h*Math.sin(rad), ch=w*Math.sin(rad)+h*Math.cos(rad);
    var bw=Math.ceil(Math.max(cw,ch)+2*th);
    var rows=Math.ceil((ch+th)/(th+gap)); if(rows%2) rows++;
    root.style.setProperty('--th',th+'px'); root.style.setProperty('--gap',gap+'px');
    var rot=document.createElement('div'); rot.className='b-rot'; rot.style.setProperty('--bw',bw+'px');
    for(var r=0;r<rows;r++){
      var ord=rowOrder(r), n=ord.length, seq=n*(tw+gap);
      var reps=Math.ceil((bw+seq)/seq)+1;
      var row=document.createElement('div'); row.className='b-row'+(r%2?' rev':'');
      var tr=document.createElement('div'); tr.className='b-track';
      var speed=14+((r*7)%5)*3, dur=seq/speed;
      tr.style.setProperty('--shift',(-seq)+'px'); tr.style.setProperty('--dur',dur.toFixed(2)+'s');
      var startOff=((r*0.41)%1)*dur;
      tr.style.setProperty('--delay',(-(startOff+T))+'s');
      var html='';
      for(var k=0;k<reps;k++) for(var i=0;i<n;i++){
        var idx=k*n+i, sdl=-(((idx*1.7+r*0.9)%11)+T);
        html+='<div class="b-tile lc" data-c="'+ord[i]+'" style="--sdl:'+sdl.toFixed(2)+'s;--sd:11s">'+
          '<i class="lc-glow"></i><div class="lc-shd"><i class="bev"></i></div>'+
          '<div class="lc-body bev"><div class="lc-art bev"><img src="'+IMG+ord[i]+'.webp" alt="" decoding="async"></div></div>'+
          '<svg class="lc-frame" aria-hidden="true"><use href="#lcf"/></svg></div>';
      }
      tr.innerHTML=html; row.appendChild(tr); rot.appendChild(row);
    }
    root.innerHTML=''; root.appendChild(rot);
    var dim=document.createElement('div'); dim.className='b-dim'; root.parentNode.insertBefore(dim,root.nextSibling);
    window.__bannerRows=[];for(var r2=0;r2<rows;r2++)window.__bannerRows.push(rowOrder(r2).join(', '));
  }
  var el=document.getElementById('banner'); if(el) build(el);
  var to; addEventListener('resize',function(){clearTimeout(to);to=setTimeout(function(){
    var d=document.querySelector('.b-dim'); if(d) d.remove(); build(el);},200);});
})();
