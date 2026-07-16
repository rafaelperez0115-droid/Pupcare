// PupCare Control — Service Worker v7
// Estrategia premium: responder desde el almacenamiento del dispositivo
// AL INSTANTE, y actualizar en segundo plano para la próxima apertura.
const CACHE_NAME = 'pupcare-v24';

// Núcleo mínimo que se guarda desde la instalación
const PRECACHE = ['./', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(PRECACHE).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;

  // Datos en vivo: nunca interferir (Firestore, fotos, clima, IA...)
  if (url.includes('firebase') || url.includes('googleapis') ||
      url.includes('cloudinary') || url.includes('open-meteo') ||
      url.includes('cdnjs') || url.includes('dog.ceo') ||
      url.includes('workers.dev')) return;

  // ── Estrategia: caché al instante + actualización en segundo plano ──
  // La app abre inmediata desde el almacenamiento del móvil; mientras,
  // se descarga la versión más nueva en silencio para la próxima vez.
  e.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Las navegaciones (abrir la app) usan siempre el index cacheado
      const req = e.request.mode === 'navigate'
        ? new Request('./', { headers: e.request.headers })
        : e.request;

      const cached = await cache.match(req);

      const fetching = fetch(e.request)
        .then(res => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);

      // Si está en el dispositivo: respuesta instantánea (y refresco silencioso)
      // Si no: esperar la red y guardarla para la próxima
      return cached || fetching.then(r => r || caches.match('./'));
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('./'));
});
