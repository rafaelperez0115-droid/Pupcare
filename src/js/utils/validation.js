/**
 * Utilidades de Validación
 * Funciones para validar datos de entrada en toda la aplicación
 * @module utils/validation
 */

/**
 * Valida un correo electrónico
 * @param {string} email - Correo a validar
 * @returns {boolean} True si es válido
 * @example
 * validateEmail('user@example.com') // true
 * validateEmail('invalid-email') // false
 */
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Valida una contraseña
 * Requisitos: mínimo 6 caracteres
 * @param {string} password - Contraseña a validar
 * @returns {object} {valid: boolean, message: string}
 */
function validatePassword(password) {
  if (!password || password.length < 6) {
    return {
      valid: false,
      message: 'La contraseña debe tener mínimo 6 caracteres'
    };
  }
  return { valid: true, message: '' };
}

/**
 * Valida que el campo no esté vacío
 * @param {string} value - Valor a validar
 * @param {string} fieldName - Nombre del campo para el mensaje
 * @returns {object} {valid: boolean, message: string}
 */
function validateRequired(value, fieldName = 'Este campo') {
  if (!value || !value.toString().trim()) {
    return {
      valid: false,
      message: `${fieldName} es requerido`
    };
  }
  return { valid: true, message: '' };
}

/**
 * Valida que sea un número positivo
 * @param {number|string} value - Valor a validar
 * @param {string} fieldName - Nombre del campo
 * @returns {object} {valid: boolean, message: string}
 */
function validatePositiveNumber(value, fieldName = 'Este campo') {
  const num = parseFloat(value);
  if (isNaN(num) || num <= 0) {
    return {
      valid: false,
      message: `${fieldName} debe ser un número positivo`
    };
  }
  return { valid: true, message: '' };
}

/**
 * Valida una fecha
 * @param {string} dateString - Fecha en formato YYYY-MM-DD
 * @returns {object} {valid: boolean, message: string}
 */
function validateDate(dateString) {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return {
      valid: false,
      message: 'Fecha inválida'
    };
  }
  if (date > new Date()) {
    return {
      valid: false,
      message: 'La fecha no puede ser en el futuro'
    };
  }
  return { valid: true, message: '' };
}

/**
 * Valida el perfil completo de una mascota
 * @param {object} petData - Objeto con datos de mascota
 * @returns {object} {valid: boolean, errors: array}
 */
function validatePetProfile(petData) {
  const errors = [];

  // Validar nombre
  const nameValidation = validateRequired(petData.name, 'Nombre');
  if (!nameValidation.valid) errors.push(nameValidation.message);

  // Validar raza
  const breedValidation = validateRequired(petData.breed, 'Raza');
  if (!breedValidation.valid) errors.push(breedValidation.message);

  // Validar fecha de nacimiento
  if (petData.birthDate) {
    const dateValidation = validateDate(petData.birthDate);
    if (!dateValidation.valid) errors.push(dateValidation.message);
  }

  // Validar peso (opcional pero si existe, debe ser positivo)
  if (petData.weight) {
    const weightValidation = validatePositiveNumber(petData.weight, 'Peso');
    if (!weightValidation.valid) errors.push(weightValidation.message);
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Valida datos de alimentación
 * @param {object} feedingData - Objeto con datos de alimentación
 * @returns {object} {valid: boolean, errors: array}
 */
function validateFeedingData(feedingData) {
  const errors = [];

  const foodTypeValidation = validateRequired(feedingData.foodType, 'Tipo de comida');
  if (!foodTypeValidation.valid) errors.push(foodTypeValidation.message);

  const amountValidation = validatePositiveNumber(feedingData.amount, 'Cantidad');
  if (!amountValidation.valid) errors.push(amountValidation.message);

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Valida datos de vacunación
 * @param {object} vaccineData - Objeto con datos de vacuna
 * @returns {object} {valid: boolean, errors: array}
 */
function validateVaccineData(vaccineData) {
  const errors = [];

  const nameValidation = validateRequired(vaccineData.name, 'Nombre de vacuna');
  if (!nameValidation.valid) errors.push(nameValidation.message);

  if (vaccineData.date) {
    const dateValidation = validateDate(vaccineData.date);
    if (!dateValidation.valid) errors.push(dateValidation.message);
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Valida datos de visita veterinaria
 * @param {object} visitData - Objeto con datos de visita
 * @returns {object} {valid: boolean, errors: array}
 */
function validateVetVisit(visitData) {
  const errors = [];

  const reasonValidation = validateRequired(visitData.reason, 'Motivo de visita');
  if (!reasonValidation.valid) errors.push(reasonValidation.message);

  if (visitData.date) {
    const dateValidation = validateDate(visitData.date);
    if (!dateValidation.valid) errors.push(dateValidation.message);
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Sanitiza una cadena de texto (previene inyección)
 * @param {string} text - Texto a sanitizar
 * @returns {string} Texto sanitizado
 */
function sanitizeText(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Valida el tamaño de un archivo de imagen
 * @param {File} file - Archivo a validar
 * @param {number} maxSizeMB - Tamaño máximo en MB
 * @returns {object} {valid: boolean, message: string}
 */
function validateImageFile(file, maxSizeMB = 5) {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const maxBytes = maxSizeMB * 1024 * 1024;

  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      message: 'Solo se permiten imágenes (JPEG, PNG, WebP, GIF)'
    };
  }

  if (file.size > maxBytes) {
    return {
      valid: false,
      message: `El archivo no debe superar ${maxSizeMB}MB`
    };
  }

  return { valid: true, message: '' };
}
