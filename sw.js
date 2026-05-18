// ─────────────────────────────────────────────
//  PupCare — Service Worker v4
//  Estrategia: Network-first con fallback a caché.
//  Agnóstico de rutas: funciona en /, /Pupcare/, etc.
// ─────────────────────────────────────────────

const CACHE_NAME = "pupcare-v4";

// Recursos del shell de la app a pre-cachear en el install.
// Se usan rutas RELATIVAS al scope del SW para ser agnósticos
// de la URL base (GitHub Pages, Netlify, Vercel, subdir, etc.)
const SHELL_ASSETS = [
  "./",           // equivale al start_url relativo
  "./index.html",
  "./manifest.json",
];

// Dominios externos que NUNCA se interceptan (Firebase, ImgBB, Google Fonts…)
const BYPASS_HOSTNAMES = [
  "firebaseapp.com",
  "firestore.googleapis.com",
  "identitytoolkit.googleapis.com",
  "securetoken.googleapis.com",
  "googleapis.com",
  "gstatic.com",
  "fonts.gstatic.com",
  "api.imgbb.com",
  "i.ibb.co",
];

// ── INSTALL: pre-cachea el shell ─────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting()) // activa el nuevo SW de inmediato
  );
});

// ── ACTIVATE: limpia cachés antiguas ─────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim()) // toma control de las pestañas abiertas
  );
});

// ── FETCH: Network-first con fallback a caché ─────────────────
self.addEventListener("fetch", (event) => {
  // Solo interceptamos GET
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Dejamos pasar peticiones a dominios externos (Firebase, fonts, CDNs…)
  if (BYPASS_HOSTNAMES.some((hostname) => url.hostname.includes(hostname))) {
    return;
  }

  // Solo cacheamos peticiones del mismo origen
  if (url.origin !== self.location.origin) return;

  event.respondWith(networkFirst(event.request));
});

/**
 * Estrategia Network-First:
 * 1. Intenta la red → si responde 200, actualiza la caché y devuelve la respuesta.
 * 2. Si la red falla (offline) → sirve desde caché.
 * 3. Si tampoco está en caché → devuelve el shell (index.html) para el routing SPA.
 */
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.status === 200) {
      // Clona antes de consumir (Response solo se puede leer una vez)
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch {
    // Sin red → busca en caché
    const cached = await cache.match(request);
    if (cached) return cached;

    // Si no está en caché (petición de navegación SPA), sirve el shell
    if (request.destination === "document") {
      const shell = await cache.match("./index.html");
      if (shell) return shell;
    }

    // Último recurso: respuesta de error limpia
    return new Response("Contenido no disponible sin conexión.", {
      status: 503,
      statusText: "Service Unavailable",
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
