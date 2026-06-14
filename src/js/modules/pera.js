/**
 * Módulo de Gestión de Mascotas
 * CRUD completo para perfiles de mascotas en Firestore
 * @module modules/pets
 */

const Pets = {
  /**
   * ID de la mascota actualmente seleccionada
   */
  currentPetId: null,

  /**
   * Cache local de mascotas
   */
  petsList: [],

  /**
   * Carga todas las mascotas del usuario desde Firestore
   * @param {string} userId - UID del usuario
   * @returns {Promise<void>}
   */
  async loadUserPets(userId) {
    showLoading(true);
    try {
      const snapshot = await firebase.firestore()
        .collection('pets')
        .where('ownerId', '==', userId)
        .orderBy('createdAt', 'asc')
        .get();

      this.petsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      this.renderPetSwitcher();

      // Cargar la primera mascota si no hay una seleccionada
      if (this.petsList.length > 0 && !this.currentPetId) {
        const savedId = LocalStorage.get('currentPetId');
        const existingPet = this.petsList.find(p => p.id === savedId);
        this.selectPet(existingPet ? savedId : this.petsList[0].id);
      } else if (this.petsList.length === 0) {
        this.showNoPetsMessage();
      }

      Logger.info('Mascotas cargadas', { count: this.petsList.length });
    } catch (error) {
      Logger.error('Error al cargar mascotas', error);
      showToast('❌ Error al cargar mascotas', 'error');
    } finally {
      showLoading(false);
    }
  },

  /**
   * Guarda un nuevo perfil de mascota
   * @param {object} petData - Datos de la mascota
   * @returns {Promise<string>} ID del documento creado
   */
  async savePetProfile(petData) {
    const validation = validatePetProfile(petData);
    if (!validation.valid) {
      showToast(`❌ ${validation.errors[0]}`, 'error');
      return null;
    }

    showLoading(true);
    try {
      const userId = Auth.getUserId();
      const docRef = await firebase.firestore().collection('pets').add({
        ...petData,
        name: sanitizeText(petData.name),
        breed: sanitizeText(petData.breed),
        ownerId: userId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      Logger.info('Mascota guardada', { id: docRef.id, name: petData.name });
      showToast(`✅ ${petData.name} guardado correctamente`, 'success');

      // Recargar lista
      await this.loadUserPets(userId);
      this.selectPet(docRef.id);
      closeDrawer();

      return docRef.id;
    } catch (error) {
      Logger.error('Error al guardar mascota', error);
      showToast('❌ Error al guardar. Intenta de nuevo', 'error');
      return null;
    } finally {
      showLoading(false);
    }
  },

  /**
   * Actualiza el perfil de una mascota
   * @param {string} petId - ID de la mascota
   * @param {object} petData - Datos a actualizar
   * @returns {Promise<boolean>}
   */
  async updatePetProfile(petId, petData) {
    const validation = validatePetProfile(petData);
    if (!validation.valid) {
      showToast(`❌ ${validation.errors[0]}`, 'error');
      return false;
    }

    showLoading(true);
    try {
      await firebase.firestore().collection('pets').doc(petId).update({
        ...petData,
        name: sanitizeText(petData.name),
        breed: sanitizeText(petData.breed),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      Logger.info('Mascota actualizada', { id: petId });
      showToast('✅ Perfil actualizado correctamente', 'success');

      // Actualizar cache local
      const index = this.petsList.findIndex(p => p.id === petId);
      if (index !== -1) {
        this.petsList[index] = { ...this.petsList[index], ...petData };
      }

      closeDrawer();
      this.selectPet(petId);
      return true;
    } catch (error) {
      Logger.error('Error al actualizar mascota', error);
      showToast('❌ Error al actualizar', 'error');
      return false;
    } finally {
      showLoading(false);
    }
  },

  /**
   * Elimina una mascota y todos sus datos asociados
   * @param {string} petId - ID de la mascota
   * @returns {Promise<void>}
   */
  async deletePet(petId) {
    const pet = this.petsList.find(p => p.id === petId);
    const petName = pet?.name || 'esta mascota';

    showConfirm(
      `¿Eliminar a ${petName}?`,
      'Se eliminarán todos sus datos: fotos, salud, comidas, etc. Esta acción no se puede deshacer.',
      async () => {
        showLoading(true);
        try {
          // Eliminar foto de perfil si existe
          if (pet?.photoUrl) {
            await deleteFileByUrl(pet.photoUrl).catch(() => {});
          }

          // Eliminar subcolecciones
          await this._deleteSubcollections(petId);

          // Eliminar documento principal
          await firebase.firestore().collection('pets').doc(petId).delete();

          Logger.info('Mascota eliminada', { id: petId, name: petName });
          showToast(`🗑️ ${petName} eliminado correctamente`, 'info');

          // Limpiar selección y recargar
          this.currentPetId = null;
          LocalStorage.remove('currentPetId');
          await this.loadUserPets(Auth.getUserId());
        } catch (error) {
          Logger.error('Error al eliminar mascota', error);
          showToast('❌ Error al eliminar', 'error');
        } finally {
          showLoading(false);
        }
      }
    );
  },

  /**
   * Sube y actualiza la foto de perfil de la mascota
   * @param {string} petId - ID de la mascota
   * @param {File} file - Archivo de imagen
   * @returns {Promise<string>} URL de la nueva foto
   */
  async updateProfilePhoto(petId, file) {
    showLoading(true);
    try {
      const path = `pets/${petId}/profile_${Date.now()}`;
      const url = await uploadImageWithCompression(file, path, (progress) => {
        Logger.debug('Subiendo foto...', { progress });
      });

      await firebase.firestore().collection('pets').doc(petId).update({
        photoUrl: url,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      showToast('✅ Foto actualizada', 'success');
      Logger.info('Foto de perfil actualizada', { petId });

      // Actualizar cache
      const index = this.petsList.findIndex(p => p.id === petId);
      if (index !== -1) this.petsList[index].photoUrl = url;

      return url;
    } catch (error) {
      Logger.error('Error al subir foto', error);
      showToast('❌ Error al subir la foto', 'error');
      return null;
    } finally {
      showLoading(false);
    }
  },

  /**
   * Registra el peso actual de la mascota
   * @param {string} petId - ID de la mascota
   * @param {number} weight - Peso
   * @param {string} unit - 'kg' o 'lb'
   * @returns {Promise<void>}
   */
  async addWeightRecord(petId, weight, unit = 'kg') {
    const validation = validatePositiveNumber(weight, 'Peso');
    if (!validation.valid) {
      showToast(`❌ ${validation.message}`, 'error');
      return;
    }

    showLoading(true);
    try {
      await firebase.firestore()
        .collection('pets').doc(petId)
        .collection('weightHistory')
        .add({
          weight: parseFloat(weight),
          unit,
          recordedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

      // Actualizar peso actual en el perfil
      await firebase.firestore().collection('pets').doc(petId).update({
        currentWeight: parseFloat(weight),
        weightUnit: unit,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      Logger.info('Peso registrado', { petId, weight, unit });
      showToast('✅ Peso registrado', 'success');
    } catch (error) {
      Logger.error('Error al registrar peso', error);
      showToast('❌ Error al registrar peso', 'error');
    } finally {
      showLoading(false);
    }
  },

  /**
   * Obtiene el historial de pesos de una mascota
   * @param {string} petId - ID de la mascota
   * @returns {Promise<array>} Array de registros de peso
   */
  async getWeightHistory(petId) {
    try {
      const snapshot = await firebase.firestore()
        .collection('pets').doc(petId)
        .collection('weightHistory')
        .orderBy('recordedAt', 'asc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().recordedAt?.toDate?.() || new Date()
      }));
    } catch (error) {
      Logger.error('Error al obtener historial de peso', error);
      return [];
    }
  },

  /**
   * Selecciona la mascota activa y actualiza la UI
   * @param {string} petId - ID de la mascota
   */
  selectPet(petId) {
    this.currentPetId = petId;
    LocalStorage.set('currentPetId', petId);

    const pet = this.petsList.find(p => p.id === petId);
    if (pet) {
      this.renderPetProfile(pet);
      if (typeof Health !== 'undefined') Health.loadHealthData(petId);
      if (typeof Feeding !== 'undefined') Feeding.loadFeedingData(petId);
    }

    // Actualizar switcher activo
    const buttons = document.querySelectorAll('.pet-switch-btn');
    buttons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.petId === petId);
    });
  },

  /**
   * Renderiza el perfil de la mascota en la UI
   * @param {object} pet - Datos de la mascota
   */
  renderPetProfile(pet) {
    setInputValue('nameInput', pet.name);
    setInputValue('breedInput', pet.breed);
    setInputValue('birthInput', pet.birthDate);

    const photoEl = document.getElementById('petPhoto');
    if (photoEl && pet.photoUrl) {
      photoEl.src = pet.photoUrl;
      photoEl.alt = `Foto de perfil de ${pet.name}`;
    }

    const ageEl = document.getElementById('petAge');
    if (ageEl && pet.birthDate) {
      ageEl.textContent = calculateAge(pet.birthDate);
    }

    const weightEl = document.getElementById('petWeight');
    if (weightEl && pet.currentWeight) {
      weightEl.textContent = `${pet.currentWeight} ${pet.weightUnit || 'kg'}`;
    }
  },

  /**
   * Renderiza el switcher de mascotas
   */
  renderPetSwitcher() {
    const switcher = document.getElementById('petSwitcher');
    if (!switcher) return;

    switcher.innerHTML = '';

    this.petsList.forEach(pet => {
      const btn = document.createElement('button');
      btn.className = `pet-switch-btn ${pet.id === this.currentPetId ? 'active' : ''}`;
      btn.dataset.petId = pet.id;
      btn.title = pet.name;
      btn.setAttribute('aria-label', `Cambiar a ${pet.name}`);
      btn.innerHTML = pet.photoUrl
        ? `<img src="${pet.photoUrl}" alt="${pet.name}" class="pet-switch-img">`
        : `<span class="pet-switch-initial">${pet.name.charAt(0).toUpperCase()}</span>`;

      btn.addEventListener('click', () => this.selectPet(pet.id));
      switcher.appendChild(btn);
    });

    // Botón para añadir mascota
    const addBtn = document.createElement('button');
    addBtn.className = 'pet-switch-btn add-pet-btn';
    addBtn.innerHTML = '➕';
    addBtn.title = 'Añadir nueva mascota';
    addBtn.setAttribute('aria-label', 'Añadir nueva mascota');
    addBtn.addEventListener('click', () => openDrawer('newPet', {
      title: 'Nueva Mascota',
      subtitle: 'Llena el perfil de tu nueva mascota'
    }));
    switcher.appendChild(addBtn);
  },

  /**
   * Muestra mensaje cuando no hay mascotas
   */
  showNoPetsMessage() {
    const container = document.getElementById('noPetsMessage');
    if (container) container.style.display = 'flex';
  },

  /**
   * Elimina subcolecciones de Firestore de una mascota
   * @private
   */
  async _deleteSubcollections(petId) {
    const subcollections = ['weightHistory', 'vaccines', 'dewormings', 'medications', 'vetVisits', 'feedings', 'photos', 'grooming', 'notes'];
    const ref = firebase.firestore().collection('pets').doc(petId);

    for (const col of subcollections) {
      try {
        const snapshot = await ref.collection(col).get();
        const batch = firebase.firestore().batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        if (snapshot.docs.length > 0) await batch.commit();
      } catch (e) {
        Logger.warn(`Error al eliminar subcolección ${col}`, e);
      }
    }
  }
};

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Pets;
}
