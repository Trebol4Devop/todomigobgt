# Guia de Contribucion a TODOMIGOBGT

Gracias por tu interes en contribuir al proyecto TODOMIGOBGT, una iniciativa de codigo abierto orientada a democratizar el acceso a la informacion publica y servicios del Estado de Guatemala.

Para mantener la calidad, estabilidad y seguridad del repositorio, todas las personas colaboradoras deben apegarse a los lineamientos tecnicos y metodologicos descritos en este documento.

---

## 1. Codigo de Conducta

Este proyecto se rige por nuestro [Codigo de Conducta](CODE_OF_CONDUCT.md). Al participar, se asume el compromiso de mantener un ambiente respetuoso, inclusivo y profesional.

---

## 2. Modelo de Ramas (Git Flow Formal)

El repositorio sigue estrictamente el flujo de trabajo **Git Flow**. Ningun desarrollo se envia directamente a la rama `main`.

### Estructura de Ramas

* **`main`**: Rama de produccion. Contiene exclusivamente codigo estable, etiquetado mediante versiones semanticas (`vMAJOR.MINOR.PATCH`). Todos los despliegues de produccion se derivan de esta rama.
* **`develop`**: Rama principal de integracion continua. Recibe las funcionalidades y refactorizaciones completadas para pruebas consolidadas antes de una version de produccion.
* **`feature/<nombre-descriptivo>`**: Ramas temporales para desarrollo de nuevas caracteristicas. Se originan a partir de `develop` y se reintegran exclusivamente a `develop`.
* **`refactor/<nombre-descriptivo>`**: Ramas para reestructuracion interna de codigo sin alterar la logica de negocio. Se derivan de `develop` y se integran a `develop`.
* **`bugfix/<nombre-descriptivo>`**: Ramas para correccion de errores no criticos en `develop`.
* **`hotfix/<nombre-descriptivo>`**: Ramas para correcciones criticas en produccion. Se originan a partir de `main` y, al concluir, se fusionan tanto en `main` como en `develop`.
* **`release/v<version>`**: Ramas de estabilizacion previas al corte de una nueva version.

### Reglas de Integracion

1. Toda fusion a `develop` o `main` se realiza mediante Pull Requests (PRs) con revision de codigo aprobada.
2. No se admiten fusiones de avance rapido forzado (`fast-forward`) sin trazabilidad cuando se combinan caracteristicas complejas; se recomienda preservar el historial mediante merges de no avance rapido (`--no-ff`) o rebase limpio segun la politica del equipo.
3. El codigo debe compilar, superar las pruebas unitarias y de integracion, y carecer de errores de analisis estatico (linter) antes de solicitar la integracion.

---

## 3. Convencion de Commits (Conventional Commits 1.0.0)

Todos los mensajes de confirmacion (commits) deben cumplir con la especificacion formal de [Conventional Commits](https://www.conventionalcommits.org/):

```text
<tipo>[ambito opcional]: <descripcion breve en modo imperativo>

[cuerpo descriptivo opcional]

[pie de commit opcional]
```

### Tipos Permitidos

* **`feat`**: Incorporacion de una nueva funcionalidad visible o de API.
* **`fix`**: Correccion de un error comprobable en el codigo.
* **`refactor`**: Modificacion del codigo que ni agrega una funcionalidad ni corrige un bug.
* **`docs`**: Cambios exclusivamente orientados a la documentacion.
* **`test`**: Inclusion o correccion de pruebas automatizadas sin impacto en produccion.
* **`chore`**: Tareas de mantenimiento, actualizacion de dependencias o configuraciones de compilacion.
* **`perf`**: Mejoras destinadas al rendimiento y optimizacion de recursos.
* **`ci`**: Modificaciones en archivos de integracion o despliegue continuo (ej. GitHub Actions).

### Reglas de Estilo de Commits

1. Escribir en modo imperativo (ejemplo: `feat: agregar extractor para nuevo portal de conred`).
2. Limitar la primera linea a 72 caracteres maximo.
3. No utilizar emojis ni expresiones informales en mensajes de confirmacion.
4. Si introduce un cambio incompatible con versiones previas (Breaking Change), se debe indicar explcitamente con `!` tras el tipo/ambito o mediante el pie `BREAKING CHANGE: <descripcion>`.

---

## 4. Control de Versiones Semantico (SemVer 2.0.0)

El proyecto adopta la especificacion formal de [Semantic Versioning 2.0.0](https://semver.org/):

* **MAJOR (X.0.0)**: Cambios incompatibles en la API, estructura de base de datos o arquitectura que requieran migraciones manuales.
* **MINOR (0.Y.0)**: Adicion de funcionalidades compatibles hacia atras.
* **PATCH (0.0.Z)**: Correcciones de errores compatibles hacia atras y optimizaciones menores.

---

## 5. Proceso de Desarrollo y Pull Requests

1. **Crear bifurcacion (Fork) o rama de trabajo:**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/nombre-de-la-funcionalidad
   ```
2. **Ejecutar pruebas locales:**
   * En `news-pipeline`: `pnpm test`
   * En `todo-mi-gob-gt`: `pnpm build`
   * En `raspberry-pi`: `python test_database.py && python test_mailer.py`
3. **Confirmar cambios:**
   Asegurar que cada commit sea atomico, autocontenido y conforme a la convencion.
4. **Abrir Pull Request:**
   * Apuntar siempre hacia `develop` (a excepcion de hotfixes dirigidos a `main`).
   * Proporcionar una descripcion detallada del problema resuelto, los componentes modificados y las pruebas realizadas.
   * Solicitar revision a los mantenedores designados.

---

## 6. Estandares de Codigo

* **TypeScript / Node.js:** Codigo tipado estrictamente (`noImplicitAny`), sin variables globales huerfanas ni advertencias de compilador.
* **Python:** Apego a directrices PEP 8, documentacion explicita en docstrings para metodos publicos y tipado estatico opcional (`typing`).
* **Astro:** Componentes semanticos, accesibilidad conforme a pautas WCAG 2.1 AA, variables CSS centralizadas y soporte de modo oscuro/claro.
