// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📤 REPORTE COMPARTIBLE (Instagram / TikTok / WhatsApp)
// Genera una imagen 1080x1920 (formato Stories/Reels) con el
// resultado del análisis y la comparte con el menú nativo.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ShareReport = {
  W: 1080,
  H: 1920,
  APP_URL: 'rafaelperez0115-droid.github.io/Pupcare',

  _last: null,   // datos del último análisis (para regenerar)

  // Guardar los datos del análisis actual
  remember(payload) {
    this._last = payload;
  },

  // ── Punto de entrada desde el botón ──
  async share() {
    if (!this._last) { showToast('No hay análisis para compartir', 'error'); return; }
    showLoading(true);
    try {
      const blob = await this.buildImage(this._last);
      showLoading(false);
      await this.deliver(blob);
    } catch (e) {
      showLoading(false);
      console.error('Error al generar reporte:', e);
      showToast('No se pudo generar el reporte', 'error');
    }
  },

  // ── Compartir (o descargar si no se puede) ──
  async deliver(blob) {
    const file = new File([blob], `pupcare-${Date.now()}.png`, { type: 'image/png' });
    const pet  = Profile.data?.name || 'mi perro';

    // Web Share API con archivos (móvil): abre Instagram, TikTok, WhatsApp...
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Crecimiento de ${pet}`,
          text: `El progreso de ${pet} 🐾 Analizado con PupCare`,
        });
        haptic(15);
        return;
      } catch (e) {
        if (e.name === 'AbortError') return;  // el usuario canceló
      }
    }

    // Respaldo: descargar la imagen
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pupcare-${pet.toLowerCase()}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('📥 Imagen descargada — súbela a tus redes', 'success');
  },

  // ── Construir la imagen en canvas ──
  async buildImage(d) {
    const { score, scoreLabel, growthPct, summary, monthLabel, statusHex } = d;
    const pet = Profile.data || {};

    const c = document.createElement('canvas');
    c.width = this.W; c.height = this.H;
    const ctx = c.getContext('2d');

    // ── Fondo con degradado ──
    const bg = ctx.createLinearGradient(0, 0, this.W, this.H);
    bg.addColorStop(0, '#0f1730');
    bg.addColorStop(0.5, '#131a3a');
    bg.addColorStop(1, '#0a0e24');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, this.W, this.H);

    // Halo decorativo
    const halo = ctx.createRadialGradient(this.W/2, 760, 60, this.W/2, 760, 460);
    halo.addColorStop(0, 'rgba(108,99,255,0.28)');
    halo.addColorStop(1, 'rgba(108,99,255,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 300, this.W, 900);

    // ── Encabezado: marca ──
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '600 34px system-ui, -apple-system, sans-serif';
    ctx.fillText('🐾  P U P C A R E', this.W/2, 130);

    // ── Foto de la mascota (círculo) ──
    const photo = await this.loadImage(pet.photoUrl);
    const cx = this.W/2, cy = 400, r = 175;
    if (photo) {
      ctx.save();
      // Anillo exterior
      ctx.beginPath();
      ctx.arc(cx, cy, r + 9, 0, Math.PI*2);
      ctx.strokeStyle = statusHex;
      ctx.lineWidth = 6;
      ctx.stroke();
      // Foto recortada en círculo
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI*2);
      ctx.clip();
      this.drawCover(ctx, photo, cx - r, cy - r, r*2, r*2);
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fill();
      ctx.font = '150px system-ui';
      ctx.fillText('🐕', cx, cy + 52);
    }

    // ── Nombre y datos ──
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 82px system-ui, -apple-system, sans-serif';
    ctx.fillText(this.clip(pet.name || 'Mi perro', 16), cx, 690);

    const sub = [pet.breed, pet.birthDate ? calcAge(pet.birthDate) : null]
      .filter(Boolean).join('  ·  ');
    if (sub) {
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '400 38px system-ui, -apple-system, sans-serif';
      ctx.fillText(this.clip(sub, 42), cx, 748);
    }

    // ── Anillo de puntaje ──
    const ry = 1000, rr = 145;
    ctx.beginPath();
    ctx.arc(cx, ry, rr, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(255,255,255,0.09)';
    ctx.lineWidth = 22;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, ry, rr, -Math.PI/2, -Math.PI/2 + (Math.PI*2 * score/100));
    ctx.strokeStyle = statusHex;
    ctx.lineWidth = 22;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.fillStyle = statusHex;
    ctx.font = '800 108px system-ui, -apple-system, sans-serif';
    ctx.fillText(String(score), cx, ry + 22);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '600 34px system-ui, -apple-system, sans-serif';
    ctx.fillText('/100', cx, ry + 72);

    ctx.fillStyle = statusHex;
    ctx.font = '700 48px system-ui, -apple-system, sans-serif';
    ctx.fillText(scoreLabel, cx, ry + 210);

    // ── Métricas ──
    const my = 1290;
    this.roundRect(ctx, 90, my, this.W - 180, 130, 28, 'rgba(255,255,255,0.05)');
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '600 30px system-ui, -apple-system, sans-serif';
    ctx.fillText('CRECIMIENTO ESTIMADO', cx, my + 50);
    ctx.fillStyle = '#a78bfa';
    ctx.font = '800 58px system-ui, -apple-system, sans-serif';
    ctx.fillText(`+${growthPct}%`, cx, my + 108);

    // ── Resumen ──
    if (summary) {
      ctx.fillStyle = 'rgba(255,255,255,0.72)';
      ctx.font = '400 36px system-ui, -apple-system, sans-serif';
      this.wrapText(ctx, summary, cx, 1510, this.W - 200, 50, 3);
    }

    // ── Pie: aviso + enlace ──
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '400 26px system-ui, -apple-system, sans-serif';
    ctx.fillText('Análisis generado por IA · No sustituye al veterinario', cx, 1770);

    ctx.fillStyle = '#a78bfa';
    ctx.font = '700 32px system-ui, -apple-system, sans-serif';
    ctx.fillText(this.APP_URL, cx, 1830);

    if (monthLabel) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '400 26px system-ui, -apple-system, sans-serif';
      ctx.fillText(monthLabel, cx, 1880);
    }

    return new Promise((resolve, reject) => {
      c.toBlob(b => b ? resolve(b) : reject(new Error('toBlob falló')), 'image/png', 0.95);
    });
  },

  // ── Helpers ──

  // Cargar imagen con CORS (necesario para no "manchar" el canvas)
  loadImage(url) {
    return new Promise(resolve => {
      if (!url) return resolve(null);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload  = () => resolve(img);
      img.onerror = () => resolve(null);   // si falla, seguimos sin foto
      img.src = url;
    });
  },

  // Dibujar imagen tipo object-fit: cover
  drawCover(ctx, img, x, y, w, h) {
    const ir = img.width / img.height;
    const br = w / h;
    let sw, sh, sx, sy;
    if (ir > br) {
      sh = img.height; sw = sh * br;
      sx = (img.width - sw) / 2; sy = 0;
    } else {
      sw = img.width; sh = sw / br;
      sx = 0; sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  },

  roundRect(ctx, x, y, w, h, r, fill) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y,     x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x,     y + h, r);
    ctx.arcTo(x,     y + h, x,     y,     r);
    ctx.arcTo(x,     y,     x + w, y,     r);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  },

  wrapText(ctx, text, x, y, maxW, lineH, maxLines) {
    const words = String(text).split(' ');
    let line = '', lines = 0;
    for (let i = 0; i < words.length; i++) {
      const test = line + words[i] + ' ';
      if (ctx.measureText(test).width > maxW && line) {
        lines++;
        if (lines >= maxLines) {
          ctx.fillText(line.trim() + '…', x, y);
          return;
        }
        ctx.fillText(line.trim(), x, y);
        line = words[i] + ' ';
        y += lineH;
      } else {
        line = test;
      }
    }
    if (line.trim()) ctx.fillText(line.trim(), x, y);
  },

  clip(str, max) {
    const s = String(str);
    return s.length > max ? s.slice(0, max - 1) + '…' : s;
  },
};
