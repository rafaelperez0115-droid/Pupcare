const CACHE = "pupcare-v2";

// Instalar sin bloquear — no falla si un asset no carga
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(["./index.html", "./manifest.json"]).catch(() => {})
    )
  );
  self.skipWaiting();
});

// Activar: limpiar cachés anteriores
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network first, caché como respaldo para assets locales
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);

  // No interceptar APIs externas ni Firebase
  const skip = ["firebase", "firestore", "googleapis", "google", "imgbb", "fonts", "gstatic"];
  if (skip.some((s) => url.hostname.includes(s))) return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
