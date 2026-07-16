// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 PRIVACIDAD Y PERMISOS
// Panel transparente: qué puede (y qué NO puede) hacer la app,
// el estado real de cada permiso, y controles para el usuario.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const Permissions = {

  async open() {
    if (typeof closeSettings === 'function') closeSettings();
    openModal('🔐 Privacidad y permisos', '<div style="text-align:center;padding:20px;color:var(--text2);">Consultando estados...</div>');

    const [geo, notif] = await Promise.all([
      this.query('geolocation'),
      this.query('notifications'),
    ]);

    const usaUbicacion = localStorage.getItem('pupcare_weather_off') !== '1';
    const pushActivas  = (typeof Push !== 'undefined' && Push.enabled());

    document.getElementById('modalBody').innerHTML = `
      <p class="perm-intro">
        PupCare funciona dentro del entorno seguro del navegador: <strong>no puede</strong>
        acceder a tu cámara, archivos o ubicación en segundo plano. Cada permiso se usa
        solo cuando tú lo activas, y aquí puedes verlo y controlarlo.
      </p>

      <!-- Ubicación -->
      <div class="perm-item">
        <div class="perm-head">
          <span class="perm-icon">📍</span>
          <div class="perm-info">
            <div class="perm-name">Ubicación</div>
            <div class="perm-use">Solo para el clima local del panel de inicio. Nunca se guarda ni se envía a nuestros servidores.</div>
          </div>
          ${this.badge(geo)}
        </div>
        <label class="perm-toggle-row">
          <span>Usar mi ubicación para el clima</span>
          <input type="checkbox" id="permGeoUse" ${usaUbicacion ? 'checked' : ''}
            onchange="Permissions.toggleLocation(this.checked)">
        </label>
      </div>

      <!-- Notificaciones -->
      <div class="perm-item">
        <div class="perm-head">
          <span class="perm-icon">🔔</span>
          <div class="perm-info">
            <div class="perm-name">Notificaciones</div>
            <div class="perm-use">Recordatorios de vacunas, desparasitación y tareas. Un aviso al día como máximo.</div>
          </div>
          ${this.badge(notif)}
        </div>
        <label class="perm-toggle-row">
          <span>Recibir avisos push</span>
          <input type="checkbox" id="permPushUse" ${pushActivas ? 'checked' : ''}
            onchange="Permissions.togglePush()">
        </label>
      </div>

      <!-- Cámara y fotos -->
      <div class="perm-item">
        <div class="perm-head">
          <span class="perm-icon">📷</span>
          <div class="perm-info">
            <div class="perm-name">Cámara y galería</div>
            <div class="perm-use">PupCare <strong>no tiene acceso directo</strong>. Al subir una foto o escanear, Android abre su propia cámara o galería y solo recibimos la imagen que tú eliges.</div>
          </div>
          <span class="perm-badge perm-ok">Sin acceso ✅</span>
        </div>
      </div>

      <!-- Almacenamiento -->
      <div class="perm-item">
        <div class="perm-head">
          <span class="perm-icon">💾</span>
          <div class="perm-info">
            <div class="perm-name">Almacenamiento</div>
            <div class="perm-use">Solo el espacio propio de la app (datos sin conexión y caché para abrir rápido). <strong>No podemos leer tus archivos.</strong></div>
          </div>
          <span class="perm-badge perm-ok">Aislado ✅</span>
        </div>
        <button class="btn-outline btn-sm perm-clear" onclick="Permissions.clearCache()">
          🧹 Borrar caché local de este dispositivo
        </button>
      </div>

      <!-- Cómo revocar a nivel de sistema -->
      <div class="perm-footer">
        <strong>¿Quieres revocar un permiso por completo?</strong><br>
        Los permisos los custodia el navegador: abre <strong>Chrome → ⚙️ Configuración →
        Configuración de sitios</strong>, busca <em>rafaelperez0115-droid.github.io</em> y
        ajústalos ahí. La app respetará el cambio de inmediato.
      </div>
      <div style="height:16px;"></div>`;
  },

  // Estado real del permiso en el navegador
  async query(name) {
    try {
      const r = await navigator.permissions.query({ name });
      return r.state;   // 'granted' | 'denied' | 'prompt'
    } catch (e) { return 'unknown'; }
  },

  badge(state) {
    if (state === 'granted') return '<span class="perm-badge perm-ok">Concedido</span>';
    if (state === 'denied')  return '<span class="perm-badge perm-no">Bloqueado</span>';
    if (state === 'prompt')  return '<span class="perm-badge perm-ask">Se pedirá al usarlo</span>';
    return '<span class="perm-badge">—</span>';
  },

  // ── Controles a nivel de app ──

  toggleLocation(usar) {
    if (usar) {
      localStorage.removeItem('pupcare_weather_off');
      showToast('📍 Clima activado — toca el panel del inicio para cargarlo', 'success');
    } else {
      localStorage.setItem('pupcare_weather_off', '1');
      localStorage.removeItem('pupcare_weather');   // borrar el último clima guardado
      showToast('La app dejará de usar tu ubicación', 'info');
    }
    // Refrescar el dashboard si está visible
    if (typeof Home !== 'undefined' && typeof currentView !== 'undefined' && currentView === 'inicio') {
      Home.render();
    }
  },

  async togglePush() {
    if (typeof Push === 'undefined') return;
    await Push.toggle();
    const chk = document.getElementById('permPushUse');
    if (chk) chk.checked = Push.enabled();
  },

  async clearCache() {
    showConfirm('¿Borrar la caché local?',
      'Se eliminarán los archivos guardados para carga rápida. Tus datos y tu cuenta NO se tocan. La app se recargará.',
      async () => {
        try {
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k)));
          localStorage.removeItem('pupcare_weather');
          showToast('🧹 Caché borrada — recargando...', 'success');
          setTimeout(() => location.reload(), 900);
        } catch (e) {
          showToast('No se pudo borrar la caché', 'error');
        }
      });
  },
};
