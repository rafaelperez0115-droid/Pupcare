// PupCare Control — Service Worker v5
const CACHE = 'pupcare-v5';
const ASSETS = [
  './', './index.html', './css/style.css',
  './js/firebase-config.js', './js/cloudinary-config.js',
  './js/app.js', './js/home.js',
  './js/profile.js', './js/modules.js',
  './manifest.json', './assets/icons/paw.svg',
  './assets/icons/google.svg'
];

self.addEventListener('install', e =>
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS).catch(() => {}))
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
  if (url.includes('firebase') ||
      url.includes('googleapis') ||
      url.includes('cloudinary')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});

// ── Manejar click en notificación ──
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || './';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(list => {
        const existing = list.find(c => c.url.includes('Pupcare') || c.url.includes('netlify'));
        if (existing) return existing.focus();
        return clients.openWindow(url);
      })
  );
});

// ── Sincronización en background (cuando vuelve la conexión) ──
self.addEventListener('sync', e => {
  if (e.tag === 'pupcare-sync') {
    e.waitUntil(
      clients.matchAll().then(list =>
        list.forEach(c => c.postMessage({ type: 'SYNC_COMPLETE' }))
      )
    );
  }
});
