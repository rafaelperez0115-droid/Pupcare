// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🐾 profile.js v4 — Perfil + Gráfico de Peso
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const Profile = {
  data: null,

  async render() {
    const view = document.getElementById('view-perfil');
    if (!view) return;

    if (!PET_ID || !this.data) {
      view.innerHTML = this.setupHTML();
      return;
    }

    const pet = this.data;
    view.innerHTML = `
      <!-- Tarjeta principal -->
      <div class="profile-hero">
        <div class="profile-photo-wrap">
          <img id="profilePhoto"
            src="${pet.photoUrl || 'assets/icons/paw.svg'}"
            alt="${sanitize(pet.name)}"
            class="profile-photo">
          <button class="photo-edit-btn" onclick="Profile.changePhoto()" aria-label="Cambiar foto">📷</button>
        </div>
        <h2 class="profile-name">${sanitize(pet.name)}</h2>
        <p class="profile-breed">${sanitize(pet.breed || '')}</p>
        ${pet.birthDate ? `<span class="profile-age">🎂 ${calcAge(pet.birthDate)}</span>` : ''}
        <input type="file" id="photoInput" accept="image/*" style="display:none"
          onchange="Profile.handlePhotoChange(event)">
      </div>

      <!-- Datos -->
      <div class="card" style="margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
          <div style="font-weight:700;font-size:0.95rem;">Datos de ${sanitize(pet.name)}</div>
          <button class="btn-primary btn-sm" onclick="Profile.openEdit()">✏️ Editar</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <div style="font-size:0.74rem;color:var(--text2);margin-bottom:2px;">Raza</div>
            <div style="font-weight:600;font-size:0.9rem;">${sanitize(pet.breed || '—')}</div>
          </div>
          <div>
            <div style="font-size:0.74rem;color:var(--text2);margin-bottom:2px;">Sexo</div>
            <div style="font-weight:600;font-size:0.9rem;">${pet.sex || '—'}</div>
          </div>
          <div>
            <div style="font-size:0.74rem;color:var(--text2);margin-bottom:2px;">Nacimiento</div>
            <div style="font-weight:600;font-size:0.9rem;">${pet.birthDate ? formatDate(pet.birthDate) : '—'}</div>
          </div>
          <div>
            <div style="font-size:0.74rem;color:var(--text2);margin-bottom:2px;">Edad</div>
            <div style="font-weight:600;font-size:0.9rem;">${pet.birthDate ? calcAge(pet.birthDate) : '—'}</div>
          </div>
        </div>
      </div>

      <!-- Sección de Medidas: Peso y Altura -->
      <div class="card weight-section">
        <div class="measure-grid">
          <div class="measure-box">
            <div class="weight-current-label">Peso actual</div>
            <div class="weight-current-val">
              ${pet.currentWeight ? pet.currentWeight + ' ' + (pet.weightUnit || 'kg') : '—'}
            </div>
            <div class="measure-actions">
              <button class="btn-primary btn-sm" onclick="Profile.openWeight()">+ Registrar</button>
              <button class="btn-outline btn-sm" onclick="Profile.showWeightChart()">📈</button>
            </div>
          </div>
          <div class="measure-box">
            <div class="weight-current-label">Altura actual</div>
            <div class="weight-current-val">
              ${pet.currentHeight ? pet.currentHeight + ' ' + (pet.heightUnit || 'cm') : '—'}
            </div>
            <div class="measure-actions">
              <button class="btn-primary btn-sm" onclick="Profile.openHeight()">+ Registrar</button>
              <button class="btn-outline btn-sm" onclick="Profile.showHeightChart()">📈</button>
            </div>
          </div>
        </div>
        <!-- Mini gráfico de peso -->
        <div id="miniChart"></div>
        ${this.adultWeightHTML(pet)}
      </div>

      <!-- Gastos -->
      <!-- Compartir / Descargar perfil -->
      <div class="card">
        <div class="petcard-row">
          <button class="btn-primary petcard-btn" onclick="PetCard.share()">
            📤 Compartir perfil
          </button>
          <button class="btn-outline petcard-btn" onclick="PetCard.download()">
            ⬇️ Descargar
          </button>
        </div>
        <p class="petcard-hint">Tarjeta con foto, datos y estado de salud — ideal para el veterinario o cuidador.</p>
      </div>

      <!-- Gastos -->
      <div class="card exp-card" onclick="Expenses.open()" role="button" tabindex="0">
        <div class="exp-card-row">
          <span class="exp-card-icon">💰</span>
          <div class="exp-card-info">
            <div class="exp-card-title">Gastos</div>
            <div class="exp-card-sub">Lo invertido en ${sanitize(pet.name || 'tu mascota')}</div>
          </div>
          <span class="setting-arrow">›</span>
        </div>
      </div>

      <!-- Gestión de mascotas -->
      <div class="card" style="display:flex;flex-direction:column;gap:10px;">
        <button class="btn-outline btn-full" onclick="openPetSelector()">🐾 Cambiar de mascota</button>
        <button class="btn-outline btn-full" onclick="addNewPet()">➕ Agregar otra mascota</button>
        <button class="btn-outline btn-full" style="color:var(--danger);border-color:var(--danger);" onclick="Profile.deletePet()">🗑️ Eliminar esta mascota</button>
      </div>
    `;

    // Cargar mini gráfico en segundo plano
    this.loadMiniChart();
  },

  async deletePet() {
    if (!PET_ID || !this.data) return;
    const petName = this.data.name;
    showConfirm(
      `¿Eliminar a ${petName}?`,
      'Se borrarán TODOS sus datos (vacunas, fotos, historial, etc.). Esta acción no se puede deshacer.',
      async () => {
        showLoading(true);
        try {
          // Eliminar el documento principal de la mascota
          await db.collection('pets').doc(PET_ID).delete();
          showToast(`${petName} fue eliminada`, 'info');

          // Buscar otra mascota del usuario
          const snap = await db.collection('pets')
            .where('ownerId', '==', currentUser.uid)
            .limit(1).get();

          if (!snap.empty) {
            // Cambiar a la primera mascota disponible
            PET_ID = snap.docs[0].id;
            localStorage.setItem('pupcare_pet_id', PET_ID);
            this.data = { id: PET_ID, ...snap.docs[0].data() };
            updateHeaderPhoto(this.data.photoUrl);
            updatePetTitle(this.data.name);
            this.updateHeader();
          } else {
            // No quedan mascotas
            PET_ID = null;
            this.data = null;
            localStorage.removeItem('pupcare_pet_id');
            updatePetTitle('PupCare');
            updateHeaderPhoto('assets/icons/paw.svg');
          }
          await navigate('inicio');
        } catch(e) {
          console.error('Error eliminando mascota:', e);
          showToast('Error al eliminar', 'error');
        } finally {
          showLoading(false);
        }
      }
    );
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📊 GRÁFICO DE PESO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async loadMiniChart() {
    const container = document.getElementById('miniChart');
    if (!container) return;
    try {
      const snap = await subRef('weightHistory')
        .orderBy('recordedAt','asc').limit(5).get();
      if (snap.empty) {
        container.innerHTML = '<p style="color:var(--text2);font-size:0.82rem;text-align:center;padding:8px 0;">Sin registros de peso aún</p>';
        return;
      }
      const records = snap.docs.map(d => ({
        weight: d.data().weight,
        unit:   d.data().unit || 'kg',
        date:   d.data().date || '',
      }));
      container.innerHTML = this.buildSVGChart(records, 200, true);
    } catch(e) {
      container.innerHTML = '';
    }
  },

  async showWeightChart() {
    openModal('📈 Historial de Peso', `
      <div style="text-align:center;padding:20px;color:var(--text2);">Cargando historial...</div>
    `);
    try {
      const snap = await subRef('weightHistory')
        .orderBy('recordedAt','asc').limit(30).get();

      if (snap.empty) {
        document.getElementById('modalBody').innerHTML = `
          <div class="chart-empty">
            <div class="empty-icon">⚖️</div>
            <p>Sin registros de peso.</p>
            <p style="margin-top:6px;font-size:0.82rem;">Usa el botón "Registrar" para empezar a llevar el historial.</p>
          </div>`;
        return;
      }

      const records = snap.docs.map(d => ({
        weight: d.data().weight,
        unit:   d.data().unit || 'kg',
        date:   d.data().date || '',
      }));

      const weights = records.map(r => r.weight);
      const minW    = Math.min(...weights);
      const maxW    = Math.max(...weights);
      const lastW   = weights[weights.length - 1];
      const firstW  = weights[0];
      const diff    = (lastW - firstW).toFixed(1);
      const unit    = records[0].unit;

      document.getElementById('modalBody').innerHTML = `
        <!-- Stats row -->
        <div class="chart-stats-row">
          <div class="chart-stat">
            <div class="chart-stat-val">${minW} ${unit}</div>
            <div class="chart-stat-label">Mínimo</div>
          </div>
          <div class="chart-stat">
            <div class="chart-stat-val">${maxW} ${unit}</div>
            <div class="chart-stat-label">Máximo</div>
          </div>
          <div class="chart-stat">
            <div class="chart-stat-val" style="color:${diff >= 0 ? 'var(--secondary)' : 'var(--danger)'}">
              ${diff >= 0 ? '+' : ''}${diff} ${unit}
            </div>
            <div class="chart-stat-label">Cambio total</div>
          </div>
          <div class="chart-stat">
            <div class="chart-stat-val">${records.length}</div>
            <div class="chart-stat-label">Registros</div>
          </div>
        </div>

        <!-- Gráfico principal -->
        <div class="chart-wrap">
          ${this.buildSVGChart(records, 240, false)}
        </div>

        <!-- Lista de últimas medidas -->
        <div style="margin-top:16px;">
          <div style="font-size:0.78rem;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">
            Últimas medidas
          </div>
          ${[...records].reverse().slice(0,8).map(r => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);">
              <span style="font-size:0.85rem;color:var(--text2);">${r.date ? formatDate(r.date) : '—'}</span>
              <span style="font-weight:700;color:var(--primary);">${r.weight} ${r.unit}</span>
            </div>`).join('')}
        </div>

        <button class="btn-primary btn-full" onclick="closeModal();Profile.openWeight();" style="margin-top:16px;margin-bottom:16px;">
          + Nuevo registro de peso
        </button>
      `;
    } catch(e) {
      document.getElementById('modalBody').innerHTML =
        '<p style="color:var(--text2);text-align:center;padding:20px;">Error al cargar historial</p>';
    }
  },

  buildSVGChart(records, chartHeight = 200, mini = false) {
    if (!records || records.length < 2) {
      if (records.length === 1) {
        return `<p style="color:var(--text2);font-size:0.82rem;text-align:center;padding:8px 0;">
          Solo hay 1 registro (${records[0].weight} ${records[0].unit}). Agrega más para ver el gráfico.
        </p>`;
      }
      return '';
    }

    const n       = records.length;
    const weights = records.map(r => parseFloat(r.weight));
    const minW    = Math.min(...weights);
    const maxW    = Math.max(...weights);
    const range   = maxW - minW || 1;
    const unit    = records[0].unit || 'kg';

    const W       = 320;
    const H       = chartHeight;
    const pL      = mini ? 36 : 44;  // padding left
    const pR      = 12;
    const pT      = mini ? 14 : 20;
    const pB      = mini ? 28 : 36;
    const cW      = W - pL - pR;
    const cH      = H - pT - pB;

    // Calcular puntos
    const pts = records.map((r, i) => ({
      x: pL + (n === 1 ? cW/2 : (i/(n-1)) * cW),
      y: pT + cH - ((parseFloat(r.weight) - minW) / range) * cH,
      w: parseFloat(r.weight),
      d: r.date,
    }));

    // Path de la línea
    const linePath = pts.map((p,i) => `${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    // Path del área rellena
    const areaPath = `${linePath} L${pts[n-1].x.toFixed(1)},${(pT+cH).toFixed(1)} L${pts[0].x.toFixed(1)},${(pT+cH).toFixed(1)} Z`;

    // Labels del eje Y (3 valores)
    const ySteps = mini ? 2 : 3;
    const yLabels = Array.from({length: ySteps+1}, (_,i) => ({
      val: (minW + (range/ySteps)*i).toFixed(1),
      y:   pT + cH - (i/ySteps)*cH,
    }));

    // Labels del eje X (máx 5)
    const xCount  = Math.min(n, mini ? 3 : 5);
    const xIdxs   = xCount <= 1 ? [0] :
      Array.from({length: xCount}, (_,i) => Math.round(i*(n-1)/(xCount-1)));
    const xLabels = xIdxs.map(idx => ({
      label: pts[idx].d ? pts[idx].d.slice(5) : '',
      x:     pts[idx].x,
    }));

    // Dot más reciente destacado
    const lastPt = pts[n-1];

    return `<svg viewBox="0 0 ${W} ${H}" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wGrad${mini?'M':'F'}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#6C63FF" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#6C63FF" stop-opacity="0.02"/>
        </linearGradient>
      </defs>

      <!-- Grid lines y labels Y -->
      ${yLabels.map(l => `
        <line x1="${pL}" y1="${l.y.toFixed(1)}" x2="${W-pR}" y2="${l.y.toFixed(1)}"
          stroke="var(--border)" stroke-dasharray="3,4" stroke-width="1"/>
        <text x="${pL-5}" y="${(l.y+4).toFixed(1)}"
          text-anchor="end" font-size="${mini?9:10}" fill="#8B92A9">${l.val}</text>
      `).join('')}

      <!-- Área rellena -->
      <path d="${areaPath}" fill="url(#wGrad${mini?'M':'F'})"/>

      <!-- Línea -->
      <path d="${linePath}" fill="none" stroke="#6C63FF" stroke-width="${mini?2:2.5}"
        stroke-linecap="round" stroke-linejoin="round"/>

      <!-- Dots -->
      ${pts.map((p,i) => `
        <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}"
          r="${i===n-1 ? (mini?4:5) : (mini?3:3.5)}"
          fill="${i===n-1 ? '#6C63FF' : '#6C63FF'}"
          stroke="var(--bg)" stroke-width="${i===n-1?2.5:2}"/>
      `).join('')}

      <!-- Etiqueta del último punto -->
      <text x="${lastPt.x.toFixed(1)}" y="${(lastPt.y - (mini?8:10)).toFixed(1)}"
        text-anchor="${n>1 && lastPt.x > W*0.8 ? 'end' : 'middle'}"
        font-size="${mini?9:11}" font-weight="700" fill="#6C63FF">${lastPt.w} ${unit}</text>

      <!-- Labels eje X -->
      ${xLabels.map(l => `
        <text x="${l.x.toFixed(1)}" y="${(H-4).toFixed(1)}"
          text-anchor="middle" font-size="${mini?9:10}" fill="#8B92A9">${l.label}</text>
      `).join('')}
    </svg>`;
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🐾 SETUP (primer login)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  setupHTML() {
    const hasPrevious = window._previousPetId;
    return `
      <div style="text-align:center;margin:28px 0 20px;">
        <div style="font-size:3.5rem;display:block;">🐾</div>
        <h2 style="margin-top:12px;font-size:1.3rem;font-weight:800;">${hasPrevious ? 'Nueva mascota' : '¡Bienvenido a PupCare!'}</h2>
        <p style="color:var(--text2);margin-top:6px;font-size:0.88rem;line-height:1.5;">
          Registra los datos de ${hasPrevious ? 'tu nueva mascota' : 'tu mascota para comenzar'}
        </p>
      </div>
      <div class="card">
        <h3 style="font-size:1rem;font-weight:700;margin-bottom:16px;">Datos de la mascota</h3>
        ${this.formHTML()}
        <button class="btn-primary btn-full" onclick="Profile.saveNew()" style="margin-top:8px;">
          Crear Perfil 🐾
        </button>
        ${hasPrevious ? `
        <button class="btn-outline btn-full" onclick="Profile.cancelNewPet()" style="margin-top:10px;">
          Cancelar
        </button>` : ''}
      </div>
    `;
  },

  async cancelNewPet() {
    const prev = window._previousPetId;
    if (!prev) return;
    showLoading(true);
    try {
      const doc = await db.collection('pets').doc(prev).get();
      if (doc.exists) {
        PET_ID = prev;
        localStorage.setItem('pupcare_pet_id', prev);
        this.data = { id: doc.id, ...doc.data() };
        updateHeaderPhoto(this.data.photoUrl);
        updatePetTitle(this.data.name);
        this.updateHeader();
      }
      window._previousPetId = null;
      await navigate('inicio');
    } catch(e) {
      showToast('Error', 'error');
    } finally { showLoading(false); }
  },

  formHTML(pet = {}) {
    return `
      <div class="field">
        <label>Nombre *</label>
        <input type="text" id="pName" value="${sanitize(pet.name||'')}" placeholder="Ej: Guts" autocomplete="off">
      </div>
      <div class="field">
        <label>Raza</label>
        <input type="text" id="pBreed" value="${sanitize(pet.breed||'')}" placeholder="Ej: Bull Terrier Mestizo" autocomplete="off">
      </div>
      <div class="field-row">
        <div class="field">
          <label>Fecha de nacimiento</label>
          <input type="date" id="pBirth" value="${pet.birthDate||''}">
        </div>
        <div class="field">
          <label>Sexo</label>
          <select id="pSex">
            <option value="Macho"  ${(pet.sex||'Macho')==='Macho'  ?'selected':''}>🐾 Macho</option>
            <option value="Hembra" ${pet.sex==='Hembra'?'selected':''}>🐾 Hembra</option>
          </select>
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label>Peso</label>
          <input type="number" id="pWeight" value="${pet.currentWeight||''}" placeholder="0.0" min="0" step="0.1">
        </div>
        <div class="field">
          <label>Unidad</label>
          <select id="pWeightUnit">
            <option value="kg" ${(pet.weightUnit||'kg')==='kg'?'selected':''}>kg</option>
            <option value="lb" ${pet.weightUnit==='lb'?'selected':''}>lb</option>
          </select>
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label>Altura (a la cruz)</label>
          <input type="number" id="pHeight" value="${pet.currentHeight||''}" placeholder="0.0" min="0" step="0.1">
        </div>
        <div class="field">
          <label>Unidad</label>
          <select id="pHeightUnit">
            <option value="cm" ${(pet.heightUnit||'cm')==='cm'?'selected':''}>cm</option>
            <option value="in" ${pet.heightUnit==='in'?'selected':''}>in</option>
          </select>
        </div>
      </div>
    `;
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 💾 CRUD
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async saveNew() {
    const nameEl = document.getElementById('pName');
    const name   = nameEl?.value.trim();
    if (!name) { showToast('El nombre es requerido','error'); nameEl?.focus(); return; }
    showLoading(true);
    try {
      const data = {
        name:          sanitize(name),
        breed:         sanitize(document.getElementById('pBreed')?.value.trim()||''),
        birthDate:     document.getElementById('pBirth')?.value||null,
        sex:           document.getElementById('pSex')?.value||'Macho',
        currentWeight: parseFloat(document.getElementById('pWeight')?.value)||null,
        currentHeight: parseFloat(document.getElementById('pHeight')?.value)||null,
        heightUnit: document.getElementById('pHeightUnit')?.value||'cm',
        weightUnit:    document.getElementById('pWeightUnit')?.value||'kg',
        photoUrl:      null,
        ownerId:       currentUser.uid,
        createdAt:     firebase.firestore.FieldValue.serverTimestamp(),
      };
      const ref  = await db.collection('pets').add(data);
      PET_ID     = ref.id;
      localStorage.setItem('pupcare_pet_id', PET_ID);
      this.data  = { id: PET_ID, ...data };
      this.updateHeader();
      updatePetTitle(this.data.name);
      window._previousPetId = null; // limpiar respaldo
      showToast(`✅ ¡Perfil de ${name} creado!`,'success');
      await navigate('inicio');
    } catch(e) {
      console.error(e); showToast('Error al crear perfil','error');
    } finally { showLoading(false); }
  },

  openEdit() {
    openModal('Editar Perfil', `
      ${this.formHTML(this.data)}
      <button class="btn-primary btn-full" onclick="Profile.saveEdit()"
        style="margin-top:8px;margin-bottom:16px;">Guardar Cambios</button>
    `);
  },

  async saveEdit() {
    const name = document.getElementById('pName')?.value.trim();
    if (!name) { showToast('El nombre es requerido','error'); return; }
    showLoading(true);
    try {
      const updates = {
        name:          sanitize(name),
        breed:         sanitize(document.getElementById('pBreed')?.value.trim()||''),
        birthDate:     document.getElementById('pBirth')?.value||null,
        sex:           document.getElementById('pSex')?.value||'Macho',
        currentWeight: parseFloat(document.getElementById('pWeight')?.value)||null,
        currentHeight: parseFloat(document.getElementById('pHeight')?.value)||null,
        heightUnit: document.getElementById('pHeightUnit')?.value||'cm',
        weightUnit:    document.getElementById('pWeightUnit')?.value||'kg',
        updatedAt:     firebase.firestore.FieldValue.serverTimestamp(),
      };
      await petRef().update(updates);
      this.data = { ...this.data, ...updates };
      this.updateHeader();
      updatePetTitle(this.data.name);
      closeModal();
      showToast('✅ Perfil actualizado','success');
      await this.render();
    } catch(e) { showToast('Error al guardar','error'); }
    finally { showLoading(false); }
  },

  openWeight() {
    openModal('Registrar Peso', `
      <div class="field-row">
        <div class="field">
          <label>Peso</label>
          <input type="number" id="wVal" value="${this.data?.currentWeight||''}"
            placeholder="0.0" min="0" step="0.1">
        </div>
        <div class="field">
          <label>Unidad</label>
          <select id="wUnit">
            <option value="kg" ${(this.data?.weightUnit||'kg')!=='lb'?'selected':''}>kg</option>
            <option value="lb" ${this.data?.weightUnit==='lb'?'selected':''}>lb</option>
          </select>
        </div>
      </div>
      <div class="field">
        <label>Fecha</label>
        <input type="date" id="wDate" value="${today()}">
      </div>
      <button class="btn-primary btn-full" onclick="Profile.saveWeight()" style="margin-bottom:16px;">
        ✅ Registrar
      </button>
    `);
  },

  async saveWeight() {
    const val  = parseFloat(document.getElementById('wVal')?.value);
    const unit = document.getElementById('wUnit')?.value||'kg';
    const date = document.getElementById('wDate')?.value;
    if (!val||val<=0) { showToast('Ingresa un peso válido','error'); return; }
    showLoading(true);
    try {
      await subRef('weightHistory').add({
        weight: val, unit, date,
        recordedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      await petRef().update({ currentWeight: val, weightUnit: unit });
      this.data = { ...this.data, currentWeight: val, weightUnit: unit };
      closeModal();
      showToast(`✅ Peso registrado: ${val} ${unit}`,'success');
      await this.render();
    } catch(e) { showToast('Error al registrar','error'); }
    finally { showLoading(false); }
  },

  // ── Predicción de peso adulto ──
  // Usa una curva estándar de % del peso adulto alcanzado por edad.
  // Solo se muestra para perros en crecimiento (< 18 meses) con datos.
  adultWeightHTML(pet) {
    if (!pet?.birthDate || !pet?.currentWeight) return '';

    const b = new Date(pet.birthDate + 'T00:00:00');
    const now = new Date();
    const months = (now.getFullYear()-b.getFullYear())*12 + (now.getMonth()-b.getMonth());

    // Solo tiene sentido durante el crecimiento
    if (months < 2 || months >= 18) return '';

    // % aproximado del peso adulto alcanzado (razas medianas/grandes)
    const curve = { 2:0.20, 3:0.30, 4:0.40, 5:0.50, 6:0.60, 7:0.65, 8:0.70,
                    9:0.75, 10:0.80, 11:0.85, 12:0.87, 13:0.90, 14:0.92,
                    15:0.94, 16:0.95, 17:0.96 };
    const pct = curve[months] || 0.9;

    const est  = pet.currentWeight / pct;
    const unit = pet.weightUnit || 'kg';
    const min  = (est * 0.88).toFixed(1);
    const max  = (est * 1.12).toFixed(1);

    return `
      <div class="adult-weight">
        <div class="adult-weight-head">
          <span class="adult-weight-icon">🔮</span>
          <span class="adult-weight-title">Peso adulto estimado</span>
        </div>
        <div class="adult-weight-range">${min} – ${max} ${unit}</div>
        <div class="adult-weight-note">
          Estimación basada en su edad y peso actual. Es orientativa — la raza,
          genética y nutrición influyen mucho. Tu veterinario puede darte una
          proyección más precisa.
        </div>
      </div>`;
  },

  // ── ALTURA (mismo patrón que el peso) ──
  openHeight() {
    openModal('Registrar Altura', `
      <div class="field-row">
        <div class="field">
          <label>Altura (a la cruz)</label>
          <input type="number" id="hVal" value="${this.data?.currentHeight||''}"
            placeholder="0.0" min="0" step="0.1">
        </div>
        <div class="field">
          <label>Unidad</label>
          <select id="hUnit">
            <option value="cm" ${(this.data?.heightUnit||'cm')!=='in'?'selected':''}>cm</option>
            <option value="in" ${this.data?.heightUnit==='in'?'selected':''}>in</option>
          </select>
        </div>
      </div>
      <div class="field">
        <label>Fecha</label>
        <input type="date" id="hDate" value="${today()}">
      </div>
      <p class="field-hint">💡 La altura se mide desde el suelo hasta la cruz (el punto más alto de los hombros).</p>
      <button class="btn-primary btn-full" onclick="Profile.saveHeight()" style="margin-bottom:16px;">
        ✅ Registrar
      </button>
    `);
  },

  async saveHeight() {
    const val  = parseFloat(document.getElementById('hVal')?.value);
    const unit = document.getElementById('hUnit')?.value||'cm';
    const date = document.getElementById('hDate')?.value;
    if (!val||val<=0) { showToast('Ingresa una altura válida','error'); return; }
    showLoading(true);
    try {
      await subRef('heightHistory').add({
        height: val, unit, date,
        recordedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      await petRef().update({ currentHeight: val, heightUnit: unit });
      this.data = { ...this.data, currentHeight: val, heightUnit: unit };
      if (typeof invalidateCache === 'function') invalidateCache('heightHistory');
      closeModal();
      showToast(`✅ Altura registrada: ${val} ${unit}`,'success');
      await this.render();
    } catch(e) { showToast('Error al registrar','error'); }
    finally { showLoading(false); }
  },

  async showHeightChart() {
    openModal('📈 Historial de Altura', `
      <div style="text-align:center;padding:20px;color:var(--text2);">Cargando historial...</div>
    `);
    try {
      const snap = await subRef('heightHistory')
        .orderBy('recordedAt','asc').limit(30).get();

      if (snap.empty) {
        document.getElementById('modalBody').innerHTML = `
          <div class="chart-empty">
            <div class="empty-icon">📏</div>
            <p>Sin registros de altura.</p>
            <p style="margin-top:6px;font-size:0.82rem;">Usa el botón "Registrar" para empezar a llevar el historial.</p>
          </div>`;
        return;
      }

      // Reutilizamos el gráfico del peso mapeando altura → weight
      const records = snap.docs.map(d => ({
        weight: d.data().height,
        unit:   d.data().unit || 'cm',
        date:   d.data().date || '',
      }));

      const first = records[0], last = records[records.length-1];
      const diff  = (parseFloat(last.weight) - parseFloat(first.weight)).toFixed(1);
      const signo = diff > 0 ? '+' : '';

      document.getElementById('modalBody').innerHTML = `
        <div class="chart-summary">
          <div class="chart-stat">
            <div class="chart-stat-label">Actual</div>
            <div class="chart-stat-val">${last.weight} ${last.unit}</div>
          </div>
          <div class="chart-stat">
            <div class="chart-stat-label">Cambio total</div>
            <div class="chart-stat-val" style="color:${diff>=0?'var(--secondary)':'var(--warning)'};">
              ${signo}${diff} ${last.unit}
            </div>
          </div>
          <div class="chart-stat">
            <div class="chart-stat-label">Registros</div>
            <div class="chart-stat-val">${records.length}</div>
          </div>
        </div>
        <div style="margin:16px 0;">
          ${this.buildSVGChart(records, 240, false)}
        </div>
        <p style="font-size:0.78rem;color:var(--text2);text-align:center;margin-bottom:16px;">
          Altura medida a la cruz
        </p>`;
    } catch(e) {
      this.chartError();
    }
  },

  chartError() {
    const b = document.getElementById('modalBody');
    if (b) b.innerHTML = `<div class="chart-empty"><p>No se pudo cargar el historial.</p></div>`;
  },

  changePhoto() { document.getElementById('photoInput')?.click(); },

  async handlePhotoChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('Selecciona una imagen válida','error'); return; }
    showLoading(true);
    showToast('⏳ Subiendo foto...','info',8000);
    try {
      const url = await uploadToCloudinary(file);
      await petRef().update({ photoUrl: url });
      this.data.photoUrl = url;
      const el = document.getElementById('profilePhoto');
      if (el) el.src = url;
      updateHeaderPhoto(url);
      this.updateHeader();
      showToast('✅ Foto actualizada','success');
    } catch(e) { showToast('Error al subir la foto','error'); console.error(e); }
    finally { showLoading(false); event.target.value=''; }
  },

  updateHeader() {
    const pet = this.data;
    if (!pet) return;
    updateHeaderPhoto(pet.photoUrl);
  },
};
