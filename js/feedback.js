// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💬 SUGERENCIAS Y REPORTES
// Permite al usuario reportar problemas o proponer mejoras
// sin salir de la app, por correo prellenado.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const Feedback = {
  // ⚠️ PON AQUÍ tu correo de contacto (el mismo de legal.html)
  CONTACT_EMAIL: 'pupcare.soporte@gmail.com',

  APP_VERSION: 'v20',

  open() {
    if (typeof closeSettings === 'function') closeSettings();

    openModal('💬 Enviar sugerencia', `
      <p class="fb-intro">
        Tu opinión mejora PupCare. Cuéntanos qué encontraste o qué te gustaría ver.
      </p>

      <div class="field">
        <label>Tipo</label>
        <div class="fb-types">
          <button type="button" class="fb-type selected" data-type="🐛 Problema" onclick="Feedback.pick(this)">🐛 Problema</button>
          <button type="button" class="fb-type" data-type="💡 Sugerencia" onclick="Feedback.pick(this)">💡 Sugerencia</button>
          <button type="button" class="fb-type" data-type="💬 Otro" onclick="Feedback.pick(this)">💬 Otro</button>
        </div>
      </div>

      <div class="field">
        <label>Cuéntanos</label>
        <textarea id="fbText" rows="4"
          placeholder="Ej: Cuando abro el álbum y toco una foto..."></textarea>
      </div>

      <button class="btn-primary btn-full" onclick="Feedback.send()" style="margin-bottom:10px;">
        📧 Enviar por correo
      </button>
      <button class="btn-outline btn-full" onclick="Feedback.copyEmail()" style="margin-bottom:16px;">
        📋 Copiar el correo de contacto
      </button>
    `);
  },

  pick(btn) {
    document.querySelectorAll('.fb-type').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
  },

  _selectedType() {
    return document.querySelector('.fb-type.selected')?.dataset.type || '💬 Otro';
  },

  send() {
    if (this.CONTACT_EMAIL.startsWith('[')) {
      showToast('Falta configurar el correo de contacto en feedback.js', 'error');
      return;
    }
    const tipo = this._selectedType();
    const texto = document.getElementById('fbText')?.value.trim() || '';

    const asunto = `${tipo} · PupCare`;
    const cuerpo =
`${texto || '(Escribe aquí tu mensaje)'}

——————————————
Información técnica (ayuda a resolver más rápido):
· App: PupCare ${this.APP_VERSION}
· Dispositivo: ${navigator.userAgent.slice(0, 110)}
· Fecha: ${new Date().toLocaleString('es-DO')}`;

    const url = `mailto:${this.CONTACT_EMAIL}`
      + `?subject=${encodeURIComponent(asunto)}`
      + `&body=${encodeURIComponent(cuerpo)}`;

    window.location.href = url;
    // Aviso por si el dispositivo no tiene app de correo configurada
    setTimeout(() => {
      showToast(`Si no se abrió tu correo, escríbenos a ${this.CONTACT_EMAIL}`, 'info', 6000);
    }, 1500);
  },

  async copyEmail() {
    if (this.CONTACT_EMAIL.startsWith('[')) {
      showToast('Falta configurar el correo de contacto en feedback.js', 'error');
      return;
    }
    try {
      await navigator.clipboard.writeText(this.CONTACT_EMAIL);
      showToast('📋 Correo copiado: ' + this.CONTACT_EMAIL, 'success');
    } catch (e) {
      showToast('Correo: ' + this.CONTACT_EMAIL, 'info', 6000);
    }
  },
};
