// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🏠 app.js — Core: Auth, Navegación, Helpers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let currentUser = null;
let currentView = 'profile';

// ── DOM Ready ──
document.addEventListener('DOMContentLoaded', () => {
  const theme = localStorage.getItem('pupcare_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeIcon(theme);

  auth.onAuthStateChanged(async (user) => {
    if (user) {
      currentUser = user;
      await initApp();
    } else {
      currentUser = null;
      showAuth();
    }
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 AUTENTICACIÓN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function loginWithEmail() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  if (!email || !password) { showToast('Llena todos los campos', 'error'); return; }
  showLoading(true);
  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch (e) {
    showToast(getAuthError(e.code), 'error');
    showLoading(false);
  }
}

async function loginWithGoogle() {
  showLoading(true);
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    await auth.signInWithPopup(provider);
  } catch (e) {
    if (e.code !== 'auth/popup-closed-by-user') {
      showToast(getAuthError(e.code), 'error');
    }
    showLoading(false);
  }
}

async function register() {
  const name     = document.getElementById('regName').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  if (!name || !email || !password) { showToast('Llena todos los campos', 'error'); return; }
  if (password.length < 6) { showToast('La contraseña debe tener al menos 6 caracteres', 'error'); return; }
  showLoading(true);
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName: name });
  } catch (e) {
    showToast(getAuthError(e.code), 'error');
    showLoading(false);
  }
}

async function resetPassword() {
  const email = document.getElementById('forgotEmail').value.trim();
  if (!email) { showToast('Ingresa tu correo', 'error'); return; }
  showLoading(true);
  try {
    await auth.sendPasswordResetEmail(email);
    showToast('📧 Correo de recuperación enviado', 'success');
    showLogin();
  } catch (e) {
    showToast(getAuthError(e.code), 'error');
  } finally { showLoading(false); }
}

async function logout() {
  showConfirm('¿Cerrar sesión?', 'Se cerrará tu sesión en este dispositivo.', async () => {
    await auth.signOut();
    PET_ID = null;
    localStorage.removeItem('pupcare_pet_id');
    Profile.data = null;
  });
}

function showLogin()          { switchAuthForm('loginForm'); }
function showRegister()       { switchAuthForm('registerForm'); }
function showForgotPassword() { switchAuthForm('forgotForm'); }

function switchAuthForm(id) {
  ['loginForm', 'registerForm', 'forgotForm'].forEach(f => {
    document.getElementById(f).style.display = f === id ? 'block' : 'none';
  });
}

function showAuth() {
  document.getElementById('loadingScreen').style.display = 'none';
  document.getElementById('authScreen').style.display    = 'flex';
  document.getElementById('appShell').style.display      = 'none';
}

function getAuthError(code) {
  const map = {
    'auth/user-not-found':          'No existe cuenta con ese correo',
    'auth/wrong-password':          'Contraseña incorrecta',
    'auth/invalid-credential':      'Correo o contraseña incorrectos',
    'auth/email-already-in-use':    'Ya existe una cuenta con ese correo',
    'auth/invalid-email':           'El correo no es válido',
    'auth/weak-password':           'Contraseña muy débil (mínimo 6 caracteres)',
    'auth/network-request-failed':  'Sin conexión a internet',
    'auth/too-many-requests':       'Demasiados intentos. Espera unos minutos',
    'auth/popup-blocked':           'El popup fue bloqueado. Permite popups para este sitio',
    'auth/cancelled-popup-request': 'Inicio con Google cancelado',
    'auth/account-exists-with-different-credential': 'Ya existe una cuenta con ese correo usando otro método',
  };
  return map[code] || 'Error al autenticar. Intenta de nuevo.';
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 INICIAR APP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function initApp() {
  try {
    if (!PET_ID) {
      const snap = await db.collection('pets')
        .where('ownerId', '==', currentUser.uid)
        .limit(1).get();
      if (!snap.empty) {
        PET_ID = snap.docs[0].id;
        localStorage.setItem('pupcare_pet_id', PET_ID);
      }
    }

    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('authScreen').style.display    = 'none';
    document.getElementById('appShell').style.display      = 'block';
    showLoading(false);

    await Profile.init();
    navigate(currentView);

  } catch (e) {
    console.error('Error iniciando app:', e);
    showToast('Error al iniciar la app', 'error');
    showLoading(false);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧭 NAVEGACIÓN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function navigate(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${view}`).classList.add('active');
  document.querySelectorAll('.tab-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.view === view)
  );
  currentView = view;
  removeFAB();

  if (!PET_ID && view !== 'profile') {
    showToast('Primero configura el perfil de tu mascota 🐾', 'info');
    navigate('profile');
    return;
  }

  const modules = {
    profile: Profile, activities: Activities, health: Health,
    feeding: Feeding, care: Care, album: Album, notes: Notes
  };
  if (modules[view]) await modules[view].render();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎨 TEMA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function toggleTheme() {
  const curr = document.documentElement.getAttribute('data-theme');
  const next = curr === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('pupcare_theme', next);
  updateThemeIcon(next);
}
function updateThemeIcon(theme) {
  const el = document.getElementById('themeIcon');
  if (el) el.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🗂️ MODAL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function openModal(title, bodyHtml) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML    = bodyHtml;
  document.getElementById('modal').style.display    = 'flex';
}
function closeModal() {
  document.getElementById('modal').style.display = 'none';
  document.getElementById('modalBody').innerHTML  = '';
}
function handleModalClick(e) {
  if (e.target === document.getElementById('modal')) closeModal();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ❓ CONFIRM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function showConfirm(title, msg, onOk) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMsg').textContent   = msg;
  document.getElementById('confirmDialog').style.display = 'flex';
  const btn    = document.getElementById('confirmOkBtn');
  const newBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(newBtn, btn);
  newBtn.addEventListener('click', () => { closeConfirm(); onOk(); });
}
function closeConfirm() {
  document.getElementById('confirmDialog').style.display = 'none';
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🍞 TOAST
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function showToast(msg, type = 'info', duration = 3200) {
  const c     = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className   = `toast ${type}`;
  toast.textContent = msg;
  c.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⏳ LOADING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function showLoading(show) {
  const el = document.getElementById('loadingScreen');
  if (el) el.style.display = show ? 'flex' : 'none';
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ➕ FAB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function addFAB(onClick) {
  removeFAB();
  const fab = document.createElement('button');
  fab.id = 'fab'; fab.className = 'btn-fab';
  fab.innerHTML = '+'; fab.setAttribute('aria-label', 'Agregar');
  fab.addEventListener('click', onClick);
  document.body.appendChild(fab);
}
function removeFAB() {
  const f = document.getElementById('fab');
  if (f) f.remove();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🛠️ UTILIDADES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateRelative(dateStr) {
  if (!dateStr) return '—';
  const d    = new Date(dateStr + 'T00:00:00');
  const diff = Math.floor((new Date() - d) / 86400000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  if (diff < 7)  return `Hace ${diff} días`;
  return formatDate(dateStr);
}

function calcAge(birthDateStr) {
  if (!birthDateStr) return '';
  const b      = new Date(birthDateStr + 'T00:00:00');
  const now    = new Date();
  const months = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
  if (months < 12) return `${months} mes${months !== 1 ? 'es' : ''}`;
  const years = Math.floor(months / 12);
  const rem   = months % 12;
  return rem > 0
    ? `${years} año${years !== 1 ? 's' : ''} y ${rem} mes${rem !== 1 ? 'es' : ''}`
    : `${years} año${years !== 1 ? 's' : ''}`;
}

function today() { return new Date().toISOString().split('T')[0]; }

function sanitize(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

async function compressImage(file, maxW = 900, q = 0.82) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        c.toBlob(b => b ? res(b) : rej(new Error('Error al comprimir')), 'image/jpeg', q);
      };
      img.onerror = rej;
      img.src = e.target.result;
    };
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

function petRef()    { return db.collection('pets').doc(PET_ID); }
function subRef(col) { return petRef().collection(col); }
