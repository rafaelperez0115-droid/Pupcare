// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎮 MODO DEMO — Usuario de prueba con datos ficticios
// Cuenta fija en Firebase. Al entrar por primera vez, siembra
// una mascota de ejemplo con datos realistas en Firestore.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const DEMO_CREDENTIALS = {
  email: 'demo@pupcare.app',
  password: 'demo123456',
};

// Fotos de ejemplo (perros de dominio público / Unsplash)
const DEMO_PHOTOS = [
  'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800',
  'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800',
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800',
  'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800',
  'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=800',
  'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=800',
];

// Helper: fecha relativa a hoy (días hacia atrás/adelante)
function demoDate(daysOffset) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().slice(0, 10);
}

// ── Iniciar sesión como demo ──
async function loginAsDemo() {
  showLoading(true);
  try {
    await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    // Intentar iniciar sesión; si la cuenta no existe, crearla
    try {
      await auth.signInWithEmailAndPassword(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password);
    } catch(e) {
      if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
        const cred = await auth.createUserWithEmailAndPassword(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password);
        await cred.user.updateProfile({ displayName: 'Usuario Demo' });
      } else {
        throw e;
      }
    }
    // La siembra de datos ocurre en initApp si detecta que es demo y no hay mascota
  } catch(e) {
    showToast(getAuthError(e.code) || 'Error al entrar en modo demo', 'error');
    showLoading(false);
  }
}

// ── ¿El usuario actual es el demo? ──
function isDemoUser() {
  return currentUser && currentUser.email === DEMO_CREDENTIALS.email;
}

// ── Sembrar datos demo (solo si no existen) ──
async function seedDemoData() {
  // Verificar si ya hay una mascota demo
  const existing = await db.collection('pets')
    .where('ownerId', '==', currentUser.uid).limit(1).get();
  if (!existing.empty) {
    // Ya tiene datos, usar esa mascota
    return existing.docs[0].id;
  }

  showToast('🎮 Preparando datos de demostración...', 'info');

  // 1. Crear la mascota demo
  const petData = {
    ownerId: currentUser.uid,
    name: 'Rocky',
    breed: 'Labrador Retriever',
    birthDate: demoDate(-300), // ~10 meses
    sex: 'Macho',
    currentWeight: 28.5,
    weightUnit: 'kg',
    photoUrl: DEMO_PHOTOS[0],
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  };
  const petRefDoc = await db.collection('pets').add(petData);
  const petId = petRefDoc.id;
  const sub = (col) => db.collection('pets').doc(petId).collection(col);

  // 2. Vacunas
  const vaccines = [
    { name: 'Antirrábica', date: demoDate(-180), nextDate: demoDate(185), brand: 'Nobivac', notes: 'Sin reacciones' },
    { name: 'Parvovirus', date: demoDate(-200), nextDate: demoDate(165), brand: 'Vanguard', notes: '' },
    { name: 'Moquillo', date: demoDate(-200), nextDate: demoDate(165), brand: 'Vanguard', notes: 'Refuerzo anual' },
  ];

  // 3. Desparasitaciones
  const dewormings = [
    { product: 'Drontal Plus', type: 'Interna', date: demoDate(-90), nextDate: demoDate(0), dose: '1 comprimido' },
    { product: 'Bravecto', type: 'Externa', date: demoDate(-60), nextDate: demoDate(30), dose: '1 tableta' },
  ];

  // 4. Visitas veterinarias
  const vetVisits = [
    { reason: 'Chequeo general', date: demoDate(-90), vet: 'Dra. Martínez', diagnosis: 'Saludable', treatment: 'Ninguno', cost: 45 },
    { reason: 'Vacunación', date: demoDate(-180), vet: 'Dr. López', diagnosis: 'Óptimo', treatment: 'Vacunas al día', cost: 60 },
  ];

  // 5. Medicamentos
  const medications = [
    { name: 'Omega 3', dose: '1 cápsula', frequency: 'Una vez al día', startDate: demoDate(-30), endDate: null, active: true, notes: 'Para el pelaje' },
  ];

  // 6. Notas de comportamiento
  const behaviorNotes = [
    { mood: 'Feliz', text: 'Muy juguetón hoy, comió bien y durmió toda la noche.', date: demoDate(-2), photoUrl: null },
    { mood: 'Normal', text: 'Día tranquilo, paseo por la tarde.', date: demoDate(-5), photoUrl: null },
  ];

  // 7. Actividades
  const activities = [
    { type: 'Paseo', date: demoDate(-1), duration: '30 min', distance: '2 km', note: 'Parque central' },
    { type: 'Juego', date: demoDate(-2), duration: '20 min', distance: '', note: 'Pelota en el jardín' },
    { type: 'Entrenamiento', date: demoDate(-4), duration: '15 min', distance: '', note: 'Práctica de "sentado"' },
  ];

  // 8. Tareas
  const tasks = [
    { type: 'Baño', dueDate: demoDate(3), completed: false },
    { type: 'Corte de uñas', dueDate: demoDate(7), completed: false },
  ];

  // 9. Cuidados
  const care = [
    { type: 'Baño', date: demoDate(-10), note: 'Champú hipoalergénico' },
    { type: 'Cepillado', date: demoDate(-3), note: '' },
  ];

  // 10. Plan de alimentación
  const feedingPlan = {
    dailyGrams: 350, brand: 'Royal Canin', mealsPerDay: 2, notes: 'Mañana y noche',
  };

  // 11. Historial de peso
  const weightHistory = [
    { weight: 12, unit: 'kg', date: demoDate(-240), recordedAt: firebase.firestore.FieldValue.serverTimestamp() },
    { weight: 18, unit: 'kg', date: demoDate(-150), recordedAt: firebase.firestore.FieldValue.serverTimestamp() },
    { weight: 24, unit: 'kg', date: demoDate(-60), recordedAt: firebase.firestore.FieldValue.serverTimestamp() },
    { weight: 28.5, unit: 'kg', date: demoDate(-5), recordedAt: firebase.firestore.FieldValue.serverTimestamp() },
  ];

  // Ejecutar toda la siembra en lote
  const now = firebase.firestore.FieldValue.serverTimestamp();
  const batch = db.batch();

  vaccines.forEach(v => batch.set(sub('vaccines').doc(), { ...v, createdAt: now }));
  dewormings.forEach(d => batch.set(sub('dewormings').doc(), { ...d, createdAt: now }));
  vetVisits.forEach(v => batch.set(sub('vetVisits').doc(), { ...v, createdAt: now }));
  medications.forEach(m => batch.set(sub('medications').doc(), { ...m, createdAt: now }));
  behaviorNotes.forEach(n => batch.set(sub('behaviorNotes').doc(), { ...n, createdAt: now }));
  activities.forEach(a => batch.set(sub('activities').doc(), { ...a, createdAt: now }));
  tasks.forEach(t => batch.set(sub('tasks').doc(), { ...t, createdAt: now }));
  care.forEach(c => batch.set(sub('care').doc(), { ...c, createdAt: now }));
  weightHistory.forEach(w => batch.set(sub('weightHistory').doc(), w));
  batch.set(sub('feedingPlan').doc('current'), feedingPlan);

  // Fotos del álbum (repartidas en meses distintos para el análisis IA)
  DEMO_PHOTOS.forEach((url, i) => {
    batch.set(sub('photos').doc(), {
      url,
      caption: ['Cachorro','Creciendo','En el parque','Jugando','Descansando','Feliz'][i] || 'Foto',
      date: demoDate(-30 * (DEMO_PHOTOS.length - i)),
      createdAt: now,
    });
  });

  await batch.commit();
  return petId;
}

// ── Mostrar banner de modo demo ──
function showDemoBanner() {
  if (document.getElementById('demoBanner')) return;
  const banner = document.createElement('div');
  banner.id = 'demoBanner';
  banner.className = 'demo-banner';
  banner.innerHTML = `
    🎮 Estás en modo demo — los datos son de ejemplo
    <button onclick="logout()">Salir</button>
  `;
  const shell = document.getElementById('appShell');
  if (shell) shell.insertBefore(banner, shell.firstChild);
}
