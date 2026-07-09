// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🏠 app.js v4 — Nueva navegación 6 tabs
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let currentUser = null;
let currentView = 'inicio';

document.addEventListener('DOMContentLoaded', () => {
  const theme = localStorage.getItem('pupcare_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeLabel(theme);

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

    // Activar detector de conexión
    setupOfflineDetection();

    // Inicializar notificaciones
    initNotifications();
    checkTaskNotifications();

    await navigate('inicio');

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

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const t = document.getElementById(`view-${view}`);
  if (t) t.classList.add('active');

  document.querySelectorAll('.tab-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.view === view)
  );

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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ SETTINGS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function openSettings() {
  const panel = document.getElementById('settingsPanel');
  panel.style.display = 'flex';
  requestAnimationFrame(() => panel.classList.add('overlay-visible'));
  lockBodyScroll();
}
function closeSettings(e) {
  if (!e || e.target === document.getElementById('settingsPanel')) {
    const panel = document.getElementById('settingsPanel');
    panel.classList.remove('overlay-visible');
    setTimeout(() => { panel.style.display = 'none'; }, 250);
    unlockBodyScroll();
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎨 TEMA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function toggleTheme() {
  const curr = document.documentElement.getAttribute('data-theme');
  const next = curr==='dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('pupcare_theme', next);
  updateThemeLabel(next);
  closeSettings();
}
function updateThemeLabel(theme) {
  const el = document.getElementById('themeLabel');
  if (el) el.textContent = theme==='dark' ? 'Oscuro' : 'Claro';
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

  panel.style.display = 'flex';
  requestAnimationFrame(() => panel.classList.add('overlay-visible'));
  lockBodyScroll();
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

    // Invalidar caché de búsqueda (nueva mascota, nuevos datos)
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
  modal.style.display = 'flex';
  requestAnimationFrame(() => modal.classList.add('overlay-visible'));
  lockBodyScroll();
}
function closeModal() {
  const modal = document.getElementById('modal');
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
  dialog.style.display = 'flex';
  requestAnimationFrame(() => dialog.classList.add('overlay-visible'));
  lockBodyScroll();
  const btn=document.getElementById('confirmOkBtn');
  const nb=btn.cloneNode(true); btn.parentNode.replaceChild(nb,btn);
  nb.addEventListener('click',()=>{ closeConfirm(); onOk(); });
}
function closeConfirm() {
  const dialog = document.getElementById('confirmDialog');
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
function removeFAB() {
  const f=document.getElementById('fab'); if(f) f.remove();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🛠️ UTILIDADES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
