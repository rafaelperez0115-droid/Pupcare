// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📲 GUÍA "AGREGAR A INICIO"
// Detecta si la app NO está instalada y guía al usuario:
// - iPhone/iPad: instrucciones paso a paso (iOS no permite auto-instalar,
//   y las notificaciones push SOLO funcionan con la app instalada).
// - Android/Chrome: botón de instalación real (beforeinstallprompt).
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const InstallGuide = {
  _deferredPrompt: null,
  DISMISS_KEY: 'pupcare_install_dismissed',
  DISMISS_DAYS: 14,

  // ¿Ya está instalada (modo standalone)?
  isInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
  },

  // ¿Es un dispositivo iOS? (incluye iPad moderno que se reporta como Mac)
  isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  },

  init() {
    // Android/Chrome: capturar el evento de instalación nativa
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this._deferredPrompt = e;
      this.maybeShowBanner();
    });
    // Si se instala, quitar el banner
    window.addEventListener('appinstalled', () => {
      localStorage.setItem(this.DISMISS_KEY, String(Date.now()));
      this.removeBanner();
      showToast('📲 ¡PupCare instalada!', 'success');
    });
    this.maybeShowBanner();
  },

  maybeShowBanner() {
    if (this.isInstalled()) return;
    if (document.getElementById('installBanner')) return;

    // Respetar si el usuario lo cerró recientemente
    const dismissed = parseInt(localStorage.getItem(this.DISMISS_KEY) || '0');
    if (dismissed && Date.now() - dismissed < this.DISMISS_DAYS * 86400000) return;

    // Solo mostrar si hay algo útil que ofrecer:
    // iOS (guía manual) o Android con prompt capturado
    if (!this.isIOS() && !this._deferredPrompt) return;

    const shell = document.getElementById('appShell');
    if (!shell || shell.style.display === 'none') return;

    const banner = document.createElement('div');
    banner.id = 'installBanner';
    banner.className = 'install-banner';
    banner.innerHTML = `
      <span class="install-banner-icon">📲</span>
      <div class="install-banner-info">
        <div class="install-banner-title">Instala PupCare en tu inicio</div>
        <div class="install-banner-sub">${this.isIOS()
          ? 'Necesario para recibir notificaciones en iPhone'
          : 'Acceso rápido y notificaciones, como una app nativa'}</div>
      </div>
      <button class="install-banner-btn" onclick="InstallGuide.install()">Instalar</button>
      <button class="install-banner-close" onclick="InstallGuide.dismiss()" aria-label="Cerrar">✕</button>
    `;
    shell.insertBefore(banner, shell.firstChild);
  },

  // Acción del botón "Instalar"
  async install() {
    haptic(8);
    if (this._deferredPrompt) {
      // Android/Chrome: instalación nativa real
      this._deferredPrompt.prompt();
      const choice = await this._deferredPrompt.userChoice.catch(() => null);
      this._deferredPrompt = null;
      if (choice?.outcome === 'accepted') this.removeBanner();
    } else {
      // iOS (o navegador sin prompt): guía manual
      this.showIOSGuide();
    }
  },

  // Instrucciones paso a paso para iPhone/iPad
  showIOSGuide() {
    openModal('📲 Instalar PupCare', `
      <div class="ios-guide">
        <p class="ios-guide-intro">
          En iPhone y iPad, las <strong>notificaciones solo funcionan si la app
          está instalada</strong> en la pantalla de inicio. Toma 20 segundos:
        </p>
        <div class="ios-step">
          <span class="ios-step-num">1</span>
          <div class="ios-step-text">
            Abre PupCare en <strong>Safari</strong>
            <span class="ios-step-note">(desde Chrome u otra app no funciona)</span>
          </div>
        </div>
        <div class="ios-step">
          <span class="ios-step-num">2</span>
          <div class="ios-step-text">
            Toca el botón <strong>Compartir</strong>
            <span class="ios-share-icon">⎋</span>
            <span class="ios-step-note">(el cuadrado con la flecha hacia arriba, abajo en el centro)</span>
          </div>
        </div>
        <div class="ios-step">
          <span class="ios-step-num">3</span>
          <div class="ios-step-text">
            Desliza y elige <strong>"Agregar a pantalla de inicio"</strong>
          </div>
        </div>
        <div class="ios-step">
          <span class="ios-step-num">4</span>
          <div class="ios-step-text">
            Toca <strong>"Agregar"</strong> arriba a la derecha. ¡Listo! 🎉
          </div>
        </div>
        <p class="ios-guide-after">
          Luego abre PupCare <strong>desde el ícono nuevo</strong> de tu pantalla
          de inicio y activa los avisos en Configuración ⚙️.
        </p>
        <button class="btn-primary btn-full" onclick="closeModal()" style="margin-bottom:16px;">
          Entendido
        </button>
      </div>
    `);
  },

  dismiss() {
    localStorage.setItem(this.DISMISS_KEY, String(Date.now()));
    this.removeBanner();
  },

  removeBanner() {
    const b = document.getElementById('installBanner');
    if (b) b.remove();
  },
};
