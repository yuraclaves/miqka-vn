/* Service worker : met le jeu en cache pour qu'il marche hors ligne.
   ⚠ Change VERSION à chaque mise à jour de ton histoire, sinon l'iPhone garde l'ancienne. */
const VERSION = "vn-v14";
const FILES = [
  "./", "index.html", "story.js", "story-hires.js", "story-hires2.js", "story-tomo.js","js/cloud.js", "js/daynight.js", "js/engine.js", "css/style.css", "manifest.json",
  "assets/fonts/Nunito.ttf", "assets/fonts/Nunito-Italic.ttf", "assets/fonts/Fredoka.ttf",
  "assets/sprites/excited.png", "assets/sprites/idea.png", "assets/sprites/pointing.png", "assets/sprites/shy.png", "assets/sprites/sweet.png",
  "assets/bg/toit.webp", "assets/bg/rue.webp", "assets/bg/cafe.webp", "assets/bg/prison.webp",
  "assets/icons/icon-180.png", "assets/icons/icon-192.png", "assets/icons/icon-512.png",
  "css/lightcone.css", "css/miqka.css", "js/lightcone.js", "js/miqka.js",
  "assets/sprites/title/excited.webp", "assets/sprites/title/idea.webp", "assets/sprites/title/pointing.webp", "assets/sprites/title/shy.webp", "assets/sprites/title/sweet.webp",
  "assets/cones/aventurine.webp", "assets/cones/zenos.webp", "assets/cones/chiaki.webp", "assets/cones/bigjim.webp", "assets/cones/thancred.webp", "assets/cones/rin.webp", "assets/cones/topaz.webp", "assets/cones/fandaniel.webp", "assets/cones/oishi.webp", "assets/cones/homer.webp", "assets/cones/estinien.webp",
  "css/city.css", "css/desktop.css", "css/builder.css", "js/wealth.js", "js/city.js", "js/builder.js", "assets/ville/city.webp",
  /* persos de la Ville : seules les silhouettes neutres sont préchargées ; les images claires, avatars et fonds de bandeau ne sont téléchargés qu'après l'embauche (cache à la volée) */
  "assets/ville/sil/p1.webp", "assets/ville/sil/p2.webp", "assets/ville/sil/p3.webp", "assets/ville/sil/p4.webp", "assets/ville/sil/p5.webp", "assets/ville/sil/p6.webp", "assets/ville/sil/p7.webp", "assets/ville/sil/p8.webp", "assets/ville/sil/p9.webp", "assets/ville/sil/p10.webp", "assets/ville/sil/p11.webp",
  /* décors photo de l'onglet Miqka : seul le 1er palier est préchargé ; les suivants se chargent au fil de la progression (palier actuel + suivant) */
  "assets/decor/photo/t00l.webp", "assets/decor/photo/t00p.webp",
  "assets/overlays/bag_lux.png", "assets/overlays/bag_small.png", "assets/overlays/bandage_a.png", "assets/overlays/bandage_b.png", "assets/overlays/beret.png", "assets/overlays/bill.png", "assets/overlays/bling.png", "assets/overlays/carton.png", "assets/overlays/cash.png", "assets/overlays/cernes.png", "assets/overlays/chain.png", "assets/overlays/cigar.png", "assets/overlays/clip_a.png", "assets/overlays/clip_b.png", "assets/overlays/coin.png", "assets/overlays/coin_holed.png", "assets/overlays/crown.png", "assets/overlays/dust.png", "assets/overlays/eye_dollar.png", "assets/overlays/fly.png", "assets/overlays/glasses_rect.png", "assets/overlays/glasses_round.png", "assets/overlays/patch_a.png", "assets/overlays/patch_b.png", "assets/overlays/pearls.png", "assets/overlays/pigeon.png", "assets/overlays/scarf.png", "assets/overlays/smoke.png", "assets/overlays/smudge.png", "assets/overlays/sun_a.png", "assets/overlays/sun_b.png", "assets/overlays/ticket.png", "assets/overlays/tophat.png", "assets/overlays/watch.png"
];
self.addEventListener("install", e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  if (e.request.url.indexOf("/assets/music/") >= 0) return;   /* musique : flux réseau (requêtes Range), cache HTTP du navigateur */
  e.respondWith(caches.match(e.request, {ignoreSearch: true}).then(hit => hit || fetch(e.request).then(res => {
    if (res.status === 200 && new URL(e.request.url).origin === location.origin) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match("index.html"))));
});
