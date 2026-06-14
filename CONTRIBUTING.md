# 🤝 Guía de Contribución - PupCare

¡Gracias por tu interés en contribuir a PupCare! Este documento explica cómo participar en el proyecto.

---

## 📋 Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [¿Cómo puedo contribuir?](#cómo-puedo-contribuir)
- [Configuración del entorno](#configuración-del-entorno)
- [Estilo de código](#estilo-de-código)
- [Proceso de Pull Request](#proceso-de-pull-request)
- [Reportar Bugs](#reportar-bugs)

---

## 📜 Código de Conducta

Este proyecto mantiene un ambiente respetuoso e inclusivo. Se esperan las siguientes conductas:

- Usar lenguaje amigable e inclusivo
- Respetar puntos de vista diferentes
- Aceptar las críticas constructivas
- Enfocarse en lo que es mejor para la comunidad

---

## 💡 ¿Cómo puedo contribuir?

### 🐛 Reportando Bugs

Antes de crear un bug report:

1. **Busca en los issues existentes** para evitar duplicados
2. **Reproduce el bug** y asegúrate de que sea reproducible
3. **Crea un issue** con la siguiente información:
   - Título claro y descriptivo
   - Pasos para reproducir el problema
   - Comportamiento esperado vs observado
   - Screenshots si es posible
   - Entorno (navegador, OS, versión)

**Plantilla de Bug Report:**

```markdown
## 🐛 Descripción del Bug
[Descripción clara del problema]

## 📋 Pasos para Reproducir
1. Ir a '...'
2. Hacer clic en '...'
3. Observar el error

## ✅ Comportamiento Esperado
[Lo que debería ocurrir]

## ❌ Comportamiento Actual
[Lo que ocurre actualmente]

## 📸 Screenshots
[Si aplica]

## 🔧 Entorno
- OS: [ej: Windows 11]
- Navegador: [ej: Chrome 120]
- Dispositivo: [ej: iPhone 14 / Desktop]
```

---

### ✨ Sugiriendo Nuevas Características

Para proponer una nueva función:

1. Verifica que no exista ya como issue o en el roadmap
2. Crea un issue etiquetado como `enhancement`
3. Describe claramente:
   - El problema que resuelve
   - Cómo imaginas que funcionaría
   - Por qué sería valioso para otros usuarios

---

### 🔧 Contribuyendo con Código

#### Proceso general

1. **Fork** el repositorio
2. **Crea una rama** desde `main`:
   ```bash
   git checkout -b feature/nombre-de-la-feature
   # o
   git checkout -b fix/descripcion-del-bug
   ```
3. **Haz tus cambios** siguiendo el estilo de código
4. **Escribe o actualiza tests** si aplica
5. **Commit** con mensajes descriptivos
6. **Push** y crea un Pull Request

---

## ⚙️ Configuración del Entorno

```bash
# 1. Clona tu fork
git clone https://github.com/TU-USUARIO/Pupcare.git
cd Pupcare

# 2. Agrega el repositorio original como remote
git remote add upstream https://github.com/rafaelperez0115-droid/Pupcare.git

# 3. Sirve localmente
python -m http.server 8000
# Abre: http://localhost:8000

# 4. Para mantener tu fork actualizado:
git fetch upstream
git merge upstream/main
```

---

## 🎨 Estilo de Código

### JavaScript

```javascript
// ✅ BIEN - Usar const y let, nunca var
const petName = 'Max';
let currentWeight = 12.5;

// ✅ BIEN - Nombres descriptivos en español o inglés (ser consistente)
async function saveVaccineRecord(petId, vaccineData) {
  // ...
}

// ✅ BIEN - Siempre usar try-catch en operaciones Firebase
async function saveData() {
  showLoading(true);
  try {
    await firebase.firestore().collection('pets').add(data);
    showToast('✅ Guardado correctamente', 'success');
  } catch (error) {
    Logger.error('Error al guardar', error);
    showToast('❌ Error al guardar', 'error');
  } finally {
    showLoading(false);
  }
}

// ✅ BIEN - Documentar funciones con JSDoc
/**
 * Calcula la edad de la mascota
 * @param {string} birthDate - Fecha en formato YYYY-MM-DD
 * @returns {string} Edad formateada
 */
function calculateAge(birthDate) {
  // ...
}

// ❌ MAL - Evitar
var x = 5;
function d() { firebase.firestore().add(d); } // sin manejo de errores
```

### CSS

```css
/* ✅ BIEN - Usar variables CSS */
.btn-primary {
  background-color: var(--color-primary);
  border-radius: var(--border-radius-md);
}

/* ✅ BIEN - Clases descriptivas */
.health-card { ... }
.pet-profile-photo { ... }

/* ❌ MAL - Evitar IDs para estilos */
#miBoton { ... }
```

### HTML

```html
<!-- ✅ BIEN - Atributos de accesibilidad -->
<button 
  aria-label="Guardar vacuna de Max"
  aria-describedby="vaccine-hint"
>💉 Guardar Vacuna</button>

<!-- ✅ BIEN - Labels para inputs -->
<label for="petName">Nombre de la mascota</label>
<input 
  id="petName" 
  type="text"
  aria-required="true"
  placeholder="Ej: Max, Guts, Bella"
>
```

---

## 📝 Convención de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
tipo(scope): descripción corta

[cuerpo opcional]

[pie de página opcional]
```

**Tipos válidos:**

| Tipo | Cuándo usar |
|------|-------------|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `docs` | Solo documentación |
| `style` | Cambios de formato (sin lógica) |
| `refactor` | Refactorización de código |
| `test` | Añadir o corregir tests |
| `chore` | Tareas de mantenimiento |

**Ejemplos:**

```bash
git commit -m "feat(health): añadir módulo de desparasitación"
git commit -m "fix(auth): corregir mensaje de error en contraseña inválida"
git commit -m "docs: actualizar README con instrucciones de instalación"
git commit -m "style(css): ajustar colores del tema oscuro"
git commit -m "refactor(pets): extraer lógica de peso a función separada"
```

---

## 🔀 Proceso de Pull Request

1. **Título claro** siguiendo la convención de commits
2. **Descripción completa** con:
   - Qué cambios hiciste y por qué
   - Screenshots para cambios visuales
   - Issues relacionados (`Fixes #123`, `Closes #456`)
3. **Tests pasando** (si hay tests)
4. **Sin conflictos** con `main`
5. **Código revisado** por ti mismo antes de enviar

**Plantilla de PR:**

```markdown
## 📋 Descripción
[¿Qué cambiaste y por qué?]

## 🔗 Issues Relacionados
Fixes #[número]

## 🧪 Cómo Probarlo
1. Paso 1
2. Paso 2

## 📸 Screenshots (si aplica)
[Antes / Después]

## ✅ Checklist
- [ ] El código sigue el estilo del proyecto
- [ ] He probado en mobile y desktop
- [ ] He probado en modo oscuro y claro
- [ ] Los tests pasan (si hay)
- [ ] He actualizado la documentación si es necesario
```

---

## ❓ ¿Preguntas?

Si tienes dudas, abre un [Discussion](https://github.com/rafaelperez0115-droid/Pupcare/discussions) o crea un issue etiquetado como `question`.

---

¡Gracias por ayudar a mejorar PupCare! 🐾
