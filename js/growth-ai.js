// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧠 growth-ai.js — Análisis de crecimiento con IA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const GrowthAI = {

  // ⚠️ URL de tu Worker de Cloudflare
  WORKER_URL: 'https://pupcare-ai.rafaelperez0115.workers.dev',

  // ── Analizar un mes vs el mes anterior ──
  async analyze(monthKey) {
    if (!PET_ID || !Profile.data) {
      showToast('Primero configura el perfil de tu mascota', 'error');
      return;
    }

    // Abrir modal de carga
    openModal('🧠 Análisis de Crecimiento IA', `
      <div class="growth-loading">
        <div class="growth-loading-icon">🧠</div>
        <div class="growth-loading-bar"><div class="growth-loading-fill"></div></div>
        <p>La IA está comparando las fotografías...</p>
        <p class="growth-loading-sub">Esto puede tardar unos segundos</p>
      </div>
    `);

    try {
      // 1. Obtener fotos del mes actual y anterior
      const [y, m] = monthKey.split('-').map(Number);
      const prevDate = new Date(y, m - 2, 1); // mes anterior
      const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth()+1).padStart(2,'0')}`;

      const allPhotos = Album.photos || [];
      const currentPhotos = allPhotos.filter(p => (p.date||'').slice(0,7) === monthKey);
      const previousPhotos = allPhotos.filter(p => (p.date||'').slice(0,7) === prevKey);

      if (currentPhotos.length === 0) {
        this.showError('No hay fotos en este mes para analizar.');
        return;
      }
      if (previousPhotos.length === 0) {
        this.showError(`No hay fotos del mes anterior (${this.monthLabel(prevKey)}) para comparar. El análisis de crecimiento necesita al menos un mes previo con fotos.`);
        return;
      }

      // 2. Convertir imágenes a base64 (limitar a 3 por mes para no exceder límites)
      const curImgs = await this.loadImages(currentPhotos.slice(0, 3));
      const prevImgs = await this.loadImages(previousPhotos.slice(0, 3));

      if (curImgs.length === 0 || prevImgs.length === 0) {
        this.showError('No se pudieron cargar las imágenes. Verifica tu conexión.');
        return;
      }

      // 3. Preparar datos del perro
      const pet = Profile.data;
      const petData = {
        name:      pet.name,
        breed:     pet.breed || 'desconocida',
        ageMonths: pet.birthDate ? this.ageInMonths(pet.birthDate) : 0,
        sex:       pet.sex || 'desconocido',
        weight:    pet.currentWeight || 0,
        weightUnit: pet.weightUnit || 'kg',
      };

      // 4. Llamar a la IA
      const result = await this.callAI(petData, curImgs, prevImgs, monthKey, prevKey);

      // 5. Guardar en Firestore
      await this.saveAnalysis(monthKey, prevKey, result);

      // 6. Mostrar resultado
      this.showResult(result, monthKey, prevKey);

    } catch(e) {
      console.error('Error en análisis IA:', e);
      let msg = 'Ocurrió un error al analizar. Intenta de nuevo.';
      if (e.message && e.message.includes('API')) {
        msg = 'No se pudo conectar con el servicio de IA. Es posible que la función no esté disponible desde este sitio. Revisa la consola para más detalles.';
      } else if (e.message && (e.message.includes('Failed to fetch') || e.message.includes('NetworkError') || e.message.includes('CORS'))) {
        msg = 'La conexión con el servicio de IA fue bloqueada. Esta función requiere una configuración adicional del servidor para funcionar desde GitHub Pages.';
      } else if (e instanceof SyntaxError) {
        msg = 'La IA respondió pero el formato no se pudo procesar. Intenta de nuevo.';
      }
      this.showError(msg);
    }
  },

  // ── Cargar imágenes como base64 ──
  async loadImages(photos) {
    const results = [];
    for (const p of photos) {
      try {
        const b64 = await this.urlToBase64(p.url);
        if (b64) results.push(b64);
      } catch(e) { console.warn('No se pudo cargar imagen:', e); }
    }
    return results;
  },

  urlToBase64(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          // Reducir tamaño para optimizar (máx 768px)
          const maxDim = 768;
          let w = img.width, h = img.height;
          if (w > h && w > maxDim) { h = h * maxDim / w; w = maxDim; }
          else if (h > maxDim) { w = w * maxDim / h; h = maxDim; }
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(dataUrl.split(',')[1]); // solo el base64, sin prefijo
        } catch(e) { reject(e); }
      };
      img.onerror = reject;
      img.src = url.includes('cloudinary')
        ? url.replace('/upload/', '/upload/w_768,q_auto/')
        : url;
    });
  },

  // ── Llamar a la API de Claude ──
  async callAI(petData, curImgs, prevImgs, monthKey, prevKey) {
    // Prompt para Gemini
    const promptText = `Eres un veterinario experto en crecimiento canino. Analiza el crecimiento de este perro comparando fotos de dos meses.

DATOS DEL PERRO:
- Nombre: ${petData.name}
- Raza: ${petData.breed}
- Edad: ${petData.ageMonths} meses
- Sexo: ${petData.sex}
- Peso: ${petData.weight} ${petData.weightUnit}

Te muestro primero las fotos del MES ANTERIOR (${this.monthLabel(prevKey)}), luego las del MES ACTUAL (${this.monthLabel(monthKey)}).

REGLAS ESTRICTAS:
- NO diagnostiques enfermedades.
- NO inventes información que no puedas observar en las fotos.
- Indica claramente cuando algo sea una estimación visual.
- Sé objetivo y alentador.

Responde ÚNICAMENTE con un objeto JSON válido (sin markdown, sin backticks) con esta estructura exacta:
{
  "summary": "resumen general en 1-2 frases",
  "growthStatus": "Normal|Acelerado|Lento|Estable",
  "estimatedGrowthPercentage": número entero de 0 a 100,
  "changesDetected": ["cambio 1", "cambio 2", "cambio 3"],
  "comparison": {
    "bodySize": "descripción breve",
    "muscleDevelopment": "descripción breve",
    "headGrowth": "descripción breve",
    "chestDevelopment": "descripción breve",
    "posture": "descripción breve",
    "coat": "descripción breve",
    "bodyCondition": "descripción breve"
  },
  "recommendations": ["recomendación 1", "recomendación 2"]
}`;

    // Construir "parts" en el formato de Gemini
    const parts = [];
    parts.push({ text: promptText });
    parts.push({ text: `\n=== FOTOS MES ANTERIOR (${this.monthLabel(prevKey)}) ===` });
    prevImgs.forEach(b64 => {
      parts.push({ inline_data: { mime_type: 'image/jpeg', data: b64 } });
    });
    parts.push({ text: `\n=== FOTOS MES ACTUAL (${this.monthLabel(monthKey)}) ===` });
    curImgs.forEach(b64 => {
      parts.push({ inline_data: { mime_type: 'image/jpeg', data: b64 } });
    });

    // Llamar al Worker de Cloudflare (que reenvía a Gemini con la API key segura)
    const response = await fetch(GrowthAI.WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1200,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) throw new Error('Error de la API: ' + response.status);

    const data = await response.json();

    // Verificar errores de Gemini
    if (data.error) throw new Error('API: ' + (data.error.message || 'error desconocido'));

    // Extraer el texto de la respuesta de Gemini
    const text = data.candidates?.[0]?.content?.parts
      ?.map(p => p.text || '')
      .join('') || '';

    if (!text) throw new Error('Respuesta vacía de la IA');

    // Parsear JSON (quitar posibles backticks por si acaso)
    const clean = text.replace(/```json/g,'').replace(/```/g,'').trim();
    return JSON.parse(clean);
  },

  // ── Guardar análisis en Firestore ──
  async saveAnalysis(monthKey, prevKey, result) {
    try {
      await subRef('growthAnalysis').add({
        month: monthKey,
        previousMonth: prevKey,
        growthPercentage: result.estimatedGrowthPercentage || 0,
        growthStatus: result.growthStatus || 'Normal',
        summary: result.summary || '',
        fullResult: JSON.stringify(result),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch(e) { console.warn('No se pudo guardar el análisis:', e); }
  },

  // ── Mostrar resultado ──
  showResult(r, monthKey, prevKey) {
    const statusColor = {
      'Normal': 'var(--secondary)', 'Acelerado': 'var(--warning)',
      'Lento': 'var(--info)', 'Estable': 'var(--primary)',
    }[r.growthStatus] || 'var(--secondary)';
    const statusEmoji = {
      'Normal': '🟢', 'Acelerado': '🟠', 'Lento': '🔵', 'Estable': '🟣',
    }[r.growthStatus] || '🟢';

    const comp = r.comparison || {};
    const compRows = [
      ['Tamaño corporal', comp.bodySize],
      ['Desarrollo muscular', comp.muscleDevelopment],
      ['Crecimiento de cabeza', comp.headGrowth],
      ['Desarrollo del pecho', comp.chestDevelopment],
      ['Postura', comp.posture],
      ['Pelaje', comp.coat],
      ['Condición corporal', comp.bodyCondition],
    ].filter(([,v]) => v);

    openModal('🧠 Análisis de Crecimiento', `
      <div class="growth-result">
        <!-- Crecimiento estimado -->
        <div class="growth-hero" style="border-color:${statusColor};">
          <div class="growth-percent">+${r.estimatedGrowthPercentage||0}%</div>
          <div class="growth-percent-label">Crecimiento estimado</div>
          <div class="growth-status" style="color:${statusColor};">
            ${statusEmoji} ${r.growthStatus || 'Normal'}
          </div>
        </div>

        <!-- Resumen -->
        <div class="growth-summary">${sanitize(r.summary||'')}</div>

        <!-- Comparación mensual -->
        <div class="growth-months">
          ${this.monthLabel(prevKey)} → ${this.monthLabel(monthKey)}
        </div>

        <!-- Cambios detectados -->
        ${r.changesDetected && r.changesDetected.length ? `
          <div class="growth-section-title">💪 Cambios detectados</div>
          <ul class="growth-list">
            ${r.changesDetected.map(c => `<li>${sanitize(c)}</li>`).join('')}
          </ul>` : ''}

        <!-- Comparación detallada -->
        ${compRows.length ? `
          <div class="growth-section-title">📊 Comparación detallada</div>
          <div class="growth-comparison">
            ${compRows.map(([label,val]) => `
              <div class="growth-comp-row">
                <span class="growth-comp-label">${label}</span>
                <span class="growth-comp-val">${sanitize(val)}</span>
              </div>`).join('')}
          </div>` : ''}

        <!-- Recomendaciones -->
        ${r.recommendations && r.recommendations.length ? `
          <div class="growth-section-title">📝 Recomendaciones</div>
          <ul class="growth-list">
            ${r.recommendations.map(rec => `<li>${sanitize(rec)}</li>`).join('')}
          </ul>` : ''}

        <!-- Disclaimer -->
        <div class="growth-disclaimer">
          ⚠️ Este análisis es una estimación visual generada por IA y no sustituye la evaluación de un veterinario profesional.
        </div>

        <button class="btn-outline btn-full" onclick="GrowthAI.showHistory()" style="margin-top:12px;margin-bottom:16px;">
          📈 Ver historial de análisis
        </button>
      </div>
    `);
  },

  // ── Mostrar historial de análisis ──
  async showHistory() {
    openModal('📈 Historial de Crecimiento', '<div style="text-align:center;padding:20px;color:var(--text2);">Cargando...</div>');
    try {
      const snap = await subRef('growthAnalysis').orderBy('month','asc').get();
      if (snap.empty) {
        document.getElementById('modalBody').innerHTML = `
          <div class="empty-state"><div class="empty-icon">📈</div><h4>Sin análisis previos</h4><p>Genera tu primer análisis desde el álbum</p></div>`;
        return;
      }
      const analyses = snap.docs.map(d => d.data());

      // Gráfico de evolución
      const chartHTML = this.buildHistoryChart(analyses);

      // Lista
      const listHTML = [...analyses].reverse().map(a => {
        const statusColor = {
          'Normal':'var(--secondary)','Acelerado':'var(--warning)',
          'Lento':'var(--info)','Estable':'var(--primary)',
        }[a.growthStatus] || 'var(--secondary)';
        return `
          <div class="growth-history-item">
            <div class="growth-history-month">${this.monthLabel(a.month)}</div>
            <div class="growth-history-bar-wrap">
              <div class="growth-history-bar" style="width:${Math.min(100,a.growthPercentage)}%;background:${statusColor};"></div>
            </div>
            <div class="growth-history-percent" style="color:${statusColor};">+${a.growthPercentage}%</div>
          </div>`;
      }).join('');

      document.getElementById('modalBody').innerHTML = `
        <div style="padding-bottom:16px;">
          ${chartHTML}
          <div class="growth-section-title" style="margin-top:16px;">Análisis por mes</div>
          ${listHTML}
        </div>`;
    } catch(e) {
      document.getElementById('modalBody').innerHTML = '<p style="text-align:center;color:var(--text2);padding:20px;">Error al cargar historial</p>';
    }
  },

  // ── Gráfico de evolución del crecimiento ──
  buildHistoryChart(analyses) {
    if (analyses.length < 2) {
      return `<p style="color:var(--text2);font-size:0.85rem;text-align:center;padding:16px;">Necesitas al menos 2 análisis para ver la evolución</p>`;
    }
    const W=300, H=140, pL=28, pR=12, pT=16, pB=24;
    const cW=W-pL-pR, cH=H-pT-pB;
    const vals = analyses.map(a => a.growthPercentage);
    const maxV = Math.max(...vals, 20);
    const n = analyses.length;

    const pts = analyses.map((a,i) => ({
      x: pL + (n===1?cW/2:(i/(n-1))*cW),
      y: pT + cH - (a.growthPercentage/maxV)*cH,
      v: a.growthPercentage, m: a.month,
    }));

    const line = pts.map((p,i)=>`${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const area = `${line} L${pts[n-1].x.toFixed(1)},${pT+cH} L${pts[0].x.toFixed(1)},${pT+cH} Z`;

    let dots='', labels='';
    pts.forEach(p => {
      dots += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3" fill="var(--primary)" stroke="var(--bg)" stroke-width="1.5"/>`;
      labels += `<text x="${p.x.toFixed(1)}" y="${(p.y-6).toFixed(1)}" text-anchor="middle" font-size="8" font-weight="700" fill="var(--primary)">+${p.v}%</text>`;
      labels += `<text x="${p.x.toFixed(1)}" y="${H-8}" text-anchor="middle" font-size="7" fill="var(--text2)">${p.m.slice(5)}/${p.m.slice(2,4)}</text>`;
    });

    return `
      <div class="growth-chart-card">
        <div class="growth-section-title" style="margin-top:0;">Evolución del crecimiento</div>
        <svg viewBox="0 0 ${W} ${H}" width="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="gGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#6C63FF" stop-opacity="0.3"/>
              <stop offset="100%" stop-color="#6C63FF" stop-opacity="0.02"/>
            </linearGradient>
          </defs>
          <path d="${area}" fill="url(#gGrad)"/>
          <path d="${line}" fill="none" stroke="#6C63FF" stroke-width="2" stroke-linecap="round"/>
          ${dots}${labels}
        </svg>
      </div>`;
  },

  showError(msg) {
    document.getElementById('modalBody').innerHTML = `
      <div class="empty-state" style="padding:32px 20px;">
        <div class="empty-icon">📸</div>
        <h4>No se pudo analizar</h4>
        <p>${sanitize(msg)}</p>
      </div>
      <button class="btn-outline btn-full" onclick="closeModal()" style="margin-bottom:16px;">Entendido</button>`;
  },

  // ── Helpers ──
  monthLabel(key) {
    if (!key) return '';
    const [y,m] = key.split('-');
    return new Date(parseInt(y), parseInt(m)-1, 1)
      .toLocaleDateString('es-ES', { month:'long', year:'numeric' });
  },

  ageInMonths(birthDate) {
    const b = new Date(birthDate + 'T00:00:00');
    const now = new Date();
    return (now.getFullYear()-b.getFullYear())*12 + (now.getMonth()-b.getMonth());
  },
};
