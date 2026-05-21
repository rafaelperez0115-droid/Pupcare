async function solicitarReporteMensual(mesNumero, datosExtra, archivoImagen) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onloadend = async () => {
      // Limpiar el prefijo para obtener solo la cadena Base64 pura
      const fotoBase64 = reader.result.split(',')[1];

      try {
        // CORRECCIÓN CRÍTICA: Se remueve el '.js' al final de la ruta para que Netlify procese el endpoint correctamente
        const respuesta = await fetch('/.netlify/functions/generar-reporte', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mes: mesNumero,
            datosExtra: datosExtra,
            fotoBase64: fotoBase64
          })
        });

        if (!respuesta.ok) {
          throw new Error(`Error en el servidor: ${respuesta.status}`);
        }

        const datos = await respuesta.json();
        
        if (datos.error) {
          reject(datos.error);
        } else {
          resolve(datos.reporte);
        }

      } catch (error) {
        console.error("Error al conectar con la función:", error);
        reject(error);
      }
    };
    
    reader.onerror = error => reject(error);
    reader.readAsDataURL(archivoImagen);
  });
}
