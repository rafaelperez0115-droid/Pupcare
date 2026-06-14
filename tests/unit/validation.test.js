/**
 * Tests Unitarios - Módulo de Validación
 * Para ejecutar: npx jest tests/unit/validation.test.js
 * 
 * Nota: Estos tests son para entorno Node.js.
 * Para correrlos en browser, usa un runner compatible como Jasmine o Mocha.
 */

// Importar funciones si estamos en Node.js
const {
  validateEmail,
  validatePassword,
  validateRequired,
  validatePositiveNumber,
  validateDate,
  validatePetProfile,
  validateFeedingData,
  validateVaccineData
} = require('../../src/js/utils/validation');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📧 EMAIL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('validateEmail', () => {
  test('acepta emails válidos', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name+tag@example.co')).toBe(true);
    expect(validateEmail('user123@domain.org')).toBe(true);
  });

  test('rechaza emails inválidos', () => {
    expect(validateEmail('invalid-email')).toBe(false);
    expect(validateEmail('@no-user.com')).toBe(false);
    expect(validateEmail('no-domain@')).toBe(false);
    expect(validateEmail('')).toBe(false);
    expect(validateEmail(null)).toBe(false);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔒 CONTRASEÑA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('validatePassword', () => {
  test('acepta contraseñas con 6 o más caracteres', () => {
    expect(validatePassword('123456').valid).toBe(true);
    expect(validatePassword('miperro123').valid).toBe(true);
    expect(validatePassword('Str0ng!P@ss').valid).toBe(true);
  });

  test('rechaza contraseñas cortas', () => {
    expect(validatePassword('12345').valid).toBe(false);
    expect(validatePassword('abc').valid).toBe(false);
    expect(validatePassword('').valid).toBe(false);
    expect(validatePassword(null).valid).toBe(false);
  });

  test('retorna mensaje de error adecuado', () => {
    const result = validatePassword('123');
    expect(result.message).toContain('6 caracteres');
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ✅ CAMPO REQUERIDO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('validateRequired', () => {
  test('acepta texto válido', () => {
    expect(validateRequired('Max').valid).toBe(true);
    expect(validateRequired('Labrador').valid).toBe(true);
    expect(validateRequired('  texto con espacios  ').valid).toBe(true);
  });

  test('rechaza valores vacíos o nulos', () => {
    expect(validateRequired('').valid).toBe(false);
    expect(validateRequired('   ').valid).toBe(false);
    expect(validateRequired(null).valid).toBe(false);
    expect(validateRequired(undefined).valid).toBe(false);
  });

  test('usa el nombre del campo en el mensaje de error', () => {
    const result = validateRequired('', 'Nombre de mascota');
    expect(result.message).toContain('Nombre de mascota');
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔢 NÚMERO POSITIVO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('validatePositiveNumber', () => {
  test('acepta números positivos', () => {
    expect(validatePositiveNumber(10).valid).toBe(true);
    expect(validatePositiveNumber(0.5).valid).toBe(true);
    expect(validatePositiveNumber('25.3').valid).toBe(true);
  });

  test('rechaza cero o negativos', () => {
    expect(validatePositiveNumber(0).valid).toBe(false);
    expect(validatePositiveNumber(-5).valid).toBe(false);
    expect(validatePositiveNumber(-0.1).valid).toBe(false);
  });

  test('rechaza valores no numéricos', () => {
    expect(validatePositiveNumber('abc').valid).toBe(false);
    expect(validatePositiveNumber('').valid).toBe(false);
    expect(validatePositiveNumber(null).valid).toBe(false);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📅 FECHA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('validateDate', () => {
  test('acepta fechas válidas en el pasado', () => {
    expect(validateDate('2020-01-15').valid).toBe(true);
    expect(validateDate('2023-06-01').valid).toBe(true);
  });

  test('rechaza fechas futuras', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const futureDateStr = futureDate.toISOString().split('T')[0];
    expect(validateDate(futureDateStr).valid).toBe(false);
  });

  test('rechaza fechas inválidas', () => {
    expect(validateDate('not-a-date').valid).toBe(false);
    expect(validateDate('').valid).toBe(false);
    expect(validateDate('99-99-9999').valid).toBe(false);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🐶 PERFIL DE MASCOTA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('validatePetProfile', () => {
  test('acepta perfil válido completo', () => {
    const result = validatePetProfile({
      name: 'Guts',
      breed: 'Bull Terrier',
      birthDate: '2024-11-01',
      weight: 12.5
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('acepta perfil mínimo (solo nombre y raza)', () => {
    const result = validatePetProfile({
      name: 'Max',
      breed: 'Mestizo'
    });
    expect(result.valid).toBe(true);
  });

  test('rechaza cuando falta nombre', () => {
    const result = validatePetProfile({
      name: '',
      breed: 'Labrador'
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.toLowerCase().includes('nombre'))).toBe(true);
  });

  test('rechaza cuando falta raza', () => {
    const result = validatePetProfile({
      name: 'Max',
      breed: ''
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.toLowerCase().includes('raza'))).toBe(true);
  });

  test('rechaza peso negativo', () => {
    const result = validatePetProfile({
      name: 'Max',
      breed: 'Labrador',
      weight: -5
    });
    expect(result.valid).toBe(false);
  });

  test('acumula múltiples errores', () => {
    const result = validatePetProfile({
      name: '',
      breed: '',
      weight: -1
    });
    expect(result.errors.length).toBeGreaterThan(1);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🍽️ DATOS DE ALIMENTACIÓN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('validateFeedingData', () => {
  test('acepta datos válidos', () => {
    const result = validateFeedingData({
      foodType: 'Croquetas premium',
      amount: 200
    });
    expect(result.valid).toBe(true);
  });

  test('rechaza sin tipo de comida', () => {
    const result = validateFeedingData({
      foodType: '',
      amount: 200
    });
    expect(result.valid).toBe(false);
  });

  test('rechaza cantidad inválida', () => {
    const result = validateFeedingData({
      foodType: 'Croquetas',
      amount: 0
    });
    expect(result.valid).toBe(false);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💉 DATOS DE VACUNA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('validateVaccineData', () => {
  test('acepta vacuna válida', () => {
    const result = validateVaccineData({
      name: 'Antirrábica',
      date: '2024-01-15'
    });
    expect(result.valid).toBe(true);
  });

  test('rechaza sin nombre de vacuna', () => {
    const result = validateVaccineData({
      name: '',
      date: '2024-01-15'
    });
    expect(result.valid).toBe(false);
  });

  test('acepta vacuna sin fecha (campo opcional)', () => {
    const result = validateVaccineData({
      name: 'Parvovirus'
    });
    expect(result.valid).toBe(true);
  });
});
