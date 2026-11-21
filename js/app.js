
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Pantalla de carga: mostrar y ocultar con fundido suave
function showLoadingScreen() {
  const ls = document.getElementById('loadingScreen');
  if (!ls) return;
  ls.classList.remove('loading-hide');
  ls.style.display = 'flex';
}
function hideLoadingScreen() {
  const ls = document.getElementById('loadingScreen');
  if (!ls) return;
  ls.classList.add('loading-hide');
  setTimeout(() => { ls.style.display = 'none'; }, 380);
}
// 🏠 app.js v4 — Nueva navegación 6 tabs
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let currentUser = null;
let currentView = 'inicio';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📳 FEEDBACK HÁPTICO (vibración sutil)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function haptic(pattern = 10) {
  if ('vibrate' in navigator) {
    try { navigator.vibrate(pattern); } catch(e) {}
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👈 SWIPE PARA BORRAR
// Aplica a tarjetas con [data-swipe-delete]. Al deslizar a la
// izquierda revela una acción de borrar.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function setupSwipeToDelete(container) {
  if (!container) return;
  const cards = container.querySelectorAll('[data-swipe-delete]');
  cards.forEach(card => {
    if (card._swipeBound) return;
    card._swipeBound = true;

    let startX = 0, currentX = 0, dragging = false;
    const inner = card.querySelector('.swipe-inner');
    if (!inner) return;

    card.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      dragging = true;
      inner.style.transition = 'none';
    }, { passive: true });

    card.addEventListener('touchmove', (e) => {
      if (!dragging) return;
      currentX = e.touches[0].clientX - startX;
      if (currentX < 0) {
        inner.style.transform = `translateX(${Math.max(currentX, -80)}px)`;
      }
    }, { passive: true });

    card.addEventListener('touchend', () => {
      dragging = false;
      inner.style.transition = 'transform 0.25s ease';
      if (currentX < -40) {
        inner.style.transform = 'translateX(-72px)';
        haptic(10);
      } else {
        inner.style.transform = 'translateX(0)';
      }
      currentX = 0;
    }, { passive: true });
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔄 PULL TO REFRESH (deslizar para actualizar)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function setupPullToRefresh() {
  let startY = 0, pulling = false, pullDistance = 0;
  const THRESHOLD = 70;

  const indicator = document.createElement('div');
  indicator.id = 'pullIndicator';
  indicator.innerHTML = '<div class="pull-spinner">🐾</div>';
  document.body.appendChild(indicator);

  document.addEventListener('touchstart', (e) => {
    // Solo si estamos en el tope de la página y no hay overlay abierto
    if (window.scrollY <= 0 && _scrollLockCount === 0) {
      startY = e.touches[0].clientY;
      pulling = true;
    }
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (!pulling) return;
    pullDistance = e.touches[0].clientY - startY;
    if (pullDistance > 0 && window.scrollY <= 0) {
      const pull = Math.min(pullDistance * 0.5, 90);
      indicator.style.transform = `translateY(${pull}px) translateX(-50%)`;
      indicator.style.opacity = Math.min(pull / THRESHOLD, 1);
      const spinner = indicator.querySelector('.pull-spinner');
      if (spinner) spinner.style.transform = `rotate(${pull * 4}deg)`;
    }
  }, { passive: true });

  document.addEventListener('touchend', async () => {
    if (!pulling) return;
    pulling = false;
    if (pullDistance > THRESHOLD && window.scrollY <= 0) {
      indicator.classList.add('refreshing');
      indicator.style.transform = 'translateY(60px) translateX(-50%)';
      indicator.style.opacity = '1';
      // Recargar vista actual
      if (typeof clearQueryCache === 'function') clearQueryCache();
      await navigate(currentView);
      showToast('✅ Actualizado', 'success', 1500);
    }
    indicator.classList.remove('refreshing');
    indicator.style.transform = 'translateY(0) translateX(-50%)';
    indicator.style.opacity = '0';
    pullDistance = 0;
  }, { passive: true });
}


document.addEventListener('DOMContentLoaded', () => {
  // Tema oscuro siempre (modo claro eliminado)
  document.documentElement.setAttribute('data-theme', 'dark');
  localStorage.setItem('pupcare_theme', 'dark');

  // Cargar tamaño de fuente guardado
  const fontSize = localStorage.getItem('pupcare_fontsize') || 'normal';
  applyFontSize(fontSize);

  showLoadingScreen();
  document.getElementById('authScreen').style.display    = 'none';
  document.getElementById('appShell').style.display      = 'none';

  auth.onAuthStateChanged(async (user) => {
    if (user) { currentUser = user; await initApp(); }
    else { currentUser = null; showAuth(); }
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 AUTH
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function loginWithEmail() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  if (!email || !password) { showToast('Llena todos los campos','error'); return; }
  showLoading(true);
  try {
    await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    await auth.signInWithEmailAndPassword(email, password);
  } catch(e) { showToast(getAuthError(e.code),'error'); showLoading(false); }
}

async function loginWithGoogle() {
  showLoading(true);
  try {
    await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  } catch(e) {
    if (e.code !== 'auth/popup-closed-by-user') showToast(getAuthError(e.code),'error');
    showLoading(false);
  }
}

async function register() {
  const name     = document.getElementById('regName').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  if (!name||!email||!password) { showToast('Llena todos los campos','error'); return; }
  if (password.length<6) { showToast('Contraseña mínimo 6 caracteres','error'); return; }
  showLoading(true);
  try {
    await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName: name });
  } catch(e) { showToast(getAuthError(e.code),'error'); showLoading(false); }
}

async function resetPassword() {
  const email = document.getElementById('forgotEmail').value.trim();
  if (!email) { showToast('Ingresa tu correo','error'); return; }
  showLoading(true);
  try {
    await auth.sendPasswordResetEmail(email);
    showToast('📧 Correo enviado','success'); showLogin();
  } catch(e) { showToast(getAuthError(e.code),'error'); }
  finally { showLoading(false); }
}

async function logout() {
  closeSettings();
  showConfirm('¿Cerrar sesión?','Se cerrará tu sesión en este dispositivo.', async () => {
    showLoading(true);
    try {
      await auth.signOut();
      PET_ID=null; Profile.data=null;
      localStorage.removeItem('pupcare_pet_id');
    } finally { showLoading(false); }
  });
}

function showLogin()          { switchAuthForm('loginForm'); }
function showRegister()       { switchAuthForm('registerForm'); }
function showForgotPassword() { switchAuthForm('forgotForm'); }
function switchAuthForm(id) {
  ['loginForm','registerForm','forgotForm'].forEach(f =>
    document.getElementById(f).style.display = f===id ? 'block':'none'
  );
}
function showAuth() {
  hideLoadingScreen();
  document.getElementById('authScreen').style.display    = 'flex';
  document.getElementById('appShell').style.display      = 'none';
}
function getAuthError(code) {
  const map = {
    'auth/user-not-found':        'No existe cuenta con ese correo',
    'auth/wrong-password':        'Contraseña incorrecta',
    'auth/invalid-credential':    'Correo o contraseña incorrectos',
    'auth/email-already-in-use':  'Ya existe una cuenta con ese correo',
    'auth/invalid-email':         'El correo no es válido',
    'auth/weak-password':         'Contraseña muy débil (mínimo 6 caracteres)',
    'auth/network-request-failed':'Sin conexión a internet',
    'auth/too-many-requests':     'Demasiados intentos. Espera unos minutos',
    'auth/popup-blocked':         'Popup bloqueado. Permite popups para este sitio',
    'auth/cancelled-popup-request':'Inicio con Google cancelado',
    'auth/account-exists-with-different-credential':'Ya existe cuenta con ese correo',
  };
  return map[code]||'Error al autenticar. Intenta de nuevo.';
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 INICIAR APP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function initApp() {
  try {
    showLoadingScreen();
    document.getElementById('authScreen').style.display    = 'none';
    document.getElementById('appShell').style.display      = 'none';

    const savedId = localStorage.getItem('pupcare_pet_id');
    if (savedId) {
      try {
        const doc = await db.collection('pets').doc(savedId).get();
        if (doc.exists) {
          PET_ID=savedId; Profile.data={id:doc.id,...doc.data()};
        } else {
          localStorage.removeItem('pupcare_pet_id'); PET_ID=null; Profile.data=null;
        }
      } catch(e) { console.error(e); PET_ID=savedId; }
    } else {
      try {
        const snap = await db.collection('pets')
          .where('ownerId','==',currentUser.uid).limit(1).get();
        if (!snap.empty) {
          PET_ID=snap.docs[0].id;
          Profile.data={id:PET_ID,...snap.docs[0].data()};
          localStorage.setItem('pupcare_pet_id',PET_ID);
        } else if (typeof isDemoUser === 'function' && isDemoUser()) {
          // Usuario demo sin datos: sembrar mascota de ejemplo
          const demoPetId = await seedDemoData();
          const demoDoc = await db.collection('pets').doc(demoPetId).get();
          PET_ID = demoPetId;
          Profile.data = { id: demoPetId, ...demoDoc.data() };
          localStorage.setItem('pupcare_pet_id', demoPetId);
        }
      } catch(e) { console.error(e); }
    }

    if (Profile.data) {
      Profile.updateHeader();
      updateHeaderPhoto(Profile.data.photoUrl);
      updatePetTitle(Profile.data.name);
    }

    hideLoadingScreen();
    document.getElementById('appShell').style.display      = 'block';

    // Banner de modo demo
    if (typeof isDemoUser === 'function' && isDemoUser()) {
      showDemoBanner();
    }

    // Guía "Agregar a inicio" (si la app no está instalada)
    if (typeof InstallGuide !== 'undefined') InstallGuide.init();

    // Gesto de retroceso estilo app nativa
    setupBackGesture();

    // Aceptación de términos (usuarios nuevos o tras actualización de términos)
    checkTermsGate();

    // Activar detector de conexión
    setupOfflineDetection();

    // Inicializar notificaciones
    initNotifications();
    checkTaskNotifications();

    // Activar pull-to-refresh
    setupPullToRefresh();

    // Auto-ocultar FAB al hacer scroll
    setupFabAutoHide();

    // Deep link: si la app se abrió desde un acceso directo (?view=salud)
    const vistaInicial = (() => {
      const v = new URLSearchParams(location.search).get('view');
      return ['inicio','salud','comida','cuidados','album','perfil'].includes(v) ? v : 'inicio';
    })();
    await navigate(vistaInicial);

  } catch(e) {
    console.error(e);
    hideLoadingScreen();
    document.getElementById('appShell').style.display      = 'block';
    await navigate('inicio');
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧭 NAVEGACIÓN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function navigate(view) {
  if (!PET_ID && view !== 'perfil' && view !== 'inicio') {
    showToast('Primero configura el perfil de tu mascota 🐾','info');
    view = 'perfil';
  }

  // Red de seguridad: garantizar que el scroll no quede bloqueado
  if (typeof forceUnlockScroll === 'function') forceUnlockScroll();

  // Cambio visual de vista (agrupado para poder animarlo)
  const switchView = () => {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const t = document.getElementById(`view-${view}`);
    if (t) t.classList.add('active');

    // Bienestar agrupa Salud y Cuidados: se ilumina con cualquiera de las dos
    if (view === 'salud' || view === 'cuidados') window._lastWellness = view;
    document.querySelectorAll('.tab-btn').forEach(b => {
      const vistas = (b.dataset.views || b.dataset.view || '').split(',');
      b.classList.toggle('active', vistas.includes(view));
    });
  };

  // Transición nativa suave entre vistas (Chrome/Android).
  // En navegadores sin soporte, la animación CSS de .view.active hace el trabajo.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (document.startViewTransition && !reduceMotion && currentView !== view) {
    document.startViewTransition(switchView);
  } else {
    switchView();
  }

  // Volver al inicio de la pantalla al cambiar de vista (sensación de app nativa)
  window.scrollTo({ top: 0, behavior: 'instant' });
  document.querySelector('.main-content')?.scrollTo({ top: 0, behavior: 'instant' });

  currentView = view;
  removeFAB();

  try {
    if (view==='inicio')   await Home.render();
    if (view==='salud')    await Health.render();
    if (view==='comida')   await Feeding.render();
    if (view==='cuidados') await Care.render();
    if (view==='album')    await Album.render();
    if (view==='perfil')   await Profile.render();
  } catch(e) {
    console.error('Error cargando vista:', view, e);
    showToast('Error al cargar la sección','error');
  }

  // Confirmar scroll arriba tras renderizar (por si el contenido asíncrono movió la vista)
  window.scrollTo({ top: 0, behavior: 'instant' });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ SETTINGS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💀 SKELETON HELPERS (Fase 2)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Skeleton de filas tipo lista (tareas, actividades, registros de salud)
function skeletonList(count = 3) {
  let html = '';
  for (let i = 0; i < count; i++) {
    html += `
      <div class="skeleton-card">
        <div class="skeleton-row">
          <div class="skeleton sk-circle"></div>
          <div class="skeleton-lines">
            <div class="skeleton sk-line lg"></div>
            <div class="skeleton sk-line sm"></div>
          </div>
        </div>
      </div>`;
  }
  return html;
}

// Skeleton de tarjetas de info (grid 2x2 del dashboard)
function skeletonInfoCards(count = 4) {
  let html = '';
  for (let i = 0; i < count; i++) {
    html += `
      <div class="info-card">
        <div class="skeleton sk-line sm" style="margin-bottom:10px;"></div>
        <div class="skeleton sk-line lg" style="margin-bottom:6px;"></div>
        <div class="skeleton sk-line sm"></div>
      </div>`;
  }
  return html;
}

// Skeleton de grilla del álbum
function skeletonAlbum(count = 9) {
  let html = '<div class="skeleton-album">';
  for (let i = 0; i < count; i++) {
    html += '<div class="skeleton sk-photo"></div>';
  }
  html += '</div>';
  return html;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔒 SISTEMA DE BLOQUEO DE SCROLL (sensación nativa)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let _scrollLockCount = 0;   // contador para overlays apilados
let _savedScrollY = 0;

function lockBodyScroll() {
  // Solo bloquear en el primer overlay (soporta modales apilados)
  if (_scrollLockCount === 0) {
    _savedScrollY = window.scrollY || window.pageYOffset || 0;
    document.body.style.top = `-${_savedScrollY}px`;
    document.body.classList.add('modal-open');
  }
  _scrollLockCount++;
}

function unlockBodyScroll() {
  _scrollLockCount = Math.max(0, _scrollLockCount - 1);
  // Solo desbloquear cuando se cierran TODOS los overlays
  if (_scrollLockCount === 0) {
    document.body.classList.remove('modal-open');
    document.body.style.top = '';
    window.scrollTo(0, _savedScrollY);
  }
}

// Red de seguridad: forzar desbloqueo total del scroll.
// Se llama al navegar entre pantallas para garantizar que la app
// nunca quede "congelada" aunque el contador se haya descuadrado.
function forceUnlockScroll() {
  _scrollLockCount = 0;
  document.body.classList.remove('modal-open');
  document.body.style.top = '';
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ SETTINGS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function openSettings() {
  const panel = document.getElementById('settingsPanel');
  const wasOpen = panel.style.display === 'flex';
  // Mostrar opción de reiniciar demo solo si es usuario demo
  const resetRow = document.getElementById('resetDemoRow');
  if (resetRow) {
    resetRow.style.display = (typeof isDemoUser === 'function' && isDemoUser()) ? 'flex' : 'none';
  }
  // La cuenta demo es compartida: ocultar "Eliminar mi cuenta" para evitar confusiones
  const deleteRow = document.getElementById('deleteAccountRow');
  if (deleteRow) {
    deleteRow.style.display = (typeof isDemoUser === 'function' && isDemoUser()) ? 'none' : 'flex';
  }
  // Reflejar el estado REAL de los avisos push (no el texto de fábrica)
  if (typeof Push !== 'undefined' && Push.refreshRow) Push.refreshRow();
  // Abrir siempre desde arriba (no recordar el scroll anterior)
  const sheet = panel.querySelector('.panel-sheet');
  if (sheet) sheet.scrollTop = 0;
  panel.style.display = 'flex';
  requestAnimationFrame(() => panel.classList.add('overlay-visible'));
  if (!wasOpen) lockBodyScroll();
}
function closeSettings(e) {
  if (!e || e.target === document.getElementById('settingsPanel')) {
    const panel = document.getElementById('settingsPanel');
    if (panel.style.display !== 'flex') return;
    panel.classList.remove('overlay-visible');
    setTimeout(() => { panel.style.display = 'none'; }, 250);
    unlockBodyScroll();
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎨 TEMA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function toggleTheme() {
  // Modo claro eliminado — la app usa siempre tema oscuro
}
function updateThemeLabel(theme) {
  // Sin efecto (modo claro eliminado)
}

// ── Tamaño de fuente ──
function setFontSize(size) {
  applyFontSize(size);
  localStorage.setItem('pupcare_fontsize', size);
  // No cerrar settings para que el usuario vea el cambio en vivo
}

function applyFontSize(size) {
  document.documentElement.setAttribute('data-fontsize', size);

  // Actualizar label
  const labels = { small:'Pequeño', normal:'Normal', large:'Grande', xlarge:'Muy Grande' };
  const labelEl = document.getElementById('fontSizeLabel');
  if (labelEl) labelEl.textContent = labels[size] || 'Normal';

  // Actualizar botones activos
  document.querySelectorAll('.font-size-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.size === size);
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🖼️ HEADER PHOTO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function updateHeaderPhoto(url) {
  const el = document.getElementById('headerPhoto');
  if (el && url) el.src = url;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🐾 SELECTOR DE MÚLTIPLES MASCOTAS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function updatePetTitle(name) {
  const el = document.getElementById('headerPetTitle');
  if (el) {
    el.innerHTML = `${sanitize(name || 'PupCare')} <span style="font-size:0.7em;color:var(--text2);">▾</span>`;
  }
}

async function openPetSelector() {
  const panel = document.getElementById('petSelectorPanel');
  const list  = document.getElementById('petSelectorList');
  if (!panel || !list) return;

  const wasOpen = panel.style.display === 'flex';
  panel.style.display = 'flex';
  requestAnimationFrame(() => panel.classList.add('overlay-visible'));
  if (!wasOpen) lockBodyScroll();
  list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text2);">Cargando...</div>';

  try {
    const snap = await db.collection('pets')
      .where('ownerId', '==', currentUser.uid)
      .get();

    if (snap.empty) {