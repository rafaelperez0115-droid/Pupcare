// PupCare — Firebase Config v6
const firebaseConfig = {
  apiKey:            "AIzaSyAk4PzQNaY0n8aEwv4cHHtL-3aF-kZo1hg",
  authDomain:        "pupcarev1.firebaseapp.com",
  projectId:         "pupcarev1",
  storageBucket:     "pupcarev1.firebasestorage.app",
  messagingSenderId: "447957068017",
  appId:             "1:447957068017:web:3963660edd8b9a9265a150"
};
firebase.initializeApp(firebaseConfig);
const auth    = firebase.auth();
const db      = firebase.firestore();
const storage = firebase.storage();

// 💾 Persistencia offline: guarda los datos en el dispositivo.
// - Reduce mucho las lecturas de Firestore (ahorra cuota gratuita)
// - La app funciona con datos recientes aunque no haya conexión
// Debe activarse ANTES de cualquier consulta a Firestore.
db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
  // 'failed-precondition': varias pestañas sin sincronizar → seguir sin caché
  // 'unimplemented': navegador sin soporte → seguir sin caché
  console.warn('Persistencia offline no disponible:', err.code);
});

let PET_ID = localStorage.getItem('pupcare_pet_id') || null;
