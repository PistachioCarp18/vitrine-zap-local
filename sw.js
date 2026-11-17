const CACHE_NAME = 'vitrine-zap-v15-p2';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './styles/home-oficina.css',
  './styles/home-barbearia.css',
  './app.js',
  './src/home/loader.js',
  './src/home/oficina.js',
  './src/home/barbearia.js',
  './assets/fonts/barlow-condensed-700.woff2',
  './assets/fonts/playfair-700.woff2',
  './assets/fonts/jakarta-400.woff2',
  './src/integrations.js',
  './src/geo-apis.js',
  './src/category-apis.js',
  './src/illustrations.js',
  './src/pdp.js',
  './src/qrcode.js',
  './src/brand/design-systems.js',
  './src/brand/brand-engine.js',
  './src/store.js',
  './src/presets.js',
  './src/mechanics/registry.js',
  './src/mechanics/autoship-reminder.js',
  './src/mechanics/deposit-pix.js',
  './src/mechanics/free-shipping-progress.js',
  './src/mechanics/inspection-checklist.js',
  './src/mechanics/item-sheet-addons.js',
  './src/mechanics/occasion-card-message.js',
  './src/mechanics/pickup-window.js',
  './src/mechanics/reorder-1-tap.js',
  './src/mechanics/slot-picker.js',
  './src/mechanics/variant-picker.js',
  './verticals/barbearia.json',
  './verticals/floricultura.json',
  './verticals/lanchonete.json',
  './verticals/moda.json',
  './verticals/oficina.json',
  './verticals/padaria.json',
  './verticals/petshop.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './manifest.webmanifest',
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
