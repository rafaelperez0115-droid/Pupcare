/**
 * Utilidades de Interfaz de Usuario
 * Funciones para mostrar mensajes, modales, loading, etc.
 * @module utils/ui-helpers
 */

/**
 * Muestra un mensaje toast (notificación temporal)
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duración en ms (default: 3000)
 * @example
 * showToast('✅ Guardado correctamente', 'success')
 * showToast('❌ Ocurrió un error', 'error', 5000)
 */
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  if (!container) {
    console.error('No se encontró contenedor de toasts');
    return;
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    padding: 16px 20px;
    margin: 8px;
    border-radius: 8px;
    animation: slideIn 0.3s ease-out;
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 500;
    font-size: 0.95rem;
  `;

  // Estilos según tipo
  const styles = {
    success: 'background: #4CAF50; color: white;',
    error: 'background: #f44336; color: white;',
    warning: 'background: #ff9800; color: white;',
    info: 'background: #2196F3; color: white;'
  };

  toast.style.cssText += styles[type] || styles.info;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Muestra un modal de confirmación
 * @param {string} title - Título del modal
 * @param {string} message - Mensaje
 * @param {function} onConfirm - Callback si confirma
 * @param {function} onCancel - Callback si cancela
 * @example
 * showConfirm('¿Eliminar?', 'No se puede deshacer', 
 *   () => console.log('Eliminado'),
 *   () => console.log('Cancelado')
 * )
 */
function showConfirm(title, message, onConfirm, onCancel = null) {
  const modal = document.getElementById('confirmModal');
  if (!modal) {
    console.error('No se encontró modal de confirmación');
    return;
  }

  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMsg').textContent = message;

  const okBtn = document.getElementById('confirmOkBtn');
  const cancelBtn = document.querySelector('.btn-confirm-cancel');

  // Limpiar listeners previos
  const newOkBtn = okBtn.cloneNode(true);
  okBtn.parentNode.replaceChild(newOkBtn, okBtn);

  newOkBtn.addEventListener('click', () => {
    closeConfirm();
    if (onConfirm) onConfirm();
  });

  cancelBtn.addEventListener('click', () => {
    closeConfirm();
    if (onCancel) onCancel();
  });

  modal.style.display = 'flex';
}

/**
 * Cierra el modal de confirmación
 */
function closeConfirm() {
  const modal = document.getElementById('confirmModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

/**
 * Muestra la pantalla de carga
 * @param {boolean} show - Mostrar u ocultar
 */
function showLoading(show = true) {
  const loader = document.getElementById('loadingScreen');
  if (loader) {
    loader.style.display = show ? 'flex' : 'none';
  }
}

/**
 * Navega a una vista específica
 * @param {string} viewName - Nombre de la vista (sin 'view-')
 * @example
 * navigateToView('health') // Abre #view-health
 */
function navigateToView(viewName) {
  const views = document.querySelectorAll('.view');
  views.forEach(view => view.classList.remove('active'));

  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) {
    targetView.classList.add('active');
  }

  // Actualizar tab activo
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => tab.classList.remove('active'));
  const activeTab = document.querySelector(`[data-target="${viewName}"]`);
  if (activeTab) {
    activeTab.classList.add('active');
  }
}

/**
 * Abre el drawer con contenido dinámico
 * @param {string} drawerType - Tipo de drawer
 * @param {object} options - Opciones de configuración
 * @example
 * openDrawer('vaccine', {
 *   title: 'Añadir Vacuna',
 *   subtitle: 'Registra una nueva vacunación'
 * })
 */
function openDrawer(drawerType, options = {}) {
  const drawer = document.getElementById('drawer');
  const drawerTitle = document.getElementById('drawerTitle');
  const drawerSubtitle = document.getElementById('drawerSubtitle');
  const drawerContent = document.getElementById('drawerContent');

  drawerTitle.textContent = options.title || 'Cargando...';
  drawerSubtitle.textContent = options.subtitle || '';

  // Aquí se llenará el contenido según drawerType
  // Esta función se completará en app.js con la lógica específica

  if (drawer) {
    drawer.style.display = 'flex';
  }
}

/**
 * Cierra el drawer
 */
function closeDrawer() {
  const drawer = document.getElementById('drawer');
  if (drawer) {
    drawer.style.display = 'none';
  }
}

/**
 * Abre la configuración
 */
function openSettings() {
  const settingsDrawer = document.getElementById('settingsDrawer');
  if (settingsDrawer) {
    settingsDrawer.style.display = 'flex';
  }
}

/**
 * Cierra la configuración
 */
function closeSettings() {
  const settingsDrawer = document.getElementById('settingsDrawer');
  if (settingsDrawer) {
    settingsDrawer.style.display = 'none';
  }
}

/**
 * Obtiene el valor de un input
 * @param {string} elementId - ID del elemento
 * @returns {string} Valor del input
 */
function getInputValue(elementId) {
  const element = document.getElementById(elementId);
  return element ? element.value.trim() : '';
}

/**
 * Establece el valor de un input
 * @param {string} elementId - ID del elemento
 * @param {string} value - Valor a establecer
 */
function setInputValue(elementId, value = '') {
  const element = document.getElementById(elementId);
  if (element) {
    element.value = value;
  }
}

/**
 * Limpia todos los inputs de un formulario
 * @param {string} formSelector - Selector del formulario (default: todos)
 */
function clearForm(formSelector = null) {
  const inputs = formSelector
    ? document.querySelectorAll(formSelector + ' input')
    : document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], input[type="number"], input[type="date"]');

  inputs.forEach(input => {
    input.value = '';
    input.setAttribute('aria-invalid', 'false');
  });
}

/**
 * Marca un input como inválido
 * @param {string} elementId - ID del elemento
 * @param {string} errorMessage - Mensaje de error
 */
function setInputError(elementId, errorMessage = '') {
  const element = document.getElementById(elementId);
  if (element) {
    element.setAttribute('aria-invalid', 'true');
    element.style.borderColor = '#f44336';

    // Crear/actualizar mensaje de error
    let errorDiv = element.nextElementSibling;
    if (!errorDiv || !errorDiv.classList.contains('error-message')) {
      errorDiv = document.createElement('small');
      errorDiv.className = 'error-message';
      errorDiv.style.cssText = 'color: #f44336; display: block; margin-top: 4px;';
      element.parentNode.insertBefore(errorDiv, element.nextSibling);
    }
    errorDiv.textContent = errorMessage;
  }
}

/**
 * Limpia el error de un input
 * @param {string} elementId - ID del elemento
 */
function clearInputError(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.setAttribute('aria-invalid', 'false');
    element.style.borderColor = '';

    const errorDiv = element.nextElementSibling;
    if (errorDiv && errorDiv.classList.contains('error-message')) {
      errorDiv.remove();
    }
  }
}

/**
 * Formatea una fecha para mostrar
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} Fecha formateada
 * @example
 * formatDate('2024-01-15') // "15 de enero de 2024"
 */
function formatDate(date) {
  const d = new Date(date);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return d.toLocaleDateString('es-ES', options);
}

/**
 * Calcula la edad en años y meses
 * @param {string|Date} birthDate - Fecha de nacimiento
 * @returns {string} Edad formateada
 * @example
 * calculateAge('2023-06-15') // "8 meses"
 */
function calculateAge(birthDate) {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  const months = monthDiff < 0 ? 12 + monthDiff : monthDiff;

  if (age === 0) {
    return `${months} mes${months !== 1 ? 'es' : ''}`;
  }
  return `${age} año${age !== 1 ? 's' : ''} ${months} mes${months !== 1 ? 'es' : ''}`;
}

/**
 * Activa/desactiva un botón
 * @param {string} elementId - ID del botón
 * @param {boolean} enabled - Estado
 */
function setButtonEnabled(elementId, enabled = true) {
  const button = document.getElementById(elementId);
  if (button) {
    button.disabled = !enabled;
    button.style.opacity = enabled ? '1' : '0.6';
  }
}

/**
 * Agrega estilos de animación al elemento
 * @param {HTMLElement} element - Elemento a animar
 * @param {string} animationName - Nombre de la animación
 */
function addAnimation(element, animationName) {
  if (!element) return;
  element.style.animation = `${animationName} 0.3s ease-out`;
  setTimeout(() => {
    element.style.animation = '';
  }, 300);
}
