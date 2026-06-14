/**
 * Utilidades de Almacenamiento
 * Manejo de Firebase Storage, localStorage y compresión de imágenes
 * @module utils/storage
 */

/**
 * Comprime una imagen antes de subirla
 * @param {File} file - Archivo de imagen original
 * @param {number} maxWidth - Ancho máximo en px (default: 800)
 * @param {number} quality - Calidad (0 a 1, default: 0.8)
 * @returns {Promise<Blob>} Imagen comprimida
 * @example
 * const compressed = await compressImage(file, 800, 0.8);
 */
function compressImage(file, maxWidth = 800, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Redimensionar si supera el ancho máximo
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Error al comprimir la imagen'));
              return;
            }
            resolve(blob);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}

/**
 * Convierte un Blob a base64
 * @param {Blob} blob - Blob a convertir
 * @returns {Promise<string>} String en base64
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Sube una imagen a Firebase Storage con compresión
 * @param {File} file - Archivo original
 * @param {string} path - Ruta en Firebase Storage (ej: 'photos/pet123/foto1')
 * @param {function} onProgress - Callback de progreso (0-100)
 * @returns {Promise<string>} URL de descarga
 * @example
 * const url = await uploadImageWithCompression(file, 'photos/pet123/pic1', (p) => setProgress(p));
 */
async function uploadImageWithCompression(file, path, onProgress = null) {
  const { validateImageFile } = window;

  // Validar archivo
  const validation = validateImageFile(file, 5);
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  // Comprimir imagen
  const compressedBlob = await compressImage(file);

  // Subir a Firebase Storage
  const storageRef = firebase.storage().ref(path);
  const uploadTask = storageRef.put(compressedBlob);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        if (onProgress) onProgress(progress);
      },
      (error) => {
        Logger.error('Error al subir imagen', error);
        reject(error);
      },
      async () => {
        try {
          const url = await uploadTask.snapshot.ref.getDownloadURL();
          Logger.info('Imagen subida correctamente', { path, url });
          resolve(url);
        } catch (e) {
          reject(e);
        }
      }
    );
  });
}

/**
 * Elimina un archivo de Firebase Storage por URL
 * @param {string} fileUrl - URL completa del archivo
 * @returns {Promise<void>}
 */
async function deleteFileByUrl(fileUrl) {
  try {
    const fileRef = firebase.storage().refFromURL(fileUrl);
    await fileRef.delete();
    Logger.info('Archivo eliminado', { url: fileUrl });
  } catch (error) {
    Logger.error('Error al eliminar archivo', error);
    throw error;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 LocalStorage Helpers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const LocalStorage = {
  /**
   * Guarda datos
   * @param {string} key
   * @param {any} value
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      Logger.warn('Error al guardar en localStorage', e);
    }
  },

  /**
   * Obtiene datos
   * @param {string} key
   * @param {any} defaultValue - Valor por defecto si no existe
   * @returns {any}
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      Logger.warn('Error al leer de localStorage', e);
      return defaultValue;
    }
  },

  /**
   * Elimina una clave
   * @param {string} key
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      Logger.warn('Error al eliminar de localStorage', e);
    }
  },

  /**
   * Limpia todo el localStorage de la app
   */
  clearAll() {
    try {
      const appKeys = ['currentPetId', 'userTheme', 'userPrefs', 'appLogs'];
      appKeys.forEach(key => localStorage.removeItem(key));
    } catch (e) {
      Logger.warn('Error al limpiar localStorage', e);
    }
  }
};

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { compressImage, blobToBase64, uploadImageWithCompression, deleteFileByUrl, LocalStorage };
}
