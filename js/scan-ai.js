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
    const label = type === 'vaccines' ? 'la tarjeta de vacunación' : 'el desparasitante';

    openModal('📷 Escanear con IA', `
      <div class="scan-intro">
        <div class="scan-intro-icon">📷</div>
        <p class="scan-intro-text">
          Toma una foto de <strong>${label}</strong> y la IA extraerá los datos automáticamente.
        </p>
        <p class="scan-intro-tip">
          💡 Asegúrate de que el texto se vea nítido y con buena luz.
        </p>
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

    // Mostrar pantalla de análisis
    this.showScanning();

    try {
      const base64 = await this.fileToBase64(file);
      const data   = await this.callAI(base64);
      this._extracted = data;
      this.showEditForm(data);
    } catch (e) {
      console.error('Error al escanear:', e);
      this.showError(this.friendlyError(e));
    }
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
      ? `Eres un asistente veterinario. Analiza esta foto de una tarjeta o certificado de vacunación canina y extrae los datos.

IMPORTANTE sobre vacunas polivalentes:
- Una sola vacuna puede cubrir varias enfermedades (ej: Quíntuple cubre Moquillo, Parvovirus, Hepatitis, Leptospirosis, Parainfluenza).
- Si detectas una vacuna polivalente, lista CADA enfermedad por separado en "diseases".
- Si es una vacuna simple (ej: Antirrábica), pon solo esa en "diseases".

REGLAS:
- NO inventes datos que no puedas leer claramente en la imagen.
- Si un dato no es legible, deja el campo como cadena vacía "".
- Las fechas en formato YYYY-MM-DD.

Responde ÚNICAMENTE con un objeto JSON válido (sin markdown, sin backticks):
{
  "diseases": ["enfermedad 1", "enfermedad 2"],
  "date": "YYYY-MM-DD o vacío",
  "nextDate": "YYYY-MM-DD o vacío",
  "brand": "marca del laboratorio o vacío",
  "notes": "observaciones relevantes o vacío",
  "confidence": "alta|media|baja"
}`
      : `Eres un asistente veterinario. Analiza esta foto de un producto desparasitante o su etiqueta y extrae los datos.

REGLAS:
- NO inventes datos que no puedas leer claramente en la imagen.
- Si un dato no es legible, deja el campo como cadena vacía "".
- Las fechas en formato YYYY-MM-DD.
- "type" debe ser: Interna, Externa o Ambas.

Responde ÚNICAMENTE con un objeto JSON válido (sin markdown, sin backticks):
{
  "product": "nombre del producto",
  "type": "Interna|Externa|Ambas",
  "dose": "dosis indicada o vacío",
  "date": "YYYY-MM-DD o vacío",
  "nextDate": "YYYY-MM-DD o vacío",
  "confidence": "alta|media|baja"
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
  showEditForm(d) {
    const isVaccine = this._type === 'vaccines';
    const conf = d.confidence || 'media';
    const confColors = { alta:'var(--secondary)', media:'var(--warning)', baja:'var(--danger)' };
    const confLabels = { alta:'Alta confianza', media:'Revisa los datos', baja:'Verifica bien los datos' };

    const v = (x) => x != null ? String(x).replace(/"/g,'&quot;') : '';

    const banner = `
      <div class="scan-confidence" style="border-left-color:${confColors[conf]};">
        <span style="color:${confColors[conf]};font-weight:700;">${confLabels[conf]}</span>
        <span class="scan-confidence-sub">Puedes corregir cualquier dato antes de guardar.</span>
      </div>`;

    if (isVaccine) {
      const diseases = Array.isArray(d.diseases) && d.diseases.length ? d.diseases : [''];
      openModal('✏️ Revisar datos escaneados', `
        ${banner}
        <div class="field">
          <label>Enfermedades que cubre</label>
          <div id="scanDiseases">
            ${diseases.map((dis, i) => this.diseaseRow(dis, i)).join('')}
          </div>
          <button class="btn-outline btn-sm" onclick="ScanAI.addDisease()" style="margin-top:8px;width:100%;">
            + Añadir otra enfermedad
          </button>
        </div>
        <div class="field-row">
          <div class="field"><label>Fecha de aplicación</label>
            <input type="date" id="scanDate" value="${d.date || today()}"></div>
          <div class="field"><label>Próxima dosis</label>
            <input type="date" id="scanNext" value="${v(d.nextDate)}"></div>
        </div>
        <div class="field"><label>Marca / Laboratorio</label>
          <input type="text" id="scanBrand" value="${v(d.brand)}" placeholder="Ej: Nobivac"></div>
        <div class="field"><label>Notas</label>
          <textarea id="scanNotes" placeholder="Observaciones...">${v(d.notes)}</textarea></div>

        <button class="btn-primary btn-full" onclick="ScanAI.save()" style="margin-bottom:10px;">
          ✅ Guardar vacuna
        </button>
        <button class="btn-outline btn-full" onclick="ScanAI.start('vaccines')" style="margin-bottom:16px;">
          🔄 Escanear otra foto
        </button>
      `);
    } else {
      openModal('✏️ Revisar datos escaneados', `
        ${banner}
        <div class="field"><label>Producto</label>
          <input type="text" id="scanProduct" value="${v(d.product)}" placeholder="Ej: Drontal"></div>
        <div class="field"><label>Tipo</label>
          <select id="scanType">
            <option ${d.type==='Interna'?'selected':''}>Interna</option>
            <option ${d.type==='Externa'?'selected':''}>Externa</option>
            <option ${d.type==='Ambas'?'selected':''}>Ambas</option>
          </select></div>
        <div class="field-row">
          <div class="field"><label>Fecha</label>
            <input type="date" id="scanDate" value="${d.date || today()}"></div>
          <div class="field"><label>Próxima</label>
            <input type="date" id="scanNext" value="${v(d.nextDate)}"></div>
        </div>
        <div class="field"><label>Dosis</label>
          <input type="text" id="scanDose" value="${v(d.dose)}" placeholder="Ej: 1 comprimido"></div>

        <button class="btn-primary btn-full" onclick="ScanAI.save()" style="margin-bottom:10px;">
          ✅ Guardar desparasitación
        </button>
        <button class="btn-outline btn-full" onclick="ScanAI.start('dewormings')" style="margin-bottom:16px;">
          🔄 Escanear otra foto
        </button>
      `);
    }
  },

  // ── Fila editable de enfermedad ──
  diseaseRow(value, i) {
    return `
      <div class="scan-disease-row" data-idx="${i}">
        <input type="text" class="scan-disease-input" value="${String(value||'').replace(/"/g,'&quot;')}"
          placeholder="Ej: Moquillo">
        <button class="btn-delete" onclick="ScanAI.removeDisease(this)" aria-label="Quitar">🗑️</button>
      </div>`;
  },

  addDisease() {
    const cont = document.getElementById('scanDiseases');
    if (!cont) return;
    const idx = cont.children.length;
    cont.insertAdjacentHTML('beforeend', this.diseaseRow('', idx));
  },

  removeDisease(btn) {
    const row = btn.closest('.scan-disease-row');
    const cont = document.getElementById('scanDiseases');
    if (cont && cont.children.length > 1) row.remove();
    else showToast('Debe haber al menos una enfermedad', 'info');
  },

  // ── Guardar en Firestore ──
  async save() {
    const isVaccine = this._type === 'vaccines';
    showLoading(true);

    try {
      const date     = document.getElementById('scanDate')?.value || today();
      const nextDate = document.getElementById('scanNext')?.value || null;
      const now      = firebase.firestore.FieldValue.serverTimestamp();

      if (isVaccine) {
        // Leer todas las enfermedades del formulario
        const inputs = [...document.querySelectorAll('.scan-disease-input')];
        const diseases = inputs.map(i => i.value.trim()).filter(Boolean);

        if (!diseases.length) {
          showLoading(false);
          showToast('Añade al menos una enfermedad', 'error');
          return;
        }

        const brand = sanitize(document.getElementById('scanBrand')?.value.trim() || '');
        const notes = sanitize(document.getElementById('scanNotes')?.value.trim() || '');

        // Una vacuna polivalente = varios registros con la MISMA fecha.
        // La app los agrupa visualmente por fecha en una sola aplicación.
        const batch = db.batch();
        diseases.forEach(name => {
          batch.set(subRef('vaccines').doc(), {
            name: sanitize(name),
            date, nextDate, brand, notes,
            createdAt: now,
          });
        });
        await batch.commit();

        if (typeof invalidateCache === 'function') invalidateCache('vaccines');
        closeModal();
        showToast(`✅ Vacuna guardada (${diseases.length} enfermedad${diseases.length!==1?'es':''})`, 'success');
        if (typeof Health !== 'undefined') await Health.loadTab('vaccines');

      } else {
        const product = document.getElementById('scanProduct')?.value.trim();
        if (!product) {
          showLoading(false);
          showToast('El producto es requerido', 'error');
          return;
        }

        await subRef('dewormings').add({
          product: sanitize(product),
          type: document.getElementById('scanType')?.value || 'Interna',
          dose: sanitize(document.getElementById('scanDose')?.value.trim() || ''),
          date, nextDate,
          createdAt: now,
        });

        if (typeof invalidateCache === 'function') invalidateCache('dewormings');
        closeModal();
        showToast('✅ Desparasitación guardada', 'success');
        if (typeof Health !== 'undefined') await Health.loadTab('dewormings');
      }
    } catch (e) {
      console.error('Error al guardar:', e);
      showToast('Error al guardar', 'error');
    } finally {
      showLoading(false);
    }
  },

  // ── Mensajes de error claros ──
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
