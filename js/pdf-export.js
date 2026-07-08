// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📄 pdf-export.js — Exportar historial médico a PDF
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
  showToast('📄 Generando PDF...', 'info', 6000);

  try {
    const pet = Profile.data;

    // Cargar todos los datos médicos en paralelo
    const [vacSnap, dewSnap, vetSnap, medSnap, weightSnap, notesSnap] = await Promise.all([
      subRef('vaccines').orderBy('date', 'desc').get(),
      subRef('dewormings').orderBy('date', 'desc').get(),
      subRef('vetVisits').orderBy('date', 'desc').get(),
      subRef('medications').orderBy('createdAt', 'desc').get(),
      subRef('weightHistory').orderBy('recordedAt', 'desc').limit(10).get(),
      subRef('behaviorNotes').orderBy('date', 'desc').limit(10).get(),
    ]);

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    const PAGE_W  = 210;
    const MARGIN  = 15;
    const CONTENT_W = PAGE_W - MARGIN * 2;
    let y = MARGIN;

    // Colores
    const PURPLE = [108, 99, 255];
    const DARK   = [30, 30, 46];
    const GRAY   = [120, 120, 140];

    // ── Helper: nueva página si es necesario ──
    function checkPage(needed = 20) {
      if (y + needed > 280) {
        doc.addPage();
        y = MARGIN;
        return true;
      }
      return false;
    }

    // ── Helper: título de sección ──
    function sectionTitle(icon, title) {
      checkPage(18);
      y += 4;
      doc.setFillColor(...PURPLE);
      doc.roundedRect(MARGIN, y, CONTENT_W, 9, 1.5, 1.5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`${icon}  ${title}`, MARGIN + 3, y + 6);
      y += 13;
      doc.setTextColor(...DARK);
    }

    // ── Helper: fila de datos ──
    function dataRow(label, value) {
      checkPage(7);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...DARK);
      doc.text(label, MARGIN + 2, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...GRAY);
      const valLines = doc.splitTextToSize(value || '—', CONTENT_W - 45);
      doc.text(valLines, MARGIN + 42, y);
      y += Math.max(6, valLines.length * 5);
    }

    // ── Helper: mensaje "sin registros" ──
    function emptyMsg() {
      checkPage(7);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(...GRAY);
      doc.text('Sin registros', MARGIN + 2, y);
      y += 7;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ENCABEZADO
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━
    doc.setFillColor(...PURPLE);
    doc.rect(0, 0, PAGE_W, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('PupCare', MARGIN, 15);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('Historial Médico Veterinario', MARGIN, 23);
    doc.setFontSize(8);
    const now = new Date();
    doc.text(`Generado: ${now.toLocaleDateString('es-ES')} ${now.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}`, PAGE_W - MARGIN, 15, { align: 'right' });

    y = 42;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━
    // DATOS DE LA MASCOTA
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━
    sectionTitle('🐾', 'DATOS DE LA MASCOTA');
    dataRow('Nombre:', pet.name);
    dataRow('Raza:', pet.breed || '—');
    dataRow('Sexo:', pet.sex || '—');
    dataRow('Nacimiento:', pet.birthDate ? formatDate(pet.birthDate) : '—');
    if (pet.birthDate) dataRow('Edad:', calcAge(pet.birthDate));
    dataRow('Peso actual:', pet.currentWeight ? `${pet.currentWeight} ${pet.weightUnit||'kg'}` : '—');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━
    // VACUNAS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━
    sectionTitle('💉', 'VACUNAS');
    if (vacSnap.empty) emptyMsg();
    else vacSnap.docs.forEach(d => {
      const v = d.data();
      checkPage(10);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...DARK);
      doc.text(`• ${v.name}`, MARGIN + 2, y);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRAY); doc.setFontSize(8);
      let line = formatDate(v.date);
      if (v.brand) line += ` · ${v.brand}`;
      if (v.nextDate) line += ` · Próxima: ${formatDate(v.nextDate)}`;
      doc.text(line, MARGIN + 5, y + 4.5);
      y += 9;
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━
    // DESPARASITACIONES
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━
    sectionTitle('🐛', 'DESPARASITACIONES');
    if (dewSnap.empty) emptyMsg();
    else dewSnap.docs.forEach(d => {
      const w = d.data();
      checkPage(10);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...DARK);
      doc.text(`• ${w.product}`, MARGIN + 2, y);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRAY); doc.setFontSize(8);
      let line = formatDate(w.date);
      if (w.type) line += ` · ${w.type}`;
      if (w.dose) line += ` · ${w.dose}`;
      if (w.nextDate) line += ` · Próxima: ${formatDate(w.nextDate)}`;
      doc.text(line, MARGIN + 5, y + 4.5);
      y += 9;
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━
    // MEDICAMENTOS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━
    sectionTitle('💊', 'MEDICAMENTOS');
    if (medSnap.empty) emptyMsg();
    else medSnap.docs.forEach(d => {
      const m = d.data();
      checkPage(11);
      const ended = m.endDate && new Date(m.endDate+'T00:00:00') < new Date();
      const active = m.active !== false && !ended;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...DARK);
      doc.text(`• ${m.name} ${active ? '(Activo)' : '(Finalizado)'}`, MARGIN + 2, y);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRAY); doc.setFontSize(8);
      let line = '';
      if (m.dose) line += m.dose;
      if (m.frequency) line += ` · ${m.frequency}`;
      if (m.startDate) line += ` · Desde ${formatDate(m.startDate)}`;
      if (m.endDate) line += ` hasta ${formatDate(m.endDate)}`;
      doc.text(doc.splitTextToSize(line, CONTENT_W - 5), MARGIN + 5, y + 4.5);
      y += 10;
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━
    // VISITAS VETERINARIAS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━
    sectionTitle('🏥', 'VISITAS VETERINARIAS');
    if (vetSnap.empty) emptyMsg();
    else vetSnap.docs.forEach(d => {
      const v = d.data();
      checkPage(16);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...DARK);
      doc.text(`• ${v.reason}`, MARGIN + 2, y);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRAY); doc.setFontSize(8);
      let line = formatDate(v.date);
      if (v.vet) line += ` · Dr. ${v.vet}`;
      if (v.cost) line += ` · $${v.cost}`;
      doc.text(line, MARGIN + 5, y + 4.5);
      y += 8;
      if (v.diagnosis) {
        checkPage(8);
        doc.setFont('helvetica', 'italic'); doc.setFontSize(8);
        const diag = doc.splitTextToSize(`Diagnóstico: ${v.diagnosis}`, CONTENT_W - 8);
        doc.text(diag, MARGIN + 5, y);
        y += diag.length * 4 + 1;
      }
      if (v.treatment) {
        checkPage(8);
        doc.setFont('helvetica', 'italic'); doc.setFontSize(8);
        const tr = doc.splitTextToSize(`Tratamiento: ${v.treatment}`, CONTENT_W - 8);
        doc.text(tr, MARGIN + 5, y);
        y += tr.length * 4 + 1;
      }
      y += 3;
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━
    // HISTORIAL DE PESO
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━
    sectionTitle('⚖️', 'HISTORIAL DE PESO (últimos 10)');
    if (weightSnap.empty) emptyMsg();
    else weightSnap.docs.forEach(d => {
      const w = d.data();
      checkPage(6);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...GRAY);
      doc.text(`${w.date ? formatDate(w.date) : '—'}`, MARGIN + 2, y);
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...DARK);
      doc.text(`${w.weight} ${w.unit || 'kg'}`, MARGIN + 50, y);
      y += 6;
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━
    // NOTAS DE COMPORTAMIENTO
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━
    sectionTitle('📝', 'NOTAS DE COMPORTAMIENTO (últimas 10)');
    if (notesSnap.empty) emptyMsg();
    else notesSnap.docs.forEach(d => {
      const n = d.data();
      checkPage(11);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...DARK);
      doc.text(`• ${n.mood || 'Nota'} — ${formatDate(n.date)}`, MARGIN + 2, y);
      y += 5;
      if (n.text) {
        doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRAY); doc.setFontSize(8);
        const txt = doc.splitTextToSize(n.text, CONTENT_W - 8);
        doc.text(txt, MARGIN + 5, y);
        y += txt.length * 4 + 2;
      }
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PIE DE PÁGINA en todas las páginas
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...GRAY);
      doc.text('Generado por PupCare 🐾', MARGIN, 290);
      doc.text(`Página ${i} de ${totalPages}`, PAGE_W - MARGIN, 290, { align: 'right' });
    }

    // Guardar
    const fileName = `Historial_${pet.name.replace(/\s+/g,'_')}_${now.toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

    showLoading(false);
    showToast('✅ PDF generado correctamente', 'success');

  } catch (e) {
    console.error('Error generando PDF:', e);
    showLoading(false);
    showToast('Error al generar el PDF', 'error');
  }
}
