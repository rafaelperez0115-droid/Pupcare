// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🏠 home.js — Dashboard principal
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const Home = {

  async render() {
    const view = document.getElementById('view-inicio');
    if (!view) return;

    if (!PET_ID || !Profile.data) {
      view.innerHTML = `
        <div class="empty-state" style="padding-top:60px;">
          <div class="empty-icon">🐾</div>
          <h4>¡Bienvenido a PupCare!</h4>
          <p>Ve a Perfil para configurar los datos de tu mascota</p>
          <button class="btn-primary" onclick="navigate('perfil')" style="margin-top:16px;">
            Ir a Perfil
          </button>
        </div>`;
      return;
    }

    view.innerHTML = `<div id="homeContent"><div style="text-align:center;padding:40px 0;"><div class="load-icon">🐾</div></div></div>`;
    addFAB(() => this.openActivityForm());
    await this.loadContent();
  },

  async loadContent() {
    const container = document.getElementById('homeContent');
    if (!container) return;

    try {
      const pet = Profile.data;

      // Cargar datos en paralelo
      const [vacSnap, photoSnap, actSnap, feedDoc, careSnap, dewSnap, allActSnap] = await Promise.all([
        subRef('vaccines').get(),
        subRef('photos').get(),
        subRef('activities').orderBy('createdAt','desc').limit(1).get(),
        subRef('feedingPlan').doc('current').get(),
        subRef('care').orderBy('createdAt','desc').limit(1).get(),
        subRef('dewormings').orderBy('createdAt','desc').limit(1).get(),
        subRef('activities').orderBy('createdAt','desc').limit(5).get(),
      ]);

      // Calcular valores
      const lastAct   = actSnap.empty  ? null : actSnap.docs[0].data();
      const lastCare  = careSnap.empty ? null : careSnap.docs[0].data();
      const lastDew   = dewSnap.empty  ? null : dewSnap.docs[0].data();
      const feedPlan  = feedDoc.exists ? feedDoc.data() : null;

      // Próxima vacuna
      let nextVax = null;
      vacSnap.docs.forEach(d => {
        const nd = d.data().nextDate;
        if (nd && (!nextVax || nd < nextVax)) nextVax = nd;
      });

      // HTML del dashboard
      container.innerHTML = `
        <!-- Pet Card -->
        <div class="pet-card">
          <div class="pet-card-top">
            <div class="pet-photo-wrap">
              <img class="pet-photo" id="homePetPhoto"
                src="${pet.photoUrl || 'assets/icons/paw.svg'}"
                alt="${sanitize(pet.name)}">
              <div class="pet-photo-edit" onclick="navigate('perfil')">📷</div>
            </div>
            <div class="pet-info">
              <div class="pet-name">${sanitize(pet.name)}</div>
              <div class="pet-meta">
                ${pet.breed ? `<span>${sanitize(pet.breed)}</span> <span>•</span>` : ''}
                ${pet.birthDate ? `<span>${calcAge(pet.birthDate)}</span> <span>•</span>` : ''}
                ${pet.currentWeight ? `<span>${pet.currentWeight} ${pet.weightUnit||'kg'}</span>` : ''}
              </div>
            </div>
          </div>
          <div class="pet-badges">
            <div class="pet-badge">
              <div class="pet-badge-num blue">${vacSnap.size}</div>
              <div class="pet-badge-label">Vacunas</div>
            </div>
            <div class="pet-badge">
              <div class="pet-badge-num green">${photoSnap.size}</div>
              <div class="pet-badge-label">Fotos</div>
            </div>
            <div class="pet-badge">
              <div class="pet-badge-num amber">${allActSnap.size}</div>
              <div class="pet-badge-label">Paseos</div>
            </div>
          </div>
        </div>

        <!-- Info Grid -->
        <div class="info-grid">
          <div class="info-card">
            <div class="info-label">Comida diaria</div>
            <div class="info-value">${feedPlan ? feedPlan.amount*(feedPlan.mealsPerDay||2)+(feedPlan.unit||'g') : '—'}</div>
            <div class="info-sub">${feedPlan ? feedPlan.foodType : 'Sin configurar'}</div>
          </div>
          <div class="info-card">
            <div class="info-label">Paseo de hoy</div>
            <div class="info-value">${lastAct && lastAct.date === today() ? (lastAct.duration||'Registrado') : '—'}</div>
            <div class="info-sub">${lastAct ? formatDateRelative(lastAct.date) : 'Sin registros'}</div>
          </div>
          <div class="info-card">
            <div class="info-label">Próxima vacuna</div>
            <div class="info-value ${nextVax ? (new Date(nextVax) < new Date() ? 'red' : 'green') : 'green'}">
              ${nextVax ? formatDate(nextVax) : 'Sin pendientes'}
            </div>
            <div class="info-sub">${nextVax ? (new Date(nextVax) < new Date() ? '⚠️ Vencida' : 'Actualizado') : 'Actualizado'}</div>
          </div>
          <div class="info-card">
            <div class="info-label">Último baño</div>
            <div class="info-value amber">${lastCare ? formatDateRelative(lastCare.date) : '—'}</div>
            <div class="info-sub">${lastCare ? formatDate(lastCare.date) : 'Sin registros'}</div>
          </div>
          ${lastDew ? `
          <div class="info-card full">
            <div class="info-label">Desparasitación</div>
            <div class="info-value green">Activa</div>
            <div class="info-sub">${lastDew.nextDate ? `Próxima en ${Math.max(0, Math.ceil((new Date(lastDew.nextDate)-new Date())/86400000))} días` : 'Sin próxima fecha'}</div>
          </div>` : ''}
        </div>

        <!-- Tareas -->
        <div class="home-section">
          <div class="home-sec-header">
            <div class="home-sec-title">Próximas tareas</div>
            <button class="btn-add" onclick="Home.openTaskForm()">+ Añadir</button>
          </div>
          <div id="tasksList"></div>
        </div>

        <!-- Actividad reciente -->
        <div class="home-section">
          <div class="home-sec-header">
            <div class="home-sec-title">Actividad reciente</div>
            <button class="btn-add" onclick="Home.openActivityForm()">+ Registrar</button>
          </div>
          <div id="recentActivity"></div>
        </div>
      `;

      // Cargar tareas y actividad
      await Promise.all([
        this.loadTasks(),
        this.loadRecentActivity(allActSnap),
      ]);

    } catch(e) {
      console.error('Error cargando dashboard:', e);
      container.innerHTML = '<p style="text-align:center;color:var(--text2);padding:20px;">Error al cargar</p>';
    }
  },

  async loadTasks() {
    const container = document.getElementById('tasksList');
    if (!container) return;
    try {
      const snap = await subRef('tasks')
        .where('completed','==',false)
        .orderBy('dueDate','asc').limit(10).get();

      if (snap.empty) {
        container.innerHTML = '<p style="color:var(--text2);font-size:0.85rem;padding:8px 0;">Sin tareas pendientes ✅</p>';
        return;
      }

      const ICONS = { 'Baño':'🛁','Vacuna':'💉','Desparasitación':'🐛','Veterinario':'🏥','Corte de uñas':'✂️','Cepillado':'🪮','Medicamento':'💊','Otro':'📋' };
      const today_ = new Date(); today_.setHours(0,0,0,0);

      container.innerHTML = snap.docs.map(doc => {
        const d = doc.data();
        const due = new Date(d.dueDate+'T00:00:00');
        const diff = Math.ceil((due - today_) / 86400000);
        const pct  = Math.min(100, Math.max(0, Math.round((1 - diff/30)*100)));
        const urgency = diff < 0 ? 'urgent' : diff <= 3 ? 'soon' : 'ok';
        const badgeText = diff < 0 ? `${Math.abs(diff)}d atrás` : diff === 0 ? 'Hoy' : `${diff}d`;
        const barColor  = urgency==='urgent'?'var(--danger)':urgency==='soon'?'var(--warning)':'var(--secondary)';

        return `
          <div class="task-card">
            <div class="task-card-top">
              <div class="task-icon">${ICONS[d.type]||'📋'}</div>
              <div class="task-info">
                <div class="task-name">${sanitize(d.type)}</div>
                <div class="task-date">${formatDate(d.dueDate)}</div>
              </div>
              <div class="task-actions">
                <span class="task-badge ${urgency}">${badgeText}</span>
                <button class="task-btn check" onclick="Home.completeTask('${doc.id}')" title="Completar">✓</button>
                <button class="task-btn del" onclick="Home.deleteTask('${doc.id}')" title="Eliminar">✕</button>
              </div>
            </div>
            <div class="task-progress">
              <div class="task-progress-fill" style="width:${pct}%;background:${barColor};"></div>
            </div>
          </div>`;
      }).join('');
    } catch(e) {
      console.warn('Error cargando tareas:', e);
      container.innerHTML = '<p style="color:var(--text2);font-size:0.85rem;padding:8px 0;">Sin tareas registradas</p>';
    }
  },

  async loadRecentActivity(snap) {
    const container = document.getElementById('recentActivity');
    if (!container) return;
    const ICONS = { 'Paseo':'🚶','Entrenamiento':'🎯','Juego':'🎾','Natación':'🏊','Otro':'⭐' };
    if (snap.empty) {
      container.innerHTML = '<p style="color:var(--text2);font-size:0.85rem;padding:8px 0;">Sin actividades registradas</p>';
      return;
    }
    container.innerHTML = snap.docs.map(doc => {
      const d = doc.data();
      const det = [d.duration, d.distance].filter(Boolean).join(' · ');
      return `
        <div class="activity-card">
          <div class="activity-icon">${ICONS[d.type]||'⭐'}</div>
          <div class="activity-info">
            <div class="activity-title">${sanitize(d.type)}</div>
            <div class="activity-sub">${formatDateRelative(d.date)}${det?' · '+sanitize(det):''}</div>
          </div>
          <button class="activity-del" onclick="Home.deleteActivity('${doc.id}')">🗑️</button>
        </div>`;
    }).join('');
  },

  openTaskForm() {
    openModal('Nueva Tarea', `
      <div class="field">
        <label>Tipo de tarea</label>
        <select id="tType">
          <option>Baño</option><option>Vacuna</option><option>Desparasitación</option>
          <option>Veterinario</option><option>Corte de uñas</option>
          <option>Cepillado</option><option>Medicamento</option><option>Otro</option>
        </select>
      </div>
      <div class="field">
        <label>Fecha programada</label>
        <input type="date" id="tDate" value="${today()}">
      </div>
      <div class="field">
        <label>Notas (opcional)</label>
        <textarea id="tNotes" placeholder="Observaciones..."></textarea>
      </div>
      <button class="btn-primary btn-full" onclick="Home.saveTask()" style="margin-bottom:16px;">✅ Agregar Tarea</button>
    `);
  },

  async saveTask() {
    const type  = document.getElementById('tType').value;
    const date  = document.getElementById('tDate').value;
    const notes = document.getElementById('tNotes').value.trim();
    if (!date) { showToast('La fecha es requerida','error'); return; }
    showLoading(true);
    try {
      await subRef('tasks').add({
        type, dueDate: date, notes: sanitize(notes),
        completed: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      closeModal(); showToast('✅ Tarea agregada','success');
      await this.loadTasks();
    } catch(e){ showToast('Error al guardar','error'); }
    finally { showLoading(false); }
  },

  async completeTask(id) {
    showLoading(true);
    try {
      await subRef('tasks').doc(id).update({
        completed: true,
        completedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      showToast('✅ Tarea completada','success');
      await this.loadTasks();
    } catch(e){ showToast('Error','error'); }
    finally { showLoading(false); }
  },

  async deleteTask(id) {
    showConfirm('¿Eliminar tarea?','Esta acción no se puede deshacer.', async () => {
      showLoading(true);
      try {
        await subRef('tasks').doc(id).delete();
        showToast('🗑️ Tarea eliminada','info');
        await this.loadTasks();
      } catch(e){ showToast('Error','error'); }
      finally { showLoading(false); }
    });
  },

  openActivityForm() {
    const TYPES = { 'Paseo':'🚶','Entrenamiento':'🎯','Juego':'🎾','Natación':'🏊','Otro':'⭐' };
    openModal('Registrar Actividad', `
      <div class="field">
        <label>Tipo</label>
        <select id="aType">
          ${Object.entries(TYPES).map(([t,i])=>`<option>${i} ${t}</option>`).join('')}
        </select>
      </div>
      <div class="field-row">
        <div class="field"><label>Fecha</label><input type="date" id="aDate" value="${today()}"></div>
        <div class="field"><label>Duración</label><input type="text" id="aDur" placeholder="30 min"></div>
      </div>
      <div class="field"><label>Distancia (opcional)</label><input type="text" id="aDist" placeholder="2 km"></div>
      <div class="field"><label>Notas</label><textarea id="aNote" placeholder="Observaciones..."></textarea></div>
      <button class="btn-primary btn-full" onclick="Home.saveActivity()" style="margin-bottom:16px;">✅ Registrar</button>
    `);
  },

  async saveActivity() {
    const typeRaw = document.getElementById('aType').value;
    const type    = typeRaw.replace(/^\S+\s/,'');
    const date    = document.getElementById('aDate').value;
    if (!date){ showToast('La fecha es requerida','error'); return; }
    showLoading(true);
    try {
      await subRef('activities').add({
        type, date,
        duration: document.getElementById('aDur').value.trim(),
        distance: document.getElementById('aDist').value.trim(),
        note: sanitize(document.getElementById('aNote').value.trim()),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      closeModal(); showToast('✅ Actividad registrada','success');
      await this.loadContent();
    } catch(e){ showToast('Error al guardar','error'); }
    finally { showLoading(false); }
  },

  async deleteActivity(id) {
    showConfirm('¿Eliminar actividad?','Esta acción no se puede deshacer.', async () => {
      showLoading(true);
      try {
        await subRef('activities').doc(id).delete();
        showToast('🗑️ Eliminada','info');
        await this.loadContent();
      } catch(e){ showToast('Error','error'); }
      finally { showLoading(false); }
    });
  },
};
