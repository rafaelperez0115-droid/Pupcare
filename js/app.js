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
    }

    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('appShell').style.display      = 'block';
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
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ SETTINGS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function openSettings() {
  document.getElementById('settingsPanel').style.display = 'flex';
}
function closeSettings(e) {
  if (!e || e.target === document.getElementById('settingsPanel')) {
    document.getElementById('settingsPanel').style.display = 'none';
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
  if (e.target===document.getElementById('modal')) closeModal();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ❓ CONFIRM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function showConfirm(title, msg, onOk) {
  document.getElementById('confirmTitle').textContent    = title;
  document.getElementById('confirmMsg').textContent      = msg;
  document.getElementById('confirmDialog').style.display = 'flex';
  const btn=document.getElementById('confirmOkBtn');
  const nb=btn.cloneNode(true); btn.parentNode.replaceChild(nb,btn);
  nb.addEventListener('click',()=>{ closeConfirm(); onOk(); });
}
function closeConfirm() {
  document.getElementById('confirmDialog').style.display = 'none';
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
