// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💡 CONSEJOS DE CUIDADO
// Sugerencias automáticas según la ETAPA DE VIDA y la RAZA de la
// mascota, pensadas para dueños primerizos. Incluye consejos
// personalizados opcionales con IA (Gemini vía Worker).
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const Tips = {
  WORKER_URL: 'https://pupcare-ai.rafaelperez0115.workers.dev',

  // ── Base de conocimiento: por etapa de vida ──
  STAGES: {
    cachorro: {
      label: 'Cachorro (0–6 meses)', icon: '🍼',
      tips: [
        { icon:'💉', t:'Completa sus vacunas antes de la calle', x:'Hasta terminar el esquema de vacunación, evita parques y zonas donde pasean otros perros: parvovirus y moquillo son muy peligrosos a esta edad.' },
        { icon:'🐛', t:'Desparasitación frecuente', x:'Los cachorros se desparasitan cada 2–4 semanas según indique el veterinario. Es tan importante como las vacunas.' },
        { icon:'🐕', t:'Socialización: la ventana de oro', x:'Entre las 3 y 14 semanas es cuando mejor acepta personas, sonidos y experiencias nuevas. Preséntaselas con calma y premios — marcará su carácter de por vida.' },
        { icon:'🦴', t:'Protege sus articulaciones en formación', x:'Nada de ejercicio forzado, carreras largas ni subir/bajar escaleras constantemente. Sus huesos y cartílagos aún se están formando.' },
        { icon:'🍖', t:'Alimento de cachorro, varias tomas', x:'Dale alimento formulado para cachorros, repartido en 3–4 comidas al día. Su estómago es pequeño y su energía enorme.' },
        { icon:'🧸', t:'Mordidas: redirige, no castigues', x:'Morder es normal a esta edad (cambio de dientes). Ten juguetes mordedores a mano y cámbiaselos cuando muerda lo que no debe.' },
      ],
    },
    adolescente: {
      label: 'Joven (6–24 meses)', icon: '⚡',
      tips: [
        { icon:'🏃', t:'Ejercicio sí, impacto no', x:'Tiene energía de sobra, pero sus placas de crecimiento cierran entre los 12 y 18 meses (más tarde en razas grandes). Evita saltos desde altura y frisbee intenso hasta entonces.' },
        { icon:'🎓', t:'Refuerza el entrenamiento', x:'La adolescencia canina existe: puede "olvidar" lo aprendido y probar límites. Constancia y premios — no desesperes, es una fase.' },
        { icon:'⚖️', t:'Vigila la transición de alimento', x:'El cambio a alimento de adulto depende de la raza: razas pequeñas ~10-12 meses, grandes hasta los 18-24. Consulta a tu veterinario.' },
        { icon:'🩺', t:'Habla de esterilización con tu vet', x:'Si no planeas criar, es el momento de conversar el cuándo y los beneficios con un profesional.' },
        { icon:'💉', t:'No olvides los refuerzos anuales', x:'Las vacunas del primer año necesitan refuerzo. PupCare te avisará, pero agenda con tiempo.' },
      ],
    },
    adulto: {
      label: 'Adulto (2–7 años)', icon: '🐕',
      tips: [
        { icon:'🩺', t:'Chequeo veterinario anual', x:'Aunque se vea perfecto, una revisión al año detecta a tiempo lo que no se ve. La prevención siempre es más barata que el tratamiento.' },
        { icon:'⚖️', t:'El sobrepeso es el enemigo #1', x:'Debes poder sentir sus costillas sin presionar fuerte. El exceso de peso acorta la vida y castiga articulaciones y corazón. Registra su peso cada mes en PupCare.' },
        { icon:'🦷', t:'Los dientes también se cuidan', x:'El sarro causa dolor e infecciones silenciosas. Cepillado con pasta canina, snacks dentales, y limpieza profesional cuando el vet lo indique.' },
        { icon:'🧠', t:'Ejercita también su mente', x:'Juegos de olfato, juguetes interactivos y trucos nuevos cansan tanto como un paseo — y previenen ansiedad y destrozos.' },
        { icon:'🚶', t:'Rutina de ejercicio diaria', x:'Paseos y juego todos los días, adaptados a su raza y energía. Un perro ejercitado es un perro tranquilo en casa.' },
      ],
    },
    senior: {
      label: 'Senior (7+ años)', icon: '👴',
      tips: [
        { icon:'🩺', t:'Chequeos cada 6 meses', x:'En la tercera edad los cambios llegan rápido. Dos revisiones al año (con analítica) detectan a tiempo problemas de riñón, corazón o tiroides.' },
        { icon:'🦴', t:'Articulaciones: su punto débil', x:'Evita pisos resbalosos (usa alfombras), cambia saltos por rampas, y considera una cama ortopédica. Pregunta al vet por condroprotectores.' },
        { icon:'🍖', t:'Dieta senior', x:'Necesita menos calorías pero nutrientes de calidad. Los alimentos "senior" cuidan articulaciones y riñones. El sobrepeso a esta edad pesa el doble.' },
        { icon:'👀', t:'Señales que no debes ignorar', x:'Beber mucha más agua, rigidez al levantarse, bultos nuevos, o cambios de apetito y ánimo: cualquiera merece visita al veterinario.' },
        { icon:'🚶', t:'Paseos: más cortos, más frecuentes', x:'Mejor tres paseos suaves que uno agotador. El movimiento diario mantiene sus articulaciones lubricadas y su mente activa.' },
        { icon:'💜', t:'Comodidad y compañía', x:'Cama calientita lejos de corrientes, agua siempre cerca, y paciencia con sus nuevos ritmos. Se lo ha ganado.' },
      ],
    },
  },

  // ── Base de conocimiento: por grupo de raza ──
  BREED_GROUPS: [
    {
      id: 'molosos', label: 'Razas tipo bull y molosos', icon: '💪',
      match: ['bull', 'bully', 'pit', 'stafford', 'presa', 'dogo', 'mastin', 'mastín', 'molos', 'cane corso', 'rottweiler', 'boxer'],
      tips: [
        { icon:'🦴', t:'Cuidado con pisos resbalosos', x:'Su masa muscular y peso castigan caderas y codos: en cerámica o porcelanato usa alfombras en sus zonas de paso y juego. Los resbalones repetidos dañan sus articulaciones.' },
        { icon:'⛔', t:'Evita los saltos desde altura', x:'Bajar del sofá, la cama o el carro de un salto impacta sus articulaciones. Enséñale a bajar con calma o usa rampas — su cuerpo pesado lo agradecerá de adulto.' },
        { icon:'⚖️', t:'Peso bajo control estricto', x:'En razas musculosas, cada kilo de más multiplica el riesgo de displasia y artrosis. Mantenlo atlético, no "relleno".' },
        { icon:'🌡️', t:'Ojo con el calor y el sobreesfuerzo', x:'Se entregan al juego sin medirse. En días calurosos, ejercicio temprano o al atardecer, con agua siempre a mano.' },
      ],
    },
    {
      id: 'braqui', label: 'Razas de cara chata (braquicéfalos)', icon: '😤',
      match: ['bulldog', 'pug', 'carlino', 'boston', 'pekines', 'pekinés', 'shih tzu', 'boxer', 'frances', 'francés'],
      tips: [
        { icon:'🥵', t:'El calor es su mayor riesgo', x:'Su hocico corto dificulta regular la temperatura: nunca pasees en horas de calor fuerte y jamás lo dejes en un carro. Un golpe de calor es una emergencia.' },
        { icon:'🦺', t:'Arnés en vez de collar', x:'El collar presiona una vía respiratoria ya estrecha. El arnés reparte la fuerza y respira mejor.' },
        { icon:'👂', t:'Ronquidos sí, ahogos no', x:'Que ronque es normal en su anatomía; que se fatigue rápido, jadee en exceso o se desmaye no lo es — consúltalo con el vet.' },
        { icon:'⚖️', t:'El sobrepeso agrava todo', x:'Cada gramo extra le dificulta más respirar. En estas razas, la báscula es cuidado respiratorio.' },
      ],
    },
    {
      id: 'pequenos', label: 'Razas pequeñas', icon: '🐾',
      match: ['chihuahua', 'yorkshire', 'yorki', 'poodle', 'caniche', 'maltes', 'maltés', 'pomerania', 'schnauzer', 'dachshund', 'salchicha', 'papillon', 'pinscher'],
      tips: [
        { icon:'🛋️', t:'Los saltos del sofá son su enemigo', x:'La luxación de rótula es común en razas pequeñas: escalones o rampas para subir a sofás y camas evitan lesiones frecuentes.' },
        { icon:'🦷', t:'Dientes: su punto débil', x:'Las bocas pequeñas acumulan sarro rapidísimo. Cepillado frecuente y revisiones dentales — pierden dientes jóvenes si se descuida.' },
        { icon:'🧥', t:'Abrígalo cuando refresque', x:'Pierden calor rápido. Si tiembla, no es drama: es frío de verdad.' },
        { icon:'👀', t:'Cuidado bajo tus pies', x:'Su tamaño los pone en riesgo de pisotones y puertas. Enséñale a no dormir en zonas de paso.' },
      ],
    },
    {
      id: 'grandes', label: 'Razas grandes y gigantes', icon: '🐕‍🦺',
      match: ['pastor', 'labrador', 'golden', 'gran danes', 'gran danés', 'san bernardo', 'terranova', 'akita', 'doberman', 'weimaraner', 'husky', 'malamute', 'bernes', 'bernés'],
      tips: [
        { icon:'🦴', t:'Displasia: prevenir desde cachorro', x:'No lo sobre-ejercites de joven ni permitas saltos de impacto: sus articulaciones grandes tardan más en madurar y pagan los excesos de por vida.' },
        { icon:'🍽️', t:'Torsión gástrica: reglas de oro', x:'Divide su comida en 2+ tomas y evita ejercicio intenso justo antes o después de comer. La torsión de estómago es una emergencia mortal en razas grandes.' },
        { icon:'🏠', t:'Superficies con agarre', x:'Su peso hace que los resbalones en piso liso lastimen de verdad. Alfombras en sus zonas = articulaciones protegidas.' },
        { icon:'⚖️', t:'El peso importa el doble', x:'En un perro grande, el sobrepeso acelera la artrosis años enteros. Mantén su silueta atlética.' },
      ],
    },
  ],

  // ── Detección ──
  stageOf(pet) {
    if (!pet?.birthDate) return 'adulto';
    const b = new Date(pet.birthDate + 'T00:00:00');
    const now = new Date();
    const months = (now.getFullYear()-b.getFullYear())*12 + (now.getMonth()-b.getMonth());
    if (months < 6)  return 'cachorro';
    if (months < 24) return 'adolescente';
    if (months < 84) return 'adulto';
    return 'senior';
  },

  groupsOf(pet) {
    const breed = (pet?.breed || '').toLowerCase();
    if (!breed) return [];
    return this.BREED_GROUPS.filter(g => g.match.some(m => breed.includes(m)));
  },

  // ── Tarjeta del dashboard ──
  renderCard() {
    const cont = document.getElementById('tipsCard');
    if (!cont || !Profile.data) return;

    const pet = Profile.data;
    const stage = this.STAGES[this.stageOf(pet)];
    const groups = this.groupsOf(pet);
    const total = stage.tips.length + groups.reduce((n,g) => n + g.tips.length, 0);

    // Vista previa: 1 consejo de etapa + 1 de raza (si hay)
    const preview = [stage.tips[0], groups[0]?.tips[0]].filter(Boolean);

    cont.innerHTML = `
      <div class="tips-card stagger-item" onclick="Tips.openAll()" role="button" tabindex="0">
        <div class="tips-card-head">
          <span class="tips-card-title">💡 Consejos para ${sanitize(pet.name || 'tu mascota')}</span>
          <span class="tips-card-stage">${stage.icon} ${stage.label.split(' (')[0]}</span>
        </div>
        ${preview.map(t => `
          <div class="tips-preview">
            <span class="tips-preview-icon">${t.icon}</span>
            <span class="tips-preview-text"><strong>${t.t}.</strong> ${t.x}</span>
          </div>`).join('')}
        <div class="tips-card-more">Ver los ${total} consejos ›</div>
      </div>`;
  },

  // ── Panel completo ──
  openAll() {
    const pet = Profile.data;
    if (!pet) return;
    const stageKey = this.stageOf(pet);
    const stage = this.STAGES[stageKey];
    const groups = this.groupsOf(pet);

    const seccion = (titulo, icon, tips) => `
      <div class="tips-section-title">${icon} ${titulo}</div>
      ${tips.map(t => `
        <div class="tips-item">
          <span class="tips-item-icon">${t.icon}</span>
          <div class="tips-item-body">
            <div class="tips-item-title">${t.t}</div>
            <div class="tips-item-text">${t.x}</div>
          </div>
        </div>`).join('')}`;

    const aiCache = this._aiCache(pet, stageKey);

    openModal('💡 Consejos de cuidado', `
      ${seccion('Por su edad — ' + stage.label, stage.icon, stage.tips)}
      ${groups.map(g => seccion('Por su raza — ' + g.label, g.icon, g.tips)).join('')}

      <div class="tips-ai-block" id="tipsAiBlock">
        ${aiCache
          ? this._renderAiTips(aiCache)
          : `<button class="btn-primary btn-full" onclick="Tips.generateAI()">
               🧠 Generar consejos personalizados con IA
             </button>
             <p class="tips-ai-hint">La IA analizará la edad, raza y peso de ${sanitize(pet.name)} para darle consejos a su medida.</p>`}
      </div>

      <div class="growth-disclaimer" style="margin-top:16px;">
        <div class="disclaimer-title">⚠️ Consejos generales</div>
        <ul class="disclaimer-list">
          <li>Estas sugerencias son <strong>orientativas</strong> y no sustituyen la evaluación de un <strong>veterinario profesional</strong>.</li>
          <li>Cada perro es único: ante cualquier duda o síntoma, consulta a tu veterinario.</li>
        </ul>
      </div>
      <div style="height:16px;"></div>
    `);
  },

  // ── Consejos con IA (con caché por mascota y etapa) ──
  _aiKey(pet, stage) { return `pupcare_aitips_${PET_ID}_${stage}`; },
  _aiCache(pet, stage) {
    try { return JSON.parse(localStorage.getItem(this._aiKey(pet, stage))); }
    catch(e) { return null; }
  },

  _renderAiTips(tips) {
    return `
      <div class="tips-section-title">🧠 Personalizados con IA</div>
      ${tips.map(t => `
        <div class="tips-item tips-item-ai">
          <span class="tips-item-icon">${t.icon || '💡'}</span>
          <div class="tips-item-body">
            <div class="tips-item-title">${sanitize(t.titulo || '')}</div>
            <div class="tips-item-text">${sanitize(t.texto || '')}</div>
          </div>
        </div>`).join('')}`;
  },

  async generateAI() {
    const pet = Profile.data;
    if (!pet) return;
    const stageKey = this.stageOf(pet);

    const block = document.getElementById('tipsAiBlock');
    if (block) block.innerHTML = `
      <div class="growth-loading" style="padding:18px 0;">
        <div class="growth-loading-icon">🧠</div>
        <div class="growth-loading-title">Pensando en ${sanitize(pet.name)}...</div>
      </div>`;

    try {
      const edad = pet.birthDate ? calcAge(pet.birthDate) : 'desconocida';
      const prompt = `Eres un educador canino y asistente veterinario. Genera 5 consejos de cuidado MUY específicos y prácticos para este perro:

- Nombre: ${pet.name || 'perro'}
- Raza: ${pet.breed || 'mestizo'}
- Edad: ${edad}
- Sexo: ${pet.sex || 'no indicado'}
- Peso actual: ${pet.currentWeight ? pet.currentWeight + ' ' + (pet.weightUnit||'kg') : 'no registrado'}

REGLAS:
- Consejos concretos y accionables para un dueño primerizo, adaptados a SU raza y edad exactas.
- NO repitas generalidades obvias (como "dale agua" o "llévalo al vet").
- NO diagnostiques ni recetes medicamentos.
- Español neutro, cálido y directo. Máximo 2 frases por consejo.

Responde ÚNICAMENTE con JSON válido (sin markdown):
{"consejos":[{"icon":"un emoji","titulo":"máx 6 palabras","texto":"el consejo"}]}`;

      const res = await fetch(this.WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: 4000, responseMimeType: 'application/json' },
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error?.message || 'HTTP ' + res.status);

      const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
      const clean = text.replace(/```json/gi,'').replace(/```/g,'').trim();
      const parsed = JSON.parse(clean.slice(clean.indexOf('{'), clean.lastIndexOf('}') + 1));
      const tips = (parsed.consejos || []).slice(0, 6);
      if (!tips.length) throw new Error('respuesta vacía');

      localStorage.setItem(this._aiKey(pet, stageKey), JSON.stringify(tips));
      if (block) block.innerHTML = this._renderAiTips(tips);
      if (typeof haptic === 'function') haptic(12);

    } catch (e) {
      console.error('Tips IA:', e);
      const detalle = (e && e.message) ? String(e.message).slice(0, 90) : 'error desconocido';
      if (block) block.innerHTML = `
        <button class="btn-primary btn-full" onclick="Tips.generateAI()">
          🧠 Generar consejos personalizados con IA
        </button>
        <p class="tips-ai-hint" style="color:var(--warning);">No se pudo generar (${sanitize(detalle)}). Intenta de nuevo en unos segundos.</p>`;
    }
  },
};
