// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💰 CONTROL DE GASTOS
// Registro de lo invertido en la mascota, con resumen por
// categoría y totales del mes y del año.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const Expenses = {
  CATEGORIES: {
    'Veterinario':  '🏥',
    'Comida':       '🍖',
    'Medicamentos': '💊',
    'Cuidados':     '🛁',
    'Accesorios':   '🦴',
    'Otro':         '📦',
  },

  CURRENCY: 'RD$',

  // ── Abrir el panel de gastos ──
  async open() {
    openModal('💰 Gastos', '<div style="text-align:center;padding:20px;color:var(--text2);">Cargando...</div>');

    try {
      const snap = await subRef('expenses').orderBy('date', 'desc').limit(100).get();
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      const now      = new Date();
      const thisMon  = now.toISOString().slice(0, 7);   // YYYY-MM
      const thisYear = String(now.getFullYear());

      const sum = (arr) => arr.reduce((t, e) => t + (parseFloat(e.amount) || 0), 0);
      const totalMonth = sum(items.filter(e => (e.date || '').startsWith(thisMon)));
      const totalYear  = sum(items.filter(e => (e.date || '').startsWith(thisYear)));
      const totalAll   = sum(items);

      // Totales por categoría (del año en curso)
      const byCat = {};
      items.filter(e => (e.date || '').startsWith(thisYear)).forEach(e => {
        const cat = e.category || 'Otro';
        byCat[cat] = (byCat[cat] || 0) + (parseFloat(e.amount) || 0);
      });
      const cats = Object.entries(byCat).sort(([,a],[,b]) => b - a);
      const maxCat = cats.length ? cats[0][1] : 0;

      document.getElementById('modalBody').innerHTML = `
        <!-- Totales -->
        <div class="exp-totals">
          <div class="exp-total">
            <div class="exp-total-label">Este mes</div>
            <div class="exp-total-val">${this.fmt(totalMonth)}</div>
          </div>
          <div class="exp-total">
            <div class="exp-total-label">Este año</div>
            <div class="exp-total-val">${this.fmt(totalYear)}</div>
          </div>
          <div class="exp-total">
            <div class="exp-total-label">Histórico</div>
            <div class="exp-total-val">${this.fmt(totalAll)}</div>
          </div>
        </div>

        <button class="btn-primary btn-full" onclick="Expenses.openForm()" style="margin-bottom:16px;">
          + Registrar gasto
        </button>

        ${cats.length ? `
          <div class="growth-section-title">Por categoría (${thisYear})</div>
          <div class="exp-cats">
            ${cats.map(([cat, amt]) => `
              <div class="exp-cat">
                <div class="exp-cat-head">
                  <span>${this.CATEGORIES[cat] || '📦'} ${sanitize(cat)}</span>
                  <strong>${this.fmt(amt)}</strong>
                </div>
                <div class="exp-cat-bar">
                  <div class="exp-cat-fill" style="width:${maxCat ? (amt/maxCat*100) : 0}%;"></div>
                </div>
              </div>`).join('')}
          </div>` : ''}

        <div class="growth-section-title">Historial</div>
        ${items.length ? `
          <div class="exp-list">
            ${items.slice(0, 30).map(e => this.row(e)).join('')}
          </div>` : `
          <div class="empty-state" style="padding:24px 16px;">
            <div class="empty-icon">💰</div>
            <p>Aún no hay gastos registrados.</p>
          </div>`}
        <div style="height:16px;"></div>`;

    } catch (e) {
      console.error(e);
      document.getElementById('modalBody').innerHTML =
        '<div class="empty-state" style="padding:24px;"><p>No se pudieron cargar los gastos.</p></div>';
    }
  },

  row(e) {
    const icon = this.CATEGORIES[e.category] || '📦';
    return `
      <div class="exp-row">
        <span class="exp-row-icon">${icon}</span>
        <div class="exp-row-info">
          <div class="exp-row-cat">${sanitize(e.category || 'Otro')}</div>
          <div class="exp-row-sub">
            ${e.date ? formatDate(e.date) : '—'}${e.note ? ' · ' + sanitize(e.note) : ''}
          </div>
        </div>
        <span class="exp-row-amt">${this.fmt(e.amount)}</span>
        <button class="btn-delete" onclick="Expenses.remove('${e.id}')" aria-label="Eliminar" title="Eliminar">🗑️</button>
      </div>`;
  },

  // ── Formulario de registro ──
  openForm() {
    const opts = Object.entries(this.CATEGORIES)
      .map(([c, i]) => `<option value="${c}">${i} ${c}</option>`).join('');

    openModal('Registrar Gasto', `
      <div class="field-row">
        <div class="field">
          <label>Monto</label>
          <input type="number" id="eAmount" placeholder="0.00" min="0" step="0.01" inputmode="decimal">
        </div>
        <div class="field">
          <label>Fecha</label>
          <input type="date" id="eDate" value="${today()}">
        </div>
      </div>
      <div class="field">
        <label>Categoría</label>
        <select id="eCategory">${opts}</select>
      </div>
      <div class="field">
        <label>Nota (opcional)</label>
        <input type="text" id="eNote" placeholder="Ej: Consulta y vacuna">
      </div>
      <button class="btn-primary btn-full" onclick="Expenses.save()" style="margin-bottom:16px;">
        ✅ Guardar gasto
      </button>
    `);
  },

  async save() {
    const amount = parseFloat(document.getElementById('eAmount')?.value);
    const date   = document.getElementById('eDate')?.value;
    if (!amount || amount <= 0) { showToast('Ingresa un monto válido', 'error'); return; }
    if (!date) { showToast('La fecha es requerida', 'error'); return; }

    showLoading(true);
    try {
      await subRef('expenses').add({
        amount,
        date,
        category: document.getElementById('eCategory')?.value || 'Otro',
        note: sanitize(document.getElementById('eNote')?.value.trim() || ''),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      if (typeof invalidateCache === 'function') invalidateCache('expenses');
      showToast('✅ Gasto registrado', 'success');
      await this.open();   // volver al panel actualizado
    } catch (e) {
      showToast('Error al guardar', 'error');
    } finally {
      showLoading(false);
    }
  },

  remove(id) {
    showConfirm('¿Eliminar gasto?', 'Esta acción no se puede deshacer.', async () => {
      showLoading(true);
      try {
        await subRef('expenses').doc(id).delete();
        if (typeof invalidateCache === 'function') invalidateCache('expenses');
        showToast('Gasto eliminado', 'success');
        await this.open();
      } catch (e) {
        showToast('Error al eliminar', 'error');
      } finally {
        showLoading(false);
      }
    });
  },

  fmt(n) {
    const v = parseFloat(n) || 0;
    return `${this.CURRENCY}${v.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  },
};
