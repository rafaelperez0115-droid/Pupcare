/**
 * Service Worker - PupCare PWA
 * Estrategia: Cache-first para assets, Network-first para datos
 * @version 2.0.0
 */

const CACHE_NAME      = 'pupcare-v2';
const ASSETS_CACHE    = 'pupcare-assets-v2';
const DATA_CACHE      = 'pupcare-data-v2';

// Archivos que se cachean durante la instalación
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/css/components/components.css',
  '/src/js/utils/validation.js',
  '/src/js/utils/logger.js',
  '/src/js/utils/storage.js',
  '/src/js/utils/ui-helpers.js',
  '/src/js/modules/auth.js',
  '/src/js/modules/pets.js',
  '/src/js/modules/health.js',
  '/src/js/modules/feeding.js',
  '/src/js/app.js'
];

// Dominios externos a cachear
const EXTERNAL_CACHE_URLS = [
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com'
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 INSTALACIÓN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando PupCare v2...');

  event.waitUntil(
    caches.open(ASSETS_CACHE)
      .then((cache) => {
        console.log('[SW] Pre-cacheando assets...');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Assets pre-cacheados ✅');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Error en pre-caché:', error);
      })
  );
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔄 ACTIVACIÓN — Limpiar cachés viejas
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando PupCare v2...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        const validCaches = [CACHE_NAME, ASSETS_CACHE, DATA_CACHE];
        return Promise.all(
          cacheNames
            .filter((name) => !validCaches.includes(name))
            .map((name) => {
              console.log('[SW] Eliminando caché antigua:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activado ✅');
        return self.clients.claim();
      })
  );
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌐 INTERCEPCIÓN DE REQUESTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignorar requests no GET
  if (event.request.method !== 'GET') return;

  // Ignorar Firebase (necesita red siempre)
  if (isFirebaseRequest(url)) return;

  // Ignorar extensiones del navegador
  if (url.protocol === 'chrome-extension:') return;

  // Fonts de Google: Cache-first
  if (isGoogleFont(url)) {
    event.respondWith(cacheFirst(event.request, ASSETS_CACHE));
    return;
  }

  // Assets locales (JS, CSS, imágenes): Cache-first
  if (isLocalAsset(url)) {
    event.respondWith(cacheFirst(event.request, ASSETS_CACHE));
    return;
  }

  // Navegación (HTML): Network-first con fallback a index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirstWithFallback(event.request));
    return;
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📬 NOTIFICACIONES PUSH (futuro)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'PupCare', body: event.data.text() };
  }

  const options = {
    body: data.body || 'Tienes un recordatorio pendiente',
    icon: '/assets/icons/icon-192.png',
    badge: '/assets/icons/badge-72.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Ver ahora' },
      { action: 'dismiss', title: 'Ignorar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '🐾 PupCare', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        const client = clientList.find((c) => c.url === url && 'focus' in c);
        return client ? client.focus() : clients.openWindow(url);
      })
  );
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔧 ESTRATEGIAS DE CACHÉ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Cache-first: sirve desde caché, actualiza en background
 */
async function cacheFirst(request, cacheName = ASSETS_CACHE) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Sin conexión y sin caché disponible', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

/**
 * Network-first: intenta red, cae a caché, cae a index.html
 */
async function networkFirstWithFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(ASSETS_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Fallback a index.html para SPA
    const fallback = await caches.match('/index.html');
    return fallback || new Response('Sin conexión', { status: 503 });
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔍 HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function isFirebaseRequest(url) {
  return url.hostname.includes('firebase') ||
         url.hostname.includes('firebaseio') ||
         url.hostname.includes('googleapis') ||
         url.hostname.includes('gstatic') && url.pathname.includes('firebase');
}

function isGoogleFont(url) {
  return url.hostname === 'fonts.googleapis.com' ||
         url.hostname === 'fonts.gstatic.com';
}

function isLocalAsset(url) {
  return url.origin === self.location.origin && (
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.svg')
  );
}
