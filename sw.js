/* Service worker : met le jeu en cache pour qu'il marche hors ligne.
   ⚠ Change VERSION à chaque mise à jour de ton histoire, sinon l'iPhone garde l'ancienne. */
const VERSION = "vn-v5";
const FILES = [
  "./", "index.html", "story.js", "js/engine.js", "css/style.css", "manifest.json",
  "assets/fonts/Nunito.ttf", "assets/fonts/Nunito-Italic.ttf", "assets/fonts/Fredoka.ttf",
  "assets/sprites/excited.png", "assets/sprites/idea.png", "assets/sprites/pointing.png", "assets/sprites/shy.png", "assets/sprites/sweet.png",
  "assets/bg/toit.svg", "assets/bg/rue.svg", "assets/bg/cafe.svg",
  "assets/icons/icon-180.png", "assets/icons/icon-192.png", "assets/icons/icon-512.png",
  "css/lightcone.css", "css/miqka.css", "js/lightcone.js", "js/miqka.js",
  "assets/sprites/title/excited.webp", "assets/sprites/title/idea.webp", "assets/sprites/title/pointing.webp", "assets/sprites/title/shy.webp", "assets/sprites/title/sweet.webp",
  "assets/cones/aventurine.webp", "assets/cones/zenos.webp", "assets/cones/chiaki.webp", "assets/cones/bigjim.webp", "assets/cones/thancred.webp", "assets/cones/rin.webp", "assets/cones/topaz.webp", "assets/cones/fandaniel.webp", "assets/cones/oishi.webp", "assets/cones/homer.webp", "assets/cones/estinien.webp",
  "css/city.css", "js/wealth.js", "js/city.js", "assets/ville/city.webp",
  "assets/ville/aventurine.webp", "assets/ville/bigjim.webp", "assets/ville/chiaki.webp", "assets/ville/estinien.webp", "assets/ville/fandaniel.webp", "assets/ville/homer.webp", "assets/ville/rin.webp", "assets/ville/topaz.webp", "assets/ville/zenos.webp", "assets/ville/bakool.webp", "assets/ville/sinbad.webp",
  "assets/overlays/bag_lux.png", "assets/overlays/bag_small.png", "assets/overlays/bandage_a.png", "assets/overlays/bandage_b.png", "assets/overlays/beret.png", "assets/overlays/bill.png", "assets/overlays/bling.png", "assets/overlays/cash.png", "assets/overlays/chain.png", "assets/overlays/cigar.png", "assets/overlays/clip_a.png", "assets/overlays/clip_b.png", "assets/overlays/coin.png", "assets/overlays/coin_holed.png", "assets/overlays/crown.png", "assets/overlays/dust.png", "assets/overlays/eye_dollar.png", "assets/overlays/fly.png", "assets/overlays/glasses_rect.png", "assets/overlays/glasses_round.png", "assets/overlays/patch_a.png", "assets/overlays/patch_b.png", "assets/overlays/pearls.png", "assets/overlays/scarf.png", "assets/overlays/smoke.png", "assets/overlays/smudge.png", "assets/overlays/sun_a.png", "assets/overlays/sun_b.png", "assets/overlays/ticket.png", "assets/overlays/tophat.png", "assets/overlays/watch.png"
];
self.addEventListener("install", e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request, {ignoreSearch: true}).then(hit => hit || fetch(e.request).then(res => {
    if (res.ok && new URL(e.request.url).origin === location.origin) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match("index.html"))));
});
