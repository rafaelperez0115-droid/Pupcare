/**
 * Sistema de Logging
 * Gestiona logs en consola y almacenamiento local
 * @module utils/logger
 */

const Logger = {
  /**
   * Niveles de log
   */
  LEVELS: {
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR'
  },

  /**
   * Configuración actual
   */
  config: {
    maxLogs: 100,
    enableConsole: true,
    enableStorage: true
  },

  /**
   * Registra un log de información
   * @param {string} message - Mensaje a registrar
   * @param {any} data - Datos adicionales
   */
  info(message, data = null) {
    this._log(this.LEVELS.INFO, message, data);
  },

  /**
   * Registra un error
   * @param {string} message - Mensaje de error
   * @param {Error|any} error - Objeto de error
   */
  error(message, error = null) {
    this._log(this.LEVELS.ERROR, message, error);
  },

  /**
   * Registra una advertencia
   * @param {string} message - Mensaje de advertencia
   * @param {any} data - Datos adicionales
   */
  warn(message, data = null) {
    this._log(this.LEVELS.WARN, message, data);
  },

  /**
   * Registra información de depuración
   * @param {string} message - Mensaje de depuración
   * @param {any} data - Datos adicionales
   */
  debug(message, data = null) {
    this._log(this.LEVELS.DEBUG, message, data);
  },

  /**
   * Método interno para registrar
   * @private
   */
  _log(level, message, data) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };

    // Mostrar en consola
    if (this.config.enableConsole) {
      const style = this._getConsoleStyle(level);
      console.log(
        `%c[${level}] ${message}`,
        style,
        data || ''
      );
    }

    // Guardar en localStorage
    if (this.config.enableStorage) {
      this._saveTolocalStorage(logEntry);
    }
  },

  /**
   * Obtiene el estilo para consola según el nivel
   * @private
   */
  _getConsoleStyle(level) {
    const styles = {
      DEBUG: 'color: #888; font-weight: bold;',
      INFO: 'color: #0066cc; font-weight: bold;',
      WARN: 'color: #ff9800; font-weight: bold;',
      ERROR: 'color: #d32f2f; font-weight: bold; font-size: 1.1em;'
    };
    return styles[level] || '';
  },

  /**
   * Guarda el log en localStorage
   * @private
   */
  _saveTolocalStorage(logEntry) {
    try {
      let logs = JSON.parse(localStorage.getItem('appLogs')) || [];
      logs.push(logEntry);

      // Mantener solo los últimos N logs
      if (logs.length > this.config.maxLogs) {
        logs = logs.slice(-this.config.maxLogs);
      }

      localStorage.setItem('appLogs', JSON.stringify(logs));
    } catch (e) {
      console.warn('No se pudo guardar el log en localStorage:', e);
    }
  },

  /**
   * Obtiene todos los logs almacenados
   * @returns {array} Array de logs
   */
  getAllLogs() {
    try {
      return JSON.parse(localStorage.getItem('appLogs')) || [];
    } catch (e) {
      return [];
    }
  },

  /**
   * Obtiene logs filtrados por nivel
   * @param {string} level - Nivel de log
   * @returns {array} Logs filtrados
   */
  getLogsByLevel(level) {
    return this.getAllLogs().filter(log => log.level === level);
  },

  /**
   * Limpia todos los logs almacenados
   */
  clearLogs() {
    localStorage.removeItem('appLogs');
    this.info('Logs borrados');
  },

  /**
   * Descarga los logs como archivo JSON
   */
  downloadLogs() {
    const logs = this.getAllLogs();
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pupcare-logs-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  },

  /**
   * Obtiene un resumen de los logs
   * @returns {object} Resumen de logs
   */
  getSummary() {
    const logs = this.getAllLogs();
    return {
      total: logs.length,
      errors: logs.filter(l => l.level === this.LEVELS.ERROR).length,
      warnings: logs.filter(l => l.level === this.LEVELS.WARN).length,
      infos: logs.filter(l => l.level === this.LEVELS.INFO).length,
      debugs: logs.filter(l => l.level === this.LEVELS.DEBUG).length
    };
  }
};

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Logger;
}
