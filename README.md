# 🐾 PupCare - Centro de Control PWA

Una **aplicación Progressive Web App (PWA)** moderna y responsiva para gestionar el cuidado integral de tu mascota. Diseñada para ser rápida, intuitiva y funcionar sin conexión a internet.

![PWA Badge](https://img.shields.io/badge/PWA-Ready-blue?logo=pwa)
![Firebase](https://img.shields.io/badge/Firebase-Integrated-orange?logo=firebase)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Características principales

✅ **Gestión de Mascotas** - Crea y administra múltiples perros con sus propios perfiles

🩺 **Seguimiento Veterinario** - Registra vacunas, desparasitaciones y visitas al veterinario

💊 **Medicamentos** - Controla medicamentos y su administración

🍽️ **Plan de Alimentación** - Define horarios y cantidad de comida, registra cada comida

📊 **Gráficos de Crecimiento** - Visualiza el peso de tu mascota en el tiempo

📸 **Álbum de Fotos** - Crea un registro visual del crecimiento de tu cachorro mes a mes

🛁 **Rutinas de Cuidado** - Registra baños, cortes de uñas, cepillado y más

📝 **Notas de Comportamiento** - Documenta cambios de comportamiento y hitos del desarrollo

🌙 **Tema Oscuro/Claro** - Interfaz adaptable según preferencia del usuario

📱 **Totalmente Responsivo** - Funciona perfectamente en teléfonos, tablets y computadoras

⚡ **Funciona sin Internet** - Los cambios se sincronizan automáticamente cuando reconectas

---

## 🚀 Inicio Rápido

### Instalación en dispositivo

1. **Abre la app en tu navegador:**
   - Dirección: `https://pupcare.netlify.app` (reemplaza con tu URL)
   - Compatible con: Chrome, Firefox, Safari, Edge

2. **Instala como app:**
   - **En teléfono Android:** Toca el menú (⋮) → "Instalar app" o "Agregar a pantalla de inicio"
   - **En iPhone:** Safari → Compartir (↗️) → "Agregar a pantalla de inicio"
   - **En PC:** Haz clic en el ícono de instalación en la barra de direcciones

3. **¡Listo!** La app se descargará y funcionará como nativa en tu dispositivo

### Desarrollo local

```bash
# 1. Clona el repositorio
git clone https://github.com/rafaelperez0115-droid/Pupcare.git
cd Pupcare

# 2. Sirve los archivos localmente
# Opción A: Con Python 3
python -m http.server 8000

# Opción B: Con Node.js + http-server
npx http-server

# Opción C: Con Live Server en VS Code
# Instala extensión "Live Server" y haz clic derecho → "Open with Live Server"

# 3. Abre en el navegador
# http://localhost:8000
```

---

## 📋 Requisitos Previos

- Navegador moderno (Chrome 51+, Firefox 44+, Safari 11+, Edge 15+)
- Conexión a internet para la primera carga
- Una cuenta de Google para iniciar sesión (opcional, también puedes crear cuenta con email)

---

## 🛠️ Tecnologías Utilizadas

### Frontend
- **HTML5** - Estructura semántica
- **CSS3** - Diseño responsivo con variables CSS
- **JavaScript Vanilla** - Sin dependencias externas (excepto Firebase)

### Backend & Servicios
- **Firebase Authentication** - Autenticación segura con Google y email
- **Firebase Firestore** - Base de datos en tiempo real
- **Firebase Storage** - Almacenamiento de fotos

### PWA
- **Service Worker** - Funcionalidad offline
- **Web Manifest** - Instalación como app
- **Workbox** (futuro) - Caché inteligente

---

## 📁 Estructura del Proyecto

```
Pupcare/
├── src/
│   ├── js/
│   │   ├── app.js                 # Archivo principal
│   │   ├── firebase-config.js     # Configuración de Firebase
│   │   ├── utils/
│   │   │   ├── validation.js      # Funciones de validación
│   │   │   ├── storage.js         # Utilidades de almacenamiento
│   │   │   ├── logger.js          # Sistema de logging
│   │   │   └── ui-helpers.js      # Funciones de UI
│   │   └── modules/
│   │       ├── auth.js            # Lógica de autenticación
│   │       ├── pets.js            # Gestión de mascotas
│   │       ├── health.js          # Seguimiento de salud
│   │       └── feeding.js         # Gestión de alimentación
│   ├── css/
│   │   ├── style.css              # Estilos principales
│   │   ├── components/
│   │   │   ├── buttons.css
│   │   │   ├── forms.css
│   │   │   └── cards.css
│   │   └── themes/
│   │       ├── light.css
│   │       └── dark.css
│   └── assets/
│       ├── icons/
│       │   ├── icon-192.png
│       │   └── icon-512.png
│       └── images/
│
├── tests/
│   ├── unit/
│   │   ├── validation.test.js
│   │   └── auth.test.js
│   └── integration/
│       └── pets.test.js
│
├── netlify/
│   └── functions/                 # Funciones serverless (si aplica)
│
├── index.html
├── manifest.json
├── sw.js
├── netlify.toml
├── .gitignore
├── README.md
└── CONTRIBUTING.md
```

---

## 🔐 Seguridad y Privacidad

- **Autenticación:** Las contraseñas se almacenan de forma segura en Firebase Auth
- **Datos encriptados:** Comunicación HTTPS en todo momento
- **Datos privados:** Solo tú tienes acceso a tus datos de mascotas
- **Sin seguimiento:** No utilizamos Google Analytics ni rastreadores
- **Open Source:** Código auditable en GitHub

---

## 🤝 Cómo Contribuir

¿Quieres mejorar PupCare? ¡Nos encantaría tu ayuda!

1. **Fork** el repositorio
2. Crea una rama para tu feature: `git checkout -b feature/AmazingFeature`
3. Commit tus cambios: `git commit -m 'Add AmazingFeature'`
4. Push a la rama: `git push origin feature/AmazingFeature`
5. Abre un **Pull Request**

Ver [CONTRIBUTING.md](./CONTRIBUTING.md) para más detalles.

---

## 📝 Licencia

Este proyecto está bajo la licencia **MIT**. Ver [LICENSE](./LICENSE) para más información.

---

## 🐛 Reporte de Bugs

¿Encontraste un bug? 🐞

1. Verifica que el bug no haya sido reportado en [Issues](https://github.com/rafaelperez0115-droid/Pupcare/issues)
2. Si no existe, crea un nuevo issue con:
   - Descripción clara del problema
   - Pasos para reproducir
   - Comportamiento esperado vs actual
   - Captura de pantalla si es posible

---

## 💡 Sugerencias y Solicitudes de Características

¿Tienes una idea para mejorar PupCare?

Abre un [GitHub Discussion](https://github.com/rafaelperez0115-droid/Pupcare/discussions) o un Issue etiquetado como "enhancement".

---

## 🙏 Agradecimientos

- Inspirado en la necesidad de mantener un registro completo del cuidado canino
- Desarrollado con ❤️ para amantes de los perros
- Gracias a [Firebase](https://firebase.google.com) por la infraestructura
- Fonts: [Google Fonts](https://fonts.google.com)

---

## 📞 Contacto

- **GitHub:** [@rafaelperez0115-droid](https://github.com/rafaelperez0115-droid)
- **Issues:** [Abre un issue](https://github.com/rafaelperez0115-droid/Pupcare/issues)

---

<div align="center">

**Hecho con 🐾 para los amigos de 4 patas**

⭐ Si te gusta PupCare, ¡déjanos una estrella en GitHub!

</div>
