# Politica de Seguridad y Divulgacion Responsable

El equipo de TODOMIGOBGT se toma con la maxima seriedad la seguridad de la informacion de los ciudadanos, la integridad de los datos gubernamentales sindicados y la robustez de la infraestructura.

---

## 1. Versiones Soportadas

Actualmente, solo las versiones oficiales publicadas en la rama `main` y etiquetadas formalmente reciben actualizaciones y parches de seguridad:

| Version | Soportada |
| :--- | :--- |
| `1.x.x` (main) | Si |
| `< 1.0.0` (mvp / preliminares) | No |

---

## 2. Reporte de Vulnerabilidades

Si has descubierto una vulnerabilidad potencial de seguridad en cualquiera de los componentes de TODOMIGOBGT (Frontend Astro, News Pipeline, API Python o Configuracion de Servidor Edge), te solicitamos **NO publicar el problema en un issue publico de GitHub**.

Por favor, sigue el siguiente procedimiento de divulgacion responsable:

1. **Contacto confidencial:**
   Envia un correo electronico a `trebol4devop@gmail.com` con el asunto:
   `[SEGURIDAD] Reporte de Vulnerabilidad en TODOMIGOBGT`.

2. **Informacion a incluir:**
   * Descripcion detallada de la vulnerabilidad y vector de ataque.
   * Pasos reproducibles o script de prueba de concepto (PoC).
   * Componentes afectados (`todo-mi-gob-gt`, `news-pipeline`, `raspberry-pi`, etc.).
   * Evaluacion del impacto potencial sobre confidencialidad, integridad o disponibilidad.

3. **Plazos de respuesta y tratamiento:**
   * **Acuse de recibo:** En un plazo maximo de 48 horas habiles.
   * **Evaluacion y validacion:** Dentro de los primeros 5 dias habiles tras el reporte.
   * **Publicacion de correccion:** Los parches criticos se integraran mediante ramas `hotfix` y se liberaran de inmediato a produccion antes de cualquier publicacion o divulgacion publica.

---

## 3. Practicas de Seguridad Incorporadas

* **Almacenamiento de Datos Minimo:** No se almacenan contrasenas ciudadanas ni identificadores personales sensibles distintos de nombre, correo y preferencias tematicas de interes publico.
* **Separacion de Privilegios:** Contenedores ejecutados como usuarios no privilegiados.
* **Comunicaciones Cifradas:** Uso obligatorio de HTTPS en capa Edge (Cloudflare) y tunel cifrado punto a punto en capa Ingress (Tailscale Funnel con TLS automatico).
* **Autenticacion SMTP Segura:** Trafico SMTP exclusivamente a traves de TLS/SSL con contrasenas de aplicacion restringidas.
