const CACHE_NAME = 'vitrine-zap-v15';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './src/home/loader.js',
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
  './assets/icons/icon-192.png',
  './manifest.webmanifest',
];

const LAZY_OFFLINE_ASSETS = [
  './styles/home-oficina.css',
  './styles/home-barbearia.css',
  './styles/home-padaria.css',
  './styles/home-moda.css',
  './styles/home-lanchonete.css',
  './styles/home-petshop.css',
  './styles/home-floricultura.css',
  './src/home/oficina.js',
  './src/home/barbearia.js',
  './src/home/padaria.js',
  './src/home/moda.js',
  './src/home/lanchonete.js',
  './src/home/petshop.js',
  './src/home/floricultura.js',
  './assets/fonts/barlow-condensed-700.woff2',
  './assets/fonts/playfair-700.woff2',
  './assets/fonts/fraunces-700.woff2',
  './assets/fonts/archivo-700.woff2',
  './assets/fonts/bodoni-italic-600.woff2',
  './assets/fonts/bricolage-700.woff2',
  './assets/fonts/nunito-700.woff2',
  './assets/fonts/cormorant-700.woff2',
  './assets/fonts/dm-sans-400.woff2',
  './assets/fonts/jakarta-400.woff2',
  './assets/fonts/jakarta-700.woff2',
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
  './assets/icons/icon-512.png',
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

self.addEventListener('message', (e) => {
  if (e.data === 'WARM_OFFLINE') {
    caches.open(CACHE_NAME).then((c) => c.addAll(LAZY_OFFLINE_ASSETS).catch(() => {}));
  }
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
