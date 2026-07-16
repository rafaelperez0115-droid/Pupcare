// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🖼️ HERRAMIENTAS DE FOTO
// 1) Recortador: elegir el encuadre de la foto de perfil
//    (arrastrar para mover + control deslizante para acercar)
// 2) Visualizador: ver la foto de perfil a pantalla completa
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const PhotoTools = {

  // ═══════════ RECORTADOR ═══════════
  _crop: null,   // estado del recorte en curso

  // Abre el recortador. Devuelve una Promise con el Blob recortado
  // (o null si el usuario cancela).
  crop(file) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        const VP = Math.min(300, Math.floor(window.innerWidth * 0.78)); // viewport
        const base = Math.max(VP / img.width, VP / img.height);          // escala "cover"

        this._crop = {
          img, url, resolve, VP, base,
          zoom: 1,
          ox: (VP - img.width * base) / 2,   // centrada
          oy: (VP - img.height * base) / 2,
          dragging: false, lastX: 0, lastY: 0,
        };

        this._buildCropUI();
        this._applyTransform();
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  },

  _buildCropUI() {
    const c = this._crop;
    document.getElementById('cropOverlay')?.remove();

    const ov = document.createElement('div');
    ov.id = 'cropOverlay';
    ov.className = 'crop-overlay';
    ov.innerHTML = `
      <div class="crop-title">Ajusta el encuadre</div>
      <div class="crop-stage" style="width:${c.VP}px;height:${c.VP}px;">
        <div class="crop-viewport" id="cropViewport" style="width:${c.VP}px;height:${c.VP}px;">
          <img id="cropImg" src="${c.url}" alt="" draggable="false">
        </div>
      </div>
      <div class="crop-hint">Arrastra para mover · desliza para acercar</div>
      <input type="range" id="cropZoom" class="crop-zoom" min="100" max="300" value="100">
      <div class="crop-actions">
        <button class="btn-outline crop-btn" id="cropCancel">Cancelar</button>
        <button class="btn-primary crop-btn" id="cropOk">✅ Usar foto</button>
      </div>`;
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('crop-overlay-visible'));
    if (typeof lockBodyScroll === 'function') lockBodyScroll();

    // Arrastrar para mover (pointer events: dedo y ratón)
    const vp = document.getElementById('cropViewport');
    vp.addEventListener('pointerdown', (e) => {
      c.dragging = true; c.lastX = e.clientX; c.lastY = e.clientY;
      vp.setPointerCapture(e.pointerId);
    });
    vp.addEventListener('pointermove', (e) => {
      if (!c.dragging) return;
      c.ox += e.clientX - c.lastX;
      c.oy += e.clientY - c.lastY;
      c.lastX = e.clientX; c.lastY = e.clientY;
      this._applyTransform();
    });
    const stop = () => { c.dragging = false; };
    vp.addEventListener('pointerup', stop);
    vp.addEventListener('pointercancel', stop);

    // Zoom con el control deslizante (mantiene el centro)
    document.getElementById('cropZoom').addEventListener('input', (e) => {
      const nuevo = parseInt(e.target.value) / 100;
      const k1 = c.base * c.zoom, k2 = c.base * nuevo;
      const cx = c.VP / 2, cy = c.VP / 2;
      c.ox = cx - (cx - c.ox) * (k2 / k1);
      c.oy = cy - (cy - c.oy) * (k2 / k1);
      c.zoom = nuevo;
      this._applyTransform();
    });

    document.getElementById('cropCancel').onclick = () => this.cancelCrop();
    document.getElementById('cropOk').onclick = () => this._confirmCrop();
  },

  // Mantener la imagen dentro del marco y pintar
  _applyTransform() {
    const c = this._crop;
    if (!c) return;
    const k = c.base * c.zoom;
    const w = c.img.width * k, h = c.img.height * k;
    c.ox = Math.min(0, Math.max(c.VP - w, c.ox));
    c.oy = Math.min(0, Math.max(c.VP - h, c.oy));
    const el = document.getElementById('cropImg');
    if (el) el.style.cssText =
      `position:absolute;left:${c.ox}px;top:${c.oy}px;width:${w}px;height:${h}px;max-width:none;user-select:none;touch-action:none;`;
  },

  _confirmCrop() {
    const c = this._crop;
    const k = c.base * c.zoom;
    const OUT = 800;   // resolución final del recorte
    const canvas = document.createElement('canvas');
    canvas.width = OUT; canvas.height = OUT;
    canvas.getContext('2d').drawImage(
      c.img,
      -c.ox / k, -c.oy / k, c.VP / k, c.VP / k,   // zona elegida
      0, 0, OUT, OUT
    );
    canvas.toBlob((blob) => {
      this._closeCropUI();
      c.resolve(blob || null);
    }, 'image/jpeg', 0.9);
  },

  cancelCrop() {
    const c = this._crop;
    this._closeCropUI();
    if (c) c.resolve(null);
  },

  _closeCropUI() {
    const c = this._crop;
    const ov = document.getElementById('cropOverlay');
    if (ov) {
      ov.classList.remove('crop-overlay-visible');
      setTimeout(() => ov.remove(), 220);
    }
    if (c?.url) URL.revokeObjectURL(c.url);
    if (typeof unlockBodyScroll === 'function') unlockBodyScroll();
    this._crop = null;
  },

  // ═══════════ VISUALIZADOR ═══════════
  lightbox(url) {
    if (!url) return;
    document.getElementById('photoLightbox')?.remove();

    const lb = document.createElement('div');
    lb.id = 'photoLightbox';
    lb.className = 'photo-lightbox';
    lb.innerHTML = `
      <button class="lightbox-close" aria-label="Cerrar">✕</button>
      <img src="${url}" alt="Foto de perfil" class="lightbox-img">`;
    document.body.appendChild(lb);
    requestAnimationFrame(() => lb.classList.add('lightbox-visible'));
    if (typeof lockBodyScroll === 'function') lockBodyScroll();
    if (typeof haptic === 'function') haptic(6);

    // Cerrar tocando el fondo o la ✕
    lb.addEventListener('click', (e) => {
      if (e.target === lb || e.target.classList.contains('lightbox-close')) {
        this.closeLightbox();
      }
    });
  },

  closeLightbox() {
    const lb = document.getElementById('photoLightbox');
    if (!lb) return;
    lb.classList.remove('lightbox-visible');
    setTimeout(() => lb.remove(), 220);
    if (typeof unlockBodyScroll === 'function') unlockBodyScroll();
  },
};
