// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🗑️ ELIMINAR MI CUENTA
// Borrado permanente: todas las mascotas con sus registros,
// los tokens de notificaciones y la cuenta de acceso.
// Con triple protección: advertencia, escribir ELIMINAR, y
// re-autenticación si Firebase la exige por seguridad.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const AccountDelete = {
  COLLECTIONS: [
    'vaccines', 'dewormings', 'vetVisits', 'medications', 'behaviorNotes',
    'activities', 'care', 'photos', 'tasks', 'weightHistory', 'heightHistory',
    'expenses', 'growthAnalysis', 'feedingPlan', 'feedingLog',
  ],

  // ── Paso 1: advertencia y confirmación escrita ──
  start() {
    if (!currentUser) return;

    // La cuenta demo es compartida: no se puede eliminar
    if (typeof isDemoUser === 'function' && isDemoUser()) {
      showToast('La cuenta demo es compartida y no puede eliminarse. Usa "Reiniciar" para limpiarla.', 'info');
      return;
    }

    if (typeof closeSettings === 'function') closeSettings();

    openModal('🗑️ Eliminar mi cuenta', `
      <div class="acct-del-warn">
        <div class="acct-del-title">Esta acción es permanente e irreversible</div>
        <p class="acct-del-text">Se eliminará para siempre:</p>
        <ul class="acct-del-list">
          <li>Todas tus mascotas y sus perfiles</li>
          <li>Todo el historial: vacunas, salud, peso, altura, actividades, gastos, análisis…</li>
          <li>El acceso a tus fotos desde la app</li>
          <li>Tus dispositivos registrados para notificaciones</li>
          <li>Tu cuenta de acceso (${sanitize(currentUser.email || '')})</li>
        </ul>
        <p class="acct-del-text">
          💡 Si quieres conservar una copia, usa antes
          <strong>Configuración → Exportar mis datos</strong>.
        </p>
      </div>

      <div class="field">
        <label>Para confirmar, escribe <strong>ELIMINAR</strong></label>
        <input type="text" id="delConfirmInput" placeholder="ELIMINAR"
          autocomplete="off" autocapitalize="characters"
          oninput="AccountDelete.checkInput()">
      </div>

      <button class="btn-danger btn-full" id="delConfirmBtn" disabled
        onclick="AccountDelete.execute()" style="margin-bottom:10px;">
        Eliminar mi cuenta para siempre
      </button>
      <button class="btn-outline btn-full" onclick="closeModal()" style="margin-bottom:16px;">
        Cancelar
      </button>
    `);
  },

  checkInput() {
    const val = document.getElementById('delConfirmInput')?.value.trim().toUpperCase();
    const btn = document.getElementById('delConfirmBtn');
    if (btn) btn.disabled = val !== 'ELIMINAR';
  },

  // ── Paso 2: ejecutar el borrado ──
  async execute() {
    showLoading(true);
    try {
      await this._deleteAllData();
      await this._deleteAuthUser();     // puede exigir re-autenticación
      this._cleanupLocal();
      showLoading(false);
      showToast('Tu cuenta y todos tus datos fueron eliminados. Gracias por usar PupCare 🐾', 'success', 6000);
      // onAuthStateChanged detecta la cuenta borrada y muestra el login
    } catch (e) {
      showLoading(false);
      if (e.code === 'auth/requires-recent-login') {
        // Firebase exige demostrar identidad si la sesión es antigua
        this._reauth();
      } else {
        console.error('Error al eliminar cuenta:', e);
        showToast('No se pudo completar la eliminación: ' + (e.message || 'intenta de nuevo'), 'error');
      }
    }
  },

  // Borrar todas las mascotas, subcolecciones y tokens
  async _deleteAllData() {
    const uid = currentUser.uid;

    // Mascotas y sus subcolecciones
    const pets = await db.collection('pets').where('ownerId', '==', uid).get();
    for (const petDoc of pets.docs) {
      for (const col of this.COLLECTIONS) {
        const items = await db.collection('pets').doc(petDoc.id).collection(col).get();
        if (items.empty) continue;
        const batch = db.batch();
        items.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
      await db.collection('pets').doc(petDoc.id).delete();
    }

    // Tokens de notificaciones
    const tokens = await db.collection('pushTokens').where('uid', '==', uid).get();
    if (!tokens.empty) {
      const batch = db.batch();
      tokens.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
  },

  async _deleteAuthUser() {
    await currentUser.delete();
  },

  _cleanupLocal() {
    ['pupcare_pet_id', 'pupcare_push_token'].forEach(k => localStorage.removeItem(k));
  },

  // ── Paso 3 (solo si Firebase lo exige): re-autenticación ──
  _reauth() {
    const provider = currentUser.providerData?.[0]?.providerId;

    if (provider === 'google.com') {
      // Google: reautenticar con la ventana de Google
      openModal('🔐 Confirma tu identidad', `
        <p class="acct-del-text" style="margin-bottom:16px;">
          Por seguridad, Firebase pide que confirmes tu identidad antes de
          eliminar la cuenta. Tus datos ya fueron borrados; falta eliminar el acceso.
        </p>
        <button class="btn-primary btn-full" onclick="AccountDelete.reauthGoogle()" style="margin-bottom:16px;">
          Continuar con Google
        </button>
      `);
    } else {
      // Correo/contraseña: pedir la contraseña
      openModal('🔐 Confirma tu identidad', `
        <p class="acct-del-text" style="margin-bottom:14px;">
          Por seguridad, escribe tu contraseña para completar la eliminación.
          Tus datos ya fueron borrados; falta eliminar el acceso.
        </p>
        <div class="field">
          <label>Contraseña</label>
          <input type="password" id="reauthPass" placeholder="Tu contraseña" autocomplete="current-password">
        </div>
        <button class="btn-danger btn-full" onclick="AccountDelete.reauthPassword()" style="margin-bottom:16px;">
          Confirmar y eliminar
        </button>
      `);
    }
  },

  async reauthGoogle() {
    showLoading(true);
    try {
      await currentUser.reauthenticateWithPopup(new firebase.auth.GoogleAuthProvider());
      await this._deleteAuthUser();
      this._cleanupLocal();
      showLoading(false);
      showToast('Tu cuenta fue eliminada. Gracias por usar PupCare 🐾', 'success', 6000);
    } catch (e) {
      showLoading(false);
      showToast('No se pudo confirmar la identidad', 'error');
    }
  },

  async reauthPassword() {
    const pass = document.getElementById('reauthPass')?.value;
    if (!pass) { showToast('Escribe tu contraseña', 'error'); return; }
    showLoading(true);
    try {
      const cred = firebase.auth.EmailAuthProvider.credential(currentUser.email, pass);
      await currentUser.reauthenticateWithCredential(cred);
      await this._deleteAuthUser();
      this._cleanupLocal();
      showLoading(false);
      showToast('Tu cuenta fue eliminada. Gracias por usar PupCare 🐾', 'success', 6000);
    } catch (e) {
      showLoading(false);
      showToast('Contraseña incorrecta', 'error');
    }
  },
};
