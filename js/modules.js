// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💉 Health — Salud
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const Health = {
  tab: 'vaccines',

  async render() {
    document.getElementById('view-salud').innerHTML = `
      ${wellnessSwitchHTML('salud')}
      <div class="sec-header"><h2 class="sec-title">Salud</h2></div>
      <div class="sub-tabs">
        <button class="sub-tab ${this.tab==='vaccines'?'active':''}"    onclick="Health.switchTab('vaccines')">💉 Vacunas</button>
        <button class="sub-tab ${this.tab==='dewormings'?'active':''}"  onclick="Health.switchTab('dewormings')">🐛 Desparasitación</button>
        <button class="sub-tab ${this.tab==='vetVisits'?'active':''}"   onclick="Health.switchTab('vetVisits')">🏥 Veterinario</button>
        <button class="sub-tab ${this.tab==='medications'?'active':''}" onclick="Health.switchTab('medications')">💊 Medicamentos</button>
        <button class="sub-tab ${this.tab==='behaviorNotes'?'active':''}" onclick="Health.switchTab('behaviorNotes')">📝 Notas</button>
      </div>
      <div id="healthContent"></div>`;
    this.setupFAB(this.tab);
    await this.loadTab(this.tab);
  },

  // FAB: menú con escaneo IA en vacunas/desparasitación, simple en el resto
  setupFAB(tab) {
    removeFAB();
    const escaneable = (tab === 'vaccines' || tab === 'dewormings');
    if (escaneable && typeof addFABMenu === 'function') {
      addFABMenu([
        { icon:'📷', label:'Escanear con IA', onClick:()=>ScanAI.start(tab) },
        { icon:'✏️', label:'Registrar manual', onClick:()=>this.openForm(tab) },
      ]);
    } else {
      addFAB(() => this.openForm(tab));
    }
  },

  async switchTab(tab) {
    this.tab = tab;
    document.querySelectorAll('.sub-tab').forEach((b,i) =>
      b.classList.toggle('active', i===['vaccines','dewormings','vetVisits','medications','behaviorNotes'].indexOf(tab))
    );
    this.setupFAB(tab);
    await this.loadTab(tab);
  },

  async loadTab(tab) {
    const c = document.getElementById('healthContent');
    if (!c) return;
    c.innerHTML = skeletonList(3);
    try {
      const snap = await subRef(tab).orderBy('createdAt','desc').get();
      const labels = { vaccines:'vacunas', dewormings:'desparasitaciones', vetVisits:'visitas veterinarias', medications:'medicamentos', behaviorNotes:'notas de comportamiento' };
      const icons  = { vaccines:'💉', dewormings:'🐛', vetVisits:'🏥', medications:'💊', behaviorNotes:'📝' };
      if (snap.empty) {
        c.innerHTML=`<div class="empty-state"><div class="empty-icon">${icons[tab]}</div><h4>Sin ${labels[tab]}</h4><p>Toca + para registrar</p></div>`;
        return;
      }
      // Las vacunas se agrupan por fecha: una aplicación puede cubrir
      // varias enfermedades (vacunas polivalentes).
      if (tab === 'vaccines') {
        c.innerHTML = this.renderVaccineGroups(snap.docs);
        return;
      }

      c.innerHTML = snap.docs.map(doc => {
        const d = doc.data();
        if (tab==='dewormings')    return this.dewormCard(doc.id,d);
        if (tab==='medications')   return this.medicationCard(doc.id,d);
        if (tab==='behaviorNotes') return this.noteCard(doc.id,d);
        return this.vetCard(doc.id,d);
      }).join('');
    } catch(e) { c.innerHTML='<p style="text-align:center;color:var(--text2);padding:20px;">Error al cargar</p>'; }
  },

  // ── Agrupar vacunas por fecha de aplicación ──
  // Una misma aplicación puede cubrir varias enfermedades (vacuna polivalente).
  renderVaccineGroups(docs) {
    const groups = {};
    docs.forEach(doc => {
      const d = doc.data();
      const key = d.date || 'sin-fecha';
      if (!groups[key]) groups[key] = [];
      groups[key].push({ id: doc.id, ...d });
    });

    const sorted = Object.entries(groups).sort(([a],[b]) => b.localeCompare(a));

    return sorted.map(([date, items]) => {
      const brand    = items.find(i => i.brand)?.brand || '';
      const nextDate = items.find(i => i.nextDate)?.nextDate || '';
      const isMulti  = items.length > 1;

      const diseases = items.map(i => `
        <div class="vax-disease">
          <span class="vax-disease-name">${sanitize(i.name)}</span>
          <span class="vax-disease-actions">
            <button class="btn-edit" onclick="event.stopPropagation();Health.edit('vaccines','${i.id}')" aria-label="Editar" title="Editar">✏️</button>
            <button class="btn-delete" onclick="Health.delete('vaccines','${i.id}')" aria-label="Eliminar" title="Eliminar">🗑️</button>
          </span>
        </div>`).join('');

      return `
        <div class="card stagger-item vax-group">
          <div class="card-row">
            <div class="card-icon">💉</div>
            <div class="card-info">
              <div class="card-title">
                ${isMulti ? 'Vacuna polivalente' : sanitize(items[0].name)}
                ${isMulti ? `<span class="vax-count">${items.length} enfermedades</span>` : ''}
              </div>
              <div class="card-sub">${date!=='sin-fecha'?formatDate(date):'Sin fecha'}${brand?' · '+sanitize(brand):''}</div>
            </div>
            ${!isMulti ? `
              <button class="btn-edit" onclick="event.stopPropagation();Health.edit('vaccines','${items[0].id}')" aria-label="Editar" title="Editar">✏️</button>
              <button class="btn-delete" onclick="Health.delete('vaccines','${items[0].id}')" aria-label="Eliminar" title="Eliminar">🗑️</button>` : ''}
          </div>
          ${isMulti ? `<div class="vax-diseases">${diseases}</div>` : ''}
          ${nextDate ? `<span class="badge badge-primary">📅 Próxima: ${formatDate(nextDate)}</span>` : ''}
        </div>`;
    }).join('');
  },

  vaccineCard(id,d){ return `<div class="card stagger-item"><div class="card-row"><div class="card-icon">💉</div><div class="card-info"><div class="card-title">${sanitize(d.name)}</div><div class="card-sub">${formatDate(d.date)}${d.brand?' · '+sanitize(d.brand):''}</div></div><button class="btn-edit" onclick="event.stopPropagation();Health.edit('vaccines','${id}')" aria-label="Editar" title="Editar">✏️</button><button class="btn-delete" onclick="Health.delete('vaccines','${id}')" aria-label="Eliminar" title="Eliminar">🗑️</button></div>${d.nextDate?`<span class="badge badge-primary">📅 Próxima: ${formatDate(d.nextDate)}</span>`:''}</div>`; },
  dewormCard(id,d){ return `<div class="card stagger-item"><div class="card-row"><div class="card-icon">🐛</div><div class="card-info"><div class="card-title">${sanitize(d.product)}</div><div class="card-sub">${formatDate(d.date)} · ${sanitize(d.type||'')}</div></div><button class="btn-edit" onclick="event.stopPropagation();Health.edit('dewormings','${id}')" aria-label="Editar" title="Editar">✏️</button><button class="btn-delete" onclick="Health.delete('dewormings','${id}')" aria-label="Eliminar" title="Eliminar">🗑️</button></div>${d.nextDate?`<span class="badge badge-secondary">📅 Próxima: ${formatDate(d.nextDate)}</span>`:''}</div>`; },
  vetCard(id,d){ return `<div class="card stagger-item"><div class="card-row"><div class="card-icon">🏥</div><div class="card-info"><div class="card-title">${sanitize(d.reason)}</div><div class="card-sub">${formatDate(d.date)}${d.vet?' · Dr. '+sanitize(d.vet):''}</div></div><button class="btn-edit" onclick="event.stopPropagation();Health.edit('vetVisits','${id}')" aria-label="Editar" title="Editar">✏️</button><button class="btn-delete" onclick="Health.delete('vetVisits','${id}')" aria-label="Eliminar" title="Eliminar">🗑️</button></div>${d.diagnosis?`<p class="card-note">📋 ${sanitize(d.diagnosis)}</p>`:''}${d.cost?`<span class="badge badge-warning">💰 $${d.cost}</span>`:''}</div>`; },

  noteCard(id,d) {
    const MOODS = {'Feliz':'😄','Normal':'😊','Juguetón':'🎉','Ansioso':'😰','Cansado':'😴','Enfermo':'🤒','Agresivo':'😠','Asustado':'😨'};
    const icon = MOODS[d.mood] || '📝';
    return `
      <div class="note-card stagger-item">
        <div class="note-card-top">
          <div class="note-mood">${icon}</div>
          <div class="note-meta">
            <div class="note-mood-label">${sanitize(d.mood || 'Sin estado')}</div>
            <div class="note-date">${formatDateRelative(d.date)} · ${formatDate(d.date)}</div>
          </div>
          <button class="btn-edit" onclick="Health.edit('behaviorNotes','${id}')" aria-label="Editar" title="Editar">✏️</button><button class="btn-delete" onclick="Health.delete('behaviorNotes','${id}')" aria-label="Eliminar" title="Eliminar">🗑️</button>
        </div>
        ${d.text ? `<div class="note-text">${sanitize(d.text)}</div>` : ''}
        ${d.photoUrl ? `<img src="${d.photoUrl}" alt="Foto de la nota" loading="lazy">` : ''}
      </div>`;
  },

  medicationCard(id,d) {
    const now     = new Date();
    const hasEnd  = d.endDate && d.endDate !== '';
    const ended   = hasEnd && new Date(d.endDate+'T00:00:00') < now;
    const active  = d.active !== false && !ended;
    const daysLeft = hasEnd && !ended
      ? Math.ceil((new Date(d.endDate+'T00:00:00') - now) / 86400000)
      : null;
    return `
      <div class="med-card stagger-item">
        <div class="med-header">
          <div class="med-icon">💊</div>
          <div class="med-info" style="flex:1;">
            <div class="med-name">${sanitize(d.name)}</div>
            <div class="med-dose">${sanitize(d.dose||'')}${d.frequency ? ' · ' + sanitize(d.frequency) : ''}</div>
          </div>
          <button class="btn-edit" onclick="Health.edit('medications','${id}')" aria-label="Editar" title="Editar">✏️</button><button class="btn-delete" onclick="Health.delete('medications','${id}')" aria-label="Eliminar" title="Eliminar">🗑️</button>
        </div>
        <span class="med-badge ${active?'active':'inactive'}">
          ${active ? '🟢 Activo' : '⚫ Finalizado'}
        </span>
        ${daysLeft !== null ? `<div class="med-freq">📅 Termina en ${daysLeft} día${daysLeft!==1?'s':''} (${formatDate(d.endDate)})</div>` : ''}
        ${d.startDate ? `<div class="med-freq">Inicio: ${formatDate(d.startDate)}</div>` : ''}
        ${d.notes ? `<div class="med-freq" style="margin-top:6px;color:var(--text2);">${sanitize(d.notes)}</div>` : ''}
      </div>`;
  },

  openForm(tab, editId = null, editData = null) {
    this._editId = editId;
    const MOODS = ['Feliz','Normal','Juguetón','Ansioso','Cansado','Enfermo','Agresivo','Asustado'];
    const MOOD_ICONS = {'Feliz':'😄','Normal':'😊','Juguetón':'🎉','Ansioso':'😰','Cansado':'😴','Enfermo':'🤒','Agresivo':'😠','Asustado':'😨'};
    const d = editData || {};
    const v = (x) => x != null ? String(x).replace(/"/g,'&quot;') : '';
    const forms = {
      vaccines:`<div class="field"><label>Vacuna</label><input type="text" id="hName" placeholder="Ej: Antirrábica" value="${v(d.name)}"></div><div class="field-row"><div class="field"><label>Fecha</label><input type="date" id="hDate" value="${d.date||today()}"></div><div class="field"><label>Próxima</label><input type="date" id="hNext" value="${d.nextDate||''}"></div></div><div class="field"><label>Marca</label><input type="text" id="hBrand" placeholder="Ej: Nobivac" value="${v(d.brand)}"></div><div class="field"><label>Notas</label><textarea id="hNotes" placeholder="...">${v(d.notes)}</textarea></div><button class="btn-primary btn-full" onclick="Health.saveVaccine()" style="margin-bottom:16px;">✅ ${editId?'Actualizar':'Guardar'}</button>`,
      dewormings:`<div class="field"><label>Producto</label><input type="text" id="hProduct" placeholder="Ej: Drontal" value="${v(d.product)}"></div><div class="field"><label>Tipo</label><select id="hDewType"><option ${d.type==='Interna'?'selected':''}>Interna</option><option ${d.type==='Externa'?'selected':''}>Externa</option><option ${d.type==='Ambas'?'selected':''}>Ambas</option></select></div><div class="field-row"><div class="field"><label>Fecha</label><input type="date" id="hDate" value="${d.date||today()}"></div><div class="field"><label>Próxima</label><input type="date" id="hNext" value="${d.nextDate||''}"></div></div><div class="field"><label>Dosis</label><input type="text" id="hDose" placeholder="Ej: 1 comprimido" value="${v(d.dose)}"></div><button class="btn-primary btn-full" onclick="Health.saveDeworming()" style="margin-bottom:16px;">✅ ${editId?'Actualizar':'Guardar'}</button>`,
      vetVisits:`<div class="field"><label>Motivo</label><input type="text" id="hReason" placeholder="Ej: Revisión general" value="${v(d.reason)}"></div><div class="field-row"><div class="field"><label>Fecha</label><input type="date" id="hDate" value="${d.date||today()}"></div><div class="field"><label>Costo ($)</label><input type="number" id="hCost" placeholder="0.00" min="0" step="0.01" value="${d.cost||''}"></div></div><div class="field"><label>Veterinario</label><input type="text" id="hVet" placeholder="Nombre del vet" value="${v(d.vet)}"></div><div class="field"><label>Diagnóstico</label><textarea id="hDiag" placeholder="...">${v(d.diagnosis)}</textarea></div><div class="field"><label>Tratamiento</label><textarea id="hTreat" placeholder="...">${v(d.treatment)}</textarea></div><button class="btn-primary btn-full" onclick="Health.saveVet()" style="margin-bottom:16px;">✅ ${editId?'Actualizar':'Guardar'}</button>`,
      medications:`
        <div class="field"><label>Nombre del medicamento</label><input type="text" id="hMedName" placeholder="Ej: Amoxicilina" value="${v(d.name)}"></div>
        <div class="field-row">
          <div class="field"><label>Dosis</label><input type="text" id="hMedDose" placeholder="Ej: 250mg" value="${v(d.dose)}"></div>
          <div class="field"><label>Frecuencia</label>
            <select id="hMedFreq">
              ${['Cada 8 horas','Cada 12 horas','Una vez al día','Dos veces al día','Tres veces al día','Según indique vet'].map(f=>`<option ${d.frequency===f?'selected':''}>${f}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="field-row">
          <div class="field"><label>Fecha inicio</label><input type="date" id="hMedStart" value="${d.startDate||today()}"></div>
          <div class="field"><label>Fecha fin (opcional)</label><input type="date" id="hMedEnd" value="${d.endDate||''}"></div>
        </div>
        <div class="field"><label>Motivo / Notas</label><textarea id="hMedNotes" placeholder="¿Por qué se recetó? ¿Dar con comida?">${v(d.notes)}</textarea></div>
        <button class="btn-primary btn-full" onclick="Health.saveMedication()" style="margin-bottom:16px;">✅ ${editId?'Actualizar':'Guardar Medicamento'}</button>
      `,
      behaviorNotes:`
        <div class="field">
          <label>Estado de ánimo</label>
          <div class="mood-grid" id="moodGrid">
            ${MOODS.map(m=>`<button class="mood-btn ${d.mood===m?'selected':''}" data-mood="${m}" onclick="Health.selectMood(this)">${MOOD_ICONS[m]} ${m}</button>`).join('')}
          </div>
          <input type="hidden" id="hMood" value="${v(d.mood)}">
        </div>
        <div class="field"><label>Fecha</label><input type="date" id="hDate" value="${d.date||today()}"></div>
        <div class="field"><label>Observaciones</label><textarea id="hNoteText" placeholder="¿Qué comportamiento notaste hoy? ¿Comió bien? ¿Algo inusual?" style="min-height:110px;">${v(d.text)}</textarea></div>
        <input type="hidden" id="notePhotoUrl" value="${v(d.photoUrl)}">
        <div class="field">
          <label>Foto (opcional)</label>
          <div id="notePhotoPreview">${d.photoUrl ? `<div class="note-photo-preview"><img src="${d.photoUrl}" alt="Foto adjunta"><div class="note-photo-remove" onclick="Health.removeNotePhoto()">✕</div></div>` : ''}</div>
          <input type="file" id="notePhotoInput" accept="image/*" style="display:none" onchange="Health.handleNotePhoto(event)">
          <button type="button" class="btn-outline btn-full note-photo-btn" onclick="document.getElementById('notePhotoInput').click()">📷 Adjuntar una foto</button>
        </div>
        <button class="btn-primary btn-full" onclick="Health.saveNote()" style="margin-bottom:16px;">✅ ${editId?'Actualizar':'Guardar Nota'}</button>
      `,
    };
    const titlesNew = { vaccines:'Nueva Vacuna', dewormings:'Nueva Desparasitación', vetVisits:'Nueva Visita', medications:'Nuevo Medicamento', behaviorNotes:'Nueva Nota de Comportamiento' };
    const titlesEdit = { vaccines:'Editar Vacuna', dewormings:'Editar Desparasitación', vetVisits:'Editar Visita', medications:'Editar Medicamento', behaviorNotes:'Editar Nota' };
    openModal((editId?titlesEdit:titlesNew)[tab], forms[tab]);
  },

  // Abrir formulario en modo edición
  async edit(tab, id) {
    showLoading(true);
    try {
      const doc = await subRef(tab).doc(id).get();
      if (doc.exists) this.openForm(tab, id, doc.data());
    } catch(e) { showToast('Error al cargar','error'); }
    finally { showLoading(false); }
  },

  selectMood(btn) {
    document.querySelectorAll('#moodGrid .mood-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    document.getElementById('hMood').value = btn.dataset.mood;
  },

  async saveVaccine() {
    const name=document.getElementById('hName').value.trim();
    if(!name){showToast('El nombre es requerido','error');return;}
    showLoading(true);
    const data={name:sanitize(name),date:document.getElementById('hDate').value,nextDate:document.getElementById('hNext').value||null,brand:sanitize(document.getElementById('hBrand').value.trim()),notes:sanitize(document.getElementById('hNotes').value.trim())};
    try{
      if(this._editId){await subRef('vaccines').doc(this._editId).update(data);this._editId=null;}
      else{data.createdAt=firebase.firestore.FieldValue.serverTimestamp();await subRef('vaccines').add(data);}
      if(typeof invalidateCache==='function')invalidateCache('vaccines');closeModal();showToast('✅ Vacuna guardada','success');await this.loadTab('vaccines');}
    catch(e){showToast('Error al guardar','error');}finally{showLoading(false);}
  },

  async saveDeworming() {
    const product=document.getElementById('hProduct').value.trim();
    if(!product){showToast('El producto es requerido','error');return;}
    showLoading(true);
    const data={product:sanitize(product),type:document.getElementById('hDewType').value,date:document.getElementById('hDate').value,nextDate:document.getElementById('hNext').value||null,dose:sanitize(document.getElementById('hDose').value.trim())};
    try{
      if(this._editId){await subRef('dewormings').doc(this._editId).update(data);this._editId=null;}
      else{data.createdAt=firebase.firestore.FieldValue.serverTimestamp();await subRef('dewormings').add(data);}
      if(typeof invalidateCache==='function')invalidateCache('dewormings');closeModal();showToast('✅ Desparasitación guardada','success');await this.loadTab('dewormings');}
    catch(e){showToast('Error al guardar','error');}finally{showLoading(false);}
  },

  async saveVet() {
    const reason=document.getElementById('hReason').value.trim();
    if(!reason){showToast('El motivo es requerido','error');return;}
    showLoading(true);
    const data={reason:sanitize(reason),date:document.getElementById('hDate').value,vet:sanitize(document.getElementById('hVet').value.trim()),diagnosis:sanitize(document.getElementById('hDiag').value.trim()),treatment:sanitize(document.getElementById('hTreat').value.trim()),cost:parseFloat(document.getElementById('hCost').value)||0};
    try{
      if(this._editId){await subRef('vetVisits').doc(this._editId).update(data);this._editId=null;}
      else{data.createdAt=firebase.firestore.FieldValue.serverTimestamp();await subRef('vetVisits').add(data);}
      if(typeof invalidateCache==='function')invalidateCache('vetVisits');closeModal();showToast('✅ Visita guardada','success');await this.loadTab('vetVisits');}
    catch(e){showToast('Error al guardar','error');}finally{showLoading(false);}
  },

  async saveNote() {
    const text     = document.getElementById('hNoteText')?.