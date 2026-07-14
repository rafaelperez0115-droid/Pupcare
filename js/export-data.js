// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💾 EXPORTAR MIS DATOS
// Descarga un respaldo completo de todas las mascotas del usuario
// y sus registros en un archivo JSON legible.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ExportData = {
  // Todas las subcolecciones que guarda la app
  COLLECTIONS: [
    'vaccines', 'dewormings', 'vetVisits', 'medications', 'behaviorNotes',
    'activities', 'care', 'photos', 'tasks', 'weightHistory', 'heightHistory',
    'expenses', 'growthAnalysis', 'feedingPlan', 'feedingLog',
  ],

  async export() {
    if (!currentUser) { showToast('Inicia sesión primero', 'error'); return; }
    showLoading(true);
    showToast('💾 Preparando tu respaldo...', 'info');

    try {
      const backup = {
        app: 'PupCare',
        formato: 1,
        exportadoEl: new Date().toISOString(),
        cuenta: currentUser.email || null,
        mascotas: [],
      };

      // 1. Todas las mascotas del usuario
      const petsSnap = await db.collection('pets')
        .where('ownerId', '==', currentUser.uid).get();

      let totalRegistros = 0;

      // 2. Por cada mascota, todas sus subcolecciones
      for (const petDoc of petsSnap.docs) {
        const pet = {
          id: petDoc.id,
          ...this.clean(petDoc.data()),
          registros: {},
        };

        const results = await Promise.all(
          this.COLLECTIONS.map(col =>
            db.collection('pets').doc(petDoc.id).collection(col).get()
              .then(snap => ({ col, snap }))
              .catch(() => ({ col, snap: null }))
          )
        );

        for (const { col, snap } of results) {
          if (!snap || snap.empty) continue;
          pet.registros[col] = snap.docs.map(d => ({
            id: d.id,
            ...this.clean(d.data()),
          }));
          totalRegistros += snap.size;
        }

        backup.mascotas.push(pet);
      }

      if (!backup.mascotas.length) {
        showLoading(false);
        showToast('No hay datos para exportar', 'info');
        return;
      }

      // 3. Descargar como archivo JSON
      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pupcare-respaldo-${today()}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      showLoading(false);
      const nMascotas = backup.mascotas.length;
      showToast(
        `✅ Respaldo descargado: ${nMascotas} mascota${nMascotas !== 1 ? 's' : ''}, ${totalRegistros} registros`,
        'success'
      );
      haptic(15);

    } catch (e) {
      showLoading(false);
      console.error('Error al exportar:', e);
      showToast('No se pudo generar el respaldo', 'error');
    }
  },

  // Convertir Timestamps de Firestore a fechas legibles (ISO)
  clean(data) {
    const out = {};
    for (const [k, v] of Object.entries(data || {})) {
      if (v && typeof v.toDate === 'function') {
        out[k] = v.toDate().toISOString();
      } else {
        out[k] = v;
      }
    }
    return out;
  },
};
