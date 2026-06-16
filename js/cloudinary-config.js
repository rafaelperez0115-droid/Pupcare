// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ☁️ Cloudinary Config — PupCare
// Reemplaza Firebase Storage (gratuito, sin tarjeta)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CLOUDINARY = {
  cloudName:    'dcmlpzuby',
  uploadPreset: 'pupcare_uploads',
  uploadUrl:    'https://api.cloudinary.com/v1_1/dcmlpzuby/image/upload',
};

/**
 * Sube una imagen a Cloudinary
 * @param {File} file - Archivo de imagen
 * @param {function} onProgress - Callback de progreso (0-100)
 * @returns {Promise<string>} URL pública de la imagen
 */
async function uploadToCloudinary(file, onProgress = null) {
  const compressed = await compressImage(file, 1200, 0.85);

  const formData = new FormData();
  formData.append('file',         compressed);
  formData.append('upload_preset', CLOUDINARY.uploadPreset);
  formData.append('folder',        'pupcare');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const res = JSON.parse(xhr.responseText);
        resolve(res.secure_url);
      } else {
        reject(new Error('Error al subir imagen: ' + xhr.status));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Error de red al subir imagen')));

    xhr.open('POST', CLOUDINARY.uploadUrl);
    xhr.send(formData);
  });
}
