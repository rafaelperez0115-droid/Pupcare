/**
 * Módulo de Alimentación
 * Gestión de planes de dieta, horarios y registro de comidas
 * @module modules/feeding
 */

const Feeding = {
  /**
   * Carga los datos de alimentación de una mascota
   * @param {string} petId
   */
  async loadFeedingData(petId) {
    try {
      const [feedingPlan, feedingLog] = await Promise.all([
        this._getFeedingPlan(petId),
        this._getFeedingLog(petId)
      ]);

      this.renderFeedingPlan(feedingPlan);
      this.renderFeedingLog(feedingLog);

      Logger.info('Datos de alimentación cargados', { petId });
    } catch (error) {
      Logger.error('Error al cargar alimentación', error);
      showToast('❌ Error al cargar datos de alimentación', 'error');
    }
  },

  /**
   * Guarda el plan de alimentación
   * @param {string} petId
   * @param {object} feedingData
   */
  async saveFeedingPlan(petId, feedingData) {
    const validation = validateFeedingData(feedingData);
    if (!validation.valid) {
      showToast(`❌ ${validation.errors[0]}`, 'error');
      return;
    }

    showLoading(true);
    try {
      // Usar set con merge para crear o actualizar el plan
      await firebase.firestore()
        .collection('pets').doc(petId)
        .collection('feedingPlan').doc('current')
        .set({
          foodType: sanitizeText(feedingData.foodType),
          brand: sanitizeText(feedingData.brand || ''),
          amount: parseFloat(feedingData.amount),
          unit: feedingData.unit || 'g',
          mealsPerDay: parseInt(feedingData.mealsPerDay) || 2,
          schedule: feedingData.schedule || [],
          notes: sanitizeText(feedingData.notes || ''),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

      Logger.info('Plan de alimentación guardado', { petId });
      showToast('✅ Plan de alimentación actualizado', 'success');

      await this.loadFeedingData(petId);
      closeDrawer();
    } catch (error) {
      Logger.error('Error al guardar plan de alimentación', error);
      showToast('❌ Error al guardar', 'error');
    } finally {
      showLoading(false);
    }
  },

  /**
   * Registra una comida en el historial
   * @param {string} petId
   * @param {object} mealData - {foodType, amount, unit, time, notes}
   */
  async logMeal(petId, mealData) {
    const amountValidation = validatePositiveNumber(mealData.amount, 'Cantidad');
    if (!amountValidation.valid) {
      showToast(`❌ ${amountValidation.message}`, 'error');
      return;
    }

    showLoading(true);
    try {
      await firebase.firestore()
        .collection('pets').doc(petId)
        .collection('feedingLog')
        .add({
          foodType: sanitizeText(mealData.foodType || 'No especificado'),
          amount: parseFloat(mealData.amount),
          unit: mealData.unit || 'g',
          time: mealData.time || new Date().toISOString(),
          notes: sanitizeText(mealData.notes || ''),
          ate: mealData.ate !== false, // ¿Comió todo?
          loggedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

      Logger.info('Comida registrada', { petId, amount: mealData.amount });
      showToast('✅ Comida registrada', 'success');

      await this.loadFeedingData(petId);
      closeDrawer();
    } catch (error) {
      Logger.error('Error al registrar comida', error);
      showToast('❌ Error al registrar comida', 'error');
    } finally {
      showLoading(false);
    }
  },

  /**
   * Obtiene el plan de alimentación actual
   * @param {string} petId
   * @returns {Promise<object|null>}
   */
  async _getFeedingPlan(petId) {
    try {
      const doc = await firebase.firestore()
        .collection('pets').doc(petId)
        .collection('feedingPlan').doc('current')
        .get();

      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
      Logger.warn('Error al obtener plan de alimentación', error);
      return null;
    }
  },

  /**
   * Obtiene el historial de comidas (últimos 30 días)
   * @param {string} petId
   * @returns {Promise<array>}
   */
  async _getFeedingLog(petId) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const snapshot = await firebase.firestore()
        .collection('pets').doc(petId)
        .collection('feedingLog')
        .where('loggedAt', '>=', thirtyDaysAgo)
        .orderBy('loggedAt', 'desc')
        .limit(50)
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      Logger.warn('Error al obtener historial de comidas', error);
      return [];
    }
  },

  /**
   * Renderiza el plan de alimentación
   * @param {object|null} plan
   */
  renderFeedingPlan(plan) {
    const container = document.getElementById('feedingPlanContainer');
    if (!container) return;

    if (!plan) {
      container.innerHTML = `
        <div class="empty-msg">
          <p>🍽️ Sin plan de alimentación configurado</p>
          <button class="btn-primary" onclick="openDrawer('feedingPlan', {title: 'Plan de Alimentación'})">
            Configurar Plan
          </button>
        </div>
      `;
      return;
    }

    const scheduleHtml = plan.schedule && plan.schedule.length > 0
      ? `<div class="schedule-list">
          ${plan.schedule.map(time => `<span class="schedule-badge">⏰ ${time}</span>`).join('')}
        </div>`
      : '';

    container.innerHTML = `
      <div class="feeding-plan-card" role="region" aria-label="Plan de alimentación actual">
        <div class="plan-header">
          <span class="plan-icon">🦴</span>
          <div>
            <strong>${plan.foodType}</strong>
            ${plan.brand ? `<small>${plan.brand}</small>` : ''}
          </div>
          <button 
            class="btn-edit-sm" 
            onclick="openDrawer('feedingPlan', {title: 'Editar Plan de Alimentación'})"
            aria-label="Editar plan de alimentación"
          >✏️</button>
        </div>
        <div class="plan-details">
          <span>🥣 ${plan.amount}${plan.unit} por comida</span>
          <span>📋 ${plan.mealsPerDay} comida${plan.mealsPerDay !== 1 ? 's' : ''} al día</span>
        </div>
        ${scheduleHtml}
        ${plan.notes ? `<p class="plan-notes">${plan.notes}</p>` : ''}
      </div>
    `;
  },

  /**
   * Renderiza el historial de comidas
   * @param {array} log
   */
  renderFeedingLog(log) {
    const container = document.getElementById('feedingLogContainer');
    if (!container) return;

    if (log.length === 0) {
      container.innerHTML = '<p class="empty-msg">Sin comidas registradas aún</p>';
      return;
    }

    // Agrupar por día
    const grouped = this._groupByDay(log);

    container.innerHTML = Object.entries(grouped).map(([date, meals]) => `
      <div class="log-day-group" role="group" aria-label="Comidas del ${date}">
        <h4 class="log-day-header">${date}</h4>
        ${meals.map(meal => `
          <div class="log-meal-card ${meal.ate ? '' : 'not-eaten'}">
            <span>${meal.ate ? '✅' : '❌'}</span>
            <div>
              <span>${meal.foodType}</span>
              <small>${meal.amount}${meal.unit} · ${this._formatTime(meal.time)}</small>
            </div>
            ${meal.notes ? `<p class="meal-notes">${meal.notes}</p>` : ''}
          </div>
        `).join('')}
      </div>
    `).join('');
  },

  /**
   * Agrupa comidas por día
   * @param {array} meals
   * @returns {object}
   */
  _groupByDay(meals) {
    const groups = {};
    meals.forEach(meal => {
      const date = meal.loggedAt?.toDate?.()
        ? formatDate(meal.loggedAt.toDate())
        : 'Hoy';

      if (!groups[date]) groups[date] = [];
      groups[date].push(meal);
    });
    return groups;
  },

  /**
   * Formatea una hora para mostrar
   * @param {string} timeStr
   * @returns {string}
   */
  _formatTime(timeStr) {
    try {
      const d = new Date(timeStr);
      return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Feeding;
}
