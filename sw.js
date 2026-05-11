const CACHE = "pupcare-v1";
const ASSETS = [
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// Instalar: cachear los archivos principales
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activar: limpiar cachés viejos
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: red primero, caché como respaldo
self.addEventListener("fetch", (e) => {
  // Solo interceptar peticiones GET del mismo origen o activos locales
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  // No interceptar llamadas a Firebase, ImgBB ni APIs externas
  if (
    url.hostname.includes("firebase") ||
    url.hostname.includes("google") ||
    url.hostname.includes("imgbb") ||
    url.hostname.includes("googleapis") ||
    url.hostname.includes("fonts")
  ) return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // Guardar copia fresca en caché
        const clone = res.clone();
        caches.open(CACHE).then((cache) => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
