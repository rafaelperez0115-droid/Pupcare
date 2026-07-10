// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🐕 MODELOS DE CRECIMIENTO (siluetas SVG neón)
// 4 etapas según la edad del perro, con efecto de escaneo.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const GrowthModels = {
  // Imágenes de crecimiento en Cloudinary
  // Orden: [cachorro, adolescente, adulto, senior]
  images: [
    'https://res.cloudinary.com/dcmlpzuby/image/upload/v1783705751/perro-1-cachorro.png_deh1r9.jpg',    // Cachorro (0-6 meses)
    'https://res.cloudinary.com/dcmlpzuby/image/upload/v1783705755/perro-2-adolescente.png_cp6icm.jpg', // Adolescente (6-24 meses)
    'https://res.cloudinary.com/dcmlpzuby/image/upload/v1783705757/perro-3-adulto.png_ncapaj.jpg',      // Adulto (2-7 años)
    'https://res.cloudinary.com/dcmlpzuby/image/upload/v1783705759/perro-4-senior.png_pkq2pk.jpg',      // Senior (7+ años)
  ],

  // Determinar etapa según edad en meses
  getStage(months) {
    if (months < 6)   return 0; // Cachorro: 0-6 meses
    if (months < 24)  return 1; // Adolescente: 6-24 meses
    if (months < 84)  return 2; // Adulto: 2-7 años (24-84 meses)
    return 3;                   // Senior: 7+ años
  },

  stageLabels: ['Cachorro', 'Adolescente', 'Adulto', 'Senior'],

  // Generar el HTML del modelo para una etapa (imagen de Cloudinary)
  render(months, color) {
    const stage = this.getStage(months);
    const imgUrl = this.images[stage];

    if (imgUrl) {
      return `
        <div class="dog-model-img-wrap">
          <img src="${imgUrl}" alt="Modelo de crecimiento: ${this.stageLabels[stage]}"
            class="dog-model-img" loading="lazy" decoding="async">
        </div>`;
    }
    // Placeholder si aún no se configuran las imágenes
    return `
      <div class="dog-model-placeholder">
        <span style="font-size:2.5rem;">🐕</span>
        <span style="font-size:0.75rem;color:var(--text2);margin-top:6px;">${this.stageLabels[stage]}</span>
      </div>`;
  },

  // Barra de progreso de etapas (indicador visual)
  renderStageBar(months) {
    const current = this.getStage(months);
    return `
      <div class="growth-stage-bar">
        ${this.stageLabels.map((label, i) => `
          <div class="growth-stage-dot ${i === current ? 'active' : ''} ${i < current ? 'done' : ''}">
            <span class="growth-stage-label">${label}</span>
          </div>
        `).join('')}
      </div>`;
  },
};
