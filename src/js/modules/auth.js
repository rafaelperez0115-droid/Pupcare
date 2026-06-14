/**
 * Módulo de Autenticación
 * Gestiona login, registro, logout y estado del usuario
 * @module modules/auth
 */

const Auth = {
  /**
   * Usuario actual
   */
  currentUser: null,

  /**
   * Inicializa el listener de autenticación
   */
  init() {
    firebase.auth().onAuthStateChanged((user) => {
      this.currentUser = user;
      if (user) {
        Logger.info('Usuario autenticado', { uid: user.uid, email: user.email });
        this.onLoginSuccess(user);
      } else {
        Logger.info('Usuario no autenticado');
        this.onLogout();
      }
    });
  },

  /**
   * Inicia sesión con email y contraseña
   * @param {string} email
   * @param {string} password
   * @returns {Promise<void>}
   */
  async loginWithEmail(email, password) {
    if (!validateEmail(email)) {
      showToast('❌ Correo electrónico inválido', 'error');
      return;
    }

    const pwdValidation = validatePassword(password);
    if (!pwdValidation.valid) {
      showToast(`❌ ${pwdValidation.message}`, 'error');
      return;
    }

    showLoading(true);

    try {
      await firebase.auth().signInWithEmailAndPassword(email, password);
      showToast('✅ ¡Bienvenido!', 'success');
    } catch (error) {
      Logger.error('Error en login', error);
      showToast(`❌ ${this.getAuthErrorMessage(error.code)}`, 'error');
    } finally {
      showLoading(false);
    }
  },

  /**
   * Registra un nuevo usuario
   * @param {string} email
   * @param {string} password
   * @param {string} displayName
   * @returns {Promise<void>}
   */
  async registerWithEmail(email, password, displayName) {
    if (!validateEmail(email)) {
      showToast('❌ Correo electrónico inválido', 'error');
      return;
    }

    const pwdValidation = validatePassword(password);
    if (!pwdValidation.valid) {
      showToast(`❌ ${pwdValidation.message}`, 'error');
      return;
    }

    const nameValidation = validateRequired(displayName, 'Nombre');
    if (!nameValidation.valid) {
      showToast(`❌ ${nameValidation.message}`, 'error');
      return;
    }

    showLoading(true);

    try {
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);

      // Actualizar nombre de usuario
      await userCredential.user.updateProfile({ displayName });

      // Crear documento en Firestore para el usuario
      await firebase.firestore().collection('users').doc(userCredential.user.uid).set({
        displayName,
        email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        pets: []
      });

      Logger.info('Usuario registrado', { uid: userCredential.user.uid });
      showToast('✅ Cuenta creada correctamente', 'success');
    } catch (error) {
      Logger.error('Error en registro', error);
      showToast(`❌ ${this.getAuthErrorMessage(error.code)}`, 'error');
    } finally {
      showLoading(false);
    }
  },

  /**
   * Inicia sesión con Google
   * @returns {Promise<void>}
   */
  async loginWithGoogle() {
    showLoading(true);
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      await firebase.auth().signInWithPopup(provider);
      showToast('✅ ¡Bienvenido!', 'success');
    } catch (error) {
      Logger.error('Error en login con Google', error);
      showToast(`❌ ${this.getAuthErrorMessage(error.code)}`, 'error');
    } finally {
      showLoading(false);
    }
  },

  /**
   * Envía email para restablecer contraseña
   * @param {string} email
   * @returns {Promise<void>}
   */
  async resetPassword(email) {
    if (!validateEmail(email)) {
      showToast('❌ Ingresa un correo válido', 'error');
      return;
    }

    showLoading(true);
    try {
      await firebase.auth().sendPasswordResetEmail(email);
      showToast('📧 Se envió el correo de recuperación', 'info');
      Logger.info('Email de recuperación enviado', { email });
    } catch (error) {
      Logger.error('Error al enviar recuperación', error);
      showToast(`❌ ${this.getAuthErrorMessage(error.code)}`, 'error');
    } finally {
      showLoading(false);
    }
  },

  /**
   * Cierra sesión del usuario
   * @returns {Promise<void>}
   */
  async logout() {
    showConfirm(
      '¿Cerrar sesión?',
      'Se cerrará tu sesión en este dispositivo.',
      async () => {
        showLoading(true);
        try {
          await firebase.auth().signOut();
          LocalStorage.clearAll();
          showToast('👋 Sesión cerrada', 'info');
        } catch (error) {
          Logger.error('Error al cerrar sesión', error);
          showToast('❌ Error al cerrar sesión', 'error');
        } finally {
          showLoading(false);
        }
      }
    );
  },

  /**
   * Callback ejecutado tras login exitoso
   * @param {firebase.User} user
   */
  onLoginSuccess(user) {
    const authScreen = document.getElementById('authScreen');
    const appShell = document.getElementById('appShell');

    if (authScreen) authScreen.style.display = 'none';
    if (appShell) appShell.style.display = 'block';

    // Actualizar nombre en la UI
    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
      userNameEl.textContent = user.displayName || user.email;
    }

    // Cargar mascotas
    if (typeof Pets !== 'undefined') {
      Pets.loadUserPets(user.uid);
    }
  },

  /**
   * Callback ejecutado tras logout
   */
  onLogout() {
    const authScreen = document.getElementById('authScreen');
    const appShell = document.getElementById('appShell');

    if (authScreen) authScreen.style.display = 'flex';
    if (appShell) appShell.style.display = 'none';
  },

  /**
   * Traduce códigos de error de Firebase Auth
   * @param {string} code - Código de error de Firebase
   * @returns {string} Mensaje amigable en español
   */
  getAuthErrorMessage(code) {
    const messages = {
      'auth/user-not-found': 'No existe cuenta con ese correo',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/email-already-in-use': 'Ya existe una cuenta con ese correo',
      'auth/invalid-email': 'El correo no es válido',
      'auth/weak-password': 'La contraseña es muy débil (mínimo 6 caracteres)',
      'auth/network-request-failed': 'Sin conexión a internet',
      'auth/too-many-requests': 'Demasiados intentos. Espera un momento',
      'auth/popup-closed-by-user': 'Inicio con Google cancelado',
      'auth/operation-not-allowed': 'Método de inicio no habilitado',
      'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
      'auth/requires-recent-login': 'Por seguridad, vuelve a iniciar sesión'
    };

    return messages[code] || `Error desconocido (${code})`;
  },

  /**
   * Verifica si hay un usuario autenticado
   * @returns {boolean}
   */
  isLoggedIn() {
    return !!firebase.auth().currentUser;
  },

  /**
   * Obtiene el UID del usuario actual
   * @returns {string|null}
   */
  getUserId() {
    return firebase.auth().currentUser?.uid || null;
  }
};

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Auth;
}
