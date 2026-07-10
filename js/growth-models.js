// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🐕 MODELOS DE CRECIMIENTO (siluetas SVG neón)
// 4 etapas según la edad del perro, con efecto de escaneo.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const GrowthModels = {
  // Determinar etapa según edad en meses
  getStage(months) {
    if (months < 4)  return 0; // Cachorro
    if (months < 8)  return 1; // Joven
    if (months < 14) return 2; // Adulto joven
    return 3;                  // Adulto
  },

  stageLabels: ['Cachorro', 'Joven', 'Adulto joven', 'Adulto'],

  // Siluetas: cada una es un path que dibuja un perro de perfil,
  // progresivamente más grande y musculoso. viewBox 0 0 240 160.
  paths: [
    // 0 — Cachorro: pequeño, patas cortas, cabeza grande proporcionalmente
    'M70 110 Q68 98 72 92 L74 84 Q75 78 81 78 Q83 73 87 75 Q88 70 92 73 Q95 72 95 78 L96 84 Q106 83 114 85 L128 86 Q135 85 140 88 Q144 84 148 86 Q152 83 153 88 Q156 87 155 92 L154 99 Q156 107 152 113 L151 124 Q151 128 148 128 Q145 128 145 124 L144 112 Q134 116 122 115 L121 124 Q121 128 118 128 Q115 128 115 124 L115 114 Q100 113 90 109 L89 124 Q89 128 86 128 Q83 128 83 124 L84 110 Q77 113 74 124 Q74 128 71 128 Q68 128 69 124 Z',
    // 1 — Joven: más alto, patas largas, cuerpo esbelto
    'M55 120 Q52 100 57 88 L60 68 Q62 56 72 55 Q75 47 81 50 Q83 42 89 47 Q93 45 93 55 L95 66 Q112 64 128 66 L152 68 Q164 66 172 71 Q178 63 184 66 Q190 62 191 69 L190 80 Q192 96 187 110 L185 138 Q185 144 180 144 Q175 144 175 138 L174 118 Q158 124 138 122 L136 138 Q136 144 131 144 Q126 144 126 138 L127 120 Q102 118 86 110 L84 138 Q84 144 79 144 Q74 144 74 138 L76 114 Q64 118 60 138 Q60 144 55 144 Q50 144 51 138 Z',
    // 2 — Adulto joven: musculoso, pecho amplio, robusto
    'M50 122 Q46 98 52 84 L56 62 Q58 48 70 47 Q74 38 82 42 Q85 32 93 38 Q98 35 98 47 L100 60 Q120 57 140 60 L166 62 Q180 60 189 66 Q196 56 203 60 Q210 55 211 64 L210 78 Q213 97 207 114 L205 142 Q205 148 199 148 Q193 148 193 142 L192 120 Q172 128 148 125 L146 142 Q146 148 140 148 Q134 148 134 142 L135 122 Q106 119 88 110 L86 142 Q86 148 80 148 Q74 148 74 142 L76 116 Q62 120 58 142 Q58 148 52 148 Q46 148 47 142 Z',
    // 3 — Adulto: máxima musculatura, cabeza ancha, cuerpo poderoso
    'M46 126 Q42 98 49 82 L54 58 Q56 42 70 41 Q75 30 84 35 Q89 24 98 31 Q104 27 104 41 L106 56 Q128 53 152 56 L180 58 Q196 56 206 63 Q214 51 222 56 Q230 50 231 60 L230 76 Q233 98 226 118 L224 148 Q224 154 217 154 Q210 154 210 148 L209 124 Q186 133 158 130 L156 148 Q156 154 150 154 Q144 154 144 148 L145 126 Q112 122 92 112 L90 148 Q90 154 84 154 Q78 154 78 148 L80 118 Q64 123 60 148 Q60 154 54 154 Q48 154 49 148 Z',
  ],

  // Líneas internas (musculatura sugerida) por etapa
  innerLines: [
    'M85 92 Q95 100 90 108 M110 90 Q115 98 112 106',
    'M75 70 Q88 85 82 105 M120 70 Q128 88 122 108 M150 72 Q158 88 152 106',
    'M72 66 Q86 84 80 108 M120 62 Q130 82 124 110 M160 66 Q170 84 164 108',
    'M70 60 Q86 82 80 112 M124 56 Q136 78 128 114 M175 60 Q186 82 178 112',
  ],

  // Generar el SVG completo para una etapa
  render(months, color) {
    const stage = this.getStage(months);
    const path = this.paths[stage];
    const inner = this.innerLines[stage];
    const glowColor = '#67e8f9';
    const outlineColor = color || '#e879f9';

    return `
      <svg viewBox="0 0 240 160" xmlns="http://www.w3.org/2000/svg" aria-label="Modelo de crecimiento: ${this.stageLabels[stage]}" style="width:100%;height:auto;">
        <!-- Contorno principal neón -->
        <path class="dog-model-outline" d="${path}"
          fill="none" stroke="${outlineColor}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
        <!-- Líneas internas (musculatura) -->
        <path class="dog-model-inner" d="${inner}"
          fill="none" stroke="${glowColor}" stroke-width="1.2" stroke-linecap="round" opacity="0.7"/>
        <!-- Relleno tenue -->
        <path d="${path}" fill="${outlineColor}" opacity="0.06"/>
      </svg>`;
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
