// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🏠 home.js v4 — Dashboard + Clima + Resumen Mensual
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const Home = {

  async render() {
    const view = document.getElementById('view-inicio');
    if (!view) return;

    if (!PET_ID || !Profile.data) {
      await this.renderWelcome(view);
      return;
    }

    const pet = Profile.data;
    const monthName = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();

    view.innerHTML = `
      <!-- #18 Widget de Clima -->
      <div id="weatherWidget" class="weather-card">
        <div class="weather-loading">🌤️ Obteniendo clima...</div>
      </div>

      <!-- Tarjeta de mascota -->
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

      <!-- Info rápida -->
      <div class="info-grid" id="infoGrid">
        ${skeletonInfoCards(4)}
      </div>

      <!-- #9 Resumen mensual -->
      <div class="home-section">
        <div class="home-sec-header">
          <div class="home-sec-title">Este mes</div>
          <span style="font-size:0.74rem;color:var(--text2);font-weight:600;">${monthName}</span>
        </div>
        <div class="monthly-grid" id="monthlyStats">
          <div class="monthly-card"><div class="monthly-icon">⏳</div><div class="monthly-info"><div class="monthly-num">—</div><div class="monthly-label">Cargando</div></div></div>
        </div>
        <button class="btn-annual-stats" onclick="Home.showAnnualStats()">
          📊 Ver resumen anual
        </button>
      </div>

      <!-- Tareas -->
      <div class="home-section">
        <div class="home-sec-header">
          <div class="home-sec-title">Próximas tareas</div>
          <button class="btn-add" onclick="Home.openTaskForm()">+ Añadir</button>
        </div>
        <div id="tasksList">${skeletonList(2)}</div>
        <div id="completedSection" style="margin-top:12px;">
          <button class="btn-completed-toggle" id="completedToggleBtn" onclick="Home.toggleCompleted()">
            📋 Ver historial de tareas completadas
          </button>
          <div id="completedList" style="display:none;margin-top:10px;"></div>
        </div>
      </div>

      <!-- Actividad reciente -->
      <div class="home-section">
        <div class="home-sec-header">
          <div class="home-sec-title">Actividad reciente</div>
          <button class="btn-add" onclick="Home.openActivityForm()">+ Registrar</button>
        </div>
        <div id="recentActivity">${skeletonList(3)}</div>
      </div>
    `;

    addFAB(() => this.openActivityForm());

    // Cargar todo en paralelo
    this.loadWeather();
    this.loadStats();
    this.loadInfoGrid();
    this.loadMonthlyStats();
    this.loadTasks();
    this.loadRecentActivity();
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎉 BIENVENIDA GUIADA
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async renderWelcome(view) {
    let hasVaccines = false, hasFeedingPlan = false;
    if (PET_ID) {
      try {
        const [vacSnap, feedDoc] = await Promise.all([
          subRef('vaccines').limit(1).get(),
          subRef('feedingPlan').doc('current').get(),
        ]);
        hasVaccines    = !vacSnap.empty;
        hasFeedingPlan = feedDoc.exists;
      } catch(e) {}
    }
    const step1Done = !!PET_ID;
    const step2Done = step1Done && hasVaccines;
    const step3Done = step1Done && hasFeedingPlan;

    view.innerHTML = `
      <div class="welcome-screen">
        <div class="welcome-hero">
          <span class="welcome-logo">🐾</span>
          <h2>¡Bienvenido a PupCare!</h2>
          <p>Tu centro de control para el cuidado de tu mascota.<br>Sigue estos pasos para comenzar:</p>
        </div>
        <p class="welcome-steps-title">Pasos para empezar</p>
        <div class="welcome-step ${step1Done?'done':''}" onclick="navigate('perfil')">
          <div class="step-num">${step1Done?'✓':'1'}</div>
          <div class="step-icon">🐶</div>
          <div class="step-body"><div class="step-title">Crea el perfil de tu mascota</div><div class="step-desc">Nombre, raza, fecha de nacimiento y peso actual</div></div>
          <div class="${step1Done?'step-status done-label':'step-chevron'}">${step1Done?'✅':'›'}</div>
        </div>
        <div class="welcome-step ${step2Done?'done':step1Done?'':'disabled'}" onclick="${step1Done?"navigate('salud')":""}">
          <div class="step-num">${step2Done?'✓':'2'}</div>
          <div class="step-icon">💉</div>
          <div class="step-body"><div class="step-title">Registra las vacunas</div><div class="step-desc">Mantén el historial de salud al día con fechas y próximas dosis</div></div>
          <div class="${step2Done?'step-status done-label':'step-chevron'}">${step2Done?'✅':'›'}</div>
        </div>
        <div class="welcome-step ${step3Done?'done':step1Done?'':'disabled'}" onclick="${step1Done?"navigate('comida')":""}">
          <div class="step-num">${step3Done?'✓':'3'}</div>
          <div class="step-icon">🍽️</div>
          <div class="step-body"><div class="step-title">Configura la alimentación</div><div class="step-desc">Tipo de alimento, cantidad y horarios de comida diarios</div></div>
          <div class="${step3Done?'step-status done-label':'step-chevron'}">${step3Done?'✅':'›'}</div>
        </div>
        ${step1Done&&step2Done&&step3Done?`
          <div style="text-align:center;margin-top:20px;padding:20px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:var(--radius-sm);">
            <div style="font-size:2rem;margin-bottom:8px;">🎉</div>
            <div style="font-weight:700;color:var(--secondary);">¡Todo listo!</div>
            <div style="font-size:0.84rem;color:var(--text2);margin-top:4px;">Tu perfil está completo. Explora todas las secciones.</div>
          </div>`:''}
      </div>`;
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🌤️ #18 WIDGET DE CLIMA
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async loadWeather() {
    const widget = document.getElementById('weatherWidget');
    if (!widget) return;

    if (!navigator.geolocation) {
      widget.style.display = 'none'; return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lon } = pos.coords;
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m&timezone=auto`;
          const res  = await fetch(url);
          const data = await res.json();
          const cw   = data.current_weather;

          const WMO = {
            0:  { icon:'☀️',  desc:'Cielo despejado' },
            1:  { icon:'🌤️', desc:'Mayormente despejado' },
            2:  { icon:'⛅',  desc:'Parcialmente nublado' },
            3:  { icon:'☁️',  desc:'Nublado' },
            45: { icon:'🌫️', desc:'Niebla' },
            48: { icon:'🌫️', desc:'Niebla helada' },
            51: { icon:'🌦️', desc:'Llovizna ligera' },
            53: { icon:'🌦️', desc:'Llovizna moderada' },
            55: { icon:'🌧️', desc:'Llovizna intensa' },
            61: { icon:'🌧️', desc:'Lluvia ligera' },
            63: { icon:'🌧️', desc:'Lluvia moderada' },
            65: { icon:'🌧️', desc:'Lluvia intensa' },
            71: { icon:'❄️',  desc:'Nieve ligera' },
            73: { icon:'❄️',  desc:'Nieve moderada' },
            75: { icon:'❄️',  desc:'Nieve intensa' },
            80: { icon:'🌦️', desc:'Chubascos ligeros' },
            81: { icon:'🌧️', desc:'Chubascos moderados' },
            82: { icon:'⛈️',  desc:'Chubascos intensos' },
            95: { icon:'⛈️',  desc:'Tormenta eléctrica' },
            96: { icon:'⛈️',  desc:'Tormenta con granizo' },
            99: { icon:'⛈️',  desc:'Tormenta con granizo fuerte' },
          };

          const petName = Profile.data?.name || 'tu mascota';
          const wInfo   = WMO[cw.weathercode] || WMO[0];
          const temp    = Math.round(cw.temperature);
          const isNight = cw.is_day === 0;

          // Sugerencia de paseo
          const code = cw.weathercode;
          let tip = '';
          if (code === 0 || code === 1)      tip = `¡Perfecto para un paseo con ${petName}! 🐾`;
          else if (code <= 3)                tip = `Buen día para salir con ${petName} 🌤️`;
          else if (code <= 48)               tip = `Paseo tranquilo, cuida la visibilidad 🌫️`;
          else if (code <= 67)               tip = `Mejor quedarse en casa hoy 🏠`;
          else if (code <= 77)               tip = `¡Mucho frío! Mantén a ${petName} abrigado ❄️`;
          else if (code >= 95)               tip = `No es seguro salir con ${petName} ⛈️`;
          else                               tip = `Revisa el clima antes de salir 🐾`;

          if (isNight && !tip.includes('casa') && !tip.includes('seguro')) {
            tip = `Buenas noches 🌙 Mañana revisa el clima para ${petName}`;
          }

          // Geocoding reverso simple (país por coords)
          widget.innerHTML = `
            <div class="weather-icon">${wInfo.icon}</div>
            <div class="weather-info">
              <div class="weather-temp">${temp}°C</div>
              <div class="weather-desc">${wInfo.desc}</div>
              <div class="weather-tip">${tip}</div>
            </div>`;
        } catch(e) {
          widget.style.display = 'none';
        }
      },
      () => { widget.style.display = 'none'; } // permiso denegado
    );
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📊 BADGES ESTADÍSTICAS
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
        <div class="pet-badge"><div class="pet-badge-num amber">${actSnap.size}</div><div class="pet-badge-label">Paseos</div></div>`;
    } catch(e) {}
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📋 INFO RÁPIDA
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
      vacSnap.docs.forEach(d => { const nd=d.data().nextDate; if(nd&&(!nextVax||nd<nextVax)) nextVax=nd; });
      const grid = document.getElementById('infoGrid');
      if (!grid) return;
      let html = `
        <div class="info-card">
          <div class="info-label">Comida diaria</div>
          <div class="info-value">${feedPlan?(feedPlan.amount*(feedPlan.mealsPerDay||2))+(feedPlan.unit||'g'):'—'}</div>
          <div class="info-sub">${feedPlan?sanitize(feedPlan.foodType):'Sin plan'}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Último paseo</div>
          <div class="info-value">${lastAct?formatDateRelative(lastAct.date):'—'}</div>
          <div class="info-sub">${lastAct?sanitize(lastAct.type||''):'Sin registros'}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Próxima vacuna</div>
          <div class="info-value ${nextVax&&new Date(nextVax)<new Date()?'red':'green'}">${nextVax?formatDate(nextVax):'Sin pendientes'}</div>
          <div class="info-sub">${nextVax&&new Date(nextVax)<new Date()?'⚠️ Vencida':'Al día'}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Último baño</div>
          <div class="info-value amber">${lastCare?formatDateRelative(lastCare.date):'—'}</div>
          <div class="info-sub">${lastCare?formatDate(lastCare.date):'Sin registros'}</div>
        </div>`;
      if (lastDew) {
        const dl = lastDew.nextDate ? Math.max(0,Math.ceil((new Date(lastDew.nextDate)-new Date())/86400000)) : null;
        html += `<div class="info-card full"><div class="info-label">Desparasitación</div><div class="info-value green">Activa</div><div class="info-sub">${dl!==null?'Próxima en '+dl+' días':'Sin próxima fecha'}</div></div>`;
      }
      grid.innerHTML = html;
    } catch(e) {}
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📅 #9 RESUMEN MENSUAL
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async loadMonthlyStats() {
    const container = document.getElementById('monthlyStats');
    if (!container) return;
    try {
      const now        = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const monthEnd   = new Date(now.getFullYear(), now.getMonth()+1, 0).toISOString().split('T')[0];

      const [actSnap, careSnap, feedSnap, notesSnap, medSnap] = await Promise.all([
        subRef('activities').where('date','>=',monthStart).where('date','<=',monthEnd).get(),
        subRef('care').where('date','>=',monthStart).where('date','<=',monthEnd).get(),
        subRef('feedingLog').where('date','>=',monthStart).where('date','<=',monthEnd).get(),
        subRef('behaviorNotes').where('date','>=',monthStart).where('date','<=',monthEnd).get(),
        subRef('medications').where('active','==',true).get(),
      ]);

      container.innerHTML = `
        <div class="monthly-card"><div class="monthly-icon">🏃</div><div class="monthly-info"><div class="monthly-num">${actSnap.size}</div><div class="monthly-label">Actividades</div></div></div>
        <div class="monthly-card"><div class="monthly-icon">🛁</div><div class="monthly-info"><div class="monthly-num">${careSnap.size}</div><div class="monthly-label">Cuidados</div></div></div>
        <div class="monthly-card"><div class="monthly-icon">🍽️</div><div class="monthly-info"><div class="monthly-num">${feedSnap.size}</div><div class="monthly-label">Comidas</div></div></div>
        <div class="monthly-card"><div class="monthly-icon">📝</div><div class="monthly-info"><div class="monthly-num">${notesSnap.size}</div><div class="monthly-label">Notas</div></div></div>
        ${medSnap.size > 0 ? `<div class="monthly-card" style="grid-column:1/-1"><div class="monthly-icon">💊</div><div class="monthly-info"><div class="monthly-num">${medSnap.size}</div><div class="monthly-label">Medicamento${medSnap.size!==1?'s':''} activo${medSnap.size!==1?'s':''}</div></div></div>` : ''}
      `;
    } catch(e) {
      if (container) container.innerHTML = '';
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📊 #19 RESUMEN ANUAL
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async showAnnualStats(year = null) {
    const currentYear = year || new Date().getFullYear();
    openModal(`📊 Resumen ${currentYear}`, '<div style="text-align:center;padding:30px;color:var(--text2);">Analizando el año...</div>');

    try {
      const yearStart = `${currentYear}-01-01`;
      const yearEnd   = `${currentYear}-12-31`;

      const [actSnap, careSnap, feedSnap, notesSnap, vacSnap, vetSnap, weightSnap, photoSnap] = await Promise.all([
        subRef('activities').where('date','>=',yearStart).where('date','<=',yearEnd).get(),
        subRef('care').where('date','>=',yearStart).where('date','<=',yearEnd).get(),
        subRef('feedingLog').where('date','>=',yearStart).where('date','<=',yearEnd).get(),
        subRef('behaviorNotes').where('date','>=',yearStart).where('date','<=',yearEnd).get(),
        subRef('vaccines').where('date','>=',yearStart).where('date','<=',yearEnd).get(),
        subRef('vetVisits').where('date','>=',yearStart).where('date','<=',yearEnd).get(),
        subRef('weightHistory').orderBy('recordedAt','asc').get(),
        subRef('photos').get(),
      ]);

      // Contar actividad por mes (para encontrar el mes más activo)
      const monthCounts = new Array(12).fill(0);
      const addToMonth = (snap) => {
        snap.docs.forEach(d => {
          const date = d.data().date;
          if (date && date.startsWith(String(currentYear))) {
            const mo = parseInt(date.slice(5,7)) - 1;
            if (mo >= 0 && mo < 12) monthCounts[mo]++;
          }
        });
      };
      addToMonth(actSnap); addToMonth(careSnap); addToMonth(notesSnap);

      const maxCount = Math.max(...monthCounts);
      const busiestMonth = maxCount > 0 ? monthCounts.indexOf(maxCount) : -1;
      const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

      // Peso: primer y último registro del año
      const yearWeights = weightSnap.docs
        .map(d => ({ w: parseFloat(d.data().weight), date: d.data().date, unit: d.data().unit||'kg' }))
        .filter(x => x.date && x.date.startsWith(String(currentYear)));
      let weightChange = null, weightUnit = 'kg';
      if (yearWeights.length >= 2) {
        weightChange = (yearWeights[yearWeights.length-1].w - yearWeights[0].w).toFixed(1);
        weightUnit = yearWeights[0].unit;
      }

      // Fotos del año
      const yearPhotos = photoSnap.docs.filter(d => {
        const dt = d.data().date;
        return dt && dt.startsWith(String(currentYear));
      }).length;

      // Total de eventos
      const totalEvents = actSnap.size + careSnap.size + notesSnap.size + vacSnap.size + vetSnap.size;

      // Gráfico de barras por mes
      const chartBars = monthCounts.map((count, i) => {
        const height = maxCount > 0 ? Math.round((count/maxCount)*100) : 0;
        const isMax = i === busiestMonth && maxCount > 0;
        return `
          <div class="annual-bar-col">
            <div class="annual-bar-wrap">
              <div class="annual-bar ${isMax?'max':''}" style="height:${height}%;" title="${count} registros"></div>
            </div>
            <div class="annual-bar-label">${['E','F','M','A','M','J','J','A','S','O','N','D'][i]}</div>
          </div>`;
      }).join('');

      // Comparación de años disponibles
      const birthYear = Profile.data?.birthDate ? parseInt(Profile.data.birthDate.slice(0,4)) : currentYear;
      const yearOptions = [];
      for (let yr = new Date().getFullYear(); yr >= birthYear; yr--) yearOptions.push(yr);

      document.getElementById('modalBody').innerHTML = `
        <div class="annual-stats">
          ${yearOptions.length > 1 ? `
            <div class="annual-year-selector">
              ${yearOptions.map(yr => `
                <button class="annual-year-btn ${yr===currentYear?'active':''}" onclick="Home.showAnnualStats(${yr})">${yr}</button>
              `).join('')}
            </div>` : ''}

          <!-- Total destacado -->
          <div class="annual-hero">
            <div class="annual-hero-num">${totalEvents}</div>
            <div class="annual-hero-label">eventos registrados en ${currentYear}</div>
          </div>

          <!-- Grid de métricas -->
          <div class="annual-grid">
            <div class="annual-card"><div class="annual-icon">🏃</div><div class="annual-num">${actSnap.size}</div><div class="annual-label">Actividades</div></div>
            <div class="annual-card"><div class="annual-icon">🛁</div><div class="annual-num">${careSnap.size}</div><div class="annual-label">Cuidados</div></div>
            <div class="annual-card"><div class="annual-icon">💉</div><div class="annual-num">${vacSnap.size}</div><div class="annual-label">Vacunas</div></div>
            <div class="annual-card"><div class="annual-icon">🏥</div><div class="annual-num">${vetSnap.size}</div><div class="annual-label">Visitas vet</div></div>
            <div class="annual-card"><div class="annual-icon">📝</div><div class="annual-num">${notesSnap.size}</div><div class="annual-label">Notas</div></div>
            <div class="annual-card"><div class="annual-icon">📸</div><div class="annual-num">${yearPhotos}</div><div class="annual-label">Fotos</div></div>
          </div>

          <!-- Gráfico de actividad por mes -->
          <div class="annual-section-title">Actividad por mes</div>
          <div class="annual-chart">${chartBars}</div>

          <!-- Destacados -->
          <div class="annual-section-title">Destacados del año</div>
          <div class="annual-highlights">
            ${busiestMonth >= 0 ? `
              <div class="annual-highlight">
                <span class="annual-highlight-icon">🏆</span>
                <div><div class="annual-highlight-title">Mes más activo</div><div class="annual-highlight-val">${monthNames[busiestMonth]} (${maxCount} registros)</div></div>
              </div>` : ''}
            ${weightChange !== null ? `
              <div class="annual-highlight">
                <span class="annual-highlight-icon">⚖️</span>
                <div><div class="annual-highlight-title">Cambio de peso</div><div class="annual-highlight-val" style="color:${weightChange>=0?'var(--secondary)':'var(--info)'}">${weightChange>=0?'+':''}${weightChange} ${weightUnit} en el año</div></div>
              </div>` : ''}
            <div class="annual-highlight">
              <span class="annual-highlight-icon">📅</span>
              <div><div class="annual-highlight-title">Promedio mensual</div><div class="annual-highlight-val">${(totalEvents/12).toFixed(1)} eventos/mes</div></div>
            </div>
          </div>

          ${totalEvents === 0 ? `<p style="text-align:center;color:var(--text2);font-size:0.85rem;margin-top:16px;">No hay registros para ${currentYear}. ¡Empieza a registrar la vida de ${Profile.data?.name||'tu mascota'}!</p>` : ''}
        </div>
      `;

    } catch(e) {
      console.error('Error en resumen anual:', e);
      document.getElementById('modalBody').innerHTML = '<p style="text-align:center;color:var(--text2);padding:20px;">Error al cargar el resumen anual</p>';
    }
  },
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async loadTasks() {
    const c = document.getElementById('tasksList');
    if (!c) return;
    try {
      let snap;
      try { snap = await subRef('tasks').where('completed','==',false).orderBy('dueDate','asc').limit(10).get(); }
      catch { snap = await subRef('tasks').where('completed','==',false).limit(10).get(); }
      if (snap.empty) { c.innerHTML='<p style="color:var(--text2);font-size:0.85rem;padding:4px 0;">Sin tareas pendientes ✅</p>'; return; }
      const ICONS={'Baño':'🛁','Vacuna':'💉','Desparasitación':'🐛','Veterinario':'🏥','Corte de uñas':'✂️','Cepillado':'🪮','Medicamento':'💊','Otro':'📋'};
      const today_=new Date(); today_.setHours(0,0,0,0);
      c.innerHTML = snap.docs.map(doc=>{
        const d=doc.data(); const due=new Date(d.dueDate+'T00:00:00');
        const diff=Math.ceil((due-today_)/86400000);
        const pct=Math.min(100,Math.max(0,Math.round((1-diff/30)*100)));
        const urg=diff<0?'urgent':diff<=3?'soon':'ok';
        const txt=diff<0?Math.abs(diff)+'d atrás':diff===0?'Hoy':diff+'d';
        const col=urg==='urgent'?'var(--danger)':urg==='soon'?'var(--warning)':'var(--secondary)';
        return `<div class="task-card stagger-item"><div class="task-card-top"><div class="task-icon">${ICONS[d.type]||'📋'}</div><div class="task-info"><div class="task-name">${sanitize(d.type)}</div><div class="task-date">${formatDate(d.dueDate)}</div></div><div class="task-actions"><span class="task-badge ${urg}">${txt}</span><button class="task-btn check" onclick="Home.completeTask('${doc.id}')">✓</button><button class="task-btn del" onclick="Home.deleteTask('${doc.id}')">✕</button></div></div><div class="task-progress"><div class="task-progress-fill" style="width:${pct}%;background:${col};"></div></div></div>`;
      }).join('');
    } catch(e) { if(c) c.innerHTML='<p style="color:var(--text2);font-size:0.85rem;">Sin tareas</p>'; }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🏃 ACTIVIDAD RECIENTE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async loadRecentActivity() {
    const c=document.getElementById('recentActivity'); if(!c) return;
    try {
      const snap=await subRef('activities').orderBy('createdAt','desc').limit(5).get();
      const ICONS={'Paseo':'🚶','Entrenamiento':'🎯','Juego':'🎾','Natación':'🏊','Otro':'⭐'};
      if(snap.empty){c.innerHTML='<p style="color:var(--text2);font-size:0.85rem;padding:4px 0;">Sin actividades registradas</p>';return;}
      c.innerHTML=snap.docs.map(doc=>{const d=doc.data();const det=[d.duration,d.distance].filter(Boolean).join(' · ');return`<div class="activity-card stagger-item"><div class="activity-icon">${ICONS[d.type]||'⭐'}</div><div class="activity-info"><div class="activity-title">${sanitize(d.type)}</div><div class="activity-sub">${formatDateRelative(d.date)}${det?' · '+sanitize(det):''}</div></div><button class="activity-del" onclick="Home.deleteActivity('${doc.id}')">🗑️</button></div>`;}).join('');
    } catch(e){if(c) c.innerHTML='<p style="color:var(--text2);font-size:0.85rem;">Sin actividades</p>';}
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📋 HISTORIAL COMPLETADAS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async toggleCompleted() {
    const list=document.getElementById('completedList'); const btn=document.getElementById('completedToggleBtn');
    if(!list||!btn) return;
    if(list.style.display!=='none'){list.style.display='none';btn.textContent='📋 Ver historial de tareas completadas';btn.classList.remove('active');return;}
    list.style.display='block'; btn.textContent='📋 Ocultar historial'; btn.classList.add('active');
    await this.loadCompletedTasks();
  },

  async loadCompletedTasks() {
    const list=document.getElementById('completedList'); if(!list) return;
    list.innerHTML='<p style="color:var(--text2);font-size:0.85rem;padding:4px 0;">Cargando...</p>';
    const ICONS={'Baño':'🛁','Vacuna':'💉','Desparasitación':'🐛','Veterinario':'🏥','Corte de uñas':'✂️','Cepillado':'🪮','Medicamento':'💊','Otro':'📋'};
    try {
      let snap;
      try{snap=await subRef('tasks').where('completed','==',true).orderBy('completedAt','desc').limit(20).get();}
      catch{snap=await subRef('tasks').where('completed','==',true).limit(20).get();}
      if(snap.empty){list.innerHTML='<p style="color:var(--text2);font-size:0.85rem;padding:4px 0;">Sin tareas completadas todavía</p>';return;}
      list.innerHTML=snap.docs.map(doc=>{
        const d=doc.data();
        let cs='—'; if(d.completedAt&&d.completedAt.toDate) cs=formatDateRelative(d.completedAt.toDate().toISOString().split('T')[0]);
        return`<div class="completed-task-card"><div class="completed-task-icon">${ICONS[d.type]||'📋'}</div><div class="completed-task-info"><div class="completed-task-name">${sanitize(d.type)}</div><div class="completed-task-date">Completada: ${cs}</div>${d.dueDate?`<div class="completed-task-date">Programada: ${formatDate(d.dueDate)}</div>`:''}</div><div style="color:var(--secondary);font-size:1.2rem;">✅</div></div>`;
      }).join('');
    } catch(e){list.innerHTML='<p style="color:var(--text2);font-size:0.85rem;">Error al cargar</p>';}
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📝 FORMULARIOS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  openTaskForm() {
    openModal('Nueva Tarea',`<div class="field"><label>Tipo</label><select id="tType"><option>Baño</option><option>Vacuna</option><option>Desparasitación</option><option>Veterinario</option><option>Corte de uñas</option><option>Cepillado</option><option>Medicamento</option><option>Otro</option></select></div><div class="field"><label>Fecha programada</label><input type="date" id="tDate" value="${today()}"></div><div class="field"><label>Notas (opcional)</label><textarea id="tNotes" placeholder="Observaciones..."></textarea></div><button class="btn-primary btn-full" onclick="Home.saveTask()" style="margin-bottom:16px;">✅ Agregar Tarea</button>`);
  },
  async saveTask(){
    const type=document.getElementById('tType').value; const date=document.getElementById('tDate').value;
    if(!date){showToast('La fecha es requerida','error');return;} showLoading(true);
    try{await subRef('tasks').add({type,dueDate:date,notes:sanitize(document.getElementById('tNotes').value.trim()),completed:false,createdAt:firebase.firestore.FieldValue.serverTimestamp()});closeModal();showToast('✅ Tarea agregada','success');await this.loadTasks();}
    catch(e){showToast('Error al guardar','error');}finally{showLoading(false);}
  },
  async completeTask(id){
    showLoading(true);
    try{await subRef('tasks').doc(id).update({completed:true,completedAt:firebase.firestore.FieldValue.serverTimestamp()});showToast('✅ Tarea completada','success');await this.loadTasks();}
    catch(e){showToast('Error','error');}finally{showLoading(false);}
  },
  async deleteTask(id){
    showConfirm('¿Eliminar tarea?','Esta acción no se puede deshacer.',async()=>{showLoading(true);try{await subRef('tasks').doc(id).delete();showToast('🗑️ Eliminada','info');await this.loadTasks();}catch(e){showToast('Error','error');}finally{showLoading(false);}});
  },

  openActivityForm(){
    openModal('Registrar Actividad',`<div class="field"><label>Tipo</label><select id="aType"><option>🚶 Paseo</option><option>🎯 Entrenamiento</option><option>🎾 Juego</option><option>🏊 Natación</option><option>⭐ Otro</option></select></div><div class="field-row"><div class="field"><label>Fecha</label><input type="date" id="aDate" value="${today()}"></div><div class="field"><label>Duración</label><input type="text" id="aDur" placeholder="30 min"></div></div><div class="field"><label>Distancia (opcional)</label><input type="text" id="aDist" placeholder="2 km"></div><div class="field"><label>Notas</label><textarea id="aNote" placeholder="Observaciones..."></textarea></div><button class="btn-primary btn-full" onclick="Home.saveActivity()" style="margin-bottom:16px;">✅ Registrar</button>`);
  },
  async saveActivity(){
    const typeRaw=document.getElementById('aType').value; const type=typeRaw.replace(/^\S+\s/,'');
    const date=document.getElementById('aDate').value; if(!date){showToast('La fecha es requerida','error');return;} showLoading(true);
    try{await subRef('activities').add({type,date,duration:document.getElementById('aDur').value.trim(),distance:document.getElementById('aDist').value.trim(),note:sanitize(document.getElementById('aNote').value.trim()),createdAt:firebase.firestore.FieldValue.serverTimestamp()});closeModal();showToast('✅ Registrado','success');this.loadStats();this.loadInfoGrid();this.loadRecentActivity();this.loadMonthlyStats();}
    catch(e){showToast('Error al guardar','error');}finally{showLoading(false);}
  },
  async deleteActivity(id){
    showConfirm('¿Eliminar actividad?','Esta acción no se puede deshacer.',async()=>{showLoading(true);try{await subRef('activities').doc(id).delete();showToast('🗑️ Eliminada','info');this.loadStats();this.loadRecentActivity();this.loadMonthlyStats();}catch(e){showToast('Error','error');}finally{showLoading(false);}});
  },
};
