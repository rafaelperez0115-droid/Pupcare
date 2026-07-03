// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🏠 home.js — Dashboard principal v3
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const Home = {

  async render() {
    const view = document.getElementById('view-inicio');
    if (!view) return;

    // ── Sin mascota: mostrar bienvenida guiada ──
    if (!PET_ID || !Profile.data) {
      await this.renderWelcome(view);
      return;
    }

    const pet = Profile.data;

    // ── Renderizar estructura base de inmediato ──
    view.innerHTML = `
      <div class="pet-card">
        <div class="pet-card-top">
          <div class="pet-photo-wrap">
            <img class="pet-photo" src="${pet.photoUrl || 'assets/icons/paw.svg'}" alt="${sanitize(pet.name)}">
            <div class="pet-photo-edit" onclick="navigate('perfil')">📷</div>
          </div>
          <div class="pet-info">
            <div class="pet-name">${sanitize(pet.name)}</div>
            <div class="pet-meta">
              ${pet.breed ? sanitize(pet.breed) + ' &nbsp;·&nbsp; ' : ''}
              ${pet.birthDate ? calcAge(pet.birthDate) + ' &nbsp;·&nbsp; ' : ''}
              ${pet.currentWeight ? pet.currentWeight + ' ' + (pet.weightUnit || 'kg') : ''}
            </div>
          </div>
        </div>
        <div class="pet-badges" id="petBadges">
          <div class="pet-badge"><div class="pet-badge-num blue">—</div><div class="pet-badge-label">Vacunas</div></div>
          <div class="pet-badge"><div class="pet-badge-num green">—</div><div class="pet-badge-label">Fotos</div></div>
          <div class="pet-badge"><div class="pet-badge-num amber">—</div><div class="pet-badge-label">Paseos</div></div>
        </div>
      </div>

      <div class="info-grid" id="infoGrid">
        <div class="info-card"><div class="info-label">Cargando...</div></div>
        <div class="info-card"><div class="info-label">Cargando...</div></div>
        <div class="info-card"><div class="info-label">Cargando...</div></div>
        <div class="info-card"><div class="info-label">Cargando...</div></div>
      </div>

      <div class="home-section">
        <div class="home-sec-header">
          <div class="home-sec-title">Próximas tareas</div>
          <button class="btn-add" onclick="Home.openTaskForm()">+ Añadir</button>
        </div>
        <div id="tasksList"><p style="color:var(--text2);font-size:0.85rem;">Cargando...</p></div>
        <!-- Historial de completadas -->
        <div id="completedSection" style="margin-top:12px;">
          <button class="btn-completed-toggle" id="completedToggleBtn" onclick="Home.toggleCompleted()">
            📋 Ver historial de tareas completadas
          </button>
          <div id="completedList" style="display:none;margin-top:10px;"></div>
        </div>
      </div>

      <div class="home-section">
        <div class="home-sec-header">
          <div class="home-sec-title">Actividad reciente</div>
          <button class="btn-add" onclick="Home.openActivityForm()">+ Registrar</button>
        </div>
        <div id="recentActivity"><p style="color:var(--text2);font-size:0.85rem;">Cargando...</p></div>
      </div>
    `;

    addFAB(() => this.openActivityForm());

    // Cargar datos en paralelo
    this.loadStats();
    this.loadInfoGrid();
    this.loadTasks();
    this.loadRecentActivity();
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎉 PANTALLA DE BIENVENIDA GUIADA
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async renderWelcome(view) {
    // Verificar qué pasos están completados
    let hasVaccines = false, hasFeedingPlan = false;
    if (PET_ID) {
      try {
        const [vacSnap, feedDoc] = await Promise.all([
          subRef('vaccines').limit(1).get(),
          subRef('feedingPlan').doc('current').get(),
        ]);
        hasVaccines    = !vacSnap.empty;
        hasFeedingPlan = feedDoc.exists;
      } catch(e) { /* ignorar */ }
    }

    const step1Done = !!PET_ID;
    const step2Done = step1Done && hasVaccines;
    const step3Done = step1Done && hasFeedingPlan;

    const stepDoneIcon   = '✅';
    const stepPendingIcon = '›';

    view.innerHTML = `
      <div class="welcome-screen">

        <!-- Hero -->
        <div class="welcome-hero">
          <span class="welcome-logo">🐾</span>
          <h2>¡Bienvenido a PupCare!</h2>
          <p>Tu centro de control para el cuidado de tu mascota.<br>Sigue estos pasos para comenzar:</p>
        </div>

        <!-- Pasos -->
        <p class="welcome-steps-title">Pasos para empezar</p>

        <!-- Paso 1 -->
        <div class="welcome-step ${step1Done ? 'done' : ''}" onclick="navigate('perfil')">
          <div class="step-num">${step1Done ? '✓' : '1'}</div>
          <div class="step-icon">🐶</div>
          <div class="step-body">
            <div class="step-title">Crea el perfil de tu mascota</div>
            <div class="step-desc">Nombre, raza, fecha de nacimiento y peso actual</div>
          </div>
          <div class="${step1Done ? 'step-status done-label' : 'step-chevron'}">${step1Done ? stepDoneIcon : stepPendingIcon}</div>
        </div>

        <!-- Paso 2 -->
        <div class="welcome-step ${step2Done ? 'done' : step1Done ? '' : 'disabled'}" onclick="${step1Done ? "navigate('salud')" : ''}">
          <div class="step-num">${step2Done ? '✓' : '2'}</div>
          <div class="step-icon">💉</div>
          <div class="step-body">
            <div class="step-title">Registra las vacunas</div>
            <div class="step-desc">Mantén el historial de salud al día con fechas y próximas dosis</div>
          </div>
          <div class="${step2Done ? 'step-status done-label' : 'step-chevron'}">${step2Done ? stepDoneIcon : stepPendingIcon}</div>
        </div>

        <!-- Paso 3 -->
        <div class="welcome-step ${step3Done ? 'done' : step1Done ? '' : 'disabled'}" onclick="${step1Done ? "navigate('comida')" : ''}">
          <div class="step-num">${step3Done ? '✓' : '3'}</div>
          <div class="step-icon">🍽️</div>
          <div class="step-body">
            <div class="step-title">Configura la alimentación</div>
            <div class="step-desc">Tipo de alimento, cantidad y horarios de comida diarios</div>
          </div>
          <div class="${step3Done ? 'step-status done-label' : 'step-chevron'}">${step3Done ? stepDoneIcon : stepPendingIcon}</div>
        </div>

        ${step1Done && step2Done && step3Done ? `
          <div style="text-align:center;margin-top:20px;padding:20px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:var(--radius-sm);">
            <div style="font-size:2rem;margin-bottom:8px;">🎉</div>
            <div style="font-weight:700;color:var(--secondary);">¡Todo listo!</div>
            <div style="font-size:0.84rem;color:var(--text2);margin-top:4px;">Tu perfil está completo. Explora todas las secciones.</div>
          </div>
        ` : ''}

      </div>
    `;
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📊 ESTADÍSTICAS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async loadStats() {
    try {
      const [vacSnap, photoSnap, actSnap] = await Promise.all([
        subRef('vaccines').get(),
        subRef('photos').get(),
        subRef('activities').get(),
      ]);
      const el = document.getElementById('petBadges');
      if (!el) return;
      el.innerHTML = `
        <div class="pet-badge"><div class="pet-badge-num blue">${vacSnap.size}</div><div class="pet-badge-label">Vacunas</div></div>
        <div class="pet-badge"><div class="pet-badge-num green">${photoSnap.size}</div><div class="pet-badge-label">Fotos</div></div>
        <div class="pet-badge"><div class="pet-badge-num amber">${actSnap.size}</div><div class="pet-badge-label">Paseos</div></div>
      `;
    } catch (e) { console.warn('Error cargando stats:', e); }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📋 INFO GRID
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async loadInfoGrid() {
    try {
      const [actSnap, feedDoc, careSnap, vacSnap, dewSnap] = await Promise.all([
        subRef('activities').orderBy('createdAt','desc').limit(1).get(),
        subRef('feedingPlan').doc('current').get(),
        subRef('care').orderBy('createdAt','desc').limit(1).get(),
        subRef('vaccines').get(),
        subRef('dewormings').orderBy('createdAt','desc').limit(1).get(),
      ]);

      const lastAct  = actSnap.empty  ? null : actSnap.docs[0].data();
      const lastCare = careSnap.empty ? null : careSnap.docs[0].data();
      const lastDew  = dewSnap.empty  ? null : dewSnap.docs[0].data();
      const feedPlan = feedDoc.exists  ? feedDoc.data() : null;

      let nextVax = null;
      vacSnap.docs.forEach(d => {
        const nd = d.data().nextDate;
        if (nd && (!nextVax || nd < nextVax)) nextVax = nd;
      });

      const grid = document.getElementById('infoGrid');
      if (!grid) return;

      let html = `
        <div class="info-card">
          <div class="info-label">Comida diaria</div>
          <div class="info-value">${feedPlan ? (feedPlan.amount*(feedPlan.mealsPerDay||2))+(feedPlan.unit||'g') : '—'}</div>
          <div class="info-sub">${feedPlan ? sanitize(feedPlan.foodType) : 'Sin plan'}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Último paseo</div>
          <div class="info-value">${lastAct ? formatDateRelative(lastAct.date) : '—'}</div>
          <div class="info-sub">${lastAct ? sanitize(lastAct.type||'') : 'Sin registros'}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Próxima vacuna</div>
          <div class="info-value ${nextVax && new Date(nextVax)<new Date() ? 'red' : 'green'}">
            ${nextVax ? formatDate(nextVax) : 'Sin pendientes'}
          </div>
          <div class="info-sub">${nextVax && new Date(nextVax)<new Date() ? '⚠️ Vencida' : 'Al día'}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Último baño</div>
          <div class="info-value amber">${lastCare ? formatDateRelative(lastCare.date) : '—'}</div>
          <div class="info-sub">${lastCare ? formatDate(lastCare.date) : 'Sin registros'}</div>
        </div>
      `;

      if (lastDew) {
        const daysLeft = lastDew.nextDate
          ? Math.max(0, Math.ceil((new Date(lastDew.nextDate)-new Date())/86400000))
          : null;
        html += `
          <div class="info-card full">
            <div class="info-label">Desparasitación</div>
            <div class="info-value green">Activa</div>
            <div class="info-sub">${daysLeft!==null ? 'Próxima en '+daysLeft+' días' : 'Sin próxima fecha'}</div>
          </div>`;
      }

      grid.innerHTML = html;
    } catch(e) { console.warn('Error info grid:', e); }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ✅ TAREAS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async loadTasks() {
    const c = document.getElementById('tasksList');
    if (!c) return;
    try {
      let snap;
      try {
        snap = await subRef('tasks').where('completed','==',false).orderBy('dueDate','asc').limit(10).get();
      } catch {
        snap = await subRef('tasks').where('completed','==',false).limit(10).get();
      }

      if (snap.empty) {
        c.innerHTML = '<p style="color:var(--text2);font-size:0.85rem;padding:4px 0;">Sin tareas pendientes ✅</p>';
        return;
      }

      const ICONS = {'Baño':'🛁','Vacuna':'💉','Desparasitación':'🐛','Veterinario':'🏥','Corte de uñas':'✂️','Cepillado':'🪮','Medicamento':'💊','Otro':'📋'};
      const today_ = new Date(); today_.setHours(0,0,0,0);

      c.innerHTML = snap.docs.map(doc => {
        const d    = doc.data();
        const due  = new Date(d.dueDate+'T00:00:00');
        const diff = Math.ceil((due-today_)/86400000);
        const pct  = Math.min(100,Math.max(0,Math.round((1-diff/30)*100)));
        const urg  = diff<0?'urgent':diff<=3?'soon':'ok';
        const txt  = diff<0?Math.abs(diff)+'d atrás':diff===0?'Hoy':diff+'d';
        const col  = urg==='urgent'?'var(--danger)':urg==='soon'?'var(--warning)':'var(--secondary)';
        return `
          <div class="task-card">
            <div class="task-card-top">
              <div class="task-icon">${ICONS[d.type]||'📋'}</div>
              <div class="task-info">
                <div class="task-name">${sanitize(d.type)}</div>
                <div class="task-date">${formatDate(d.dueDate)}</div>
              </div>
              <div class="task-actions">
                <span class="task-badge ${urg}">${txt}</span>
                <button class="task-btn check" onclick="Home.completeTask('${doc.id}')">✓</button>
                <button class="task-btn del"   onclick="Home.deleteTask('${doc.id}')">✕</button>
              </div>
            </div>
            <div class="task-progress"><div class="task-progress-fill" style="width:${pct}%;background:${col};"></div></div>
          </div>`;
      }).join('');
    } catch(e) {
      c.innerHTML = '<p style="color:var(--text2);font-size:0.85rem;">Sin tareas registradas</p>';
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🏃 ACTIVIDAD RECIENTE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async loadRecentActivity() {
    const c = document.getElementById('recentActivity');
    if (!c) return;
    try {
      const snap = await subRef('activities').orderBy('createdAt','desc').limit(5).get();
      const ICONS = {'Paseo':'🚶','Entrenamiento':'🎯','Juego':'🎾','Natación':'🏊','Otro':'⭐'};
      if (snap.empty) {
        c.innerHTML = '<p style="color:var(--text2);font-size:0.85rem;padding:4px 0;">Sin actividades registradas</p>';
        return;
      }
      c.innerHTML = snap.docs.map(doc => {
        const d   = doc.data();
        const det = [d.duration,d.distance].filter(Boolean).join(' · ');
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
    } catch(e) {
      c.innerHTML = '<p style="color:var(--text2);font-size:0.85rem;">Sin actividades</p>';
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📝 FORMULARIOS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  openTaskForm() {
    openModal('Nueva Tarea',`
      <div class="field"><label>Tipo de tarea</label><select id="tType">
        <option>Baño</option><option>Vacuna</option><option>Desparasitación</option>
        <option>Veterinario</option><option>Corte de uñas</option>
        <option>Cepillado</option><option>Medicamento</option><option>Otro</option>
      </select></div>
      <div class="field"><label>Fecha programada</label><input type="date" id="tDate" value="${today()}"></div>
      <div class="field"><label>Notas (opcional)</label><textarea id="tNotes" placeholder="Observaciones..."></textarea></div>
      <button class="btn-primary btn-full" onclick="Home.saveTask()" style="margin-bottom:16px;">✅ Agregar Tarea</button>
    `);
  },

  async saveTask() {
    const type=document.getElementById('tType').value;
    const date=document.getElementById('tDate').value;
    if(!date){showToast('La fecha es requerida','error');return;}
    showLoading(true);
    try{
      await subRef('tasks').add({type,dueDate:date,notes:sanitize(document.getElementById('tNotes').value.trim()),completed:false,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
      closeModal();showToast('✅ Tarea agregada','success');await this.loadTasks();
    }catch(e){showToast('Error al guardar','error');}finally{showLoading(false);}
  },

  async completeTask(id) {
    showLoading(true);
    try{await subRef('tasks').doc(id).update({completed:true,completedAt:firebase.firestore.FieldValue.serverTimestamp()});showToast('✅ Tarea completada','success');await this.loadTasks();}
    catch(e){showToast('Error','error');}finally{showLoading(false);}
  },

  async deleteTask(id) {
    showConfirm('¿Eliminar tarea?','Esta acción no se puede deshacer.',async()=>{
      showLoading(true);
      try{await subRef('tasks').doc(id).delete();showToast('🗑️ Eliminada','info');await this.loadTasks();}
      catch(e){showToast('Error','error');}finally{showLoading(false);}
    });
  },

  async toggleCompleted() {
    const list = document.getElementById('completedList');
    const btn  = document.getElementById('completedToggleBtn');
    if (!list || !btn) return;

    if (list.style.display !== 'none') {
      list.style.display = 'none';
      btn.textContent = '📋 Ver historial de tareas completadas';
      btn.classList.remove('active');
      return;
    }

    list.style.display = 'block';
    btn.textContent = '📋 Ocultar historial de completadas';
    btn.classList.add('active');
    await this.loadCompletedTasks();
  },

  async loadCompletedTasks() {
    const list = document.getElementById('completedList');
    if (!list) return;
    list.innerHTML = '<p style="color:var(--text2);font-size:0.85rem;padding:4px 0;">Cargando...</p>';

    const ICONS = {'Baño':'🛁','Vacuna':'💉','Desparasitación':'🐛','Veterinario':'🏥','Corte de uñas':'✂️','Cepillado':'🪮','Medicamento':'💊','Otro':'📋'};

    try {
      let snap;
      try {
        snap = await subRef('tasks')
          .where('completed','==',true)
          .orderBy('completedAt','desc')
          .limit(20).get();
      } catch {
        snap = await subRef('tasks')
          .where('completed','==',true)
          .limit(20).get();
      }

      if (snap.empty) {
        list.innerHTML = '<p style="color:var(--text2);font-size:0.85rem;padding:4px 0;">Sin tareas completadas todavía</p>';
        return;
      }

      list.innerHTML = snap.docs.map(doc => {
        const d = doc.data();
        let completedStr = '—';
        if (d.completedAt && d.completedAt.toDate) {
          completedStr = formatDateRelative(d.completedAt.toDate().toISOString().split('T')[0]);
        }
        return `
          <div class="completed-task-card">
            <div class="completed-task-icon">${ICONS[d.type]||'📋'}</div>
            <div class="completed-task-info">
              <div class="completed-task-name">${sanitize(d.type)}</div>
              <div class="completed-task-date">Completada: ${completedStr}</div>
              ${d.dueDate ? `<div class="completed-task-date">Programada: ${formatDate(d.dueDate)}</div>` : ''}
            </div>
            <div style="color:var(--secondary);font-size:1.2rem;">✅</div>
          </div>`;
      }).join('');

    } catch(e) {
      list.innerHTML = '<p style="color:var(--text2);font-size:0.85rem;">Error al cargar historial</p>';
    }
  },

  openActivityForm() {
    openModal('Registrar Actividad',`
      <div class="field"><label>Tipo</label><select id="aType">
        <option>🚶 Paseo</option><option>🎯 Entrenamiento</option>
        <option>🎾 Juego</option><option>🏊 Natación</option><option>⭐ Otro</option>
      </select></div>
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
    const typeRaw=document.getElementById('aType').value;
    const type=typeRaw.replace(/^\S+\s/,'');
    const date=document.getElementById('aDate').value;
    if(!date){showToast('La fecha es requerida','error');return;}
    showLoading(true);
    try{
      await subRef('activities').add({type,date,duration:document.getElementById('aDur').value.trim(),distance:document.getElementById('aDist').value.trim(),note:sanitize(document.getElementById('aNote').value.trim()),createdAt:firebase.firestore.FieldValue.serverTimestamp()});
      closeModal();showToast('✅ Registrado','success');
      this.loadStats();this.loadInfoGrid();this.loadRecentActivity();
    }catch(e){showToast('Error','error');}finally{showLoading(false);}
  },

  async deleteActivity(id) {
    showConfirm('¿Eliminar actividad?','Esta acción no se puede deshacer.',async()=>{
      showLoading(true);
      try{await subRef('activities').doc(id).delete();showToast('🗑️ Eliminada','info');this.loadStats();this.loadRecentActivity();}
      catch(e){showToast('Error','error');}finally{showLoading(false);}
    });
  },
};
