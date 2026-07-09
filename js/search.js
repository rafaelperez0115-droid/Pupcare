// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔍 search.js — Búsqueda global
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const Search = {
  cache: null,       // datos cacheados de la mascota actual
  cachePetId: null,  // para saber si el caché es válido
  debounceTimer: null,
};

function openSearch() {
  if (!PET_ID) {
    showToast('Primero configura el perfil de tu mascota 🐾', 'info');
    return;
  }
  const overlay = document.getElementById('searchOverlay');
  overlay.style.display = 'flex';
  requestAnimationFrame(() => overlay.classList.add('overlay-visible'));
  if (typeof lockBodyScroll === 'function') lockBodyScroll();
  const input = document.getElementById('searchInput');
  input.value = '';
  document.getElementById('searchClearBtn').style.display = 'none';
  resetSearchResults();
  setTimeout(() => input.focus(), 100);

  // Precargar datos en segundo plano
  preloadSearchData();
}

function closeSearch() {
  const overlay = document.getElementById('searchOverlay');
  overlay.classList.remove('overlay-visible');
  setTimeout(() => { overlay.style.display = 'none'; }, 250);
  if (typeof unlockBodyScroll === 'function') unlockBodyScroll();
}

function clearSearch() {
  const input = document.getElementById('searchInput');
  input.value = '';
  document.getElementById('searchClearBtn').style.display = 'none';
  resetSearchResults();
  input.focus();
}

function resetSearchResults() {
  document.getElementById('searchResults').innerHTML = `
    <div class="search-hint">
      <div style="font-size:2.5rem;margin-bottom:10px;">🔍</div>
      <p>Busca en todo el historial de tu mascota</p>
      <p style="font-size:0.8rem;margin-top:6px;">Vacunas, medicamentos, notas, actividades, visitas y más</p>
    </div>`;
}

// ── Precargar todos los registros de la mascota ──
async function preloadSearchData() {
  // Si ya tenemos caché válido para esta mascota, no recargar
  if (Search.cache && Search.cachePetId === PET_ID) return;

  try {
    const [vac, dew, vet, med, notes, acts, care, feed, photos] = await Promise.all([
      subRef('vaccines').get(),
      subRef('dewormings').get(),
      subRef('vetVisits').get(),
      subRef('medications').get(),
      subRef('behaviorNotes').get(),
      subRef('activities').get(),
      subRef('care').get(),
      subRef('feedingLog').get(),
      subRef('photos').get(),
    ]);

    const records = [];

    vac.docs.forEach(d => { const v=d.data(); records.push({
      cat:'Vacunas', icon:'💉', view:'salud',
      title:v.name, sub:formatDate(v.date)+(v.brand?' · '+v.brand:''),
      text:`${v.name} ${v.brand||''} ${v.notes||''}`.toLowerCase(),
    });});

    dew.docs.forEach(d => { const w=d.data(); records.push({
      cat:'Desparasitaciones', icon:'🐛', view:'salud',
      title:w.product, sub:formatDate(w.date)+(w.type?' · '+w.type:''),
      text:`${w.product} ${w.type||''} ${w.dose||''}`.toLowerCase(),
    });});

    vet.docs.forEach(d => { const v=d.data(); records.push({
      cat:'Visitas veterinarias', icon:'🏥', view:'salud',
      title:v.reason, sub:formatDate(v.date)+(v.vet?' · Dr. '+v.vet:''),
      text:`${v.reason} ${v.vet||''} ${v.diagnosis||''} ${v.treatment||''}`.toLowerCase(),
    });});

    med.docs.forEach(d => { const m=d.data(); records.push({
      cat:'Medicamentos', icon:'💊', view:'salud',
      title:m.name, sub:(m.dose||'')+(m.frequency?' · '+m.frequency:''),
      text:`${m.name} ${m.dose||''} ${m.frequency||''} ${m.notes||''}`.toLowerCase(),
    });});

    notes.docs.forEach(d => { const n=d.data(); records.push({
      cat:'Notas de comportamiento', icon:'📝', view:'salud',
      title:n.mood||'Nota', sub:formatDate(n.date)+(n.text?' · '+n.text.slice(0,40):''),
      text:`${n.mood||''} ${n.text||''}`.toLowerCase(),
    });});

    acts.docs.forEach(d => { const a=d.data(); records.push({
      cat:'Actividades', icon:'🏃', view:'inicio',
      title:a.type, sub:formatDate(a.date)+(a.duration?' · '+a.duration:''),
      text:`${a.type} ${a.duration||''} ${a.distance||''} ${a.note||''}`.toLowerCase(),
    });});

    care.docs.forEach(d => { const c=d.data(); records.push({
      cat:'Cuidados', icon:'🛁', view:'cuidados',
      title:c.type, sub:formatDate(c.date)+(c.product?' · '+c.product:''),
      text:`${c.type} ${c.product||''} ${c.notes||''}`.toLowerCase(),
    });});

    feed.docs.forEach(d => { const f=d.data(); records.push({
      cat:'Alimentación', icon:'🍽️', view:'comida',
      title:f.foodType||'Comida', sub:formatDate(f.date)+(f.amount?' · '+f.amount+(f.unit||'g'):''),
      text:`${f.foodType||''}`.toLowerCase(),
    });});

    photos.docs.forEach(d => { const p=d.data(); if(p.caption) records.push({
      cat:'Fotos', icon:'📸', view:'album',
      title:p.caption, sub:p.date?formatDate(p.date+'-01'):'Álbum',
      text:`${p.caption}`.toLowerCase(),
    });});

    Search.cache = records;
    Search.cachePetId = PET_ID;
  } catch(e) {
    console.error('Error precargando búsqueda:', e);
  }
}

// ── Buscar (con debounce) ──
function performSearch(query) {
  const clearBtn = document.getElementById('searchClearBtn');
  clearBtn.style.display = query ? 'flex' : 'none';

  clearTimeout(Search.debounceTimer);
  Search.debounceTimer = setTimeout(() => doSearch(query), 200);
}

async function doSearch(query) {
  const results = document.getElementById('searchResults');
  const q = query.trim().toLowerCase();

  if (!q) { resetSearchResults(); return; }

  // Asegurar que los datos estén cargados
  if (!Search.cache || Search.cachePetId !== PET_ID) {
    results.innerHTML = '<div class="search-loading">🔍 Cargando datos...</div>';
    await preloadSearchData();
  }

  if (!Search.cache) {
    results.innerHTML = '<div class="search-empty"><div class="empty-icon">⚠️</div><p>No se pudieron cargar los datos</p></div>';
    return;
  }

  // Filtrar (soporta múltiples palabras)
  const words = q.split(/\s+/);
  const matches = Search.cache.filter(r =>
    words.every(w => r.text.includes(w))
  );

  if (matches.length === 0) {
    results.innerHTML = `
      <div class="search-empty">
        <div class="empty-icon">🔍</div>
        <p>Sin resultados para "${sanitize(query)}"</p>
        <p style="font-size:0.8rem;margin-top:6px;">Intenta con otras palabras</p>
      </div>`;
    return;
  }

  // Agrupar por categoría
  const groups = {};
  matches.forEach(m => {
    if (!groups[m.cat]) groups[m.cat] = [];
    groups[m.cat].push(m);
  });

  // Renderizar
  let html = `<div style="font-size:0.8rem;color:var(--text2);margin-bottom:8px;">${matches.length} resultado${matches.length!==1?'s':''}</div>`;

  Object.entries(groups).forEach(([cat, items]) => {
    html += `<div class="search-category">${cat} (${items.length})</div>`;
    items.forEach(item => {
      html += `
        <div class="search-result-item" onclick="goToSearchResult('${item.view}')">
          <div class="search-result-icon">${item.icon}</div>
          <div class="search-result-info">
            <div class="search-result-title">${highlightMatch(item.title, words)}</div>
            <div class="search-result-sub">${highlightMatch(item.sub, words)}</div>
          </div>
        </div>`;
    });
  });

  results.innerHTML = html;
}

// ── Resaltar coincidencias ──
function highlightMatch(text, words) {
  let safe = sanitize(text);
  words.forEach(w => {
    if (!w) return;
    const regex = new RegExp(`(${w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi');
    safe = safe.replace(regex, '<span class="search-highlight">$1</span>');
  });
  return safe;
}

// ── Ir a la sección del resultado ──
function goToSearchResult(view) {
  closeSearch();
  navigate(view);
}

// Invalidar caché cuando se agrega/borra algo (llamar desde otros módulos si es necesario)
function invalidateSearchCache() {
  Search.cache = null;
  Search.cachePetId = null;
}
