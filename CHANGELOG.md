# Registro de Cambios (Changelog)

Todas las modificaciones notables realizadas en el proyecto TODOMIGOBGT se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y este proyecto se adhiere a [Semantic Versioning 2.0.0](https://semver.org/lang/es/).

---

## [1.0.0] - 2026-09-29

### Anadido
* Migracion e integracion total del historial de control de versiones y ramas desde repositorio de origen hacia `todomigobgt`.
* Implementacion formal del flujo de trabajo Git Flow (`main`, `develop`, ramas de soporte).
* Adicion de documentacion formal de comunidad: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md` y `CHANGELOG.md`.
* Configuracion de `.gitattributes` para normalizacion de saltos de linea (LF/CRLF).
* Integracion de flujos de trabajo de integracion y despliegue continuo en `.github/workflows/docker-publish.yml` para soporte multi-arquitectura (ARM64 y AMD64).
* Cobertura de pruebas unitarias para validacion de correos unicos en SQLite y renderizado de plantillas institucionales.

### Cambiado
* Unificacion de marca e identificadores del sistema de `TODOMIGOB` a `TODOMIGOBGT` en interfaces web, API perimetral, esquemas de bases de datos, scripts de despliegue y variables de entorno.
* Eliminacion estricta de emoticonos y elementos graficos informales en la documentacion tecnica, terminal CLI, codigo fuente y plantillas.
* Refactorizacion de la arquitectura de despacho asincrono de notificaciones en Python (`server.py`, `mailer.py`, `dispatcher.py`).
* Actualizacion de configuraciones de despliegue en Cloudflare Workers y almacenamiento de objetos Cloudflare R2 (`todomigobgt`).

### Corregido
* Restriccion de unicidad estricta para correos en base de datos SQLite (`COLLATE NOCASE`), evitando duplicados con mayusculas/minusculas.
* Manejo de encabezados CORS y resolucion de peticiones preflight en endpoints de la API.
* Parametrizacion de timeouts y reintentos ante fallas temporales en la API de inferencia externa y almacenamiento en la nube.
