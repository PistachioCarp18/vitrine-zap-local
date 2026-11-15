const CACHE_NAME = 'vitrine-zap-v2';
const ASSETS = ['./', './index.html', './styles.css', './app.js', './src/integrations.js', './src/qrcode.js', './src/store.js', './src/presets.js', './manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then((res) => res || fetch(e.request)));
});
