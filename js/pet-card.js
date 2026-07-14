// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🪪 TARJETA DE PERFIL COMPARTIBLE
// Genera una imagen elegante (1080x1350) con la foto, datos y
// estado de salud de la mascota. Para compartir con el veterinario,
// un cuidador, o en redes.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const PetCard = {
  W: 1080,
  H: 1350,
  APP_URL: 'rafaelperez0115-droid.github.io/Pupcare',

  // ── Compartir con el menú nativo ──
  async share() {
    await this._deliver('share');
  },

  // ── Descargar como imagen ──
  async download() {
    await this._deliver('download');
  },

  async _deliver(mode) {
    if (!Profile.data) { showToast('No hay mascota para compartir', 'error'); return; }
    showLoading(true);
    try {
      const blob = await this.buildImage();
      showLoading(false);

      const pet = Profile.data.name || 'mascota';
      const file = new File([blob], `pupcare-perfil-${pet.toLowerCase()}.png`, { type: 'image/png' });

      if (mode === 'share' && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `Perfil de ${pet}`,
            text: `🐾 Perfil de ${pet} · PupCare`,
          });
          haptic(15);
          return;
        } catch (e) {
          if (e.name === 'AbortError') return;
          // Si falla el share, cae a descarga
        }
      }

      // Descarga (directa o como respaldo del share)
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast('📥 Perfil descargado', 'success');

    } catch (e) {
      showLoading(false);
      console.error('Error al generar perfil:', e);
      showToast('No se pudo generar la tarjeta', 'error');
    }
  },

  // ── Consultar estado de salud para la tarjeta ──
  async healthSummary() {
    const out = { vax: 'Sin registros', vaxOk: null, dew: 'Sin registros', dewOk: null };
    try {
      const now = new Date(); now.setHours(0, 0, 0, 0);

      const nextFuture = (snap) => {
        let next = null, overdue = false;
        snap.docs.forEach(d => {
          const nd = d.data().nextDate;
          if (!nd) return;
          const dt = new Date(nd + 'T00:00:00');
          if (dt >= now) { if (!next || dt < next) next = dt; }
          else overdue = true;
        });
        return { next, overdue, empty: snap.empty };
      };

      const [vacSnap, dewSnap] = await Promise.all([
        subRef('vaccines').get(),
        subRef('dewormings').get(),
      ]);

      const v = nextFuture(vacSnap);
      if (!v.empty) {
        if (v.next)      { out.vax = 'Al día · próxima ' + formatDate(v.next.toISOString().slice(0,10)); out.vaxOk = true; }
        else if (v.overdue) { out.vax = 'Refuerzo pendiente'; out.vaxOk = false; }
        else             { out.vax = 'Registradas'; out.vaxOk = true; }
      }

      const d = nextFuture(dewSnap);
      if (!d.empty) {
        if (d.next)      { out.dew = 'Al día · próxima ' + formatDate(d.next.toISOString().slice(0,10)); out.dewOk = true; }
        else if (d.overdue) { out.dew = 'Refuerzo pendiente'; out.dewOk = false; }
        else             { out.dew = 'Registradas'; out.dewOk = true; }
      }
    } catch (e) { /* sin datos de salud, la tarjeta sale igual */ }
    return out;
  },

  // ── Construir la imagen ──
  async buildImage() {
    const pet = Profile.data;
    const health = await this.healthSummary();

    const c = document.createElement('canvas');
    c.width = this.W; c.height = this.H;
    const ctx = c.getContext('2d');
    const cx = this.W / 2;

    // Fondo con degradado
    const bg = ctx.createLinearGradient(0, 0, this.W, this.H);
    bg.addColorStop(0, '#131a3a');
    bg.addColorStop(1, '#0a0e24');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, this.W, this.H);

    // Halo decorativo detrás de la foto
    const halo = ctx.createRadialGradient(cx, 420, 80, cx, 420, 420);
    halo.addColorStop(0, 'rgba(108,99,255,0.30)');
    halo.addColorStop(1, 'rgba(108,99,255,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 60, this.W, 760);

    // Marca
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '600 32px system-ui, -apple-system, sans-serif';
    ctx.fillText('🐾  P U P C A R E', cx, 96);

    // Foto circular
    const r = 225, cy = 420;
    const photo = await this.loadImage(pet.photoUrl);
    if (photo) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r + 10, 0, Math.PI * 2);
      ctx.strokeStyle = '#6C63FF';
      ctx.lineWidth = 7;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      this.drawCover(ctx, photo, cx - r, cy - r, r * 2, r * 2);
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      ctx.fill();
      ctx.font = '190px system-ui';
      ctx.fillText('🐕', cx, cy + 66);
    }

    // Nombre
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 88px system-ui, -apple-system, sans-serif';
    ctx.fillText(this.clip(pet.name || 'Mi mascota', 15), cx, 770);

    // Raza · sexo · edad
    const sub = [pet.breed, pet.sex, pet.birthDate ? calcAge(pet.birthDate) : null]
      .filter(Boolean).join('  ·  ');
    if (sub) {
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '400 40px system-ui, -apple-system, sans-serif';
      ctx.fillText(this.clip(sub, 44), cx, 832);
    }

    // Fila de datos: Peso · Altura · Nacimiento
    const stats = [
      { label: 'PESO',       value: pet.currentWeight ? `${pet.currentWeight} ${pet.weightUnit || 'kg'}` : '—' },
      { label: 'ALTURA',     value: pet.currentHeight ? `${pet.currentHeight} ${pet.heightUnit || 'cm'}` : '—' },
      { label: 'NACIMIENTO', value: pet.birthDate ? formatDate(pet.birthDate) : '—' },
    ];
    const boxW = 300, boxH = 130, gap = 24;
    const startX = cx - (boxW * 3 + gap * 2) / 2;
    stats.forEach((s, i) => {
      const x = startX + i * (boxW + gap);
      this.roundRect(ctx, x, 890, boxW, boxH, 24, 'rgba(255,255,255,0.06)');
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font = '600 26px system-ui, -apple-system, sans-serif';
      ctx.fillText(s.label, x + boxW / 2, 940);
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 40px system-ui, -apple-system, sans-serif';
      ctx.fillText(this.clip(s.value, 14), x + boxW / 2, 992);
    });

    // Estado de salud
    const rows = [
      { icon: '💉', label: 'Vacunas', text: health.vax, ok: health.vaxOk },
      { icon: '🐛', label: 'Desparasitación', text: health.dew, ok: health.dewOk },
    ];
    rows.forEach((row, i) => {
      const y = 1085 + i * 84;
      this.roundRect(ctx, 90, y, this.W - 180, 68, 20, 'rgba(255,255,255,0.05)');
      ctx.textAlign = 'left';
      ctx.font = '400 34px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${row.icon}  ${row.label}`, 122, y + 45);
      ctx.textAlign = 'right';
      ctx.fillStyle = row.ok === false ? '#fbbf24' : row.ok ? '#34d399' : 'rgba(255,255,255,0.5)';
      ctx.font = '700 32px system-ui, -apple-system, sans-serif';
      ctx.fillText(this.clip(row.text, 34), this.W - 122, y + 45);
      ctx.textAlign = 'center';
    });

    // Pie
    ctx.fillStyle = '#a78bfa';
    ctx.font = '700 30px system-ui, -apple-system, sans-serif';
    ctx.fillText(this.APP_URL, cx, 1296);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '400 24px system-ui, -apple-system, sans-serif';
    ctx.fillText('Generado el ' + formatDate(today()), cx, 1330);

    return new Promise((resolve, reject) => {
      c.toBlob(b => b ? resolve(b) : reject(new Error('toBlob falló')), 'image/png', 0.95);
    });
  },

  // ── Helpers ──
  loadImage(url) {
    return new Promise(resolve => {
      if (!url) return resolve(null);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  },

  drawCover(ctx, img, x, y, w, h) {
    const ir = img.width / img.height, br = w / h;
    let sw, sh, sx, sy;
    if (ir > br) { sh = img.height; sw = sh * br; sx = (img.width - sw) / 2; sy = 0; }
    else { sw = img.width; sh = sw / br; sx = 0; sy = (img.height - sh) / 2; }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  },

  roundRect(ctx, x, y, w, h, r, fill) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  },

  clip(str, max) {
    const s = String(str);
    return s.length > max ? s.slice(0, max - 1) + '…' : s;
  },
};
