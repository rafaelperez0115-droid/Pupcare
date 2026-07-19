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
      ${(typeof isDemoUser === 'function' && isDemoUser()) ? `
        <div class="demo-notice stagger-item">
          <div class="demo-notice-head">🎮 Estás en el modo de prueba</div>
          <p class="demo-notice-text">
            Los datos que ves son <strong>de ejemplo</strong> y se comparten entre
            todos los visitantes de la demo — no son un error. Explora libremente:
            nada de lo que hagas aquí afecta a nadie.
          </p>
          <button class="btn-primary btn-sm demo-notice-btn" onclick="logout()">
            ✨ Crear mi cuenta y registrar mi mascota
          </button>
        </div>` : ''}
      <!-- #18 Widget de Clima (pintado al instante desde la caché) -->
      ${this.weatherInitialHTML()}

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

      <!-- 🚀 Primeros pasos (usuarios nuevos) -->
      <div id="onboardingChecklist"></div>

      <!-- 💡 Mensajes inteligentes -->
      <div id="smartMessages"></div>

      <!-- 💡 Consejos por edad y raza -->
      <div id="tipsCard"></div>

      <!-- 🩺 Salud general -->
      <div id="healthStatusCard" class="health-status-card">
        <div class="skeleton sk-line" style="width:40%;margin:0 auto;"></div>
      </div>

      <!-- 📅 Próximos eventos -->
      <div class="home-section" id="upcomingSection">
        <div class="home-sec-header">
          <div class="home-sec-title">Próximos eventos</div>
        </div>
        <div id="upcomingList">${skeletonList(2)}</div>
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

    addFABMenu([
      { icon:'🏃', label:'Actividad', onClick:()=>this.openActivityForm() },
      { icon:'📋', label:'Tarea',     onClick:()=>this.openTaskForm() },
    ]);

    // Cargar todo en paralelo
    this.syncWeather();
    this.loadStats();
    this.loadInfoGrid();
    this.loadHealthStatus();
    this.loadSmartMessages();
    if (typeof Tips !== 'undefined') Tips.renderCard();
    if (typeof Onboarding !== 'undefined') Onboarding.render();
    this.loadUpcoming();
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
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🌤️ CLIMA — caché instantánea + sincronización silenciosa
  // El panel se pinta AL INSTANTE con el último clima guardado.
  // Solo se actualiza: (a) una vez al iniciar la app, en silencio,
  // (b) cuando el usuario toca el panel.
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  WEATHER_KEY: 'pupcare_weather',
  WEATHER_OFF: 'pupcare_weather_off',
  WEATHER_TTL: 30 * 60 * 1000,   // no refrescar más de 1 vez cada 30 min
  _weatherSynced: false,          // 1 sincronización automática por sesión

  WMO: {
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
  },

  // Contenido interno de la tarjeta a partir de datos guardados
  weatherCardHTML(temp, code, isNight) {
    const petName = Profile.data?.name || 'tu mascota';
    const wInfo = this.WMO[code] || this.WMO[0];

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

    return `
      <div class="weather-icon">${isNight && (code===0||code===1) ? '🌙' : wInfo.icon}</div>
      <div class="weather-info">
        <div class="weather-temp">${temp}°C</div>
        <div class="weather-desc">${wInfo.desc}</div>
        <div class="weather-tip">${tip}</div>
      </div>`;
  },

  getWeatherCache() {
    try {
      const c = JSON.parse(localStorage.getItem(this.WEATHER_KEY));
      return (c && c.temp != null) ? c : null;
    } catch(e) { return null; }
  },

  // HTML inicial del widget: SIN estados vacíos
  weatherInitialHTML() {
    if (localStorage.getItem(this.WEATHER_OFF) === '1') return '';

    const cached = this.getWeatherCache();
    if (cached) {
      // Pintado inmediato con el último clima conocido
      return `
        <div id="weatherWidget" class="weather-card" role="button" tabindex="0"
          title="Toca para actualizar" onclick="Home.refreshWeather()">
          ${this.weatherCardHTML(cached.temp, cached.code, cached.isNight)}
        </div>`;
    }

    // Primera vez: invitación discreta (el permiso se pide con el toque)
    return `
      <div id="weatherWidget" class="weather-card weather-activate" role="button" tabindex="0"
        onclick="Home.refreshWeather()">
        <div class="weather-icon">📍</div>
        <div class="weather-info">
          <div class="weather-desc">Clima para los paseos</div>
          <div class="weather-tip">Toca para activarlo con tu ubicación</div>
        </div>
      </div>`;
  },

  // Sincronización SILENCIOSA al iniciar: una vez por sesión, solo si la
  // caché tiene más de 30 min, y sin tocar la pantalla hasta tener datos.
  syncWeather() {
    if (localStorage.getItem(this.WEATHER_OFF) === '1') return;
    const cached = this.getWeatherCache();
    if (!cached) return;                 // sin activar aún: esperar al usuario
    if (this._weatherSynced) return;     // ya sincronizado en esta sesión
    if (Date.now() - (cached.ts || 0) < this.WEATHER_TTL) {
      this._weatherSynced = true;        // datos frescos: nada que hacer
      return;
    }
    this._weatherSynced = true;
    this.fetchWeather(false);            // silencioso
  },

  // Actualización manual: al tocar el panel
  async refreshWeather() {
    if (typeof haptic === 'function') haptic(8);
    const w = document.getElementById('weatherWidget');
    if (w) w.classList.add('weather-syncing');
    await this.fetchWeather(true);
    if (w) w.classList.remove('weather-syncing');
  },

  // Obtener ubicación + clima y pintar SOLO cuando hay datos
  fetchWeather(interactive) {
    return new Promise(resolve => {
      if (!navigator.geolocation) { resolve(); return; }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude: lat, longitude: lon } = pos.coords;
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
            const res  = await fetch(url);
            const data = await res.json();
            const cw   = data.current_weather;

            const payload = {
              temp: Math.round(cw.temperature),
              code: cw.weathercode,
              isNight: cw.is_day === 0,
              ts: Date.now(),
            };
            localStorage.setItem(this.WEATHER_KEY, JSON.stringify(payload));
            localStorage.removeItem(this.WEATHER_OFF);

            const w = document.getElementById('weatherWidget');
            if (w) {
              w.classList.remove('weather-activate');
              w.innerHTML = this.weatherCardHTML(payload.temp, payload.code, payload.isNight);
              w.onclick = () => Home.refreshWeather();
              w.title = 'Toca para actualizar';
            }
            if (interactive) showToast('🌤️ Clima actualizado', 'success');
          } catch(e) {
            if (interactive) showToast('No se pudo obtener el clima', 'error');
          }
          resolve();
        },
        (err) => {
          if (err && err.code === 1) {
            // Permiso denegado: ocultar el panel sin insistir
            localStorage.setItem(this.WEATHER_OFF, '1');
            const w = document.getElementById('weatherWidget');
            if (w) w.style.display = 'none';
            if (interactive) showToast('Ubicación denegada. Puedes activarla en los ajustes del sistema.', 'info', 5000);
          } else if (interactive) {
            showToast('No se pudo obtener tu ubicación', 'error');
          }
          resolve();
        },
        { maximumAge: 10 * 60 * 1000, timeout: 10000 }
      );
    });
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📊 BADGES ESTADÍSTICAS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async loadStats() {
    try {
      const [vacSnap, photoSnap, actSnap] = await Promise.all([
        cachedGet('vaccines'),
        cachedGet('photos'),
        cachedGet('activities'),
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
        cachedGet('vaccines'),
        cachedGet('dewormings'),
      ]);
      const lastAct  = actSnap.empty  ? null : actSnap.docs[0].data();
      const lastCare = careSnap.empty ? null : careSnap.docs[0].data();
      const feedPlan = feedDoc.exists  ? feedDoc.data() : null;
      const nowD = new Date(); nowD.setHours(0,0,0,0);

      // Próxima vacuna FUTURA (ignorar vencidas)
      let nextVax = null;
      vacSnap.docs.forEach(d => {
        const nd = d.data().nextDate;
        if (!nd) return;
        const dt = new Date(nd + 'T00:00:00');
        if (dt >= nowD && (!nextVax || dt < new Date(nextVax + 'T00:00:00'))) nextVax = nd;
      });

      // Próxima desparasitación FUTURA
      let nextDew = null;
      dewSnap.docs.forEach(d => {
        const nd = d.data().nextDate;
        if (!nd) return;
        const dt = new Date(nd + 'T00:00:00');
        if (dt >= nowD && (!nextDew || dt < new Date(nextDew + 'T00:00:00'))) nextDew = nd;
      });
      const hasDew = !dewSnap.empty;

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
          <div class="info-value green">${nextVax?formatDate(nextVax):'Sin pendientes'}</div>
          <div class="info-sub">${nextVax?'Programada':'Al día'}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Último baño</div>
          <div class="info-value amber">${lastCare?formatDateRelative(lastCare.date):'—'}</div>
          <div class="info-sub">${lastCare?formatDate(lastCare.date):'Sin registros'}</div>
        </div>`;
      if (hasDew) {
        const dl = nextDew ? Math.ceil((new Date(nextDew+'T00:00:00') - nowD)/86400000) : null;
        const dewValue = nextDew ? 'Activa' : 'Pendiente';
        const dewColor = nextDew ? 'green' : 'amber';
        html += `<div class="info-card full"><div class="info-label">Desparasitación</div><div class="info-value ${dewColor}">${dewValue}</div><div class="info-sub">${dl!==null?'Próxima en '+dl+' días':'Sin próxima fecha programada'}</div></div>`;
      }
      grid.innerHTML = html;
    } catch(e) {}
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📅 #9 RESUMEN MENSUAL
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 💡 MENSAJES INTELIGENTES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async loadSmartMessages() {
    const cont = document.getElementById('smartMessages');
    if (!cont) return;
    try {
      const messages = [];
      const now = new Date(); now.setHours(0,0,0,0);
      const pet = Profile.data || {};

      // 1. Próximo cumpleaños de meses
      if (pet.birthDate) {
        const birth = new Date(pet.birthDate + 'T00:00:00');
        const months = (now.getFullYear()-birth.getFullYear())*12 + (now.getMonth()-birth.getMonth());
        // Fecha del próximo "cumple-mes"
        const nextMonthDay = new Date(birth);
        nextMonthDay.setMonth(birth.getMonth() + months + 1);
        const daysToBday = Math.ceil((nextMonthDay - now)/86400000);
        if (daysToBday >= 0 && daysToBday <= 15) {
          messages.push({
            icon:'🎂',
            text: daysToBday===0 ? `¡Hoy ${pet.name} cumple ${months+1} meses!` : `${pet.name} cumplirá ${months+1} meses en ${daysToBday} día${daysToBday!==1?'s':''}`,
            type:'birthday'
          });
        }
      }

      // 2. Próxima vacuna
      const vacSnap = await cachedGet('vaccines');
      let nextVax = null;
      vacSnap.docs.forEach(d => { const nd=d.data().nextDate; if(nd){ const dd=new Date(nd+'T00:00:00'); if(dd>=now && (!nextVax||dd<nextVax)) nextVax=dd; }});
      if (nextVax) {
        const daysToVax = Math.ceil((nextVax-now)/86400000);
        if (daysToVax <= 30) {
          messages.push({ icon:'💉', text:`La próxima vacuna es en ${daysToVax} día${daysToVax!==1?'s':''}`, type:'vaccine' });
        }
      }

      // 3. Inactividad (días sin registrar actividad)
      const actSnap = await subRef('activities').orderBy('date','desc').limit(1).get();
      if (!actSnap.empty) {
        const lastAct = new Date(actSnap.docs[0].data().date + 'T00:00:00');
        const daysSince = Math.floor((now-lastAct)/86400000);
        if (daysSince >= 3) {
          messages.push({ icon:'🏃', text:`Hace ${daysSince} días que no registras una actividad`, type:'reminder' });
        }
      }

      if (messages.length === 0) { cont.innerHTML=''; return; }

      cont.innerHTML = messages.slice(0,3).map(m => `
        <div class="smart-msg smart-msg-${m.type} stagger-item">
          <span class="smart-msg-icon">${m.icon}</span>
          <span class="smart-msg-text">${sanitize(m.text)}</span>
        </div>`).join('');
    } catch(e) {
      cont.innerHTML = '';
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🩺 SALUD GENERAL (Fase 4)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async loadHealthStatus() {
    const card = document.getElementById('healthStatusCard');
    if (!card) return;
    try {
      const now = new Date();
      const [vacSnap, dewSnap] = await Promise.all([
        cachedGet('vaccines'),
        cachedGet('dewormings'),
      ]);

      // Evaluar estado de vacunas
      // Lógica: si existe alguna próxima fecha FUTURA, está cubierto.
      // Solo hay alerta si todas las fechas programadas ya vencieron.
      let vacStatus = 'ok', vacText = 'Al día';
      let nextVaxFuture = null;   // la próxima futura más cercana
      let anyVaxOverdue = false;  // ¿hay alguna vencida?
      vacSnap.docs.forEach(d => {
        const nd = d.data().nextDate;
        if (!nd) return;
        const dt = new Date(nd + 'T00:00:00');
        if (dt >= now) {
          if (!nextVaxFuture || dt < nextVaxFuture) nextVaxFuture = dt;
        } else {
          anyVaxOverdue = true;
        }
      });
      if (vacSnap.empty) { vacStatus='none'; vacText='Sin registros'; }
      else if (nextVaxFuture) {
        // Hay una futura → está cubierto
        const days = Math.ceil((nextVaxFuture - now)/86400000);
        if (days <= 15) { vacStatus='soon'; vacText=`Vacuna en ${days}d`; }
        else { vacStatus='ok'; vacText='Al día'; }
      }
      else if (anyVaxOverdue) { vacStatus='alert'; vacText='Vacuna vencida'; }

      // Evaluar desparasitación (misma lógica)
      let dewStatus = 'ok', dewText = 'Al día';
      let nextDewFuture = null;
      let anyDewOverdue = false;
      dewSnap.docs.forEach(d => {
        const nd = d.data().nextDate;
        if (!nd) return;
        const dt = new Date(nd + 'T00:00:00');
        if (dt >= now) {
          if (!nextDewFuture || dt < nextDewFuture) nextDewFuture = dt;
        } else {
          anyDewOverdue = true;
        }
      });
      if (dewSnap.empty) { dewStatus='none'; dewText='Sin registros'; }
      else if (nextDewFuture) {
        const days = Math.ceil((nextDewFuture - now)/86400000);
        if (days <= 15) { dewStatus='soon'; dewText=`Próxima en ${days}d`; }
        else { dewStatus='ok'; dewText='Al día'; }
      }
      else if (anyDewOverdue) { dewStatus='alert'; dewText='Desparasitación vencida'; }

      // Determinar estado general
      const statuses = [vacStatus, dewStatus];
      let overall, emoji, color, message;
      if (statuses.includes('alert')) {
        overall='Requiere atención'; emoji='⚠️'; color='var(--danger)';
        message='Hay pendientes de salud importantes';
      } else if (statuses.includes('soon')) {
        overall='Atención pronto'; emoji='🟠'; color='var(--warning)';
        message='Tienes eventos de salud próximos';
      } else if (statuses.every(s => s === 'none')) {
        overall='Sin datos'; emoji='📋'; color='var(--text2)';
        message='Registra vacunas y desparasitación';
      } else {
        overall='Saludable'; emoji='🟢'; color='var(--secondary)';
        message=`${Profile.data?.name || 'Tu mascota'} está al día`;
      }

      // Calcular puntaje de salud (0-100)
      let score = 100;
      if (vacStatus === 'alert') score -= 30;
      else if (vacStatus === 'soon') score -= 10;
      else if (vacStatus === 'none') score -= 20;
      if (dewStatus === 'alert') score -= 25;
      else if (dewStatus === 'none') score -= 15;
      // Bonus/penalización por actividad reciente
      try {
        const actSnap = await subRef('activities').orderBy('date','desc').limit(1).get();
        if (!actSnap.empty) {
          const lastAct = new Date(actSnap.docs[0].data().date+'T00:00:00');
          const daysSince = Math.floor((now - lastAct)/86400000);
          if (daysSince > 7) score -= 10;
          else if (daysSince > 3) score -= 5;
        } else { score -= 5; }
      } catch(e){}
      score = Math.max(0, Math.min(100, score));
      const scoreColor = score >= 85 ? 'var(--secondary)' : score >= 60 ? 'var(--warning)' : 'var(--danger)';

      card.className = 'health-status-card';
      card.innerHTML = `
        <div class="health-status-main">
          <div class="health-score-ring" style="--score:${score};--ring-color:${scoreColor};">
            <div class="health-score-inner">
              <div class="health-score-num" style="color:${scoreColor};">${score}</div>
              <div class="health-score-max">/100</div>
            </div>
          </div>
          <div class="health-status-info">
            <div class="health-status-title" style="color:${color};">${emoji} ${overall}</div>
            <div class="health-status-msg">${message}</div>
          </div>
        </div>
        <div class="health-status-items">
          <div class="health-status-item">
            <span class="hs-dot ${vacStatus}"></span>
            <span class="hs-label">Vacunas</span>
            <span class="hs-value">${vacText}</span>
          </div>
          <div class="health-status-item">
            <span class="hs-dot ${dewStatus}"></span>
            <span class="hs-label">Desparasitación</span>
            <span class="hs-value">${dewText}</span>
          </div>
        </div>`;
    } catch(e) {
      card.style.display = 'none';
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📅 PRÓXIMOS EVENTOS (Fase 4)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async loadUpcoming() {
    const list = document.getElementById('upcomingList');
    const section = document.getElementById('upcomingSection');
    if (!list) return;
    try {
      const now = new Date(); now.setHours(0,0,0,0);
      const events = [];

      const [vacSnap, dewSnap, tasksSnap] = await Promise.all([
        cachedGet('vaccines'),
        cachedGet('dewormings'),
        subRef('tasks').where('completed','==',false).get().catch(()=>({docs:[]})),
      ]);

      // Próximas vacunas
      vacSnap.docs.forEach(d => {
        const v = d.data();
        if (v.nextDate) {
          const days = Math.ceil((new Date(v.nextDate+'T00:00:00')-now)/86400000);
          if (days >= -30) events.push({ icon:'💉', title:`Vacuna: ${v.name}`, date:v.nextDate, days, type:'salud' });
        }
      });

      // Próxima desparasitación
      dewSnap.docs.forEach(d => {
        const w = d.data();
        if (w.nextDate) {
          const days = Math.ceil((new Date(w.nextDate+'T00:00:00')-now)/86400000);
          if (days >= -30) events.push({ icon:'🐛', title:`Desparasitación: ${w.product}`, date:w.nextDate, days, type:'salud' });
        }
      });

      // Tareas pendientes
      (tasksSnap.docs||[]).forEach(d => {
        const t = d.data();
        if (t.dueDate) {
          const days = Math.ceil((new Date(t.dueDate+'T00:00:00')-now)/86400000);
          events.push({ icon:'📋', title:t.type, date:t.dueDate, days, type:'tarea' });
        }
      });

      // Ordenar por fecha y tomar los 5 más próximos
      events.sort((a,b) => a.days - b.days);

      // Si ya existe un evento FUTURO de vacuna o desparasitación,
      // ocultar los vencidos de ese tipo (ya están cubiertos por el nuevo).
      const hasFutureVaccine = events.some(e => e.icon === '💉' && e.days >= 0);
      const hasFutureDeworm  = events.some(e => e.icon === '🐛' && e.days >= 0);
      const filtered = events.filter(e => {
        if (e.days >= 0) return true;              // futuros: siempre mostrar
        if (e.icon === '💉' && hasFutureVaccine) return false;  // vencida pero ya cubierta
        if (e.icon === '🐛' && hasFutureDeworm)  return false;
        return e.days >= -7;                        // otros vencidos recientes
      });

      const upcoming = filtered.slice(0, 5);

      if (upcoming.length === 0) {
        if (section) section.style.display = 'none';
        return;
      }
      if (section) section.style.display = '';

      list.innerHTML = upcoming.map(e => {
        let badge, badgeClass;
        if (e.days < 0)      { badge = `${Math.abs(e.days)}d atrás`; badgeClass = 'urgent'; }
        else if (e.days === 0) { badge = 'Hoy'; badgeClass = 'urgent'; }
        else if (e.days === 1) { badge = 'Mañana'; badgeClass = 'soon'; }
        else if (e.days <= 7)  { badge = `${e.days}d`; badgeClass = 'soon'; }
        else                   { badge = `${e.days}d`; badgeClass = 'ok'; }
        return `
          <div class="upcoming-item stagger-item" onclick="navigate('${e.type==='salud'?'salud':'inicio'}')">
            <div class="upcoming-icon">${e.icon}</div>
            <div class="upcoming-info">
              <div class="upcoming-title">${sanitize(e.title)}</div>
              <div class="upcoming-date">${formatDate(e.date)}</div>
            </div>
            <span class="upcoming-badge ${badgeClass}">${badge}</span>
          </div>`;
      }).join('');
    } catch(e) {
      if (section) section.style.display = 'none';
    }
  },

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

      const [actSnap, careSnap, feedSnap, notesSnap, vacSnap, vetSnap, weightSnap, photoSnap, expSnap] = await Promise.all([
        subRef('activities').where('date','>=',yearStart).where('date','<=',yearEnd).get(),
        subRef('care').where('date','>=',yearStart).where('date','<=',yearEnd).get(),
        subRef('feedingLog').where('date','>=',yearStart).where('date','<=',yearEnd).get(),
        subRef('behaviorNotes').where('date','>=',yearStart).where('date','<=',yearEnd).get(),
        subRef('vaccines').where('date','>=',yearStart).where('date','<=',yearEnd).get(),
        subRef('vetVisits').where('date','>=',yearStart).where('date','<=',yearEnd).get(),
        subRef('weightHistory').orderBy('recordedAt','asc').get(),
        subRef('photos').get(),
        subRef('expenses').where('date','>=',yearStart).where('date','<=',yearEnd).get(),
      ]);

      // Gasto total del año
      const totalSpent = expSnap.docs.reduce((t,d) => t + (parseFloat(d.data().amount)||0), 0);

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

          ${totalSpent > 0 ? `
            <div class="annual-spent" onclick="closeModal();setTimeout(()=>Expenses.open(),300);" role="button" tabindex="0">
              <span class="annual-spent-icon">💰</span>
              <div class="annual-spent-info">
                <div class="annual-spent-label">Invertido en ${currentYear}</div>
                <div class="annual-spent-num">${typeof Expenses!=='undefined'?Expenses.fmt(totalSpent):totalSpent}</div>
              </div>
              <span class="setting-arrow">›</span>
            </div>` : ''}

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
        const prio=d.priority||'media';
        const prioLabel={baja:'🟢 Baja',media:'🟠 Media',alta:'🔴 Alta'}[prio];
        return `<div class="task-card stagger-item"><div class="task-card-top"><div class="task-icon">${ICONS[d.type]||'📋'}</div><div class="task-info"><div class="task-name">${sanitize(d.type)} <span class="task-priority ${prio}">${prioLabel}</span></div><div class="task-date">${formatDate(d.dueDate)}</div></div><div class="task-actions"><span class="task-badge ${urg}">${txt}</span><button class="task-btn check" onclick="Home.completeTask('${doc.id}')" aria-label="Completar tarea" title="Completar">✓</button><button class="task-btn del" onclick="Home.deleteTask('${doc.id}')" aria-label="Eliminar tarea" title="Eliminar">🗑️</button></div></div><div class="task-progress"><div class="task-progress-fill" style="width:${pct}%;background:${col};"></div></div></div>`;
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
      c.innerHTML=snap.docs.map(doc=>{const d=doc.data();const det=[d.duration,d.distance].filter(Boolean).join(' · ');return`<div class="swipe-card stagger-item" data-swipe-delete><div class="swipe-bg"><button onclick="Home.deleteActivity('${doc.id}')" aria-label="Eliminar actividad">🗑️</button></div><div class="activity-card swipe-inner"><div class="activity-icon">${ICONS[d.type]||'⭐'}</div><div class="activity-info"><div class="activity-title">${sanitize(d.type)}</div><div class="activity-sub">${formatDateRelative(d.date)}${det?' · '+sanitize(det):''}</div></div><button class="btn-edit" onclick="Home.editActivity('${doc.id}')" aria-label="Editar actividad" title="Editar">✏️</button><button class="activity-del" onclick="Home.deleteActivity('${doc.id}')" aria-label="Eliminar actividad" title="Eliminar">🗑️</button></div></div>`;}).join('');
      if (typeof setupSwipeToDelete === 'function') setupSwipeToDelete(c);
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
    openModal('Nueva Tarea',`<div class="field"><label>Tipo</label><select id="tType"><option>Baño</option><option>Vacuna</option><option>Desparasitación</option><option>Veterinario</option><option>Corte de uñas</option><option>Cepillado</option><option>Medicamento</option><option>Otro</option></select></div><div class="field"><label>Prioridad</label><div class="priority-picker" id="tPriorityPicker"><button type="button" class="priority-opt low" data-priority="baja" onclick="Home.pickPriority(this)">🟢 Baja</button><button type="button" class="priority-opt med selected" data-priority="media" onclick="Home.pickPriority(this)">🟠 Media</button><button type="button" class="priority-opt high" data-priority="alta" onclick="Home.pickPriority(this)">🔴 Alta</button></div><input type="hidden" id="tPriority" value="media"></div><div class="field"><label>Fecha programada</label><input type="date" id="tDate" value="${today()}"></div><div class="field"><label>Notas (opcional)</label><textarea id="tNotes" placeholder="Observaciones..."></textarea></div><button class="btn-primary btn-full" onclick="Home.saveTask()" style="margin-bottom:16px;">✅ Agregar Tarea</button>`);
  },
  pickPriority(el){
    document.querySelectorAll('#tPriorityPicker .priority-opt').forEach(b=>b.classList.remove('selected'));
    el.classList.add('selected');
    document.getElementById('tPriority').value = el.dataset.priority;
  },
  async saveTask(){
    const type=document.getElementById('tType').value; const date=document.getElementById('tDate').value;
    const priority=document.getElementById('tPriority')?.value||'media';
    if(!date){showToast('La fecha es requerida','error');return;} showLoading(true);
    try{await subRef('tasks').add({type,dueDate:date,priority,notes:sanitize(document.getElementById('tNotes').value.trim()),completed:false,createdAt:firebase.firestore.FieldValue.serverTimestamp()});closeModal();showToast('✅ Tarea agregada','success');await this.loadTasks();}
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

  openActivityForm(editId=null, editData=null){
    this._editActId = editId;
    const d = editData || {};
    const vv = (x) => x != null ? String(x).replace(/"/g,'&quot;') : '';
    const types = ['🚶 Paseo','🎯 Entrenamiento','🎾 Juego','🏊 Natación','⭐ Otro'];
    openModal(editId?'Editar Actividad':'Registrar Actividad',`<div class="field"><label>Tipo</label><select id="aType">${types.map(t=>`<option ${d.type&&t.includes(d.type)?'selected':''}>${t}</option>`).join('')}</select></div><div class="field-row"><div class="field"><label>Fecha</label><input type="date" id="aDate" value="${d.date||today()}"></div><div class="field"><label>Duración</label><input type="text" id="aDur" placeholder="30 min" value="${vv(d.duration)}"></div></div><div class="field"><label>Distancia (opcional)</label><input type="text" id="aDist" placeholder="2 km" value="${vv(d.distance)}"></div><div class="field"><label>Notas</label><textarea id="aNote" placeholder="Observaciones...">${vv(d.note)}</textarea></div><button class="btn-primary btn-full" onclick="Home.saveActivity()" style="margin-bottom:16px;">✅ ${editId?'Actualizar':'Registrar'}</button>`);
  },
  async editActivity(id){
    showLoading(true);
    try{const doc=await subRef('activities').doc(id).get();if(doc.exists)this.openActivityForm(id,doc.data());}
    catch(e){showToast('Error','error');}finally{showLoading(false);}
  },
  async saveActivity(){
    const typeRaw=document.getElementById('aType').value; const type=typeRaw.replace(/^\S+\s/,'');
    const date=document.getElementById('aDate').value; if(!date){showToast('La fecha es requerida','error');return;} showLoading(true);
    const data={type,date,duration:document.getElementById('aDur').value.trim(),distance:document.getElementById('aDist').value.trim(),note:sanitize(document.getElementById('aNote').value.trim())};
    try{
      if(this._editActId){await subRef('activities').doc(this._editActId).update(data);this._editActId=null;}
      else{data.createdAt=firebase.firestore.FieldValue.serverTimestamp();await subRef('activities').add(data);}
      invalidateCache('activities');closeModal();showToast('✅ Guardado','success');this.loadStats();this.loadInfoGrid();this.loadRecentActivity();this.loadMonthlyStats();}
    catch(e){showToast('Error al guardar','error');}finally{showLoading(false);}
  },
  async deleteActivity(id){
    showConfirm('¿Eliminar actividad?','Esta acción no se puede deshacer.',async()=>{showLoading(true);try{await subRef('activities').doc(id).delete();invalidateCache('activities');showToast('🗑️ Eliminada','info');this.loadStats();this.loadRecentActivity();this.loadMonthlyStats();}catch(e){showToast('Error','error');}finally{showLoading(false);}});
  },
};
