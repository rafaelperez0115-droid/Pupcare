// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎨 SISTEMA DE DISEÑO — PupCare Premium Dark
//
// 1) THEME: espejo en JS de los tokens CSS (:root). Se usa donde
//    las variables CSS no funcionan: canvas, gráficas SVG generadas
//    por JS y reportes. Si cambias un color aquí, cámbialo también
//    en css/style.css (:root).
// 2) Icon: iconos SVG de trazo, un solo estilo para toda la app.
//    Uso:  Icon.get('heart')            → <svg> inline
//          Icon.get('heart', 24)        → con tamaño
//          Icon.badge('syringe','primary') → icono en cuadro teñido
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const THEME = {
  bg:           '#0D0F1E',
  card:         '#14141F',
  cardElevated: '#1C1B2A',
  border:       '#2B2A40',
  primary:      '#8B5CF6',
  primaryLight: '#A78BFA',
  primaryDark:  '#7C3AED',
  accent:       '#6366F1',
  text:         '#F5F3FF',
  text2:        '#A1A1B5',
  success:      '#34D399',
  warning:      '#FBBF24',
  danger:       '#F87171',
  info:         '#60A5FA',
};

const Icon = {
  // Todos en cuadrícula 24×24, trazo redondeado, sin relleno
  paths: {
    // ── Navegación y secciones ──
    home:      '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/>',
    heart:     '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20z"/>',
    bowl:      '<path d="M4 11h16a8 8 0 0 1-16 0z"/><path d="M9 7c0-1.5 1-1.5 1-3M14 7c0-1.5 1-1.5 1-3"/>',
    sparkles:  '<path d="M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    image:     '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="m4 17 5-4.5 3.5 3 3-2.5 4.5 4"/>',
    user:      '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c.8-3.8 3.6-5.8 7-5.8s6.2 2 7 5.8"/>',
    users:     '<circle cx="9" cy="9" r="3"/><path d="M3.5 19c.6-3.2 2.8-4.8 5.5-4.8s4.9 1.6 5.5 4.8"/><circle cx="17" cy="9.5" r="2.4"/><path d="M16.5 14.4c2.4 0 4 1.3 4.5 4"/>',
    paw:       '<ellipse cx="12" cy="15.5" rx="4.6" ry="3.8"/><ellipse cx="6" cy="10.5" rx="1.9" ry="2.5"/><ellipse cx="10" cy="6.5" rx="1.9" ry="2.5"/><ellipse cx="14" cy="6.5" rx="1.9" ry="2.5"/><ellipse cx="18" cy="10.5" rx="1.9" ry="2.5"/>',

    // ── Salud y cuidado ──
    syringe:   '<path d="M16 3.5l4.5 4.5"/><path d="M14 6l4 4"/><path d="M13.5 6.5l4 4-8.5 8.5-4-4z"/><path d="M5 19l-2 2"/><path d="M11 9l2 2M9 11l2 2"/>',
    bug:       '<ellipse cx="12" cy="13.5" rx="4.5" ry="5.5"/><path d="M12 8V5.5M9 5l1.5 1.5M15 5l-1.5 1.5"/><path d="M7.5 11l-3-1.5M7.5 15l-3 1.5M16.5 11l3-1.5M16.5 15l3 1.5M12 8v11"/>',
    hospital:  '<rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M12 9v7M8.5 12.5h7"/>',
    pill:      '<g transform="rotate(-35 12 12)"><rect x="3.5" y="8.5" width="17" height="7" rx="3.5"/><path d="M12 8.5v7"/></g>',
    note:      '<path d="M6 3.5h9l4 4V20.5H6z"/><path d="M15 3.5v4h4"/><path d="M9 12h7M9 15.5h7"/>',
    droplet:   '<path d="M12 3.5s6 6.2 6 10.5a6 6 0 0 1-12 0C6 9.7 12 3.5 12 3.5z"/>',
    scissors:  '<circle cx="6.5" cy="7" r="2.5"/><circle cx="6.5" cy="17" r="2.5"/><path d="M8.5 8.5 20 18M8.5 15.5 20 6"/>',
    thermometer:'<path d="M10 14.5V5.5a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0z"/><path d="M12 9v7"/>',
    bone:      '<path d="M8.5 15.5 15.5 8.5"/><circle cx="6.5" cy="14" r="1.8"/><circle cx="8" cy="17.5" r="1.8"/><circle cx="17.5" cy="10" r="1.8"/><circle cx="16" cy="6.5" r="1.8"/>',

    // ── Seguimiento y registros ──
    scale:     '<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M8.5 9.5a4.2 4.2 0 0 1 7 0"/><path d="m12 9.5 1.8-1.8"/>',
    ruler:     '<g transform="rotate(-45 12 12)"><rect x="2.5" y="8.5" width="19" height="7" rx="1.6"/><path d="M7 8.5v3M10.5 8.5v2M14 8.5v3M17.5 8.5v2"/></g>',
    route:     '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h6a3.5 3.5 0 0 0 0-7h-4a3.5 3.5 0 0 1 0-7h6"/>',
    activity:  '<path d="M3 12h4l2.5-6 4 12 2.5-6H21"/>',
    chart:     '<path d="M4 4v16h16"/><path d="m8 15 3.5-4 3 2.5L19 8"/>',
    calendar:  '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    clock:     '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    wallet:    '<rect x="3.5" y="6.5" width="17" height="13" rx="2.5"/><path d="M3.5 10.5h17"/><path d="M16 15h1"/>',
    cake:      '<path d="M4 20.5h16M5.5 20.5V13h13v7.5"/><path d="M5.5 16.5c2 1.5 3.5 1.5 4.7 0 1.2 1.5 2.6 1.5 3.8 0 1.1 1.5 2.5 1.5 4.5 0"/><path d="M12 13V9.5M12 7v.01"/>',
    timeline:  '<path d="M7 4v16"/><circle cx="7" cy="7" r="2"/><circle cx="7" cy="17" r="2"/><path d="M12 7h8M12 17h8"/>',

    // ── Acciones ──
    camera:    '<path d="M4 8.5A2 2 0 0 1 6 6.5h2l1.4-2h5.2l1.4 2h2a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.6"/>',
    plus:      '<path d="M12 5v14M5 12h14"/>',
    check:     '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    close:     '<path d="M6 6l12 12M18 6 6 18"/>',
    edit:      '<path d="M4 20l1-4L16.5 4.5a2 2 0 0 1 3 3L8 19z"/><path d="m14.5 6.5 3 3"/>',
    trash:     '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/><path d="M10 11v5M14 11v5"/>',
    search:    '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    share:     '<circle cx="6" cy="12" r="2.4"/><circle cx="17.5" cy="6" r="2.4"/><circle cx="17.5" cy="18" r="2.4"/><path d="m8.2 10.8 7.1-3.6M8.2 13.2l7.1 3.6"/>',
    download:  '<path d="M12 4v11M7.5 11 12 15.5 16.5 11M5 19.5h14"/>',
    upload:    '<path d="M12 15.5V4.5M7.5 9 12 4.5 16.5 9M5 19.5h14"/>',
    settings:  '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    qr:        '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h3v3M20 14v.01M14 20h3M20 17v3"/>',
    compare:   '<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><path d="M12 5v14"/><path d="M9.5 12H8M14.5 12H16"/>',
    chevronRight:'<path d="m9 5 7 7-7 7"/>',
    chevronDown: '<path d="m5 9 7 7 7-7"/>',
    arrowLeft:   '<path d="M19 12H5M11 6l-6 6 6 6"/>',

    // ── Estado e información ──
    bell:      '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2H4.5z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    shield:    '<path d="M12 3.5 5 6v5.5c0 4.4 3 7.6 7 9 4-1.4 7-4.6 7-9V6z"/><path d="m9 12 2.3 2.3L15.5 10"/>',
    lock:      '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
    alert:     '<path d="M12 4 3 19.5h18z"/><path d="M12 10v4.5M12 17.2v.01"/>',
    info:      '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8v.01"/>',
    star:      '<path d="m12 4 2.4 5 5.4.7-4 3.8 1 5.4-4.8-2.6-4.8 2.6 1-5.4-4-3.8 5.4-.7z"/>',
    bulb:      '<path d="M9 17.5h6M10 20.5h4"/><path d="M12 3.5a5.5 5.5 0 0 0-3.2 10c.8.6 1.2 1.4 1.2 2.5h4c0-1.1.4-1.9 1.2-2.5A5.5 5.5 0 0 0 12 3.5z"/>',
    message:   '<path d="M4.5 6.5A2.5 2.5 0 0 1 7 4h10a2.5 2.5 0 0 1 2.5 2.5v7A2.5 2.5 0 0 1 17 16h-5.5L8 19.5V16H7a2.5 2.5 0 0 1-2.5-2.5z"/>',
    sun:       '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>',
    moon:      '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
    pin:       '<path d="M12 21s6.5-5.6 6.5-11a6.5 6.5 0 0 0-13 0C5.5 15.4 12 21 12 21z"/><circle cx="12" cy="10" r="2.4"/>',
  },

  // SVG inline listo para insertar en HTML. Hereda el color del texto.
  get(name, size = 20, extraClass = '') {
    const p = this.paths[name];
    if (!p) {
      console.warn('Icon: no existe "' + name + '"');
      return '';
    }
    return '<svg class="ui-icon ' + extraClass + '" width="' + size + '" height="' + size +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  },

  // Icono dentro de un cuadro con fondo teñido (tone: primary|success|warning|danger|info)
  badge(name, tone = 'primary', size = 20) {
    return '<span class="ui-icon-badge ui-tone-' + tone + '">' + this.get(name, size) + '</span>';
  },

  names() { return Object.keys(this.paths); },
};

// Estado vacío consistente: icono, título, descripción y acción principal.
// Uso: Empty.html({ icon:'hospital', title:'...', text:'...', cta:'Registrar', action:"Health.openForm('vetVisits')" })
const Empty = {
  html({ icon = 'paw', title = '', text = '', cta = '', action = '', secondary = '', secondaryAction = '' }) {
    return '<div class="empty-state ui-empty">' +
      '<div class="ui-empty-ic">' + Icon.get(icon, 30) + '</div>' +
      '<h4 class="ui-empty-title">' + title + '</h4>' +
      (text ? '<p class="ui-empty-text">' + text + '</p>' : '') +
      (cta ? '<button class="btn-primary ui-empty-cta" onclick="' + action + '">' + Icon.get('plus', 16) + ' ' + cta + '</button>' : '') +
      (secondary ? '<button class="ui-empty-link" onclick="' + secondaryAction + '">' + secondary + '</button>' : '') +
      '</div>';
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚖️ UNIDADES — conversión kg↔lb y cm↔in + preferencia de visualización
// Cada registro conserva la unidad en que se guardó; al DIBUJAR o COMPARAR se
// convierte todo a la unidad elegida, para no mezclar libras con kilos.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const Units = {
  KG_PER_LB: 0.45359237,
  CM_PER_IN: 2.54,

  _n(u) { return String(u == null ? '' : u).toLowerCase().replace(/[^a-z]/g, ''); },
  weightUnit(u) { return ['lb', 'lbs', 'libra', 'libras', 'pound', 'pounds'].includes(this._n(u)) ? 'lb' : 'kg'; },
  heightUnit(u) { return ['in', 'inch', 'inches', 'pulgada', 'pulgadas'].includes(this._n(u)) ? 'in' : 'cm'; },

  weight(v, from, to) {
    v = parseFloat(v); if (isNaN(v)) return NaN;
    const a = this.weightUnit(from), b = this.weightUnit(to);
    if (a === b) return v;
    return a === 'lb' ? v * this.KG_PER_LB : v / this.KG_PER_LB;
  },
  height(v, from, to) {
    v = parseFloat(v); if (isNaN(v)) return NaN;
    const a = this.heightUnit(from), b = this.heightUnit(to);
    if (a === b) return v;
    return a === 'in' ? v * this.CM_PER_IN : v / this.CM_PER_IN;
  },

  _get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  _set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },

  // Unidad con la que se muestran las gráficas: la elegida con el botón;
  // si nunca eligió, la unidad del perfil de la mascota.
  prefWeight() {
    const s = this._get('pupcare_unit_weight');
    if (s === 'kg' || s === 'lb') return s;
    return this.weightUnit(typeof Profile !== 'undefined' && Profile.data ? Profile.data.weightUnit : 'kg');
  },
  prefHeight() {
    const s = this._get('pupcare_unit_height');
    if (s === 'cm' || s === 'in') return s;
    return this.heightUnit(typeof Profile !== 'undefined' && Profile.data ? Profile.data.heightUnit : 'cm');
  },
  setWeight(u) { this._set('pupcare_unit_weight', this.weightUnit(u)); this.refreshViews(); },
  setHeight(u) { this._set('pupcare_unit_height', this.heightUnit(u)); this.refreshViews(); },

  fmt(v) { return (typeof v !== 'number' || isNaN(v)) ? '—' : String(Math.round(v * 10) / 10); },

  // Botón selector (kg | lb  /  cm | in)
  toggleHTML(kind) {
    const alto = kind === 'height';
    const cur = alto ? this.prefHeight() : this.prefWeight();
    return '<div class="unit-toggle" role="group" aria-label="Unidad de ' + (alto ? 'altura' : 'peso') + '">' +
      (alto ? ['cm', 'in'] : ['kg', 'lb']).map(o =>
        '<button type="button" class="unit-btn' + (o === cur ? ' active' : '') + '" aria-pressed="' + (o === cur) +
        '" onclick="Units.' + (alto ? 'setHeight' : 'setWeight') + "('" + o + "')\">" + o + '</button>').join('') +
      '</div>';
  },

  // Vuelve a dibujar lo que esté a la vista con la nueva unidad
  refreshViews() {
    const run = (fn) => { try { fn(); } catch (e) { console.error('Units:', e); } };
    run(() => { if (document.getElementById('miniChart') && typeof Profile !== 'undefined') Profile.loadMiniChart(); });
    run(() => { if (document.getElementById('evolutionBody') && typeof Home !== 'undefined') Home.loadEvolution(); });
    run(() => {
      const k = document.getElementById('chartKind');
      if (!k || typeof Profile === 'undefined') return;
      if (k.dataset.kind === 'weight') Profile.renderWeightModal();
      else if (k.dataset.kind === 'height') Profile.renderHeightModal();
    });
  },
};
