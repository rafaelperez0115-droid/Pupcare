
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🏠 home.js v4 — Dashboard + Clima + Resumen Mensual
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const Home = {

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🏠 DASHBOARD PREMIUM
  // Jerarquía: hero → bienestar → acciones rápidas → eventos →
  // evolución → resto. No todas las tarjetas pesan lo mismo.
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async render() {
    const view = document.getElementById('view-inicio');
    if (!view) return;

    if (!PET_ID || !Profile.data) {
      await this.renderWelcome(view);
      return;
    }

    const pet = Profile.data;
    const monthName = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
    const esDemo = (typeof isDemoUser === 'function' && isDemoUser());

    view.innerHTML = `
      ${esDemo ? `
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

      <!-- A. Hero de la mascota -->
      ${this.heroHTML(pet)}

      <!-- 🚀 Primeros pasos (usuarios nuevos) -->
      <div id="onboardingChecklist"></div>

      <!-- B. Resumen de bienestar (datos reales) -->
      <div class="well-grid" id="infoGrid">${this.wellSkeleton()}</div>
      <div id="todayRow"></div>

      <!-- 💡 Mensajes inteligentes -->
      <div id="smartMessages"></div>

      <!-- C. Acciones rápidas -->
      ${this.quickActionsHTML()}

      <!-- Clima (pintado al instante desde la caché) -->
      ${this.weatherInitialHTML()}

      <!-- D. Próximos eventos -->
      <div class="home-section" id="upcomingSection">
        <div class="home-sec-header">
          <div class="home-sec-title">Próximos eventos</div>
        </div>
        <div id="upcomingList">${skeletonList(2)}</div>
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

      <!-- E. Evolución -->
      <div class="ui-card ui-card--elev evo-card" id="evolutionCard">
        <div class="evo-head">
          <span class="ui-section-title">Evolución de peso</span>
          <span id="evoDelta"></span>
        </div>
        <div id="evolutionBody"><div class="skeleton sk-line" style="height:110px;border-radius:12px;"></div></div>
        <div class="evo-links">
          <button class="evo-link" onclick="Profile.showWeightChart()">${Icon.get('chart',15)} Ver historial</button>
          <button class="evo-link" onclick="navigate('album')">${Icon.get('sparkles',15)} Análisis de crecimiento</button>
        </div>
      </div>

      <!-- 🩺 Salud general -->
      <div id="healthStatusCard" class="health-status-card">
        <div class="skeleton sk-line" style="width:40%;margin:0 auto;"></div>
      </div>

      <!-- F. Actividad reciente -->
      <div class="home-section">
        <div class="home-sec-header">
          <div class="home-sec-title">Actividad reciente</div>
          <button class="btn-add" onclick="Home.openActivityForm()">+ Registrar</button>
        </div>
        <div id="recentActivity">${skeletonList(3)}</div>
      </div>

      <!-- G. Consejos por edad y raza -->
      <div id="tipsCard"></div>

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

      <!-- Entrada de foto para la acción rápida -->
      <input type="file" id="quickPhotoInput" accept="image/*" style="display:none" onchange="Album.handleUpload(event)">
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
    this.loadEvolution();
    this.loadMonthlyStats();
    this.loadTasks();
    this.loadRecentActivity();
  },

  // ── A. Hero: foto integrada al fondo con degradado ──
  heroHTML(pet) {
    const tienFoto = !!pet.photoUrl;
    const edad  = pet.birthDate ? calcAge(pet.birthDate) : '';
    const raza  = pet.breed ? sanitize(pet.breed) : '';
    const nace  = pet.birthDate ? formatDate(pet.birthDate) : '';
    const peso  = pet.currentWeight ? `${pet.currentWeight} ${pet.weightUnit || 'kg'}` : '';
    return `
      <div class="dash-hero ui-card ui-card--hero stagger-item" id="dashHero">
        <div class="dash-hero-photo${tienFoto ? '' : ' is-empty'}" ${tienFoto ? 'onclick="Profile.viewPhoto()" role="button" aria-label="Ver foto"' : ''}>
          ${tienFoto
            ? `<img src="${pet.photoUrl}" alt="${sanitize(pet.name)}">`
            : `<div class="dash-hero-paw">${Icon.get('paw', 72)}</div>`}
        </div>
        <div class="dash-hero-body">
          <span class="ui-chip" id="heroStatus">${Icon.get('activity', 13)} Revisando…</span>
          <h2 class="dash-hero-name">${sanitize(pet.name)}</h2>
          <div class="dash-hero-meta">${[raza, edad].filter(Boolean).join(' · ')}</div>
          <div class="dash-hero-facts">
            ${nace ? `<span class="ui-chip">${Icon.get('cake', 13)} ${nace}</span>` : ''}
            ${peso ? `<span class="ui-chip ui-chip--primary">${Icon.get('scale', 13)} ${peso}</span>` : ''}
          </div>
          <button class="dash-hero-link" onclick="navigate('perfil')">Ver perfil completo ${Icon.get('chevronRight', 14)}</button>
        </div>
        <div class="dash-hero-stats" id="petBadges">
          <div class="dash-hero-stat"><b>—</b><span>Vacunas</span></div>
          <div class="dash-hero-stat"><b>—</b><span>Fotos</span></div>
          <div class="dash-hero-stat"><b>—</b><span>Actividades</span></div>
        </div>
      </div>`;
  },

  updateHero() {
    const el = document.getElementById('dashHero');
    if (!el || !Profile.data) return;
    const tmp = document.createElement('div');
    tmp.innerHTML = this.heroHTML(Profile.data).trim();
    const nuevo = tmp.firstElementChild;
    nuevo.classList.remove('stagger-item');   // sin re-animar al refrescar
    el.replaceWith(nuevo);
  },

  wellSkeleton() {
    return Array.from({ length: 4 }, () =>
      `<div class="ui-stat"><div class="skeleton sk-line" style="width:55%"></div><div class="skeleton sk-line" style="width:80%;height:18px"></div><div class="skeleton sk-line" style="width:65%"></div></div>`
    ).join('');
  },

  // ── C. Acciones rápidas ──
  quickActionsHTML() {
    const acciones = [
      ['weight',   'scale',    'Peso'],
      ['height',   'ruler',    'Altura'],
      ['meal',     'bowl',     'Comida'],
      ['walk',     'route',    'Paseo'],
      ['activity', 'activity', 'Actividad'],
      ['vet',      'hospital', 'Veterinario'],
      ['med',      'pill',     'Medicina'],
      ['photo',    'camera',   'Foto'],
    ];
    return `
      <div class="ui-section-head quick-head"><span class="ui-section-title">Registro rápido</span></div>
      <div class="quick-grid">
        ${acciones.map(([k, ic, label]) => `
          <button class="ui-action" onclick="Home.quick('${k}')" aria-label="${label}">
            ${Icon.badge(ic, 'primary', 20)}
            <span>${label}</span>
          </button>`).join('')}
      </div>`;
  },

  quick(kind) {
    this._quickOrigin = true;   // al cerrar el formulario, el dashboard se refresca solo
    const acciones = {
      weight:   () => Profile.openWeight(),
      height:   () => Profile.openHeight(),
      meal:     () => Feeding.openLog(),
      walk:     () => this.openActivityForm(null, null, 'Paseo'),
      activity: () => this.openActivityForm(null, null, 'Juego'),
      vet:      () => Health.openForm('vetVisits'),
      med:      () => Health.openForm('medications'),
      photo:    () => document.getElementById('quickPhotoInput')?.click(),
    };
    try {
      if (typeof haptic === 'function') haptic(6);
      (acciones[kind] || (() => {}))();
    } catch (e) {
      console.error('Acción rápida:', e);
      showToast('No se pudo abrir el formulario', 'error');
    }
  },

  // Se llama desde closeModal(): vuelve a leer lo que pudo cambiar
  refreshData() {
    if (typeof currentView === 'undefined' || currentView !== 'inicio') return;
    if (!PET_ID || !Profile.data) return;
    ['vetVisits', 'medications', 'photos', 'activities'].forEach(c => invalidateCache(c));
    this.updateHero();
    this.loadStats();
    this.loadInfoGrid();
    this.loadUpcoming();
    this.loadRecentActivity();
    this.loadEvolution();
    this.loadMonthlyStats();
    this.loadHealthStatus();
  },

  // Saltar a una pestaña concreta de Salud desde un indicador
  goHealth(tab) {
    if (typeof Health !== 'undefined') Health.tab = tab;
    navigate('salud');
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
            if (interactive) showToast('🌤️ Clima actualizado', 's