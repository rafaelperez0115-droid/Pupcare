// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 ONBOARDING — Primeros pasos
// Checklist en el dashboard que detecta qué le falta al usuario
// y lo guía con acciones directas. Desaparece al completarse.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const Onboarding = {

  // Pasos: cómo detectarlos y a dónde llevan
  STEPS: [
    {
      id: 'photo',
      icon: '📸',
      label: 'Sube la primera foto',
      sub: 'El álbum guarda su historia y alimenta el análisis IA',
      action: () => { navigate('album'); },
    },
    {
      id: 'weight',
      icon: '⚖️',
      label: 'Registra su peso',
      sub: 'Para seguir su crecimiento mes a mes',
      action: () => { navigate('perfil'); setTimeout(() => Profile.openWeight(), 400); },
    },
    {
      id: 'vaccine',
      icon: '💉',
      label: 'Añade sus vacunas',
      sub: 'Escanea la tarjeta con IA o regístralas manual',
      action: () => { navigate('salud'); },
    },
    {
      id: 'feeding',
      icon: '🍖',
      label: 'Configura su alimentación',
      sub: 'Cuánto y qué come al día',
      action: () => { navigate('comida'); },
    },
    {
      id: 'activity',
      icon: '🏃',
      label: 'Registra una actividad',
      sub: 'Paseos, juegos, entrenamiento',
      action: () => { navigate('inicio'); setTimeout(() => Home.openActivityForm(), 400); },
    },
  ],

  _dismissKey() {
    return `pupcare_onboarding_done_${PET_ID || 'none'}`;
  },

  // ── Renderizar el checklist en el dashboard ──
  async render() {
    const cont = document.getElementById('onboardingChecklist');
    if (!cont || !PET_ID) return;

    // Si el usuario lo cerró para esta mascota, no mostrar
    if (localStorage.getItem(this._dismissKey())) { cont.innerHTML = ''; return; }

    try {
      // Detectar en paralelo qué pasos ya están hechos
      const [photos, weights, vaccines, feeding, activities] = await Promise.all([
        subRef('photos').limit(1).get(),
        subRef('weightHistory').limit(1).get(),
        subRef('vaccines').limit(1).get(),
        subRef('feedingPlan').doc('current').get(),
        subRef('activities').limit(1).get(),
      ]);

      const done = {
        photo:    !photos.empty,
        weight:   !weights.empty || !!Profile.data?.currentWeight,
        vaccine:  !vaccines.empty,
        feeding:  feeding.exists,
        activity: !activities.empty,
      };

      const pending   = this.STEPS.filter(s => !done[s.id]);
      const completed = this.STEPS.length - pending.length;

      // Todo completo: celebrar una vez y no volver a mostrar
      if (!pending.length) {
        localStorage.setItem(this._dismissKey(), '1');
        cont.innerHTML = '';
        return;
      }

      const pct = Math.round((completed / this.STEPS.length) * 100);
      const name = sanitize(Profile.data?.name || 'tu mascota');

      cont.innerHTML = `
        <div class="onb-card stagger-item">
          <div class="onb-head">
            <div class="onb-title">🚀 Primeros pasos con ${name}</div>
            <button class="onb-close" onclick="Onboarding.dismiss()" aria-label="Ocultar guía" title="Ocultar">✕</button>
          </div>
          <div class="onb-progress">
            <div class="onb-progress-bar"><div class="onb-progress-fill" style="width:${pct}%;"></div></div>
            <span class="onb-progress-txt">${completed}/${this.STEPS.length}</span>
          </div>
          <div class="onb-steps">
            ${pending.slice(0, 3).map(s => `
              <button class="onb-step" onclick="Onboarding.go('${s.id}')">
                <span class="onb-step-icon">${s.icon}</span>
                <span class="onb-step-info">
                  <span class="onb-step-label">${s.label}</span>
                  <span class="onb-step-sub">${s.sub}</span>
                </span>
                <span class="onb-step-arrow">›</span>
              </button>`).join('')}
          </div>
          ${pending.length > 3 ? `<div class="onb-more">y ${pending.length - 3} paso${pending.length - 3 !== 1 ? 's' : ''} más…</div>` : ''}
        </div>`;
    } catch (e) {
      cont.innerHTML = '';
    }
  },

  go(id) {
    const step = this.STEPS.find(s => s.id === id);
    if (step) { haptic(8); step.action(); }
  },

  dismiss() {
    localStorage.setItem(this._dismissKey(), '1');
    const cont = document.getElementById('onboardingChecklist');
    if (cont) cont.innerHTML = '';
    showToast('Guía ocultada. ¡Explora a tu ritmo! 🐾', 'info');
  },
};
