// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🐾 profile.js — Perfil y configuración
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
      <div class="profile-hero">
        <div class="profile-photo-wrap">
          <img id="profilePhoto"
            src="${pet.photoUrl || 'assets/icons/paw.svg'}"
            alt="${sanitize(pet.name)}"
            class="profile-photo">
          <button class="photo-edit-btn" onclick="Profile.changePhoto()" aria-label="Cambiar foto">📷</button>
        </div>
        <h2 class="profile-name">${sanitize(pet.name)}</h2>
        <p class="profile-breed">${sanitize(pet.breed||'')}</p>
        ${pet.birthDate ? `<span class="profile-age">🎂 ${calcAge(pet.birthDate)}</span>` : ''}
        <input type="file" id="photoInput" accept="image/*" style="display:none"
          onchange="Profile.handlePhotoChange(event)">
      </div>

      <div class="card" style="margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div style="font-weight:700;">Datos de ${sanitize(pet.name)}</div>
          <button class="btn-primary btn-sm" onclick="Profile.openEdit()">✏️ Editar</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div>
            <div style="font-size:0.74rem;color:var(--text2);">Raza</div>
            <div style="font-weight:600;font-size:0.9rem;">${sanitize(pet.breed||'—')}</div>
          </div>
          <div>
            <div style="font-size:0.74rem;color:var(--text2);">Sexo</div>
            <div style="font-weight:600;font-size:0.9rem;">${pet.sex||'—'}</div>
          </div>
          <div>
            <div style="font-size:0.74rem;color:var(--text2);">Nacimiento</div>
            <div style="font-weight:600;font-size:0.9rem;">${pet.birthDate ? formatDate(pet.birthDate) : '—'}</div>
          </div>
          <div>
            <div style="font-size:0.74rem;color:var(--text2);">Peso</div>
            <div style="font-weight:600;font-size:0.9rem;">${pet.currentWeight ? pet.currentWeight+' '+(pet.weightUnit||'kg') : '—'}</div>
          </div>
        </div>
      </div>

      <div class="card" style="display:flex;flex-direction:column;gap:10px;">
        <button class="btn-outline btn-full" onclick="Profile.openWeight()">⚖️ Registrar peso</button>
      </div>
    `;
  },

  setupHTML() {
    return `
      <div style="text-align:center;margin:28px 0 20px;">
        <div style="font-size:3.5rem;display:block;">🐾</div>
        <h2 style="margin-top:12px;font-size:1.3rem;font-weight:800;">¡Bienvenido a PupCare!</h2>
        <p style="color:var(--text2);margin-top:6px;font-size:0.88rem;line-height:1.5;">
          Registra los datos de tu mascota para comenzar
        </p>
      </div>
      <div class="card">
        <h3 style="font-size:1rem;font-weight:700;margin-bottom:16px;">Datos de tu mascota</h3>
        ${this.formHTML()}
        <button class="btn-primary btn-full" onclick="Profile.saveNew()" style="margin-top:8px;">
          Crear Perfil 🐾
        </button>
      </div>
    `;
  },

  formHTML(pet={}) {
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
            <option value="Macho"  ${(pet.sex||'Macho')==='Macho'  ? 'selected':''}>🐾 Macho</option>
            <option value="Hembra" ${pet.sex==='Hembra' ? 'selected':''}>🐾 Hembra</option>
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
    `;
  },

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
      updateHeaderPhoto(null);
      showToast(`✅ ¡Perfil de ${name} creado!`,'success');
      await this.render();
    } catch(e) {
      console.error(e); showToast('Error al crear perfil','error');
    } finally { showLoading(false); }
  },

  openEdit() {
    openModal('Editar Perfil', `
      ${this.formHTML(this.data)}
      <button class="btn-primary btn-full" onclick="Profile.saveEdit()" style="margin-top:8px;margin-bottom:16px;">
        Guardar Cambios
      </button>
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
        weightUnit:    document.getElementById('pWeightUnit')?.value||'kg',
        updatedAt:     firebase.firestore.FieldValue.serverTimestamp(),
      };
      await petRef().update(updates);
      this.data = { ...this.data, ...updates };
      this.updateHeader();
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
          <input type="number" id="wVal" value="${this.data?.currentWeight||''}" placeholder="0.0" min="0" step="0.1">
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
      <button class="btn-primary btn-full" onclick="Profile.saveWeight()" style="margin-bottom:16px;">✅ Registrar</button>
    `);
  },

  async saveWeight() {
    const val  = parseFloat(document.getElementById('wVal')?.value);
    const unit = document.getElementById('wUnit')?.value||'kg';
    const date = document.getElementById('wDate')?.value;
    if (!val||val<=0) { showToast('Ingresa un peso válido','error'); return; }
    showLoading(true);
    try {
      await subRef('weightHistory').add({ weight:val, unit, date, recordedAt:firebase.firestore.FieldValue.serverTimestamp() });
      await petRef().update({ currentWeight:val, weightUnit:unit });
      this.data = { ...this.data, currentWeight:val, weightUnit:unit };
      closeModal(); showToast(`✅ Peso: ${val} ${unit}`,'success');
      await this.render();
    } catch(e) { showToast('Error al registrar','error'); }
    finally { showLoading(false); }
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
