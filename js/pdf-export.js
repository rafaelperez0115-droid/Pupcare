// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📄 pdf-export.js v3 — Reporte HTML → Canvas → PDF
// Replica exacta del dashboard premium de PupCare
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Iconos Lucide (SVG inline, stroke)
const PDF_ICONS = {
  shield:      '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>',
  shieldCheck: '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>',
  worm:        '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12h-2a2 2 0 0 0-2 2v1a2 2 0 0 1-2 2 2 2 0 0 0-2 2v3"/><path d="M9 21a2 2 0 0 0 2-2v-1a2 2 0 0 1 2-2 2 2 0 0 0 2-2v-1a2 2 0 0 1 2-2 2 2 0 0 0 2-2V6a3 3 0 0 0-6 0v.5"/><circle cx="7" cy="5" r="1"/></svg>',
  pill:        '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>',
  stethoscope: '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>',
  clipboard:   '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>',
  chartLine:   '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="m19 9-5 5-4-4-3 3"/></svg>',
  calendar:    '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>',
  venus:       '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15v7"/><path d="M9 19h6"/><circle cx="12" cy="9" r="6"/></svg>',
  scale:       '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>',
  cake:        '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><path d="M7 8v3"/><path d="M12 8v3"/><path d="M17 8v3"/><path d="M7 4h.01"/><path d="M12 4h.01"/><path d="M17 4h.01"/></svg>',
  paw:         '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="4" cy="8" r="2"/><circle cx="7" cy="14" r="2"/><path d="M8 22a5 5 0 0 1-1-9.5A5 5 0 0 1 16 12a5 5 0 0 1 0 10Z" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
};

async function exportHistoryPDF() {
  if (!PET_ID || !Profile.data) { showToast('Primero configura el perfil de tu mascota','error'); return; }
  if (!window.jspdf || !window.html2canvas) { showToast('Cargando generador, intenta de nuevo','error'); return; }

  closeSettings();
  showLoading(true);
  showToast('📄 Generando reporte premium...', 'info', 10000);

  try {
    const pet = Profile.data;

    const [vacSnap, dewSnap, vetSnap, medSnap, weightSnap, notesSnap, heightSnap, expSnap] = await Promise.all([
      subRef('vaccines').orderBy('date','desc').get(),
      subRef('dewormings').orderBy('date','desc').get(),
      subRef('vetVisits').orderBy('date','desc').get(),
      subRef('medications').orderBy('createdAt','desc').get(),
      subRef('weightHistory').orderBy('recordedAt','asc').get(),
      subRef('behaviorNotes').orderBy('date','desc').limit(10).get(),
      subRef('heightHistory').orderBy('recordedAt','asc').get().catch(() => ({ docs: [], empty: true })),
      subRef('expenses').get().catch(() => ({ docs: [], empty: true })),
    ]);

    // Foto en base64 (para evitar problemas CORS en html2canvas)
    let petPhoto = null;
    if (pet.photoUrl) {
      try { petPhoto = await loadImageAsBase64(pet.photoUrl); } catch(e) {}
    }

    // Próxima vacuna
    let nextVax = null;
    vacSnap.docs.forEach(d => { const nd=d.data().nextDate; if(nd&&(!nextVax||nd<nextVax)) nextVax=nd; });
    const lastDew = dewSnap.empty ? null : dewSnap.docs[0].data();
    const now = new Date();

    // Weights
    const weights = weightSnap.docs.map(d => ({ weight:parseFloat(d.data().weight), date:d.data().date||'', unit:d.data().unit||'kg' }));

    // Alturas
    const heights = heightSnap.docs.map(d => ({ height:parseFloat(d.data().height), date:d.data().date||'', unit:d.data().unit||'cm' }));

    // Gastos del año en curso, por categoría
    const thisYear = String(now.getFullYear());
    const expByCat = {};
    let expTotal = 0;
    expSnap.docs.forEach(d => {
      const e = d.data();
      if (!(e.date||'').startsWith(thisYear)) return;
      const amt = parseFloat(e.amount)||0;
      expTotal += amt;
      const cat = e.category || 'Otro';
      expByCat[cat] = (expByCat[cat]||0) + amt;
    });

    // Construir el HTML del reporte
    const reportHTML = buildReportHTML({ pet, petPhoto, vacSnap, dewSnap, vetSnap, medSnap, notesSnap, weights, heights, expByCat, expTotal, thisYear, nextVax, lastDew, now });

    // Contenedor oculto
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-9999px;top:0;width:800px;background:#050816;';
    container.innerHTML = reportHTML;
    document.body.appendChild(container);

    // Esperar a que la imagen cargue
    await new Promise(r => setTimeout(r, 300));

    // Capturar con html2canvas
    const canvas = await html2canvas(container.firstElementChild, {
      scale: 2,
      backgroundColor: '#050816',
      logging: false,
      useCORS: true,
      allowTaint: true,
    });

    document.body.removeChild(container);

    // Generar PDF — todo en UNA sola hoja A4
    const { jsPDF } = window.jspdf;
    const PAGE_W = 210, PAGE_H = 297; // A4 en mm
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });

    // Fondo oscuro de la página
    pdf.setFillColor(5, 8, 22);
    pdf.rect(0, 0, PAGE_W, PAGE_H, 'F');

    const imgData = canvas.toDataURL('image/jpeg', 0.94);
    const canvasRatio = canvas.width / canvas.height;
    const pageRatio   = PAGE_W / PAGE_H;

    // Escalar la imagen para que quepa COMPLETA dentro de la hoja (contain)
    let renderW, renderH;
    if (canvasRatio > pageRatio) {
      // La imagen es más ancha proporcionalmente → ajustar al ancho
      renderW = PAGE_W;
      renderH = PAGE_W / canvasRatio;
    } else {
      // La imagen es más alta → ajustar al alto
      renderH = PAGE_H;
      renderW = PAGE_H * canvasRatio;
    }

    // Centrar en la página
    const offsetX = (PAGE_W - renderW) / 2;
    const offsetY = (PAGE_H - renderH) / 2;

    pdf.addImage(imgData, 'JPEG', offsetX, offsetY, renderW, renderH);

    const fileName = `Historial_${pet.name.replace(/\s+/g,'_')}_${now.toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

    showLoading(false);
    showToast('✅ Reporte generado', 'success');

  } catch(e) {
    console.error('Error generando PDF:', e);
    showLoading(false);
    showToast('Error al generar el reporte', 'error');
  }
}

function buildReportHTML(d) {
  const { pet, petPhoto, vacSnap, dewSnap, vetSnap, medSnap, notesSnap, weights, heights, expByCat, expTotal, thisYear, nextVax, lastDew, now } = d;

  const fmtMoney = (n) => 'RD$' + (parseFloat(n)||0).toLocaleString('es-DO', { minimumFractionDigits: 2 });

  // Altura: últimos registros (más reciente primero)
  const heightItems = (heights || []).slice(-6).reverse().map(h => ({
    title: `${h.height} ${h.unit}`,
    sub: h.date ? formatDate(h.date) : '',
  }));

  // Gastos del año por categoría (mayor primero)
  const expItems = Object.entries(expByCat || {})
    .sort(([,a],[,b]) => b - a)
    .map(([cat, amt]) => ({ title: sanitize(cat), sub: fmtMoney(amt) }));

  const cardStyle = 'background:linear-gradient(135deg,#17152f,#0f1023);border:1px solid rgba(109,94,252,0.15);border-radius:22px;box-shadow:0 8px 30px rgba(0,0,0,.35),0 0 15px rgba(109,94,252,.08);';
  const P = '#6d5efc', GREEN = '#10B981', AMBER = '#F59E0B', BLUE = '#3B82F6', GRAY = '#8B92A9', WHITE = '#fff';

  // Foto
  const photoHTML = petPhoto
    ? `<img src="${petPhoto}" style="width:120px;height:120px;border-radius:50%;object-fit:cover;border:4px solid ${P};box-shadow:0 0 20px rgba(109,94,252,0.45);" alt="${pet.name}">`
    : `<div style="width:120px;height:120px;border-radius:50%;background:#161829;border:4px solid ${P};box-shadow:0 0 20px rgba(109,94,252,0.45);display:flex;align-items:center;justify-content:center;color:${P};">${PDF_ICONS.paw}</div>`;

  // Badge médico
  function statBadge(icon, num, label, color) {
    return `<div style="flex:1;background:rgba(0,0,0,0.25);border:1px solid rgba(109,94,252,0.12);border-radius:16px;padding:16px 8px;text-align:center;">
      <div style="color:${color};display:flex;justify-content:center;margin-bottom:8px;">${icon}</div>
      <div style="font-size:28px;font-weight:800;color:${color};line-height:1;">${num}</div>
      <div style="font-size:12px;color:${GRAY};margin-top:5px;">${label}</div>
    </div>`;
  }

  // Mini dato con icono
  function miniData(icon, label, value) {
    return `<div style="display:flex;align-items:flex-start;gap:8px;">
      <div style="color:${P};margin-top:2px;">${icon}</div>
      <div>
        <div style="font-size:11px;color:${GRAY};text-transform:uppercase;letter-spacing:0.5px;">${label}</div>
        <div style="font-size:15px;font-weight:700;color:${WHITE};margin-top:2px;">${value||'—'}</div>
      </div>
    </div>`;
  }

  // Info card (próxima vacuna / desparasitación)
  function infoCard(icon, iconColor, label, value, valueColor, sub) {
    return `<div style="flex:1;${cardStyle}padding:22px;display:flex;align-items:center;gap:16px;">
      <div style="width:54px;height:54px;border-radius:50%;background:rgba(109,94,252,0.1);display:flex;align-items:center;justify-content:center;color:${iconColor};flex-shrink:0;">${icon}</div>
      <div>
        <div style="font-size:14px;color:${GRAY};">${label}</div>
        <div style="font-size:22px;font-weight:800;color:${valueColor};margin-top:3px;">${value}</div>
        <div style="font-size:12px;color:${GRAY};margin-top:2px;">${sub}</div>
      </div>
    </div>`;
  }

  // Section card
  function sectionCard(icon, iconColor, title, subtitle, items) {
    let body;
    if (!items.length) {
      body = `<div style="font-size:14px;color:${GRAY};font-style:italic;">Sin registros</div>`;
    } else {
      body = items.map(it => `
        <div style="margin-bottom:9px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:6px;height:6px;border-radius:50%;background:${P};flex-shrink:0;"></div>
            <div style="font-size:15px;font-weight:700;color:${WHITE};">${it.title}</div>
          </div>
          ${it.sub ? `<div style="font-size:12.5px;color:${GRAY};margin-left:14px;margin-top:3px;line-height:1.4;">${it.sub}</div>` : ''}
        </div>`).join('');
    }
    return `<div style="${cardStyle}padding:18px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
        <div style="width:42px;height:42px;border-radius:12px;background:rgba(109,94,252,0.12);display:flex;align-items:center;justify-content:center;color:${iconColor};">${icon}</div>
        <div style="font-size:19px;font-weight:800;color:${WHITE};">${title}${subtitle?`<span style="font-size:13px;font-weight:400;color:${GRAY};margin-left:8px;">${subtitle}</span>`:''}</div>
      </div>
      ${body}
    </div>`;
  }

  // Datos de las secciones
  const vacItems = vacSnap.docs.map(x=>{ const v=x.data(); let s=formatDate(v.date); if(v.brand)s+=' · '+v.brand; if(v.nextDate)s+=' · Próx: '+formatDate(v.nextDate); return {title:sanitize(v.name),sub:s}; });
  const dewItems = dewSnap.docs.map(x=>{ const w=x.data(); let s=formatDate(w.date); if(w.type)s+=' · '+w.type; if(w.dose)s+=' · '+w.dose; if(w.nextDate)s+=' · Próx: '+formatDate(w.nextDate); return {title:sanitize(w.product),sub:s}; });
  const medItems = medSnap.docs.map(x=>{ const m=x.data(); const ended=m.endDate&&new Date(m.endDate+'T00:00:00')<now; const active=m.active!==false&&!ended; let s=''; if(m.dose)s+=m.dose; if(m.frequency)s+=' · '+m.frequency; return {title:`${sanitize(m.name)} ${active?'(Activo)':'(Finalizado)'}`,sub:s}; });
  const vetItems = vetSnap.docs.map(x=>{ const v=x.data(); let s=formatDate(v.date); if(v.vet)s+=' · Dr. '+sanitize(v.vet); if(v.cost)s+=' · $'+v.cost; return {title:sanitize(v.reason),sub:s}; });
  const noteItems = notesSnap.docs.map(x=>{ const n=x.data(); return {title:`${sanitize(n.mood||'Nota')} — ${formatDate(n.date)}`, sub:sanitize(n.text||'')}; });

  // Gráfico de peso SVG
  const chartHTML = buildWeightChartHTML(weights);

  const fStr = `${now.getDate()} ${now.toLocaleDateString('es-ES',{month:'short'})} ${now.getFullYear()} · ${now.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}`;

  return `
  <div style="width:800px;background:linear-gradient(180deg,#080b1a,#0f1328);padding:26px;font-family:'Inter',system-ui,-apple-system,sans-serif;color:${WHITE};box-sizing:border-box;">

    <!-- ENCABEZADO -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">
      <div style="display:flex;align-items:center;gap:14px;">
        <div style="width:52px;height:52px;border-radius:15px;background:linear-gradient(135deg,${P},#a78bfa);display:flex;align-items:center;justify-content:center;color:#fff;">${PDF_ICONS.paw}</div>
        <div>
          <div style="font-size:26px;font-weight:800;color:${WHITE};">PupCare</div>
          <div style="font-size:14px;color:${GRAY};">Historial Médico Veterinario</div>
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:12px;font-weight:700;color:#a78bfa;letter-spacing:0.5px;">REPORTE GENERADO</div>
        <div style="font-size:17px;font-weight:700;color:${WHITE};margin-top:3px;">${fStr}</div>
      </div>
    </div>

    <!-- TARJETA PRINCIPAL -->
    <div style="${cardStyle}padding:22px;margin-bottom:14px;">
      <div style="display:flex;gap:20px;align-items:flex-start;">
        <div style="flex-shrink:0;">${photoHTML}</div>
        <div style="flex:1;">
          <div style="font-size:44px;font-weight:800;color:${WHITE};line-height:1;">${sanitize(pet.name)}</div>
          <div style="font-size:16px;color:${GRAY};margin-top:8px;">
            ${pet.breed?sanitize(pet.breed):''}${pet.breed?' &nbsp;·&nbsp; ':''}${pet.birthDate?calcAge(pet.birthDate):''}${pet.currentWeight?' &nbsp;·&nbsp; '+pet.currentWeight+' '+(pet.weightUnit||'kg'):''}
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:22px;max-width:420px;">
            ${miniData(PDF_ICONS.calendar,'Nacimiento',pet.birthDate?formatDate(pet.birthDate):'—')}
            ${miniData(PDF_ICONS.venus,'Sexo',pet.sex||'—')}
            ${miniData(PDF_ICONS.cake,'Edad',pet.birthDate?calcAge(pet.birthDate):'—')}
            ${miniData(PDF_ICONS.scale,'Peso actual',pet.currentWeight?pet.currentWeight+' '+(pet.weightUnit||'kg'):'—')}
          </div>
        </div>
        <div style="display:flex;gap:12px;flex-shrink:0;width:280px;">
          ${statBadge(PDF_ICONS.shield, vacSnap.size, 'Vacunas', BLUE)}
          ${statBadge(PDF_ICONS.worm, dewSnap.size, 'Desparasit.', GREEN)}
          ${statBadge(PDF_ICONS.stethoscope, vetSnap.size, 'Visitas Vet', AMBER)}
        </div>
      </div>
    </div>

    <!-- PRÓXIMA VACUNA + DESPARASITACIÓN -->
    <div style="display:flex;gap:12px;margin-bottom:14px;">
      ${infoCard(PDF_ICONS.shieldCheck, GREEN, 'Próxima vacuna', nextVax?formatDate(nextVax):'Sin pendientes', nextVax&&new Date(nextVax)<now?AMBER:GREEN, nextVax&&new Date(nextVax)<now?'Vencida':'Al día')}
      ${infoCard(PDF_ICONS.worm, GREEN, 'Desparasitación', lastDew?'Activa':'Sin registro', lastDew?GREEN:GRAY, lastDew&&lastDew.nextDate?'Próx: '+formatDate(lastDew.nextDate):'Sin próxima')}
    </div>

    <!-- GRÁFICO DE PESO -->
    ${chartHTML}

    <!-- SECCIONES 2 COLUMNAS -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
      ${sectionCard(PDF_ICONS.shield, P, 'Vacunas', '', vacItems)}
      ${sectionCard(PDF_ICONS.worm, GREEN, 'Desparasitaciones', '', dewItems)}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
      ${sectionCard(PDF_ICONS.pill, P, 'Medicamentos', '', medItems)}
      ${sectionCard(PDF_ICONS.stethoscope, P, 'Visitas veterinarias', '', vetItems)}
    </div>

    <!-- ALTURA Y GASTOS -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
      ${sectionCard(PDF_ICONS.chart || PDF_ICONS.clipboard, P, 'Altura (a la cruz)', '', heightItems)}
      ${sectionCard(PDF_ICONS.clipboard, GREEN, 'Gastos ' + thisYear, expTotal ? 'Total: ' + fmtMoney(expTotal) : '', expItems)}
    </div>

    <!-- NOTAS (ancho completo) -->
    <div style="margin-bottom:14px;">
      ${sectionCard(PDF_ICONS.clipboard, P, 'Notas de comportamiento', '(últimas 10)', noteItems)}
    </div>

    <!-- FOOTER -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding-top:16px;border-top:1px solid rgba(109,94,252,0.12);">
      <div style="display:flex;align-items:center;gap:6px;font-size:13px;color:${GRAY};">
        Generado por PupCare <span style="color:${P};">♥</span>
      </div>
      <div style="font-size:13px;color:${GRAY};">${sanitize(pet.name)} · ${now.toLocaleDateString('es-ES')}</div>
    </div>

  </div>`;
}

function buildWeightChartHTML(weights) {
  const cardStyle = 'background:linear-gradient(135deg,#17152f,#0f1023);border:1px solid rgba(109,94,252,0.15);border-radius:22px;box-shadow:0 8px 30px rgba(0,0,0,.35),0 0 15px rgba(109,94,252,.08);';
  const P='#6d5efc', GRAY='#8B92A9', WHITE='#fff';

  if (weights.length < 2) {
    return `<div style="${cardStyle}padding:24px;margin-bottom:18px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
        <div style="color:${P};">${PDF_ICONS.chartLine}</div>
        <div style="font-size:18px;font-weight:800;color:${WHITE};">Historial de peso</div>
      </div>
      <div style="font-size:14px;color:${GRAY};font-style:italic;">Necesitas al menos 2 registros de peso para ver el gráfico</div>
    </div>`;
  }

  const W=736, H=240, pL=40, pR=20, pT=30, pB=36;
  const cW=W-pL-pR, cH=H-pT-pB;
  const wVals=weights.map(w=>w.weight);
  const maxW=Math.max(...wVals);
  const scaleMax=Math.ceil(maxW/10)*10||10;
  const n=weights.length;

  const pts=weights.map((w,i)=>({
    x: pL+(n===1?cW/2:(i/(n-1))*cW),
    y: pT+cH-((w.weight)/scaleMax)*cH,
    w: w.weight, d: w.date, u: w.unit,
  }));

  const linePath=pts.map((p,i)=>`${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath=`${linePath} L${pts[n-1].x.toFixed(1)},${(pT+cH).toFixed(1)} L${pts[0].x.toFixed(1)},${(pT+cH).toFixed(1)} Z`;

  // Grid Y
  let gridY='';
  const ySteps=4;
  for(let i=0;i<=ySteps;i++){
    const val=(scaleMax/ySteps)*i;
    const ly=pT+cH-(i/ySteps)*cH;
    gridY+=`<line x1="${pL}" y1="${ly}" x2="${W-pR}" y2="${ly}" stroke="rgba(109,94,252,0.12)" stroke-width="1"/>`;
    gridY+=`<text x="${pL-8}" y="${ly+4}" text-anchor="end" font-size="12" fill="${GRAY}">${Math.round(val)}</text>`;
  }

  // Puntos + etiquetas
  let dots='', labels='', xLabels='';
  pts.forEach(p=>{
    dots+=`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="${P}" stroke="#0f1023" stroke-width="2"/>`;
    labels+=`<text x="${p.x.toFixed(1)}" y="${(p.y-12).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="700" fill="${WHITE}">${p.w} ${p.u}</text>`;
    if(p.d) xLabels+=`<text x="${p.x.toFixed(1)}" y="${H-10}" text-anchor="middle" font-size="11" fill="${GRAY}">${formatDate(p.d).replace(/ de /g,' ')}</text>`;
  });

  const curW=weights[n-1];

  return `<div style="${cardStyle}padding:18px;margin-bottom:14px;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="color:${P};">${PDF_ICONS.chartLine}</div>
        <div style="font-size:18px;font-weight:800;color:${WHITE};">Historial de peso <span style="font-size:13px;font-weight:400;color:${GRAY};">(últimos ${n})</span></div>
      </div>
      <div style="font-size:15px;font-weight:700;color:#a78bfa;">Peso actual: ${curW.weight} ${curW.unit}</div>
    </div>
    <svg width="100%" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${P}" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="${P}" stop-opacity="0.02"/>
        </linearGradient>
      </defs>
      ${gridY}
      <path d="${areaPath}" fill="url(#wg)"/>
      <path d="${linePath}" fill="none" stroke="${P}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      ${dots}
      ${labels}
      ${xLabels}
    </svg>
  </div>`;
}

async function loadImageAsBase64(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 240;
        canvas.width=size; canvas.height=size;
        const ctx = canvas.getContext('2d');
        const min = Math.min(img.width, img.height);
        const sx=(img.width-min)/2, sy=(img.height-min)/2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      } catch(e){ reject(e); }
    };
    img.onerror = reject;
    img.src = url.includes('cloudinary') ? url.replace('/upload/','/upload/w_240,h_240,c_fill/') : url;
  });
}
