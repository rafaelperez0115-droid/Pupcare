// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔔 NOTIFICACIONES PUSH (Fase 1)
// Pide permiso, obtiene el token FCM del dispositivo y lo guarda
// en Firestore para que el Worker programado pueda enviar avisos.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const Push = {
  // ⚠️ PEGA AQUÍ tu clave VAPID pública de Firebase
  // (Consola Firebase → Configuración del proyecto → Cloud Messaging
  //  → Certificados push web → Generar par de claves)
  VAPID_KEY: 'PEGA_AQUI_TU_CLAVE_VAPID',

  _messaging: null,

  supported() {
    return 'Notification' in window
      && 'serviceWorker' in navigator
      && typeof firebase !== 'undefined'
      && firebase.messaging?.isSupported?.() !== false;
  },

  enabled() {
    return this.supported()
      && Notification.permission === 'granted'
      && localStorage.getItem('pupcare_push_token');
  },

  // ── Activar notificaciones (llamar desde Configuración) ──
  async enable() {
    if (!this.supported()) {
      showToast('Este navegador no soporta notificaciones push', 'error');
      return false;
    }
    if (this.VAPID_KEY.startsWith('PEGA_AQUI')) {
      showToast('Falta configurar la clave VAPID', 'error');
      console.error('Push: configura VAPID_KEY en js/push.js');
      return false;
    }

    showLoading(true);
    try {
      // 1. Pedir permiso al usuario
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        showLoading(false);
        showToast('Permiso de notificaciones denegado', 'info');
        return false;
      }

      // 2. Registrar el service worker de mensajería
      //    (ruta relativa para funcionar en GitHub Pages /Pupcare/)
      const swReg = await navigator.serviceWorker.register('firebase-messaging-sw.js');

      // 3. Obtener el token del dispositivo
      this._messaging = firebase.messaging();
      const token = await this._messaging.getToken({
        vapidKey: this.VAPID_KEY,
        serviceWorkerRegistration: swReg,
      });

      if (!token) {
        showLoading(false);
        showToast('No se pudo obtener el token de notificaciones', 'error');
        return false;
      }

      // 4. Guardar el token en Firestore (para el Worker de la Fase 3)
      await db.collection('pushTokens').doc(token).set({
        uid: currentUser.uid,
        token,
        petId: PET_ID || null,
        platform: navigator.userAgent.slice(0, 120),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      localStorage.setItem('pupcare_push_token', token);

      // 5. Escuchar notificaciones con la app ABIERTA (foreground)
      this._messaging.onMessage((payload) => {
        const n = payload.notification || {};
        showToast(`🔔 ${n.title || 'PupCare'}${n.body ? ' — ' + n.body : ''}`, 'info', 6000);
        haptic(20);
      });

      showLoading(false);
      showToast('🔔 Notificaciones activadas', 'success');
      return true;

    } catch (e) {
      showLoading(false);
      console.error('Push error:', e);
      if (String(e).includes('messaging/permission-blocked')) {
        showToast('Las notificaciones están bloqueadas en el navegador', 'error');
      } else {
        showToast('No se pudieron activar las notificaciones', 'error');
      }
      return false;
    }
  },

  // ── Desactivar ──
  async disable() {
    showLoading(true);
    try {
      const token = localStorage.getItem('pupcare_push_token');
      if (token) {
        await db.collection('pushTokens').doc(token).delete().catch(() => {});
        localStorage.removeItem('pupcare_push_token');
      }
      if (this._messaging) {
        await this._messaging.deleteToken().catch(() => {});
      }
      showLoading(false);
      showToast('Notificaciones desactivadas', 'info');
    } catch (e) {
      showLoading(false);
      showToast('Error al desactivar', 'error');
    }
  },

  // ── Alternar desde Configuración ──
  async toggle() {
    if (this.enabled()) {
      await this.disable();
    } else {
      await this.enable();
    }
    this.refreshRow();
  },

  // Actualizar el texto de la fila en Configuración
  refreshRow() {
    const el = document.getElementById('pushStatusValue');
    if (el) el.textContent = this.enabled() ? 'Activadas ✅' : 'Desactivadas';
  },
};
