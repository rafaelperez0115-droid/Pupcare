// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔔 Service Worker de Firebase Messaging
// Recibe las notificaciones push cuando la app está CERRADA
// o en segundo plano, y las muestra en el sistema.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            "AIzaSyAk4PzQNaY0n8aEwv4cHHtL-3aF-kZo1hg",
  authDomain:        "pupcarev1.firebaseapp.com",
  projectId:         "pupcarev1",
  storageBucket:     "pupcarev1.firebasestorage.app",
  messagingSenderId: "447957068017",
  appId:             "1:447957068017:web:3963660edd8b9a9265a150"
});

const messaging = firebase.messaging();

// Notificación recibida con la app cerrada / en segundo plano
messaging.onBackgroundMessage((payload) => {
  const n = payload.notification || {};
  const d = payload.data || {};

  self.registration.showNotification(n.title || '🐾 PupCare', {
    body: n.body || 'Tienes un recordatorio pendiente',
    icon: 'assets/icons/icon-192.png',
    badge: 'assets/icons/icon-192.png',
    tag: d.tag || 'pupcare-reminder',
    data: { url: d.url || './' },
  });
});

// Al tocar la notificación: abrir o enfocar la app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || './';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      return clients.openWindow(url);
    })
  );
});
