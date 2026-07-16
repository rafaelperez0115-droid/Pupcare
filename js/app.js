// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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

  document.getElementById('loadingScreen').style.display = 'flex';
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
  document.getElementById('loadingScreen').style.display = 'none';
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
    document.getElementById('loadingScreen').style.display = 'flex';
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

    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('appShell').style.display      = 'block';

    // Banner de modo demo
    if (typeof isDemoUser === 'function' && isDemoUser()) {
      showDemoBanner();
    }

    // Guía "Agregar a inicio" (si la app no está instalada)
    if (typeof InstallGuide !== 'undefined') InstallGuide.init();

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
    document.getElementById('loadingScreen').style.display = 'none';
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

    document.querySelectorAll('.tab-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.view === view)
    );
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
  // Reflejar el estado REAL de los avisos push (no el texto de fábrica)
  if (typeof Push !== 'undefined' && Push.refreshRow) Push.refreshRow();
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
      list.innerHTML = `
        <div class="pet-select-add" onclick="addNewPet()">
          <div class="pet-select-add-icon">+</div>
          <div>Agregar tu primera mascota</div>
        </div>`;
      return;
    }

    // Ordenar por fecha de creación
    const pets = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    pets.sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() || 0;
      const tb = b.createdAt?.toMillis?.() || 0;
      return ta - tb;
    });

    list.innerHTML = pets.map(p => `
      <div class="pet-select-item ${p.id === PET_ID ? 'active' : ''}" onclick="switchPet('${p.id}')">
        <img class="pet-select-avatar" src="${p.photoUrl || 'assets/icons/paw.svg'}" alt="${sanitize(p.name)}">
        <div class="pet-select-info">
          <div class="pet-select-name">${sanitize(p.name)}</div>
          <div class="pet-select-breed">${sanitize(p.breed || 'Sin raza')}${p.birthDate ? ' · ' + calcAge(p.birthDate) : ''}</div>
        </div>
        ${p.id === PET_ID ? '<div class="pet-select-check">✓</div>' : ''}
      </div>
    `).join('') + `
      <div class="pet-select-add" onclick="addNewPet()">
        <div class="pet-select-add-icon">+</div>
        <div>Agregar otra mascota</div>
      </div>`;

  } catch(e) {
    console.error('Error cargando mascotas:', e);
    list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text2);">Error al cargar</div>';
  }
}

function closePetSelector(e) {
  if (!e || e.target === document.getElementById('petSelectorPanel')) {
    const panel = document.getElementById('petSelectorPanel');
    if (panel.style.display !== 'flex') return;
    panel.classList.remove('overlay-visible');
    setTimeout(() => { panel.style.display = 'none'; }, 250);
    unlockBodyScroll();
  }
}

async function switchPet(petId) {
  if (petId === PET_ID) { closePetSelector(); return; }

  showLoading(true);
  try {
    const doc = await db.collection('pets').doc(petId).get();
    if (!doc.exists) { showToast('Mascota no encontrada', 'error'); showLoading(false); return; }

    PET_ID = petId;
    localStorage.setItem('pupcare_pet_id', petId);
    Profile.data = { id: doc.id, ...doc.data() };

    // Limpiar cachés (nueva mascota, datos distintos)
    if (typeof clearQueryCache === 'function') clearQueryCache();
    if (typeof invalidateSearchCache === 'function') invalidateSearchCache();

    updateHeaderPhoto(Profile.data.photoUrl);
    updatePetTitle(Profile.data.name);
    Profile.updateHeader();

    closePetSelector();
    document.getElementById('petSelectorPanel').style.display = 'none';

    showToast(`🐾 Ahora viendo a ${Profile.data.name}`, 'success');

    // Recargar la vista actual con los datos de la nueva mascota
    await navigate('inicio');

  } catch(e) {
    console.error('Error cambiando de mascota:', e);
    showToast('Error al cambiar de mascota', 'error');
  } finally {
    showLoading(false);
  }
}

function addNewPet() {
  closePetSelector();
  document.getElementById('petSelectorPanel').style.display = 'none';

  // Guardar temporalmente el PET_ID actual y limpiar para crear uno nuevo
  const previousPetId = PET_ID;
  PET_ID = null;
  Profile.data = null;

  // Ir al perfil que mostrará el formulario de creación
  navigate('perfil');
  showToast('Completa los datos de la nueva mascota', 'info');

  // Guardar el ID anterior por si cancela (para restaurar)
  window._previousPetId = previousPetId;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📡 DETECTOR DE CONEXIÓN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function setupOfflineDetection() {
  function updateBanner() {
    const banner = document.getElementById('offlineBanner');
    if (!banner) return;
    const offline = !navigator.onLine;
    banner.style.display = offline ? 'flex' : 'none';
    document.body.classList.toggle('is-offline', offline);
    if (!offline && banner._wasOffline) {
      showToast('✅ Conexión restaurada', 'success');
    }
    banner._wasOffline = offline;
  }
  window.addEventListener('online',  updateBanner);
  window.addEventListener('offline', updateBanner);
  updateBanner(); // Verificar estado inicial
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔔 NOTIFICACIONES PUSH DE TAREAS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function initNotifications() {
  const saved = localStorage.getItem('pupcare_notifications');
  updateNotifUI(saved === 'enabled');
}

function updateNotifUI(enabled) {
  const label  = document.getElementById('notifLabel');
  const toggle = document.getElementById('notifToggle');
  if (label)  label.textContent = enabled ? 'Activadas' : 'Desactivadas';
  if (toggle) toggle.classList.toggle('active', enabled);
}

async function toggleNotifications() {
  if (!('Notification' in window)) {
    showToast('Tu navegador no soporta notificaciones', 'error');
    return;
  }
  const current = localStorage.getItem('pupcare_notifications') === 'enabled';
  if (current) {
    localStorage.setItem('pupcare_notifications', 'disabled');
    updateNotifUI(false);
    showToast('🔕 Notificaciones desactivadas', 'info');
  } else {
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      localStorage.setItem('pupcare_notifications', 'enabled');
      localStorage.removeItem('pupcare_lastNotifCheck');
      updateNotifUI(true);
      showToast('🔔 Notificaciones activadas', 'success');
      await checkTaskNotifications();
    } else {
      showToast('❌ Permiso denegado — actívalo en Configuración del navegador', 'error');
    }
  }
}

async function checkTaskNotifications() {
  if (!PET_ID) return;
  if (Notification.permission !== 'granted') return;
  if (localStorage.getItem('pupcare_notifications') !== 'enabled') return;

  // Solo verificar una vez por día
  const lastCheck = localStorage.getItem('pupcare_lastNotifCheck');
  const todayStr  = today();
  if (lastCheck === todayStr) return;

  try {
    let snap;
    try {
      snap = await subRef('tasks')
        .where('completed','==',false)
        .orderBy('dueDate','asc').get();
    } catch {
      snap = await subRef('tasks').where('completed','==',false).get();
    }

    if (snap.empty) return;

    const todayDate = new Date(); todayDate.setHours(0,0,0,0);
    const overdue = [], dueToday = [], dueTomorrow = [];

    snap.docs.forEach(doc => {
      const d    = doc.data();
      const due  = new Date(d.dueDate + 'T00:00:00');
      const diff = Math.ceil((due - todayDate) / 86400000);
      if (diff < 0)       overdue.push(d.type);
      else if (diff === 0) dueToday.push(d.type);
      else if (diff === 1) dueTomorrow.push(d.type);
    });

    const total = overdue.length + dueToday.length + dueTomorrow.length;
    if (total === 0) { localStorage.setItem('pupcare_lastNotifCheck', todayStr); return; }

    let body = '';
    if (overdue.length)    body += `⚠️ Vencidas: ${overdue.join(', ')}. `;
    if (dueToday.length)   body += `📅 Hoy: ${dueToday.join(', ')}. `;
    if (dueTomorrow.length) body += `⏰ Mañana: ${dueTomorrow.join(', ')}.`;

    // Mostrar notificación via Service Worker si está disponible
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) {
        await reg.showNotification(`PupCare 🐾 — ${total} tarea${total>1?'s':''} pendiente${total>1?'s':''}`, {
          body:    body.trim(),
          icon:    'assets/icons/icon-192.png',
          badge:   'assets/icons/paw.svg',
          tag:     'pupcare-tasks',
          vibrate: [200, 100, 200],
          data:    { url: window.location.href },
        });
        localStorage.setItem('pupcare_lastNotifCheck', todayStr);
        return;
      }
    }
    // Fallback: notificación nativa del navegador
    new Notification(`PupCare 🐾 — ${total} tarea${total>1?'s':''} pendiente${total>1?'s':''}`, {
      body: body.trim(),
      icon: 'assets/icons/icon-192.png',
    });
    localStorage.setItem('pupcare_lastNotifCheck', todayStr);

  } catch(e) {
    console.warn('Error en notificaciones:', e);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🗂️ MODAL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function openModal(title, bodyHtml) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML    = bodyHtml;
  const modal = document.getElementById('modal');
  const wasOpen = modal.style.display === 'flex';
  modal.style.display = 'flex';
  requestAnimationFrame(() => modal.classList.add('overlay-visible'));
  // Solo bloquear si el modal NO estaba ya abierto (evita descuadrar el contador)
  if (!wasOpen) lockBodyScroll();
}
function closeModal() {
  const modal = document.getElementById('modal');
  if (modal.style.display !== 'flex') return; // ya está cerrado, no desbloquear de más
  modal.classList.remove('overlay-visible');
  setTimeout(() => {
    modal.style.display = 'none';
    document.getElementById('modalBody').innerHTML = '';
  }, 250);
  unlockBodyScroll();
}
function handleModalClick(e) {
  if (e.target===document.getElementById('modal')) closeModal();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ❓ CONFIRM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function showConfirm(title, msg, onOk) {
  document.getElementById('confirmTitle').textContent    = title;
  document.getElementById('confirmMsg').textContent      = msg;
  const dialog = document.getElementById('confirmDialog');
  const wasOpen = dialog.style.display === 'flex';
  dialog.style.display = 'flex';
  requestAnimationFrame(() => dialog.classList.add('overlay-visible'));
  if (!wasOpen) lockBodyScroll();
  const btn=document.getElementById('confirmOkBtn');
  const nb=btn.cloneNode(true); btn.parentNode.replaceChild(nb,btn);
  nb.addEventListener('click',()=>{ closeConfirm(); onOk(); });
}
function closeConfirm() {
  const dialog = document.getElementById('confirmDialog');
  if (dialog.style.display !== 'flex') return;
  dialog.classList.remove('overlay-visible');
  setTimeout(() => { dialog.style.display = 'none'; }, 250);
  unlockBodyScroll();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🍞 TOAST
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function showToast(msg, type='info', duration=3200) {
  const c=document.getElementById('toastContainer');
  const t=document.createElement('div');
  t.className=`toast ${type}`; t.textContent=msg;
  c.appendChild(t); setTimeout(()=>t.remove(), duration);
  // Feedback háptico sutil según el tipo
  if (type === 'success') haptic(15);
  else if (type === 'error') haptic([10, 40, 10]);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⏳ LOADING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function showLoading(show) {
  const el=document.getElementById('loadingScreen');
  if(el) el.style.display=show?'flex':'none';
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ➕ FAB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function addFAB(onClick) {
  removeFAB();
  const fab=document.createElement('button');
  fab.id='fab'; fab.className='btn-fab'; fab.innerHTML='+';
  fab.setAttribute('aria-label','Agregar');
  fab.addEventListener('click', onClick);
  document.body.appendChild(fab);
}

// FAB con menú de varias acciones
// actions = [{ icon:'🚶', label:'Paseo', onClick:fn }, ...]
function addFABMenu(actions) {
  removeFAB();
  const fab=document.createElement('button');
  fab.id='fab'; fab.className='btn-fab'; fab.innerHTML='+';
  fab.setAttribute('aria-label','Agregar');

  const menu=document.createElement('div');
  menu.id='fabMenu'; menu.className='fab-menu';
  menu.innerHTML = actions.map((a,i)=>`
    <button class="fab-menu-item" data-idx="${i}" aria-label="${a.label}">
      <span class="fab-menu-label">${a.label}</span>
      <span class="fab-menu-icon">${a.icon}</span>
    </button>`).join('');

  let open=false;
  const toggle=(show)=>{
    open = show ?? !open;
    fab.classList.toggle('fab-open', open);
    menu.classList.toggle('fab-menu-visible', open);
    fab.innerHTML = open ? '×' : '+';
    haptic(8);
  };

  fab.addEventListener('click',(e)=>{ e.stopPropagation(); toggle(); });
  menu.querySelectorAll('.fab-menu-item').forEach(btn=>{
    btn.addEventListener('click',(e)=>{
      e.stopPropagation();
      const idx=parseInt(btn.dataset.idx);
      toggle(false);
      actions[idx].onClick();
    });
  });
  // Cerrar al tocar fuera
  document.addEventListener('click', ()=>{ if(open) toggle(false); });

  document.body.appendChild(menu);
  document.body.appendChild(fab);
}
function removeFAB() {
  const f=document.getElementById('fab'); if(f) f.remove();
  const m=document.getElementById('fabMenu'); if(m) m.remove();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👇 AUTO-OCULTAR FAB AL HACER SCROLL
// Se oculta al bajar (para no tapar contenido) y reaparece al subir.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let _lastScrollY = 0;
let _fabScrollTimer = null;
function setupFabAutoHide() {
  window.addEventListener('scroll', () => {
    const fab = document.getElementById('fab');
    const menu = document.getElementById('fabMenu');
    if (!fab) return;

    const y = window.scrollY;
    const goingDown = y > _lastScrollY;

    // Ignorar micro-movimientos
    if (Math.abs(y - _lastScrollY) > 6) {
      if (goingDown && y > 120) {
        // Bajando: ocultar
        fab.classList.add('fab-hidden');
        // Si el menú estaba abierto, cerrarlo
        if (menu && menu.classList.contains('fab-menu-visible')) {
          menu.classList.remove('fab-menu-visible');
          fab.classList.remove('fab-open');
          fab.innerHTML = '+';
        }
      } else {
        // Subiendo: mostrar
        fab.classList.remove('fab-hidden');
      }
      _lastScrollY = y;
    }

    // Al detener el scroll, siempre reaparece
    clearTimeout(_fabScrollTimer);
    _fabScrollTimer = setTimeout(() => {
      fab.classList.remove('fab-hidden');
    }, 900);
  }, { passive: true });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🛠️ UTILIDADES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🖼️ OPTIMIZACIÓN DE IMÁGENES (Fase 3)
// Genera miniaturas de Cloudinary para ahorrar datos y acelerar carga.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function thumbUrl(url, size = 400) {
  if (!url || !url.includes('cloudinary')) return url;
  // Insertar transformación: recorte cuadrado, calidad auto, formato auto
  return url.replace('/upload/', `/upload/w_${size},h_${size},c_fill,q_auto,f_auto/`);
}

function optimizedUrl(url, width = 1000) {
  if (!url || !url.includes('cloudinary')) return url;
  // Para el visor: ancho limitado, calidad y formato automáticos
  return url.replace('/upload/', `/upload/w_${width},q_auto,f_auto/`);
}

function formatDate(dateStr) {
  if(!dateStr) return '—';
  return new Date(dateStr+'T00:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'});
}
function formatDateRelative(dateStr) {
  if(!dateStr) return '—';
  const diff=Math.floor((new Date()-new Date(dateStr+'T00:00:00'))/86400000);
  if(diff===0) return 'Hoy'; if(diff===1) return 'Ayer';
  if(diff<7) return `Hace ${diff} días`; return formatDate(dateStr);
}
function calcAge(b) {
  if(!b) return '';
  const d0=new Date(b+'T00:00:00'), now=new Date();
  const months=(now.getFullYear()-d0.getFullYear())*12+(now.getMonth()-d0.getMonth());
  if(months<12) return `${months} mes${months!==1?'es':''}`;
  const y=Math.floor(months/12), r=months%12;
  return r>0?`${y} año${y!==1?'s':''} y ${r} mes${r!==1?'es':''}`:`${y} año${y!==1?'s':''}`;
}
function today() { return new Date().toISOString().split('T')[0]; }
function sanitize(str) {
  const d=document.createElement('div'); d.textContent=str||''; return d.innerHTML;
}
async function compressImage(file,maxW=900,q=0.82) {
  return new Promise((res,rej)=>{
    const r=new FileReader();
    r.onload=e=>{
      const img=new Image();
      img.onload=()=>{
        let w=img.width,h=img.height;
        if(w>maxW){h=Math.round(h*maxW/w);w=maxW;}
        const c=document.createElement('canvas');
        c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);
        c.toBlob(b=>b?res(b):rej(new Error('Error')),'image/jpeg',q);
      };
      img.onerror=rej; img.src=e.target.result;
    };
    r.onerror=rej; r.readAsDataURL(file);
  });
}
function petRef()    { return db.collection('pets').doc(PET_ID); }
function subRef(col) { return petRef().collection(col); }

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚡ CACHÉ DE CONSULTAS FIRESTORE (Fase 3)
// Evita consultas repetidas de la misma colección en poco tiempo.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const _queryCache = new Map();
const CACHE_TTL = 15000; // 15 segundos

// Obtener una colección completa con caché
async function cachedGet(col) {
  const key = `${PET_ID}:${col}`;
  const cached = _queryCache.get(key);
  if (cached && (Date.now() - cached.time) < CACHE_TTL) {
    return cached.snap;
  }
  const snap = await subRef(col).get();
  _queryCache.set(key, { snap, time: Date.now() });
  return snap;
}

// Invalidar el caché de una colección (tras agregar/borrar)
function invalidateCache(col) {
  if (col) {
    _queryCache.delete(`${PET_ID}:${col}`);
  } else {
    _queryCache.clear();
  }
  // También invalidar la búsqueda global
  if (typeof invalidateSearchCache === 'function') invalidateSearchCache();
}

// Limpiar todo el caché al cambiar de mascota
function clearQueryCache() {
  _queryCache.clear();
}
