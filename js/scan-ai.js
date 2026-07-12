// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📷 ESCANEO DE VACUNAS Y DESPARASITACIONES CON IA
// Toma una foto (cámara o galería), la analiza con Gemini vía el
// Worker de Cloudflare, y muestra un formulario editable antes de guardar.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ScanAI = {
  WORKER_URL: 'https://pupcare-ai.rafaelperez0115.workers.dev',

  _type: null,      // 'vaccines' o 'dewormings'
  _extracted: null, // datos extraídos por la IA

  // ── Iniciar escaneo: elegir cámara o galería ──
  start(type) {
    this._type = type;
    const label = type === 'vaccines'
      ? 'la tarjeta de vacunación completa'
      : 'el desparasitante o su registro';
    const tip = type === 'vaccines'
      ? '💡 La IA leerá <strong>todas las aplicaciones</strong> de la tarjeta. Que se vea la tabla completa, con buena luz y sin sombras.'
      : '💡 Asegúrate de que el texto se vea nítido y con buena luz.';

    openModal('📷 Escanear con IA', `
      <div class="scan-intro">
        <div class="scan-intro-icon">📷</div>
        <p class="scan-intro-text">
          Toma una foto de <strong>${label}</strong> y la IA extraerá los datos automáticamente.
        </p>
        <p class="scan-intro-tip">${tip}</p>
      </div>

      <input type="file" id="scanCamera" accept="image/*" capture="environment"
        style="display:none" onchange="ScanAI.handleImage(event)">
      <input type="file" id="scanGallery" accept="image/*"
        style="display:none" onchange="ScanAI.handleImage(event)">

      <button class="btn-primary btn-full" onclick="document.getElementById('scanCamera').click()"
        style="margin-bottom:10px;">
        📸 Tomar foto con la cámara
      </button>
      <button class="btn-outline btn-full" onclick="document.getElementById('scanGallery').click()"
        style="margin-bottom:16px;">
        🖼️ Elegir de la galería
      </button>
    `);
  },

  // ── Procesar la imagen elegida ──
  async handleImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    this.showScanning();

    try {
      const base64 = await this.fileToBase64(file);
      const data   = await this.callAI(base64);

      // Normalizar: siempre trabajar con una lista de aplicaciones
      let apps = Array.isArray(data.applications) ? data.applications : [];
      apps = apps.filter(a => a && a.date);   // descartar filas sin fecha

      if (!apps.length) {
        this.showError('No se detectó ninguna fecha legible. Prueba con una foto más nítida o registra manualmente.');
        return;
      }

      // Detectar cuáles ya están registradas (misma fecha)
      const existing = await this.getExistingDates();
      apps.forEach(a => {
        a._duplicate = existing.has(a.date);
        a._include   = !a._duplicate;   // los duplicados vienen desmarcados
      });

      this._extracted = { ...data, applications: apps };
      this.showReview(this._extracted);

    } catch (e) {
      console.error('Error al escanear:', e);
      this.showError(this.friendlyError(e));
    }
  },

  // ── Fechas ya registradas en Firestore (para evitar duplicados) ──
  async getExistingDates() {
    const set = new Set();
    try {
      const snap = await subRef(this._type).get();
      snap.docs.forEach(d => { const dt = d.data().date; if (dt) set.add(dt); });
    } catch(e) { /* si falla, seguimos sin detección */ }
    return set;
  },

  // ── Convertir archivo a base64 (comprimido) ──
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (e) => {
        img.onload = () => {
          // Redimensionar para no enviar imágenes enormes
          const MAX = 1400;
          let { width, height } = img;
          if (width > MAX || height > MAX) {
            const ratio = Math.min(MAX / width, MAX / height);
            width  = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataUrl.split(',')[1]);
        };
        img.onerror = () => reject(new Error('No se pudo leer la imagen'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
      reader.readAsDataURL(file);
    });
  },

  // ── Llamar a Gemini vía el Worker ──
  async callAI(base64) {
    const isVaccine = this._type === 'vaccines';

    const prompt = isVaccine
      ? `Eres un asistente veterinario. Analiza esta foto de una tarjeta o carnet de vacunación canina.

CONTEXTO IMPORTANTE:
- Las tarjetas de vacunación suelen tener una TABLA con VARIAS filas.
- Cada fila es UNA aplicación distinta (con su propia fecha).
- Las columnas son las enfermedades que cubre cada vacuna (Moquillo, Hepatitis, Adenovirus, Leptospirosis, Parainfluenza, Parvovirus, Rabia, Coronavirus, etc.).
- Una fila con varias casillas marcadas = una vacuna polivalente que cubre esas enfermedades.
- Si la tarjeta tiene secciones para GATOS y PERROS, lee SOLO la sección de PERROS/CANINA.

TU TAREA:
Extrae TODAS las aplicaciones que veas registradas (filas con fecha y casillas marcadas).

REGLAS ESTRICTAS:
- NO inventes datos. Si no puedes leer algo con claridad, omítelo o déjalo vacío.
- Solo incluye filas que TENGAN una fecha legible.
- Solo lista las enfermedades cuyas casillas estén realmente marcadas (✓, X, o similar).
- Fechas en formato YYYY-MM-DD. Si la tarjeta usa DD/MM/AA, conviértelo (ej: 22/12/25 → 2025-12-22).
- Si el año tiene 2 dígitos, asume 20XX.

Responde ÚNICAMENTE con un objeto JSON válido (sin markdown, sin backticks):
{
  "applications": [
    {
      "date": "YYYY-MM-DD",
      "ageLabel": "edad anotada si aparece, ej: 2 meses",
      "diseases": ["Moquillo", "Parvovirus"],
      "brand": "marca si es legible o vacío"
    }
  ],
  "confidence": "alta|media|baja",
  "notes": "cualquier observación relevante o dificultad de lectura"
}`
      : `Eres un asistente veterinario. Analiza esta foto de un producto desparasitante, su etiqueta o un registro de desparasitación.

Si ves un REGISTRO con varias filas (varias desparasitaciones), extrae todas.
Si es un solo producto o una sola aplicación, devuelve una sola entrada.

REGLAS ESTRICTAS:
- NO inventes datos que no puedas leer claramente.
- Fechas en formato YYYY-MM-DD. Si usa DD/MM/AA, conviértelo.
- "type" debe ser: Interna, Externa o Ambas.

Responde ÚNICAMENTE con un objeto JSON válido (sin markdown, sin backticks):
{
  "applications": [
    {
      "product": "nombre del producto",
      "type": "Interna|Externa|Ambas",
      "dose": "dosis o vacío",
      "date": "YYYY-MM-DD",
      "nextDate": "YYYY-MM-DD o vacío"
    }
  ],
  "confidence": "alta|media|baja",
  "notes": "observaciones o vacío"
}`;

    const response = await fetch(this.WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: 'image/jpeg', data: base64 } },
          ],
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2000,
          responseMimeType: 'application/json',
        },
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      const detail = data.error?.message || `HTTP ${response.status}`;
      throw new Error('GEMINI: ' + detail);
    }
    if (data.candidates?.[0]?.finishReason === 'SAFETY') {
      throw new Error('La IA no pudo procesar esta imagen.');
    }

    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
    if (!text) throw new Error('Respuesta vacía de la IA');

    return this.parseJSON(text);
  },

  // ── Parseo robusto de JSON ──
  parseJSON(text) {
    let clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    try { return JSON.parse(clean); } catch(e) {}

    const first = clean.indexOf('{');
    const last  = clean.lastIndexOf('}');
    if (first !== -1 && last > first) {
      const block = clean.slice(first, last + 1);
      try { return JSON.parse(block); } catch(e) {}
      try {
        return JSON.parse(block.replace(/,\s*}/g,'}').replace(/,\s*]/g,']'));
      } catch(e) {}
    }
    console.error('No se pudo parsear:', text);
    throw new SyntaxError('No se pudo interpretar la respuesta de la IA');
  },

  // ── Pantalla de análisis en curso ──
  showScanning() {
    const body = document.getElementById('modalBody');
    if (!body) return;
    body.innerHTML = `
      <div class="growth-loading">
        <div class="growth-loading-icon">🔍</div>
        <div class="growth-loading-title">Leyendo la imagen...</div>
        <div class="growth-loading-bar"><div class="growth-loading-fill" style="width:60%;"></div></div>
        <p class="growth-loading-sub">La IA está extrayendo los datos</p>
      </div>`;
  },

  // ── Formulario editable con los datos extraídos ──
  // ── Pantalla de revisión: TODAS las aplicaciones detectadas ──
  showReview(data) {
    const isVaccine = this._type === 'vaccines';
    const apps = data.applications;
    const conf = data.confidence || 'media';
    const confColors = { alta:'var(--secondary)', media:'var(--warning)', baja:'var(--danger)' };
    const confLabels = {
      alta:'Lectura clara',
      media:'Revisa bien los datos',
      baja:'Verifica todo con cuidado',
    };

    const dupCount = apps.filter(a => a._duplicate).length;

    const banner = `
      <div class="scan-confidence" style="border-left-color:${confColors[conf]};">
        <span style="color:${confColors[conf]};font-weight:700;">${confLabels[conf]}</span>
        <span class="scan-confidence-sub">
          Se detectaron <strong>${apps.length}</strong> aplicacion${apps.length!==1?'es':''}.
          Revisa y corrige antes de guardar.
        </span>
      </div>
      ${dupCount ? `
        <div class="scan-dup-warn">
          ♻️ ${dupCount} ${dupCount===1?'aplicación ya está registrada':'aplicaciones ya están registradas'} y vienen desmarcadas para no duplicar.
        </div>` : ''}`;

    const cards = apps.map((a, i) => this.appCard(a, i, isVaccine)).join('');

    openModal('✏️ Revisar lo escaneado', `
      ${banner}
      <div id="scanApps">${cards}</div>

      <button class="btn-primary btn-full" onclick="ScanAI.save()" style="margin-top:6px;margin-bottom:10px;">
        ✅ Guardar seleccionadas
      </button>
      <button class="btn-outline btn-full" onclick="ScanAI.start('${this._type}')" style="margin-bottom:16px;">
        🔄 Escanear otra foto
      </button>
    `);
  },

  // ── Tarjeta editable de una aplicación ──
  appCard(a, i, isVaccine) {
    const esc = (x) => x != null ? String(x).replace(/"/g,'&quot;') : '';
    const diseases = Array.isArray(a.diseases) && a.diseases.length ? a.diseases : [''];

    return `
      <div class="scan-app ${a._duplicate ? 'is-dup' : ''}" data-idx="${i}">
        <div class="scan-app-head">
          <label class="scan-app-check">
            <input type="checkbox" class="scan-app-include" ${a._include ? 'checked' : ''}>
            <span>Aplicación ${i + 1}</span>
          </label>
          ${a._duplicate ? '<span class="scan-dup-badge">Ya registrada</span>' : ''}
          ${a.ageLabel ? `<span class="scan-age">${sanitize(a.ageLabel)}</span>` : ''}
        </div>

        <div class="scan-app-body">
          ${isVaccine ? `
            <div class="field">
              <label>Fecha de aplicación</label>
              <input type="date" class="scan-app-date" value="${esc(a.date)}">
            </div>
            <div class="field">
              <label>Enfermedades que cubre</label>
              <div class="scan-app-diseases">
                ${diseases.map(d => this.diseaseRow(d)).join('')}
              </div>
              <button class="btn-outline btn-sm" onclick="ScanAI.addDisease(this)" style="margin-top:6px;width:100%;">
                + Añadir enfermedad
              </button>
            </div>
            <div class="field">
              <label>Marca / Laboratorio</label>
              <input type="text" class="scan-app-brand" value="${esc(a.brand)}" placeholder="Ej: Vibix">
            </div>
          ` : `
            <div class="field">
              <label>Producto</label>
              <input type="text" class="scan-app-product" value="${esc(a.product)}" placeholder="Ej: Drontal">
            </div>
            <div class="field-row">
              <div class="field">
                <label>Fecha</label>
                <input type="date" class="scan-app-date" value="${esc(a.date)}">
              </div>
              <div class="field">
                <label>Próxima</label>
                <input type="date" class="scan-app-next" value="${esc(a.nextDate)}">
              </div>
            </div>
            <div class="field-row">
              <div class="field">
                <label>Tipo</label>
                <select class="scan-app-type">
                  <option ${a.type==='Interna'?'selected':''}>Interna</option>
                  <option ${a.type==='Externa'?'selected':''}>Externa</option>
                  <option ${a.type==='Ambas'?'selected':''}>Ambas</option>
                </select>
              </div>
              <div class="field">
                <label>Dosis</label>
                <input type="text" class="scan-app-dose" value="${esc(a.dose)}" placeholder="1 comprimido">
              </div>
            </div>
          `}
        </div>
      </div>`;
  },

  // ── Fila editable de enfermedad ──
  diseaseRow(value) {
    return `
      <div class="scan-disease-row">
        <input type="text" class="scan-disease-input" value="${String(value||'').replace(/"/g,'&quot;')}"
          placeholder="Ej: Moquillo">
        <button class="btn-delete" onclick="ScanAI.removeDisease(this)" aria-label="Quitar">🗑️</button>
      </div>`;
  },

  addDisease(btn) {
    const cont = btn.previousElementSibling; // .scan-app-diseases
    if (cont) cont.insertAdjacentHTML('beforeend', this.diseaseRow(''));
  },

  removeDisease(btn) {
    const row  = btn.closest('.scan-disease-row');
    const cont = row?.parentElement;
    if (cont && cont.children.length > 1) row.remove();
    else showToast('Debe haber al menos una enfermedad', 'info');
  },

  // ── Guardar todas las aplicaciones seleccionadas ──
  async save() {
    const isVaccine = this._type === 'vaccines';
    const cards = [...document.querySelectorAll('.scan-app')];

    // Recoger solo las marcadas
    const toSave = [];
    cards.forEach(card => {
      const include = card.querySelector('.scan-app-include')?.checked;
      if (!include) return;

      const date = card.querySelector('.scan-app-date')?.value;
      if (!date) return;

      if (isVaccine) {
        const diseases = [...card.querySelectorAll('.scan-disease-input')]
          .map(i => i.value.trim()).filter(Boolean);
        if (!diseases.length) return;
        toSave.push({
          date,
          diseases,
          brand: sanitize(card.querySelector('.scan-app-brand')?.value.trim() || ''),
        });
      } else {
        const product = card.querySelector('.scan-app-product')?.value.trim();
        if (!product) return;
        toSave.push({
          date,
          product: sanitize(product),
          type: card.querySelector('.scan-app-type')?.value || 'Interna',
          dose: sanitize(card.querySelector('.scan-app-dose')?.value.trim() || ''),
          nextDate: card.querySelector('.scan-app-next')?.value || null,
        });
      }
    });

    if (!toSave.length) {
      showToast('Selecciona al menos una aplicación válida', 'error');
      return;
    }

    showLoading(true);
    try {
      const now = firebase.firestore.FieldValue.serverTimestamp();
      const batch = db.batch();
      let registros = 0;

      toSave.forEach(app => {
        if (isVaccine) {
          // Una aplicación polivalente = un registro por enfermedad, MISMA fecha.
          // La app las agrupa visualmente en una sola tarjeta.
          app.diseases.forEach(name => {
            batch.set(subRef('vaccines').doc(), {
              name: sanitize(name),
              date: app.date,
              nextDate: null,
              brand: app.brand,
              notes: '',
              createdAt: now,
            });
            registros++;
          });
        } else {
          batch.set(subRef('dewormings').doc(), {
            product: app.product,
            type: app.type,
            dose: app.dose,
            date: app.date,
            nextDate: app.nextDate,
            createdAt: now,
          });
          registros++;
        }
      });

      await batch.commit();
      if (typeof invalidateCache === 'function') invalidateCache(this._type);

      closeModal();
      const n = toSave.length;
      showToast(`✅ ${n} aplicaci${n!==1?'ones guardadas':'ón guardada'}`, 'success');
      if (typeof Health !== 'undefined') await Health.loadTab(this._type);

    } catch (e) {
      console.error('Error al guardar:', e);
      showToast('Error al guardar', 'error');
    } finally {
      showLoading(false);
    }
  },

  friendlyError(e) {
    const msg = e.message || '';
    if (msg.startsWith('GEMINI:')) {
      const detail = msg.replace('GEMINI:', '').trim();
      if (/API key|401|403/i.test(detail)) return 'La clave de IA no es válida. Revisa la configuración del Worker.';
      if (/quota|429|RESOURCE_EXHAUSTED/i.test(detail)) return 'Se alcanzó el límite diario de la IA. Intenta mañana.';
      return 'Error de la IA: ' + detail;
    }
    if (e instanceof SyntaxError) return 'La IA respondió pero no se pudo leer el resultado. Intenta con otra foto.';
    if (/Failed to fetch|NetworkError/i.test(msg)) return 'No se pudo conectar con el servicio de IA. Revisa tu conexión.';
    return 'No se pudieron extraer los datos. Intenta con una foto más nítida.';
  },

  showError(msg) {
    const body = document.getElementById('modalBody');
    if (!body) return;
    const type = this._type;
    body.innerHTML = `
      <div class="empty-state" style="padding:32px 20px;">
        <div class="empty-icon">📷</div>
        <h4>No se pudo escanear</h4>
        <p>${sanitize(msg)}</p>
      </div>
      <button class="btn-primary btn-full" onclick="ScanAI.start('${type}')" style="margin-bottom:10px;">
        🔄 Intentar de nuevo
      </button>
      <button class="btn-outline btn-full" onclick="Health.openForm('${type}')" style="margin-bottom:16px;">
        ✏️ Registrar manualmente
      </button>`;
  },
};
