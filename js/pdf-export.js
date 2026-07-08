// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📄 pdf-export.js v2 — Reporte médico estilo Dashboard
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function exportHistoryPDF() {
  if (!PET_ID || !Profile.data) {
    showToast('Primero configura el perfil de tu mascota', 'error');
    return;
  }
  if (!window.jspdf) {
    showToast('No se pudo cargar el generador de PDF', 'error');
    return;
  }

  closeSettings();
  showLoading(true);
  showToast('📄 Generando reporte...', 'info', 8000);

  try {
    const pet = Profile.data;

    const [vacSnap, dewSnap, vetSnap, medSnap, weightSnap, notesSnap, careSnap, actSnap, feedDoc] = await Promise.all([
      subRef('vaccines').orderBy('date', 'desc').get(),
      subRef('dewormings').orderBy('date', 'desc').get(),
      subRef('vetVisits').orderBy('date', 'desc').get(),
      subRef('medications').orderBy('createdAt', 'desc').get(),
      subRef('weightHistory').orderBy('recordedAt', 'asc').get(),
      subRef('behaviorNotes').orderBy('date', 'desc').limit(10).get(),
      subRef('care').orderBy('createdAt', 'desc').limit(1).get(),
      subRef('activities').orderBy('createdAt', 'desc').limit(1).get(),
      subRef('feedingPlan').doc('current').get(),
    ]);

    let petPhotoData = null;
    if (pet.photoUrl) {
      try { petPhotoData = await loadImageAsBase64(pet.photoUrl); }
      catch(e) { console.warn('No se pudo cargar la foto:', e); }
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    const C = {
      bg:[13,15,30], card:[22,24,41], cardTop:[30,33,64],
      purple:[108,99,255], purpleLt:[167,139,250], white:[255,255,255],
      gray:[139,146,169], green:[16,185,129], amber:[245,158,11],
      blue:[59,130,246], border:[42,45,69],
    };

    const PAGE_W=210, PAGE_H=297, M=12;
    const CW = PAGE_W - M*2;
    let y = M;

    function fillBg(){ doc.setFillColor(...C.bg); doc.rect(0,0,PAGE_W,PAGE_H,'F'); }
    function card(x,cy,w,h,color=C.card,r=3){ doc.setFillColor(...color); doc.roundedRect(x,cy,w,h,r,r,'F'); }
    function checkPage(needed=20){ if(y+needed>PAGE_H-15){ addFooter(); doc.addPage(); fillBg(); y=M; return true; } return false; }
    function addFooter(){
      doc.setFont('helvetica','normal'); doc.setFontSize(7.5);
      doc.setTextColor(...C.gray); doc.text('Generado por PupCare', M, PAGE_H-8);
    }

    // ── FONDO + ENCABEZADO ──
    fillBg();
    card(M, y, 16, 16, C.purple, 4);
    doc.setFontSize(11); doc.text('🐾', M+3.5, y+10.5);
    doc.setTextColor(...C.white); doc.setFont('helvetica','bold'); doc.setFontSize(17);
    doc.text('PupCare', M+20, y+6.5);
    doc.setFont('helvetica','normal'); doc.setFontSize(9.5); doc.setTextColor(...C.gray);
    doc.text('Historial Médico Veterinario', M+20, y+12);

    const now = new Date();
    doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(...C.purpleLt);
    doc.text('REPORTE GENERADO', PAGE_W-M, y+4, {align:'right'});
    doc.setFontSize(11); doc.setTextColor(...C.white);
    const fStr = `${now.getDate()} ${now.toLocaleDateString('es-ES',{month:'short'})} ${now.getFullYear()} · ${now.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}`;
    doc.text(fStr, PAGE_W-M, y+10, {align:'right'});
    y += 22;

    // ── TARJETA PRINCIPAL ──
    const heroH = 52;
    card(M, y, CW, heroH, C.cardTop, 4);
    const photoX=M+8, photoY=y+8, photoD=30;
    doc.setFillColor(...C.purple);
    doc.circle(photoX+photoD/2, photoY+photoD/2, photoD/2+1.5, 'F');
    if (petPhotoData) {
      try {
        doc.addImage(petPhotoData, 'JPEG', photoX, photoY, photoD, photoD, undefined, 'FAST');
      } catch(e) {
        doc.setFillColor(...C.card); doc.circle(photoX+photoD/2, photoY+photoD/2, photoD/2, 'F');
        doc.setFontSize(16); doc.text('🐾', photoX+photoD/2-4, photoY+photoD/2+3);
      }
    } else {
      doc.setFillColor(...C.card); doc.circle(photoX+photoD/2, photoY+photoD/2, photoD/2, 'F');
      doc.setFontSize(18); doc.text('🐾', photoX+photoD/2-4.5, photoY+photoD/2+3);
    }

    const infoX = photoX+photoD+8;
    doc.setTextColor(...C.white); doc.setFont('helvetica','bold'); doc.setFontSize(22);
    doc.text(pet.name, infoX, y+15);
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...C.gray);
    let metaLine = pet.breed || '';
    if (pet.birthDate) metaLine += (metaLine?'   ·   ':'') + calcAge(pet.birthDate);
    if (pet.currentWeight) metaLine += '   ·   ' + pet.currentWeight + ' ' + (pet.weightUnit||'kg');
    doc.text(metaLine, infoX, y+21);

    const col1X=infoX, col2X=infoX+52, dataY=y+30;
    function miniData(x,dy,label,value){
      doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...C.gray);
      doc.text(label.toUpperCase(), x, dy);
      doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...C.white);
      doc.text(value||'—', x, dy+5);
    }
    miniData(col1X, dataY, 'Nacimiento', pet.birthDate?formatDate(pet.birthDate):'—');
    miniData(col2X, dataY, 'Sexo', pet.sex||'—');
    miniData(col1X, dataY+11, 'Peso actual', pet.currentWeight?pet.currentWeight+' '+(pet.weightUnit||'kg'):'—');
    miniData(col2X, dataY+11, 'Edad', pet.birthDate?calcAge(pet.birthDate):'—');

    const badgeW=30, badgeH=20, badgeGap=3;
    const badgeStartX = PAGE_W-M-8-(badgeW*3+badgeGap*2);
    const badgeY = y+8;
    function medBadge(bx,num,label,color){
      card(bx, badgeY, badgeW, badgeH, C.card, 2.5);
      doc.setFont('helvetica','bold'); doc.setFontSize(15); doc.setTextColor(...color);
      doc.text(String(num), bx+badgeW/2, badgeY+9, {align:'center'});
      doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(...C.gray);
      doc.text(label, bx+badgeW/2, badgeY+15, {align:'center'});
    }
    medBadge(badgeStartX, vacSnap.size, 'Vacunas', C.blue);
    medBadge(badgeStartX+badgeW+badgeGap, dewSnap.size, 'Desparasit.', C.green);
    medBadge(badgeStartX+(badgeW+badgeGap)*2, vetSnap.size, 'Visitas Vet', C.amber);
    y += heroH+6;

    // ── INFO RÁPIDA (2 tarjetas) ──
    let nextVax=null;
    vacSnap.docs.forEach(d=>{ const nd=d.data().nextDate; if(nd&&(!nextVax||nd<nextVax)) nextVax=nd; });
    const lastDew = dewSnap.empty?null:dewSnap.docs[0].data();
    const infoCardW=(CW-6)/2, infoCardH=24;
    function infoCard(x,label,value,sub,valColor=C.white){
      card(x, y, infoCardW, infoCardH, C.card, 3);
      doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(...C.gray);
      doc.text(label, x+6, y+7);
      doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(...valColor);
      doc.text(value, x+6, y+14);
      doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...C.gray);
      doc.text(sub, x+6, y+20);
    }
    infoCard(M, 'Próxima vacuna', nextVax?formatDate(nextVax):'Sin pendientes',
      nextVax&&new Date(nextVax)<now?'Vencida':'Al día',
      nextVax&&new Date(nextVax)<now?C.amber:C.green);
    infoCard(M+infoCardW+6, 'Desparasitación', lastDew?'Activa':'Sin registro',
      lastDew&&lastDew.nextDate?'Próx: '+formatDate(lastDew.nextDate):'Sin próxima',
      lastDew?C.green:C.gray);
    y += infoCardH+6;

    // ── GRÁFICO DE PESO ──
    const weights = weightSnap.docs.map(d=>({ weight:parseFloat(d.data().weight), date:d.data().date||'', unit:d.data().unit||'kg' }));
    if (weights.length >= 2) {
      const chartH=62;
      checkPage(chartH+6);
      card(M, y, CW, chartH, C.card, 3);
      doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...C.white);
      doc.text('Historial de peso', M+6, y+9);
      doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(...C.gray);
      doc.text(`(últimos ${weights.length})`, M+42, y+9);
      doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...C.purpleLt);
      const curW = weights[weights.length-1];
      doc.text(`Peso actual: ${curW.weight} ${curW.unit}`, PAGE_W-M-6, y+9, {align:'right'});

      const gX=M+14, gY=y+15, gW=CW-24, gH=chartH-30;
      const wVals=weights.map(w=>w.weight);
      const maxW=Math.max(...wVals);
      const scaleMax=Math.ceil(maxW/10)*10||10, scaleMin=0;
      const scaleRange=scaleMax-scaleMin||1;

      doc.setFontSize(6.5); doc.setTextColor(...C.gray);
      const ySteps=4;
      for(let i=0;i<=ySteps;i++){
        const val=scaleMin+(scaleRange/ySteps)*i;
        const ly=gY+gH-(i/ySteps)*gH;
        doc.setDrawColor(...C.border); doc.setLineWidth(0.1);
        doc.line(gX, ly, gX+gW, ly);
        doc.text(String(Math.round(val)), gX-3, ly+1.5, {align:'right'});
      }

      const pts=weights.map((w,i)=>({
        x:gX+(weights.length===1?gW/2:(i/(weights.length-1))*gW),
        y:gY+gH-((w.weight-scaleMin)/scaleRange)*gH,
        w:w.weight, d:w.date, u:w.unit,
      }));

      try {
        doc.setFillColor(108,99,255);
        doc.setGState(new doc.GState({opacity:0.12}));
        for(let i=0;i<pts.length-1;i++){
          doc.triangle(pts[i].x,pts[i].y,pts[i+1].x,pts[i+1].y,pts[i].x,gY+gH,'F');
          doc.triangle(pts[i+1].x,pts[i+1].y,pts[i+1].x,gY+gH,pts[i].x,gY+gH,'F');
        }
        doc.setGState(new doc.GState({opacity:1}));
      } catch(e){}

      doc.setDrawColor(...C.purple); doc.setLineWidth(0.7);
      for(let i=0;i<pts.length-1;i++) doc.line(pts[i].x,pts[i].y,pts[i+1].x,pts[i+1].y);

      doc.setFontSize(6.5);
      pts.forEach(p=>{
        doc.setFillColor(...C.purple); doc.circle(p.x,p.y,1.3,'F');
        doc.setFillColor(...C.bg); doc.circle(p.x,p.y,0.6,'F');
        doc.setTextColor(...C.white); doc.setFont('helvetica','bold');
        doc.text(`${p.w} ${p.u}`, p.x, p.y-3, {align:'center'});
        if(p.d){
          doc.setTextColor(...C.gray); doc.setFont('helvetica','normal'); doc.setFontSize(5.5);
          doc.text(formatDate(p.d).replace(/ de /g,' '), p.x, gY+gH+5, {align:'center'});
          doc.setFontSize(6.5);
        }
      });
      y += chartH+6;
    }

    // ── TARJETAS DE SECCIONES ──
    function sectionCard(x,cy,w,icon,title,items,subtitle=''){
      const lineH=9, headH=14;
      const bodyH = items.length ? items.length*lineH+4 : 10;
      const totalH = headH+bodyH;
      card(x, cy, w, totalH, C.card, 3);
      doc.setFontSize(11); doc.text(icon, x+5, cy+9);
      doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...C.white);
      doc.text(title, x+13, cy+9);
      if(subtitle){
        doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...C.gray);
        doc.text(subtitle, x+13+doc.getTextWidth(title)+3, cy+9);
      }
      let iy=cy+headH+3;
      if(!items.length){
        doc.setFont('helvetica','italic'); doc.setFontSize(8); doc.setTextColor(...C.gray);
        doc.text('Sin registros', x+5, iy);
      } else {
        items.forEach(it=>{
          doc.setFillColor(...C.purple); doc.circle(x+6, iy-1.2, 0.8, 'F');
          doc.setFont('helvetica','bold'); doc.setFontSize(8.5); doc.setTextColor(...C.white);
          doc.text(it.title, x+9, iy);
          if(it.sub){
            doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...C.gray);
            const subLines=doc.splitTextToSize(it.sub, w-14);
            doc.text(subLines[0], x+9, iy+4);
          }
          iy += lineH;
        });
      }
      return totalH;
    }

    const vacItems = vacSnap.docs.map(d=>{ const v=d.data(); let s=formatDate(v.date); if(v.brand)s+=' · '+v.brand; if(v.nextDate)s+=' · Próx: '+formatDate(v.nextDate); return {title:v.name,sub:s}; });
    const dewItems = dewSnap.docs.map(d=>{ const w=d.data(); let s=formatDate(w.date); if(w.type)s+=' · '+w.type; if(w.dose)s+=' · '+w.dose; if(w.nextDate)s+=' · Próx: '+formatDate(w.nextDate); return {title:w.product,sub:s}; });
    const medItems = medSnap.docs.map(d=>{ const m=d.data(); const ended=m.endDate&&new Date(m.endDate+'T00:00:00')<now; const active=m.active!==false&&!ended; let s=''; if(m.dose)s+=m.dose; if(m.frequency)s+=' · '+m.frequency; return {title:`${m.name} ${active?'(Activo)':'(Finalizado)'}`,sub:s}; });
    const vetItems = vetSnap.docs.map(d=>{ const v=d.data(); let s=formatDate(v.date); if(v.vet)s+=' · Dr. '+v.vet; if(v.cost)s+=' · $'+v.cost; return {title:v.reason,sub:s}; });

    const colW=(CW-6)/2;
    checkPage(50);
    const h1=sectionCard(M, y, colW, '💉','Vacunas', vacItems);
    const h2=sectionCard(M+colW+6, y, colW, '🐛','Desparasitaciones', dewItems);
    y += Math.max(h1,h2)+6;

    checkPage(50);
    const h3=sectionCard(M, y, colW, '💊','Medicamentos', medItems);
    const h4=sectionCard(M+colW+6, y, colW, '🏥','Visitas veterinarias', vetItems);
    y += Math.max(h3,h4)+6;

    const noteItems = notesSnap.docs.map(d=>{ const n=d.data(); return {title:`${n.mood||'Nota'} — ${formatDate(n.date)}`, sub:n.text||''}; });
    checkPage(30);
    sectionCard(M, y, CW, '📝','Notas de comportamiento', noteItems, '(últimas 10)');

    addFooter();
    const totalPages=doc.internal.getNumberOfPages();
    for(let i=1;i<=totalPages;i++){
      doc.setPage(i);
      doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(...C.gray);
      doc.text(`Página ${i} de ${totalPages}`, PAGE_W-M, PAGE_H-8, {align:'right'});
    }

    const fileName=`Historial_${pet.name.replace(/\s+/g,'_')}_${now.toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    showLoading(false);
    showToast('✅ Reporte generado', 'success');

  } catch(e) {
    console.error('Error generando PDF:', e);
    showLoading(false);
    showToast('Error al generar el reporte', 'error');
  }
}

async function loadImageAsBase64(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 200;
        canvas.width=size; canvas.height=size;
        const ctx = canvas.getContext('2d');
        const min = Math.min(img.width, img.height);
        const sx=(img.width-min)/2, sy=(img.height-min)/2;
        // Recorte circular
        ctx.beginPath();
        ctx.arc(size/2, size/2, size/2, 0, Math.PI*2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } catch(e){ reject(e); }
    };
    img.onerror = reject;
    img.src = url.includes('cloudinary') ? url.replace('/upload/','/upload/w_200,h_200,c_fill/') : url;
  });
}
