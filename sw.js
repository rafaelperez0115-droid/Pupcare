// PupCare Control — Service Worker v6
// Este SW borra TODOS los cachés anteriores y toma control inmediato
const CACHE_NAME = 'pupcare-v6';

self.addEventListener('install', e => {
  e.waitUntil(self.skipWaiting()); // Tomar control inmediato
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => {
        console.log('Borrando caché antigua:', k);
        return caches.delete(k); // Borrar TODOS los cachés anteriores
      }))
    ).then(() => self.clients.claim()) // Tomar control de todas las pestañas
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;
  if (url.includes('firebase') || url.includes('googleapis') || url.includes('cloudinary') || url.includes('open-meteo')) return;

  // Estrategia: Network first, caché como respaldo
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('./'));
});
