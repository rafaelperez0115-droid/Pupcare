/**
 * Módulo de Salud
 * Gestión de vacunas, desparasitaciones, medicamentos y visitas veterinarias
 * @module modules/health
 */

const Health = {
  /**
   * Cache de datos de salud
   */
  healthData: {
    vaccines: [],
    dewormings: [],
    medications: [],
    vetVisits: []
  },

  /**
   * Carga todos los datos de salud de una mascota
   * @param {string} petId - ID de la mascota
   * @returns {Promise<void>}
   */
  async loadHealthData(petId) {
    showLoading(true);
    try {
      const [vaccines, dewormings, medications, vetVisits] = await Promise.all([
        this._getSubcollection(petId, 'vaccines'),
        this._getSubcollection(petId, 'dewormings'),
        this._getSubcollection(petId, 'medications'),
        this._getSubcollection(petId, 'vetVisits')
      ]);

      this.healthData = { vaccines, dewormings, medications, vetVisits };

      this.renderVaccines(vaccines);
      this.renderDewormings(dewormings);
      this.renderMedications(medications);
      this.renderVetVisits(vetVisits);

      Logger.info('Datos de salud cargados', {
        petId,
        vaccines: vaccines.length,
        medications: medications.length
      });
    } catch (error) {
      Logger.error('Error al cargar datos de salud', error);
      showToast('❌ Error al cargar datos de salud', 'error');
    } finally {
      showLoading(false);
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 💉 VACUNAS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Guarda una vacuna en Firestore
   * @param {string} petId - ID de la mascota
   * @param {object} vaccineData - Datos de la vacuna
   * @returns {Promise<void>}
   */
  async saveVaccine(petId, vaccineData) {
    const validation = validateVaccineData(vaccineData);
    if (!validation.valid) {
      showToast(`❌ ${validation.errors[0]}`, 'error');
      return;
    }

    showLoading(true);
    try {
      await firebase.firestore()
        .collection('pets').doc(petId)
        .collection('vaccines')
        .add({
          name: sanitizeText(vaccineData.name),
          date: vaccineData.date,
          nextDate: vaccineData.nextDate || null,
          brand: sanitizeText(vaccineData.brand || ''),
          batch: sanitizeText(vaccineData.batch || ''),
          vet: sanitizeText(vaccineData.vet || ''),
          notes: sanitizeText(vaccineData.notes || ''),
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

      Logger.info('Vacuna guardada', { petId, name: vaccineData.name });
      showToast(`✅ Vacuna "${vaccineData.name}" registrada`, 'success');

      await this.loadHealthData(petId);
      closeDrawer();
    } catch (error) {
      Logger.error('Error al guardar vacuna', error);
      showToast('❌ Error al guardar vacuna', 'error');
    } finally {
      showLoading(false);
    }
  },

  /**
   * Elimina una vacuna
   * @param {string} petId
   * @param {string} vaccineId
   */
  async deleteVaccine(petId, vaccineId) {
    showConfirm(
      '¿Eliminar vacuna?',
      'Esta acción no se puede deshacer.',
      async () => {
        showLoading(true);
        try {
          await firebase.firestore()
            .collection('pets').doc(petId)
            .collection('vaccines').doc(vaccineId)
            .delete();

          showToast('🗑️ Vacuna eliminada', 'info');
          await this.loadHealthData(petId);
        } catch (error) {
          Logger.error('Error al eliminar vacuna', error);
          showToast('❌ Error al eliminar', 'error');
        } finally {
          showLoading(false);
        }
      }
    );
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🐛 DESPARASITACIÓN
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Guarda un registro de desparasitación
   * @param {string} petId
   * @param {object} dewormingData
   */
  async saveDeworming(petId, dewormingData) {
    const nameValidation = validateRequired(dewormingData.product, 'Producto');
    if (!nameValidation.valid) {
      showToast(`❌ ${nameValidation.message}`, 'error');
      return;
    }

    showLoading(true);
    try {
      await firebase.firestore()
        .collection('pets').doc(petId)
        .collection('dewormings')
        .add({
          product: sanitizeText(dewormingData.product),
          type: dewormingData.type || 'interna', // interna, externa, ambas
          date: dewormingData.date,
          nextDate: dewormingData.nextDate || null,
          dose: dewormingData.dose || '',
          notes: sanitizeText(dewormingData.notes || ''),
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

      Logger.info('Desparasitación guardada', { petId });
      showToast('✅ Desparasitación registrada', 'success');

      await this.loadHealthData(petId);
      closeDrawer();
    } catch (error) {
      Logger.error('Error al guardar desparasitación', error);
      showToast('❌ Error al guardar', 'error');
    } finally {
      showLoading(false);
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 💊 MEDICAMENTOS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Guarda un medicamento
   * @param {string} petId
   * @param {object} medData
   */
  async saveMedication(petId, medData) {
    const nameValidation = validateRequired(medData.name, 'Nombre del medicamento');
    if (!nameValidation.valid) {
      showToast(`❌ ${nameValidation.message}`, 'error');
      return;
    }

    showLoading(true);
    try {
      await firebase.firestore()
        .collection('pets').doc(petId)
        .collection('medications')
        .add({
          name: sanitizeText(medData.name),
          dose: sanitizeText(medData.dose || ''),
          frequency: sanitizeText(medData.frequency || ''),
          startDate: medData.startDate || null,
          endDate: medData.endDate || null,
          reason: sanitizeText(medData.reason || ''),
          active: medData.active !== false,
          notes: sanitizeText(medData.notes || ''),
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

      Logger.info('Medicamento guardado', { petId, name: medData.name });
      showToast(`✅ Medicamento "${medData.name}" registrado`, 'success');

      await this.loadHealthData(petId);
      closeDrawer();
    } catch (error) {
      Logger.error('Error al guardar medicamento', error);
      showToast('❌ Error al guardar', 'error');
    } finally {
      showLoading(false);
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🏥 VISITAS VETERINARIAS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Guarda una visita veterinaria
   * @param {string} petId
   * @param {object} visitData
   */
  async saveVetVisit(petId, visitData) {
    const validation = validateVetVisit(visitData);
    if (!validation.valid) {
      showToast(`❌ ${validation.errors[0]}`, 'error');
      return;
    }

    showLoading(true);
    try {
      await firebase.firestore()
        .collection('pets').doc(petId)
        .collection('vetVisits')
        .add({
          date: visitData.date,
          reason: sanitizeText(visitData.reason),
          vet: sanitizeText(visitData.vet || ''),
          clinic: sanitizeText(visitData.clinic || ''),
          diagnosis: sanitizeText(visitData.diagnosis || ''),
          treatment: sanitizeText(visitData.treatment || ''),
          cost: parseFloat(visitData.cost) || 0,
          nextVisit: visitData.nextVisit || null,
          notes: sanitizeText(visitData.notes || ''),
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

      Logger.info('Visita veterinaria guardada', { petId });
      showToast('✅ Visita registrada correctamente', 'success');

      await this.loadHealthData(petId);
      closeDrawer();
    } catch (error) {
      Logger.error('Error al guardar visita', error);
      showToast('❌ Error al guardar visita', 'error');
    } finally {
      showLoading(false);
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🖥️ RENDERIZADO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  renderVaccines(vaccines) {
    const container = document.getElementById('vaccinesList');
    if (!container) return;

    if (vaccines.length === 0) {
      container.innerHTML = '<p class="empty-msg">Sin vacunas registradas</p>';
      return;
    }

    container.innerHTML = vaccines
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(v => `
        <div class="health-card" role="article" aria-label="Vacuna ${v.name}">
          <div class="health-card-header">
            <span class="health-icon">💉</span>
            <div>
              <strong>${v.name}</strong>
              <small>${formatDate(v.date)}</small>
            </div>
          </div>
          ${v.nextDate ? `<p class="next-date">📅 Próxima: ${formatDate(v.nextDate)}</p>` : ''}
          ${v.notes ? `<p class="health-notes">${v.notes}</p>` : ''}
          <button 
            class="btn-delete-sm" 
            onclick="Health.deleteVaccine('${Pets.currentPetId}', '${v.id}')"
            aria-label="Eliminar vacuna ${v.name}"
          >🗑️</button>
        </div>
      `).join('');
  },

  renderDewormings(dewormings) {
    const container = document.getElementById('dewormingsList');
    if (!container) return;

    if (dewormings.length === 0) {
      container.innerHTML = '<p class="empty-msg">Sin desparasitaciones registradas</p>';
      return;
    }

    container.innerHTML = dewormings
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(d => `
        <div class="health-card" role="article" aria-label="Desparasitación ${d.product}">
          <div class="health-card-header">
            <span class="health-icon">🐛</span>
            <div>
              <strong>${d.product}</strong>
              <small>${formatDate(d.date)} · ${d.type}</small>
            </div>
          </div>
          ${d.nextDate ? `<p class="next-date">📅 Próxima: ${formatDate(d.nextDate)}</p>` : ''}
        </div>
      `).join('');
  },

  renderMedications(medications) {
    const container = document.getElementById('medicationsList');
    if (!container) return;

    if (medications.length === 0) {
      container.innerHTML = '<p class="empty-msg">Sin medicamentos registrados</p>';
      return;
    }

    container.innerHTML = medications
      .map(m => `
        <div class="health-card ${m.active ? 'active' : 'inactive'}" role="article">
          <div class="health-card-header">
            <span class="health-icon">💊</span>
            <div>
              <strong>${m.name}</strong>
              <small>${m.dose} · ${m.frequency}</small>
            </div>
            <span class="badge ${m.active ? 'badge-active' : 'badge-inactive'}">
              ${m.active ? 'Activo' : 'Finalizado'}
            </span>
          </div>
          ${m.reason ? `<p class="health-notes">${m.reason}</p>` : ''}
        </div>
      `).join('');
  },

  renderVetVisits(visits) {
    const container = document.getElementById('vetVisitsList');
    if (!container) return;

    if (visits.length === 0) {
      container.innerHTML = '<p class="empty-msg">Sin visitas veterinarias registradas</p>';
      return;
    }

    container.innerHTML = visits
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(v => `
        <div class="health-card" role="article">
          <div class="health-card-header">
            <span class="health-icon">🏥</span>
            <div>
              <strong>${v.reason}</strong>
              <small>${formatDate(v.date)} ${v.vet ? '· Dr. ' + v.vet : ''}</small>
            </div>
          </div>
          ${v.diagnosis ? `<p><strong>Diagnóstico:</strong> ${v.diagnosis}</p>` : ''}
          ${v.treatment ? `<p><strong>Tratamiento:</strong> ${v.treatment}</p>` : ''}
          ${v.cost > 0 ? `<p class="cost-badge">💰 $${v.cost.toFixed(2)}</p>` : ''}
        </div>
      `).join('');
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔧 INTERNOS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Obtiene todos los documentos de una subcolección
   * @param {string} petId
   * @param {string} subcollection
   * @returns {Promise<array>}
   */
  async _getSubcollection(petId, subcollection) {
    try {
      const snapshot = await firebase.firestore()
        .collection('pets').doc(petId)
        .collection(subcollection)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      Logger.warn(`Error al obtener ${subcollection}`, error);
      return [];
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Health;
}
