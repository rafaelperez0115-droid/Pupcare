// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🐾 profile.js — Perfil de la mascota
// Fotos via Cloudinary (sin Firebase Storage)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const Profile = {
  data: null,

  async init() {
    if (!PET_ID) return;
    try {
      const doc = await petRef().get();
      if (doc.exists) {
        this.data = { id: doc.id, ...doc.data() };
        this.updateHeader();
      } else {
        PET_ID = null;
        localStorage.removeItem('pupcare_pet_id');
      }
    } catch (e) { console.error('Error cargando perfil:', e); }
  },

  async render() {
    const view = document.getElementById('view-profile');
    if (!PET_ID) { this.renderSetup(view); return; }
    if (!this.data) await this.init();
    if (!this.data) { this.renderSetup(view); return; }

    const pet = this.data;
    const [lastAct, lastVax, lastCare] = await Promise.all([
      this.getLastRecord('activities'),
      this.getLastRecord('vaccines'),
      this.getLastRecord('care'),
    ]);

    view.innerHTML = `
      <div class="profile-hero">
        <div class="profile-photo-wrap">
          <img id="profilePhoto"
            src="${pet.photoUrl || 'assets/icons/paw.svg'}"
            alt="Foto de ${sanitize(pet.name)}"
            class="profile-photo">
          <button class="photo-edit-btn" onclick="Profile.changePhoto()" aria-label="Cambiar foto">📷</button>
        </div>
        <h2 class="profile-name">${sanitize(pet.name)}</h2>
        <p class="profile-breed">${sanitize(pet.breed || '')}</p>
        ${pet.birthDate ? `<span class="profile-age">🎂 ${calcAge(pet.birthDate)}</span>` : ''}
        <input type="file" id="photoInput" accept="image/*" style="display:none" onchange="Profile.handlePhotoChange(event)">
      </div>

      <div class="profile-stats">
        <div class="stat-card">
          <div class="stat-icon">⚖️</div>
          <div class="stat-value">${pet.currentWeight ? pet.currentWeight + ' ' + (pet.weightUnit || 'kg') : '—'}</div>
          <div class="stat-label">Peso actual</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🏃</div>
          <div class="stat-value" style="font-size:0.95rem;">${lastAct ? formatDateRelative(lastAct.date) : '—'}</div>
          <div class="stat-label">Última actividad</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💉</div>
          <div class="stat-value" style="font-size:0.95rem;">${lastVax ? formatDateRelative(lastVax.date) : '—'}</div>
          <div class="stat-label">Última vacuna</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🛁</div>
          <div class="stat-value" style="font-size:0.95rem;">${lastCare ? formatDateRelative(lastCare.date) : '—'}</div>
          <div class="stat-label">Último baño</div>
        </div>
      </div>

      <div class="card" style="display:flex; flex-direction:column; gap:10px;">
        <button class="btn-secondary" onclick="Profile.openEdit()">✏️ Editar perfil</button>
        <button class="btn-secondary" onclick="Profile.openWeight()">⚖️ Registrar peso</button>
        <button class="btn-secondary" style="color:var(--danger);border-color:var(--danger);" onclick="logout()">🚪 Cerrar sesión</button>
      </div>
    `;
  },

  renderSetup(view) {
    view.innerHTML = `
      <div style="text-align:center; margin: 32px 0 24px;">
        <span style="font-size:3.5rem;">🐾</span>
        <h2 style="margin-top:12px; font-size:1.4rem;">¡Bienvenido!</h2>
        <p style="color:var(--text2); margin-top:6px; font-size:0.9rem;">Configura el perfil de tu mascota para comenzar</p>
      </div>
      <div class="card">
        ${this.profileFormHTML()}
        <button class="btn-primary btn-full" onclick="Profile.saveNew()" style="margin-top:6px;">
          Crear Perfil 🐾
        </button>
      </div>
    `;
  },

  profileFormHTML(pet = {}) {
    return `
      <div class="field">
        <label>Nombre</label>
        <input type="text" id="pName" value="${sanitize(pet.name || '')}" placeholder="Ej: Guts">
      </div>
      <div class="field">
        <label>Raza</label>
        <input type="text" id="pBreed" value="${sanitize(pet.breed || '')}" placeholder="Ej: Bull Terrier Mestizo">
      </div>
      <div class="field-row">
        <div class="field">
          <label>Fecha de nacimiento</label>
          <input type="date" id="pBirth" value="${pet.birthDate || ''}">
        </div>
        <div class="field">
          <label>Sexo</label>
          <select id="pSex">
            <option value="macho"  ${pet.sex === 'macho'  ? 'selected' : ''}>🐾 Macho</option>
            <option value="hembra" ${pet.sex === 'hembra' ? 'selected' : ''}>🐾 Hembra</option>
          </select>
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label>Peso</label>
          <input type="number" id="pWeight" value="${pet.currentWeight || ''}" placeholder="0.0" min="0" step="0.1">
        </div>
        <div class="field">
          <label>Unidad</label>
          <select id="pWeightUnit">
            <option value="kg" ${pet.weightUnit !== 'lb' ? 'selected' : ''}>kg</option>
            <option value="lb" ${pet.weightUnit === 'lb' ? 'selected' : ''}>lb</option>
          </select>
        </div>
      </div>
    `;
  },

  async saveNew() {
    const name = document.getElementById('pName').value.trim();
    if (!name) { showToast('El nombre es requerido', 'error'); return; }
    showLoading(true);
    try {
      const data = {
        name:          sanitize(name),
        breed:         sanitize(document.getElementById('pBreed').value.trim()),
        birthDate:     document.getElementById('pBirth').value || null,
        sex:           document.getElementById('pSex').value,
        currentWeight: parseFloat(document.getElementById('pWeight').value) || null,
        weightUnit:    document.getElementById('pWeightUnit').value,
        photoUrl:      null,
        ownerId:       currentUser.uid,
        createdAt:     firebase.firestore.FieldValue.serverTimestamp(),
      };
      const ref = await db.collection('pets').add(data);
      PET_ID = ref.id;
      localStorage.setItem('pupcare_pet_id', PET_ID);
      this.data = { id: PET_ID, ...data };
      this.updateHeader();
      showToast(`✅ Perfil de ${name} creado`, 'success');
      await this.render();
    } catch (e) {
      showToast('Error al crear perfil', 'error');
      console.error(e);
    } finally { showLoading(false); }
  },

  openEdit() {
    openModal('Editar Perfil', `
      ${this.profileFormHTML(this.data)}
      <button class="btn-primary btn-full" onclick="Profile.saveEdit()" style="margin-top:6px; margin-bottom:16px;">
        Guardar Cambios
      </button>
    `);
  },

  async saveEdit() {
    const name = document.getElementById('pName').value.trim();
    if (!name) { showToast('El nombre es requerido', 'error'); return; }
    showLoading(true);
    try {
      const updates = {
        name:          sanitize(name),
        breed:         sanitize(document.getElementById('pBreed').value.trim()),
        birthDate:     document.getElementById('pBirth').value || null,
        sex:           document.getElementById('pSex').value,
        currentWeight: parseFloat(document.getElementById('pWeight').value) || null,
        weightUnit:    document.getElementById('pWeightUnit').value,
        updatedAt:     firebase.firestore.FieldValue.serverTimestamp(),
      };
      await petRef().update(updates);
      this.data = { ...this.data, ...updates };
      this.updateHeader();
      closeModal();
      showToast('✅ Perfil actualizado', 'success');
      await this.render();
    } catch (e) {
      showToast('Error al guardar', 'error');
    } finally { showLoading(false); }
  },

  openWeight() {
    openModal('Registrar Peso', `
      <div class="field-row">
        <div class="field">
          <label>Peso</label>
          <input type="number" id="wVal" value="${this.data?.currentWeight || ''}" placeholder="0.0" min="0" step="0.1">
        </div>
        <div class="field">
          <label>Unidad</label>
          <select id="wUnit">
            <option value="kg" ${this.data?.weightUnit !== 'lb' ? 'selected' : ''}>kg</option>
            <option value="lb" ${this.data?.weightUnit === 'lb' ? 'selected' : ''}>lb</option>
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
    const val  = parseFloat(document.getElementById('wVal').value);
    const unit = document.getElementById('wUnit').value;
    const date = document.getElementById('wDate').value;
    if (!val || val <= 0) { showToast('Ingresa un peso válido', 'error'); return; }
    showLoading(true);
    try {
      await subRef('weightHistory').add({
        weight: val, unit, date,
        recordedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      await petRef().update({ currentWeight: val, weightUnit: unit });
      this.data = { ...this.data, currentWeight: val, weightUnit: unit };
      closeModal();
      showToast(`✅ Peso: ${val} ${unit}`, 'success');
      await this.render();
    } catch (e) {
      showToast('Error al registrar peso', 'error');
    } finally { showLoading(false); }
  },

  changePhoto() { document.getElementById('photoInput').click(); },

  async handlePhotoChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('Selecciona una imagen válida', 'error'); return; }

    showLoading(true);
    showToast('⏳ Subiendo foto...', 'info', 8000);
    try {
      // Subir a Cloudinary
      const url = await uploadToCloudinary(file);

      // Guardar URL en Firestore
      await petRef().update({ photoUrl: url });
      this.data.photoUrl = url;

      const el = document.getElementById('profilePhoto');
      if (el) el.src = url;
      this.updateHeader();
      showToast('✅ Foto actualizada', 'success');
    } catch (e) {
      showToast('Error al subir la foto', 'error');
      console.error(e);
    } finally {
      showLoading(false);
      event.target.value = '';
    }
  },

  updateHeader() {
    const pet = this.data;
    if (!pet) return;
    const nameEl  = document.getElementById('headerPetName');
    const ageEl   = document.getElementById('headerPetAge');
    const photoEl = document.getElementById('headerPhoto');
    if (nameEl)  nameEl.textContent = pet.name;
    if (ageEl)   ageEl.textContent  = pet.birthDate ? calcAge(pet.birthDate) : '';
    if (photoEl && pet.photoUrl) photoEl.src = pet.photoUrl;
  },

  async getLastRecord(col) {
    try {
      const snap = await subRef(col).orderBy('createdAt', 'desc').limit(1).get();
      return snap.empty ? null : snap.docs[0].data();
    } catch { return null; }
  },
};
