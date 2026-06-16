# 🐾 PupCare — Guía de Configuración

## Paso 1 — Obtener tu Firebase Config

1. Ve a https://console.firebase.google.com
2. Selecciona tu proyecto **PupCare**
3. Clic en ⚙️ **Configuración del proyecto** → pestaña **General**
4. Baja hasta "Tus apps" → clic en **</>** (Web)
5. Copia los valores del objeto `firebaseConfig`

## Paso 2 — Pegar la config en la app

Abre `js/firebase-config.js` y reemplaza los valores:

```javascript
const firebaseConfig = {
  apiKey:            "PEGA TU apiKey",
  authDomain:        "PEGA TU authDomain",
  projectId:         "PEGA TU projectId",
  storageBucket:     "PEGA TU storageBucket",
  messagingSenderId: "PEGA TU messagingSenderId",
  appId:             "PEGA TU appId"
};
```

## Paso 3 — Habilitar Auth en Firebase

1. Firebase Console → **Authentication** → **Sign-in method**
2. Habilita **Email/Password**
3. (Opcional) Habilita **Google**

## Paso 4 — Aplicar Reglas de Firestore

1. Firebase Console → **Firestore Database** → pestaña **Reglas**
2. Borra el contenido actual
3. Pega el contenido de `firestore.rules`
4. Clic en **Publicar**

## Paso 5 — Aplicar Reglas de Storage

1. Firebase Console → **Storage** → pestaña **Reglas**
2. Borra el contenido actual
3. Pega el contenido de `storage.rules`
4. Clic en **Publicar**

## Paso 6 — Subir a GitHub

### Estructura de archivos que va en tu repo:
```
Pupcare/
├── index.html
├── manifest.json
├── sw.js
├── firestore.rules
├── storage.rules
├── css/
│   └── style.css
├── js/
│   ├── firebase-config.js
│   ├── app.js
│   ├── profile.js
│   └── modules.js
└── assets/
    └── icons/
        └── paw.svg
```

### Desde GitHub Web (recomendado sin Git):
1. Ve a tu repo: https://github.com/rafaelperez0115-droid/Pupcare
2. Para cada archivo: **Add file → Create new file**
3. Escribe la ruta completa (ej: `css/style.css`) — GitHub crea las carpetas solas
4. Pega el contenido → **Commit changes**

### Desde Git (si tienes Git instalado):
```bash
git clone https://github.com/rafaelperez0115-droid/Pupcare.git
cd Pupcare
# Copia aquí todos los archivos nuevos
git add .
git commit -m "feat: nueva versión de PupCare desde cero"
git push origin main
```

## Paso 7 — Desplegar en Netlify (gratis)

1. Ve a https://netlify.com e inicia sesión
2. **Add new site → Import an existing project → GitHub**
3. Selecciona el repo **Pupcare**
4. Build command: (dejar vacío)
5. Publish directory: `.` (punto)
6. Clic en **Deploy**

¡Listo! Tu app estará en una URL como `https://pupcare-xyz.netlify.app`

---

## ⚠️ Notas importantes

- **Íconos PWA**: Necesitas crear `assets/icons/icon-192.png` y `assets/icons/icon-512.png`
  para que la app sea instalable. Puedes usar cualquier imagen 192x192 y 512x512 pixeles.
  
- **Firebase gratis**: El plan Spark (gratuito) incluye:
  - 1 GB de almacenamiento en Storage
  - 1 GB de datos en Firestore
  - 50,000 lecturas/día y 20,000 escrituras/día
  - Más que suficiente para uso personal

- **Primera vez**: Al abrir la app, crea tu cuenta con tu correo y contraseña.
  Luego configura el perfil de Guts y ¡listo!
