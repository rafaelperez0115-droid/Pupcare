// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💉 Health — Salud
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const Health = {
  tab: 'vaccines',

  async render() {
    document.getElementById('view-salud').innerHTML = `
      <div class="sec-header"><h2 class="sec-title">Salud</h2></div>
      <div class="sub-tabs">
        <button class="sub-tab ${this.tab==='vaccines'?'active':''}"    onclick="Health.switchTab('vaccines')">💉 Vacunas</button>
        <button class="sub-tab ${this.tab==='dewormings'?'active':''}"  onclick="Health.switchTab('dewormings')">🐛 Desparasitación</button>
        <button class="sub-tab ${this.tab==='vetVisits'?'active':''}"   onclick="Health.switchTab('vetVisits')">🏥 Veterinario</button>
        <button class="sub-tab ${this.tab==='medications'?'active':''}" onclick="Health.switchTab('medications')">💊 Medicamentos</button>
        <button class="sub-tab ${this.tab==='behaviorNotes'?'active':''}" onclick="Health.switchTab('behaviorNotes')">📝 Notas</button>
      </div>
      <div id="healthContent"></div>`;
    addFAB(() => this.openForm(this.tab));
    await this.loadTab(this.tab);
  },

  async switchTab(tab) {
    this.tab = tab;
    document.querySelectorAll('.sub-tab').forEach((b,i) =>
      b.classList.toggle('active', i===['vaccines','dewormings','vetVisits','medications','behaviorNotes'].indexOf(tab))
    );
    removeFAB(); addFAB(() => this.openForm(tab));
    await this.loadTab(tab);
  },

  async loadTab(tab) {
    const c = document.getElementById('healthContent');
    if (!c) return;
    c.innerHTML = '<div style="text-align:center;padding:40px 0;"><div class="load-icon">🐾</div></div>';
    try {
      const snap = await subRef(tab).orderBy('createdAt','desc').get();
      const labels = { vaccines:'vacunas', dewormings:'desparasitaciones', vetVisits:'visitas veterinarias', medications:'medicamentos', behaviorNotes:'notas de comportamiento' };
      const icons  = { vaccines:'💉', dewormings:'🐛', vetVisits:'🏥', medications:'💊', behaviorNotes:'📝' };
      if (snap.empty) {
        c.innerHTML=`<div class="empty-state"><div class="empty-icon">${icons[tab]}</div><h4>Sin ${labels[tab]}</h4><p>Toca + para registrar</p></div>`;
        return;
      }
      c.innerHTML = snap.docs.map(doc => {
        const d = doc.data();
        if (tab==='vaccines')      return this.vaccineCard(doc.id,d);
        if (tab==='dewormings')    return this.dewormCard(doc.id,d);
        if (tab==='medications')   return this.medicationCard(doc.id,d);
        if (tab==='behaviorNotes') return this.noteCard(doc.id,d);
        return this.vetCard(doc.id,d);
      }).join('');
    } catch(e) { c.innerHTML='<p style="text-align:center;color:var(--text2);padding:20px;">Error al cargar</p>'; }
  },

  vaccineCard(id,d){ return `<div class="card"><div class="card-row"><div class="card-icon">💉</div><div class="card-info"><div class="card-title">${sanitize(d.name)}</div><div class="card-sub">${formatDate(d.date)}${d.brand?' · '+sanitize(d.brand):''}</div></div><button class="btn-delete" onclick="Health.delete('vaccines','${id}')">🗑️</button></div>${d.nextDate?`<span class="badge badge-primary">📅 Próxima: ${formatDate(d.nextDate)}</span>`:''}</div>`; },
  dewormCard(id,d){ return `<div class="card"><div class="card-row"><div class="card-icon">🐛</div><div class="card-info"><div class="card-title">${sanitize(d.product)}</div><div class="card-sub">${formatDate(d.date)} · ${sanitize(d.type||'')}</div></div><button class="btn-delete" onclick="Health.delete('dewormings','${id}')">🗑️</button></div>${d.nextDate?`<span class="badge badge-secondary">📅 Próxima: ${formatDate(d.nextDate)}</span>`:''}</div>`; },
  vetCard(id,d){ return `<div class="card"><div class="card-row"><div class="card-icon">🏥</div><div class="card-info"><div class="card-title">${sanitize(d.reason)}</div><div class="card-sub">${formatDate(d.date)}${d.vet?' · Dr. '+sanitize(d.vet):''}</div></div><button class="btn-delete" onclick="Health.delete('vetVisits','${id}')">🗑️</button></div>${d.diagnosis?`<p class="card-note">📋 ${sanitize(d.diagnosis)}</p>`:''}${d.cost?`<span class="badge badge-warning">💰 $${d.cost}</span>`:''}</div>`; },

  noteCard(id,d) {
    const MOODS = {'Feliz':'😄','Normal':'😊','Juguetón':'🎉','Ansioso':'😰','Cansado':'😴','Enfermo':'🤒','Agresivo':'😠','Asustado':'😨'};
    const icon = MOODS[d.mood] || '📝';
    return `
      <div class="note-card">
        <div class="note-card-top">
          <div class="note-mood">${icon}</div>
          <div class="note-meta">
            <div class="note-mood-label">${sanitize(d.mood || 'Sin estado')}</div>
            <div class="note-date">${formatDateRelative(d.date)} · ${formatDate(d.date)}</div>
          </div>
          <button class="btn-delete" onclick="Health.delete('behaviorNotes','${id}')">🗑️</button>
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
      <div class="med-card">
        <div class="med-header">
          <div class="med-icon">💊</div>
          <div class="med-info" style="flex:1;">
            <div class="med-name">${sanitize(d.name)}</div>
            <div class="med-dose">${sanitize(d.dose||'')}${d.frequency ? ' · ' + sanitize(d.frequency) : ''}</div>
          </div>
          <button class="btn-delete" onclick="Health.delete('medications','${id}')">🗑️</button>
        </div>
        <span class="med-badge ${active?'active':'inactive'}">
          ${active ? '🟢 Activo' : '⚫ Finalizado'}
        </span>
        ${daysLeft !== null ? `<div class="med-freq">📅 Termina en ${daysLeft} día${daysLeft!==1?'s':''} (${formatDate(d.endDate)})</div>` : ''}
        ${d.startDate ? `<div class="med-freq">Inicio: ${formatDate(d.startDate)}</div>` : ''}
        ${d.notes ? `<div class="med-freq" style="margin-top:6px;color:var(--text2);">${sanitize(d.notes)}</div>` : ''}
      </div>`;
  },

  openForm(tab) {
    const MOODS = ['Feliz','Normal','Juguetón','Ansioso','Cansado','Enfermo','Agresivo','Asustado'];
    const MOOD_ICONS = {'Feliz':'😄','Normal':'😊','Juguetón':'🎉','Ansioso':'😰','Cansado':'😴','Enfermo':'🤒','Agresivo':'😠','Asustado':'😨'};
    const forms = {
      vaccines:`<div class="field"><label>Vacuna</label><input type="text" id="hName" placeholder="Ej: Antirrábica"></div><div class="field-row"><div class="field"><label>Fecha</label><input type="date" id="hDate" value="${today()}"></div><div class="field"><label>Próxima</label><input type="date" id="hNext"></div></div><div class="field"><label>Marca</label><input type="text" id="hBrand" placeholder="Ej: Nobivac"></div><div class="field"><label>Notas</label><textarea id="hNotes" placeholder="..."></textarea></div><button class="btn-primary btn-full" onclick="Health.saveVaccine()" style="margin-bottom:16px;">✅ Guardar</button>`,
      dewormings:`<div class="field"><label>Producto</label><input type="text" id="hProduct" placeholder="Ej: Drontal"></div><div class="field"><label>Tipo</label><select id="hDewType"><option>Interna</option><option>Externa</option><option>Ambas</option></select></div><div class="field-row"><div class="field"><label>Fecha</label><input type="date" id="hDate" value="${today()}"></div><div class="field"><label>Próxima</label><input type="date" id="hNext"></div></div><div class="field"><label>Dosis</label><input type="text" id="hDose" placeholder="Ej: 1 comprimido"></div><button class="btn-primary btn-full" onclick="Health.saveDeworming()" style="margin-bottom:16px;">✅ Guardar</button>`,
      vetVisits:`<div class="field"><label>Motivo</label><input type="text" id="hReason" placeholder="Ej: Revisión general"></div><div class="field-row"><div class="field"><label>Fecha</label><input type="date" id="hDate" value="${today()}"></div><div class="field"><label>Costo ($)</label><input type="number" id="hCost" placeholder="0.00" min="0" step="0.01"></div></div><div class="field"><label>Veterinario</label><input type="text" id="hVet" placeholder="Nombre del vet"></div><div class="field"><label>Diagnóstico</label><textarea id="hDiag" placeholder="..."></textarea></div><div class="field"><label>Tratamiento</label><textarea id="hTreat" placeholder="..."></textarea></div><button class="btn-primary btn-full" onclick="Health.saveVet()" style="margin-bottom:16px;">✅ Guardar</button>`,
      medications:\`
        <div class="field"><label>Nombre del medicamento</label><input type="text" id="hMedName" placeholder="Ej: Amoxicilina"></div>
        <div class="field-row">
          <div class="field"><label>Dosis</label><input type="text" id="hMedDose" placeholder="Ej: 250mg"></div>
          <div class="field"><label>Frecuencia</label>
            <select id="hMedFreq">
              <option>Cada 8 horas</option><option>Cada 12 horas</option><option>Una vez al día</option>
              <option>Dos veces al día</option><option>Tres veces al día</option><option>Según indique vet</option>
            </select>
          </div>
        </div>
        <div class="field-row">
          <div class="field"><label>Fecha inicio</label><input type="date" id="hMedStart" value="${today()}"></div>
          <div class="field"><label>Fecha fin (opcional)</label><input type="date" id="hMedEnd"></div>
        </div>
        <div class="field"><label>Motivo / Notas</label><textarea id="hMedNotes" placeholder="¿Por qué se recetó? ¿Dar con comida?"></textarea></div>
        <button class="btn-primary btn-full" onclick="Health.saveMedication()" style="margin-bottom:16px;">✅ Guardar Medicamento</button>
      \`,
      behaviorNotes:`
        <div class="field">
          <label>Estado de ánimo</label>
          <div class="mood-grid" id="moodGrid">
            ${MOODS.map(m=>`<button class="mood-btn" data-mood="${m}" onclick="Health.selectMood(this)">${MOOD_ICONS[m]} ${m}</button>`).join('')}
          </div>
          <input type="hidden" id="hMood" value="">
        </div>
        <div class="field"><label>Fecha</label><input type="date" id="hDate" value="${today()}"></div>
        <div class="field"><label>Observaciones</label><textarea id="hNoteText" placeholder="¿Qué comportamiento notaste hoy? ¿Comió bien? ¿Algo inusual?" style="min-height:110px;"></textarea></div>
        <button class="btn-primary btn-full" onclick="Health.saveNote()" style="margin-bottom:16px;">✅ Guardar Nota</button>
      `,
    };
    const titles = { vaccines:'Nueva Vacuna', dewormings:'Nueva Desparasitación', vetVisits:'Nueva Visita', medications:'Nuevo Medicamento', behaviorNotes:'Nueva Nota de Comportamiento' };
    openModal(titles[tab], forms[tab]);
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
    try{await subRef('vaccines').add({name:sanitize(name),date:document.getElementById('hDate').value,nextDate:document.getElementById('hNext').value||null,brand:sanitize(document.getElementById('hBrand').value.trim()),notes:sanitize(document.getElementById('hNotes').value.trim()),createdAt:firebase.firestore.FieldValue.serverTimestamp()});closeModal();showToast('✅ Vacuna registrada','success');await this.loadTab('vaccines');}
    catch(e){showToast('Error al guardar','error');}finally{showLoading(false);}
  },

  async saveDeworming() {
    const product=document.getElementById('hProduct').value.trim();
    if(!product){showToast('El producto es requerido','error');return;}
    showLoading(true);
    try{await subRef('dewormings').add({product:sanitize(product),type:document.getElementById('hDewType').value,date:document.getElementById('hDate').value,nextDate:document.getElementById('hNext').value||null,dose:sanitize(document.getElementById('hDose').value.trim()),createdAt:firebase.firestore.FieldValue.serverTimestamp()});closeModal();showToast('✅ Desparasitación registrada','success');await this.loadTab('dewormings');}
    catch(e){showToast('Error al guardar','error');}finally{showLoading(false);}
  },

  async saveVet() {
    const reason=document.getElementById('hReason').value.trim();
    if(!reason){showToast('El motivo es requerido','error');return;}
    showLoading(true);
    try{await subRef('vetVisits').add({reason:sanitize(reason),date:document.getElementById('hDate').value,vet:sanitize(document.getElementById('hVet').value.trim()),diagnosis:sanitize(document.getElementById('hDiag').value.trim()),treatment:sanitize(document.getElementById('hTreat').value.trim()),cost:parseFloat(document.getElementById('hCost').value)||0,createdAt:firebase.firestore.FieldValue.serverTimestamp()});closeModal();showToast('✅ Visita registrada','success');await this.loadTab('vetVisits');}
    catch(e){showToast('Error al guardar','error');}finally{showLoading(false);}
  },

  async saveNote() {
    const text     = document.getElementById('hNoteText')?.value.trim();
    const mood     = document.getElementById('hMood')?.value;
    const date     = document.getElementById('hDate')?.value;
    const photoUrl = document.getElementById('notePhotoUrl')?.value || null;
    if (!text) { showToast('Escribe algo en la nota','error'); return; }
    showLoading(true);
    try {
      await subRef('behaviorNotes').add({
        mood: mood||'Normal', text: sanitize(text),
        date: date||today(), photoUrl,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      closeModal(); showToast('✅ Nota guardada','success');
      await this.loadTab('behaviorNotes');
    } catch(e) { showToast('Error al guardar','error'); }
    finally { showLoading(false); }
  },

  async handleNotePhoto(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('Selecciona una imagen válida','error'); return; }
    showLoading(true); showToast('⏳ Subiendo foto...','info',6000);
    try {
      const url = await uploadToCloudinary(file);
      document.getElementById('notePhotoUrl').value = url;
      document.getElementById('notePhotoPreview').innerHTML = `<div class="note-photo-preview"><img src="${url}" alt="Foto adjunta"><div class="note-photo-remove" onclick="Health.removeNotePhoto()">✕</div></div>`;
      showToast('✅ Foto lista','success');
    } catch(e) { showToast('Error al subir foto','error'); }
    finally { showLoading(false); event.target.value=''; }
  },

  removeNotePhoto() {
    const u=document.getElementById('notePhotoUrl'); const p=document.getElementById('notePhotoPreview');
    if(u) u.value=''; if(p) p.innerHTML='';
  },

  async saveMedication() {
    const name = document.getElementById('hMedName')?.value.trim();
    if (!name) { showToast('El nombre del medicamento es requerido','error'); return; }
    showLoading(true);
    try {
      const endDate   = document.getElementById('hMedEnd')?.value || null;
      const startDate = document.getElementById('hMedStart')?.value || today();
      const ended     = endDate && new Date(endDate+'T00:00:00') < new Date();
      await subRef('medications').add({
        name: sanitize(name), dose: sanitize(document.getElementById('hMedDose')?.value.trim()||''),
        frequency: document.getElementById('hMedFreq')?.value||'',
        startDate, endDate, active: !ended,
        notes: sanitize(document.getElementById('hMedNotes')?.value.trim()||''),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      closeModal(); showToast('✅ Medicamento guardado','success');
      await this.loadTab('medications');
    } catch(e) { showToast('Error al guardar','error'); }
    finally { showLoading(false); }
  },

  delete(col,id) {
    showConfirm('¿Eliminar registro?','Esta acción no se puede deshacer.',async()=>{
      showLoading(true);
      try{await subRef(col).doc(id).delete();showToast('🗑️ Eliminado','info');await this.loadTab(col);}
      catch(e){showToast('Error','error');}finally{showLoading(false);}
    });
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🍽️ Feeding — Comida
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const Feeding = {
  async render() {
    document.getElementById('view-comida').innerHTML = `
      <div class="sec-header">
        <h2 class="sec-title">Alimentación</h2>
        <button class="btn-primary btn-sm" onclick="Feeding.openPlan()">⚙️ Plan</button>
      </div>
      <div id="feedContent"><div style="text-align:center;padding:40px 0;"><div class="load-icon">🐾</div></div></div>`;
    addFAB(()=>this.openLog());
    await this.load();
  },

  async load() {
    const c=document.getElementById('feedContent');
    if(!c) return;
    try {
      const [planDoc,logSnap]=await Promise.all([subRef('feedingPlan').doc('current').get(),subRef('feedingLog').orderBy('createdAt','desc').limit(30).get()]);
      let html='';
      if(planDoc.exists){
        const p=planDoc.data();
        html+=`<div class="plan-card"><div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;"><span style="font-size:1.5rem;">🦴</span><div><div style="font-weight:700;">${sanitize(p.foodType)}</div>${p.brand?`<div style="font-size:0.8rem;color:var(--text2);">${sanitize(p.brand)}</div>`:''}</div></div><div class="plan-grid"><div class="plan-item"><span>Cantidad</span>${p.amount} ${p.unit||'g'}</div><div class="plan-item"><span>Comidas/día</span>${p.mealsPerDay}</div>${p.schedule?.length?`<div class="plan-item" style="grid-column:1/-1"><span>Horarios</span>${p.schedule.join(' · ')}</div>`:''}</div></div>`;
      } else {
        html+=`<div class="card" style="text-align:center;padding:20px;"><p style="color:var(--text2);margin-bottom:12px;">Sin plan de alimentación</p><button class="btn-primary" onclick="Feeding.openPlan()">⚙️ Configurar Plan</button></div>`;
      }
      html+=`<h3 style="font-size:0.85rem;font-weight:700;margin:14px 0 10px;color:var(--text2);text-transform:uppercase;letter-spacing:0.5px;">Historial</h3>`;
      if(logSnap.empty){html+=`<div class="empty-state"><div class="empty-icon">🍽️</div><h4>Sin comidas registradas</h4><p>Toca + para registrar</p></div>`;}
      else{html+=logSnap.docs.map(doc=>{const d=doc.data();return`<div class="card"><div class="card-row"><div class="card-icon">${d.ate!==false?'✅':'❌'}</div><div class="card-info"><div class="card-title">${sanitize(d.foodType||'Comida')}</div><div class="card-sub">${formatDateRelative(d.date)}${d.amount?' · '+d.amount+' '+(d.unit||'g'):''}</div></div><button class="btn-delete" onclick="Feeding.delete('${doc.id}')">🗑️</button></div></div>`;}).join('');}
      c.innerHTML=html;
    } catch(e){c.innerHTML='<p style="text-align:center;color:var(--text2);padding:20px;">Error al cargar</p>';}
  },

  openPlan(){openModal('Plan de Alimentación',`<div class="field"><label>Tipo de alimento</label><input type="text" id="fType" placeholder="Ej: Croquetas premium"></div><div class="field"><label>Marca</label><input type="text" id="fBrand" placeholder="Ej: Royal Canin"></div><div class="field-row"><div class="field"><label>Cantidad</label><input type="number" id="fAmount" placeholder="200" min="0"></div><div class="field"><label>Unidad</label><select id="fUnit"><option>g</option><option>ml</option><option>tazas</option></select></div></div><div class="field"><label>Comidas por día</label><input type="number" id="fMeals" value="2" min="1" max="6"></div><div class="field"><label>Horarios (separados por coma)</label><input type="text" id="fSched" placeholder="7:00 AM, 6:00 PM"></div><button class="btn-primary btn-full" onclick="Feeding.savePlan()" style="margin-bottom:16px;">✅ Guardar Plan</button>`);},

  async savePlan(){const type=document.getElementById('fType').value.trim();if(!type){showToast('El tipo de alimento es requerido','error');return;}const s=document.getElementById('fSched').value;showLoading(true);try{await subRef('feedingPlan').doc('current').set({foodType:sanitize(type),brand:sanitize(document.getElementById('fBrand').value.trim()),amount:parseFloat(document.getElementById('fAmount').value)||0,unit:document.getElementById('fUnit').value,mealsPerDay:parseInt(document.getElementById('fMeals').value)||2,schedule:s?s.split(',').map(x=>x.trim()).filter(Boolean):[],updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});closeModal();showToast('✅ Plan guardado','success');await this.load();}catch(e){showToast('Error','error');}finally{showLoading(false);}},

  openLog(){openModal('Registrar Comida',`<div class="field"><label>Alimento</label><input type="text" id="flType" placeholder="Ej: Croquetas"></div><div class="field-row"><div class="field"><label>Cantidad</label><input type="number" id="flAmt" placeholder="200" min="0"></div><div class="field"><label>Unidad</label><select id="flUnit"><option>g</option><option>ml</option><option>tazas</option></select></div></div><div class="field"><label>Fecha</label><input type="date" id="flDate" value="${today()}"></div><div class="field"><label>¿Comió todo?</label><select id="flAte"><option value="true">✅ Sí, comió todo</option><option value="false">❌ No comió todo</option></select></div><button class="btn-primary btn-full" onclick="Feeding.saveLog()" style="margin-bottom:16px;">✅ Registrar</button>`);},

  async saveLog(){showLoading(true);try{await subRef('feedingLog').add({foodType:sanitize(document.getElementById('flType').value.trim())||'Comida',amount:parseFloat(document.getElementById('flAmt').value)||null,unit:document.getElementById('flUnit').value,date:document.getElementById('flDate').value,ate:document.getElementById('flAte').value==='true',createdAt:firebase.firestore.FieldValue.serverTimestamp()});closeModal();showToast('✅ Registrado','success');await this.load();}catch(e){showToast('Error','error');}finally{showLoading(false);}},

  delete(id){showConfirm('¿Eliminar?','No se puede deshacer.',async()=>{showLoading(true);try{await subRef('feedingLog').doc(id).delete();showToast('🗑️ Eliminado','info');await this.load();}catch(e){showToast('Error','error');}finally{showLoading(false);}});},
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🛁 Care — Cuidados
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const Care = {
  TYPES:{'Baño':'🛁','Corte de uñas':'✂️','Cepillado':'🪮','Limpieza de oídos':'👂','Limpieza dental':'🦷','Otro':'✨'},

  async render() {
    document.getElementById('view-cuidados').innerHTML=`<div class="sec-header"><h2 class="sec-title">Cuidados</h2></div><div id="careList"><div style="text-align:center;padding:40px 0;"><div class="load-icon">🐾</div></div></div>`;
    addFAB(()=>this.openForm());
    await this.load();
  },

  async load() {
    const c=document.getElementById('careList');if(!c)return;
    try{const snap=await subRef('care').orderBy('createdAt','desc').limit(50).get();
    if(snap.empty){c.innerHTML=`<div class="empty-state"><div class="empty-icon">🛁</div><h4>Sin registros de cuidado</h4><p>Toca + para registrar</p></div>`;return;}
    c.innerHTML=snap.docs.map(doc=>{const d=doc.data();return`<div class="card"><div class="card-row"><div class="card-icon">${this.TYPES[d.type]||'✨'}</div><div class="card-info"><div class="card-title">${sanitize(d.type)}</div><div class="card-sub">${formatDateRelative(d.date)}${d.product?' · '+sanitize(d.product):''}</div></div><button class="btn-delete" onclick="Care.delete('${doc.id}')">🗑️</button></div>${d.notes?`<p class="card-note">${sanitize(d.notes)}</p>`:''}</div>`;}).join('');}
    catch(e){c.innerHTML='<p style="text-align:center;color:var(--text2);padding:20px;">Error al cargar</p>';}
  },

  openForm(){openModal('Nuevo Cuidado',`<div class="field"><label>Tipo</label><select id="cType">${Object.entries(this.TYPES).map(([t,i])=>`<option value="${t}">${i} ${t}</option>`).join('')}</select></div><div class="field"><label>Fecha</label><input type="date" id="cDate" value="${today()}"></div><div class="field"><label>Producto (opcional)</label><input type="text" id="cProd" placeholder="Ej: Shampoo neutro"></div><div class="field"><label>Notas</label><textarea id="cNotes" placeholder="Observaciones..."></textarea></div><button class="btn-primary btn-full" onclick="Care.save()" style="margin-bottom:16px;">✅ Guardar</button>`);},

  async save(){showLoading(true);try{await subRef('care').add({type:document.getElementById('cType').value,date:document.getElementById('cDate').value,product:sanitize(document.getElementById('cProd').value.trim()),notes:sanitize(document.getElementById('cNotes').value.trim()),createdAt:firebase.firestore.FieldValue.serverTimestamp()});closeModal();showToast('✅ Registro guardado','success');await this.load();}catch(e){showToast('Error','error');}finally{showLoading(false);}},

  delete(id){showConfirm('¿Eliminar?','No se puede deshacer.',async()=>{showLoading(true);try{await subRef('care').doc(id).delete();showToast('🗑️ Eliminado','info');await this.load();}catch(e){showToast('Error','error');}finally{showLoading(false);}});},
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📸 Album — Álbum con visor y borrado
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const Album = {
  photos: [],
  currentIndex: 0,

  async render() {
    document.getElementById('view-album').innerHTML = `
      <div class="sec-header">
        <h2 class="sec-title">Álbum de ${Profile.data?.name||'tu mascota'}</h2>
      </div>
      <input type="file" id="albumInput" accept="image/*" style="display:none" onchange="Album.handleUpload(event)">
      <div id="albumGrid"><div style="text-align:center;padding:40px 0;"><div class="load-icon">🐾</div></div></div>
    `;
    addFAB(() => document.getElementById('albumInput').click());
    await this.load();
  },

  async load() {
    const c = document.getElementById('albumGrid');
    if (!c) return;
    try {
      const snap = await subRef('photos').orderBy('createdAt','desc').limit(60).get();
      if (snap.empty) {
        this.photos = [];
        c.innerHTML = `<div class="empty-state"><div class="empty-icon">📸</div><h4>Álbum vacío</h4><p>Toca + para añadir fotos</p></div>`;
        return;
      }

      // Guardar fotos en memoria para la navegación
      this.photos = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Agrupar por mes
      const groups = {};
      this.photos.forEach((p, idx) => {
        const m = (p.date||'').slice(0,7) || new Date().toISOString().slice(0,7);
        if (!groups[m]) groups[m] = [];
        groups[m].push({ ...p, idx });
      });

      c.innerHTML = Object.entries(groups)
        .sort(([a],[b]) => b.localeCompare(a))
        .map(([month, photos]) => {
          const [y,m] = month.split('-');
          const label = new Date(parseInt(y),parseInt(m)-1,1)
            .toLocaleDateString('es-ES',{month:'long',year:'numeric'})
            .toUpperCase();
          return `
            <div class="album-month-header">${label}</div>
            <div class="album-grid">
              ${photos.map(p => `
                <div class="album-item" onclick="Album.openViewer(${p.idx})">
                  <img src="${p.url}" alt="${sanitize(p.caption||'Foto')}" loading="lazy">
                </div>
              `).join('')}
            </div>`;
        }).join('');
    } catch(e) {
      c.innerHTML = '<p style="text-align:center;color:var(--text2);padding:20px;">Error al cargar</p>';
    }
  },

  // ── Abrir visor ──
  openViewer(index) {
    this.currentIndex = index;
    let viewer = document.getElementById('photoViewer');
    if (!viewer) {
      viewer = document.createElement('div');
      viewer.id = 'photoViewer';
      viewer.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.97);z-index:2000;display:flex;flex-direction:column;align-items:center;justify-content:center;';
      document.body.appendChild(viewer);
    }
    viewer.style.display = 'flex';
    this.renderViewer();
    document.addEventListener('keydown', this._keyHandler);
  },

  _keyHandler(e) {
    if (e.key==='ArrowLeft')  Album.prevPhoto();
    if (e.key==='ArrowRight') Album.nextPhoto();
    if (e.key==='Escape')     Album.closeViewer();
  },

  renderViewer() {
    const viewer = document.getElementById('photoViewer');
    if (!viewer) return;
    const photo = this.photos[this.currentIndex];
    if (!photo) return;
    const total = this.photos.length;
    const idx   = this.currentIndex;

    // Dots de navegación (máx 7 para no saturar)
    const showDots = total <= 10;
    const dotsHtml = showDots
      ? this.photos.map((_,i) => `<div style="width:${i===idx?'18px':'6px'};height:6px;border-radius:3px;background:${i===idx?'var(--primary)':'rgba(255,255,255,0.3)'};transition:all 0.3s;"></div>`).join('')
      : `<span style="color:rgba(255,255,255,0.6);font-size:0.82rem;">${idx+1} de ${total}</span>`;

    viewer.innerHTML = `
      <!-- Barra superior -->
      <div style="position:absolute;top:0;left:0;right:0;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(to bottom,rgba(0,0,0,0.85),transparent);z-index:10;">
        <button onclick="Album.closeViewer()" style="width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,0.12);color:#fff;font-size:1.2rem;display:flex;align-items:center;justify-content:center;">✕</button>
        <span style="color:rgba(255,255,255,0.8);font-size:0.82rem;font-weight:600;">${idx+1} / ${total}</span>
        <div style="display:flex;gap:8px;">
          <button onclick="Album.sharePhoto('${photo.url}','${sanitize(photo.caption||'')}')" style="width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,0.12);color:#fff;font-size:1rem;display:flex;align-items:center;justify-content:center;" title="Compartir foto">📤</button>
          <button onclick="Album.deletePhoto('${photo.id}',${idx})" style="width:38px;height:38px;border-radius:50%;background:rgba(239,68,68,0.2);color:#EF4444;font-size:1rem;display:flex;align-items:center;justify-content:center;" title="Eliminar foto">🗑️</button>
        </div>
      </div>

      <!-- Foto -->
      <div style="flex:1;display:flex;align-items:center;justify-content:center;width:100%;padding:70px 12px 12px;">
        <img src="${photo.url}" alt="${sanitize(photo.caption||'Foto')}"
          style="max-width:100%;max-height:100%;object-fit:contain;border-radius:10px;">
      </div>

      <!-- Caption -->
      ${photo.caption ? `<p style="color:rgba(255,255,255,0.7);font-size:0.85rem;text-align:center;padding:4px 24px;margin-bottom:4px;">${sanitize(photo.caption)}</p>` : ''}

      <!-- Navegación inferior -->
      <div style="display:flex;align-items:center;justify-content:center;gap:20px;padding:12px 24px 40px;width:100%;">
        <button onclick="Album.prevPhoto()"
          style="width:48px;height:48px;border-radius:14px;background:rgba(255,255,255,0.1);color:#fff;font-size:1.6rem;display:flex;align-items:center;justify-content:center;${idx===0?'opacity:0.25;pointer-events:none;':''}">‹</button>
        <div style="display:flex;align-items:center;gap:5px;flex:1;justify-content:center;">${dotsHtml}</div>
        <button onclick="Album.nextPhoto()"
          style="width:48px;height:48px;border-radius:14px;background:rgba(255,255,255,0.1);color:#fff;font-size:1.6rem;display:flex;align-items:center;justify-content:center;${idx===total-1?'opacity:0.25;pointer-events:none;':''}">›</button>
      </div>
    `;

    // Soporte táctil (swipe)
    let startX = 0;
    viewer.ontouchstart = e => { startX = e.touches[0].clientX; };
    viewer.ontouchend   = e => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) { diff > 0 ? Album.nextPhoto() : Album.prevPhoto(); }
    };
  },

  prevPhoto() {
    if (this.currentIndex > 0) { this.currentIndex--; this.renderViewer(); }
  },
  nextPhoto() {
    if (this.currentIndex < this.photos.length - 1) { this.currentIndex++; this.renderViewer(); }
  },

  closeViewer() {
    document.removeEventListener('keydown', this._keyHandler);
    const v = document.getElementById('photoViewer');
    if (v) v.style.display = 'none';
  },

  async deletePhoto(id, idx) {
    showConfirm('¿Eliminar foto?', 'Esta acción no se puede deshacer.', async () => {
      showLoading(true);
      try {
        await subRef('photos').doc(id).delete();
        showToast('🗑️ Foto eliminada', 'info');
        this.closeViewer();
        await this.load();
      } catch(e) { showToast('Error al eliminar','error'); }
      finally { showLoading(false); }
    });
  },

  async sharePhoto(url, caption) {
    const petName = Profile.data?.name || 'mi mascota';
    // Web Share API (móvil nativo)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Foto de ${petName} 🐾`,
          text:  caption || `¡Mira a ${petName}! 🐾`,
          url:   url,
        });
        return;
      } catch(e) {
        if (e.name === 'AbortError') return; // usuario canceló
      }
    }
    // Fallback: copiar enlace al portapapeles
    await this.copyPhotoUrl(url);
  },

  async copyPhotoUrl(url) {
    try {
      await navigator.clipboard.writeText(url);
      showToast('✅ Enlace copiado al portapapeles', 'success');
    } catch(e) {
      showToast('No se pudo copiar el enlace', 'error');
    }
  },

  async handleUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('Selecciona una imagen válida','error'); return; }
    openModal('Nueva Foto',`<div style="text-align:center;padding:20px;"><div class="load-icon">📸</div><p style="color:var(--text2);">Subiendo imagen...</p></div>`);
    showLoading(true);
    try {
      const url = await uploadToCloudinary(file);
      event.target.value = '';
      document.getElementById('modalBody').innerHTML = `
        <div style="text-align:center;margin-bottom:14px;">
          <img src="${url}" style="max-height:180px;border-radius:12px;margin:0 auto;object-fit:cover;">
        </div>
        <div class="field"><label>Descripción (opcional)</label><input type="text" id="pCaption" placeholder="Ej: Primer día en el parque"></div>
        <div class="field"><label>Mes</label><input type="month" id="pMonth" value="${today().slice(0,7)}"></div>
        <input type="hidden" id="pUrl" value="${url}">
        <button class="btn-primary btn-full" onclick="Album.savePhoto()" style="margin-bottom:16px;">✅ Guardar Foto</button>`;
    } catch(e) { closeModal(); showToast('Error al subir foto','error'); }
    finally { showLoading(false); }
  },

  async savePhoto() {
    showLoading(true);
    try {
      await subRef('photos').add({
        url: document.getElementById('pUrl').value,
        caption: sanitize(document.getElementById('pCaption').value.trim()),
        date: document.getElementById('pMonth').value,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      closeModal(); showToast('📸 Foto guardada','success');
      await this.load();
    } catch(e) { showToast('Error','error'); }
    finally { showLoading(false); }
  },
};
