// PupCare Control — Service Worker v4
const CACHE = 'pupcare-v4';
const ASSETS = [
  '/', '/index.html', '/css/style.css?v=4',
  '/js/firebase-config.js?v=4', '/js/cloudinary-config.js?v=4',
  '/js/app.js?v=4', '/js/home.js?v=4',
  '/js/profile.js?v=4', '/js/modules.js?v=4',
  '/manifest.json', '/assets/icons/paw.svg',
  '/assets/icons/google.svg'
];

self.addEventListener('install', e =>
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  )
);

self.addEventListener('activate', e =>
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
);

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;
  if (url.includes('firebase') || url.includes('googleapis') || url.includes('cloudinary')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      }).catch(() => caches.match('/index.html'));
    })
  );
});
