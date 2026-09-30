# Guía de Comandos y Configuración: Envío de Alertas TODOMIGOBGT

Esta guía contiene la configuración de variables de entorno (`.env`) y todos los comandos necesarios para consultar usuarios y despachar noticias a todos los ciudadanos suscritos según su categoría, considerando que los comandos se ejecutan desde la máquina host o desde un **contenedor Docker independiente**.

---

## 1. Archivo `.env`

Copia este contenido en tu archivo `.env` en la máquina donde corre el servicio:

```ini
# ==========================================
# CONFIGURACIÓN DEL SERVIDOR TODOMIGOBGT
# ==========================================
DOCKER_IMAGE=spumapl/todomigobgt-service:latest
HOST=0.0.0.0
PORT=8080
EXTERNAL_PORT=8081
DB_PATH=/app/data/todomigobgt.db

# ==========================================
# CREDENCIALES SMTP GMAIL (OFICIALES)
# ==========================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=trebol4devop@gmail.com
SMTP_PASS="lykc jsej osgf ezee"
SMTP_APP_NAME=todomigobgt
SENDER_NAME="TODOMIGOBGT Alertas Ciudadanas"

# ==========================================
# URL DE LA API PARA DOCKERS CLIENTES / SCRIPTS
# ==========================================
# Si ejecutas desde la misma máquina donde corre el contenedor:
TODOMIGOBGT_API_URL=http://localhost:8081/api
# Si ejecutas desde otra máquina en la misma red local:
# TODOMIGOBGT_API_URL=http://<IP_DE_LA_MAQUINA>:8081/api
```

---

## 2. Iniciar / Reiniciar el Contenedor del Servicio

Para asegurarte de que el contenedor esté corriendo con el correo y contraseña correctos en el puerto `8081`:

```bash
docker rm -f todomigobgt-service

docker run -d \
  --name todomigobgt-service \
  --restart unless-stopped \
  -p 8081:8080 \
  -v ./data:/app/data \
  -e SMTP_USER="trebol4devop@gmail.com" \
  -e SMTP_PASS="lykc jsej osgf ezee" \
  spumapl/todomigobgt-service:latest
```

---

## 3. Comandos para Ver Todos los Usuarios Registrados

### Opción A: Desde otro contenedor Docker independiente (curl efímero)
```bash
docker run --rm --network host curlimages/curl:latest -s http://localhost:8081/api/users
```

### Opción B: Con `curl` directo desde la terminal de la máquina
```bash
curl -s http://localhost:8081/api/users
```

### Opción C: Mediante la herramienta CLI interna del contenedor (formato tabla)
```bash
docker exec -it todomigobgt-service python manage.py list-users
```

---

## 4. Crear el Lote de Noticias para Todas las Categorías

Ejecuta el siguiente bloque en la terminal para generar el archivo `noticias_todas_categorias.json`. Este archivo incluye una noticia para cada una de las 6 categorías oficiales, garantizando que **todos los usuarios registrados reciban correo según sus preferencias**:

```bash
cat << 'EOF' > noticias_todas_categorias.json
[
  {
    "id": "noticia-cat-educacion-01",
    "categoryId": "education_scholarships",
    "urgent": false,
    "originalUrl": "https://todomigobgt.gob.gt/educacion/becas",
    "content": {
      "es": {
        "title": "Convocatoria Nacional de Becas Universitarias 2026",
        "summary": "El Ministerio de Educación abre 2,500 plazas de becas para estudios superiores y carreras técnicas en todo el país.",
        "citizenAction": "Completar el formulario de postulación en el portal oficial antes del 30 de septiembre."
      }
    }
  },
  {
    "id": "noticia-cat-salud-01",
    "categoryId": "health_wellbeing",
    "urgent": false,
    "originalUrl": "https://todomigobgt.gob.gt/salud/jornadas",
    "content": {
      "es": {
        "title": "Jornada Integral de Salud y Vacunación",
        "summary": "Centros de salud comunitarios estarán habilitados este fin de semana para atención preventiva y esquema de vacunación completo.",
        "citizenAction": "Presentarse con DPI y carnet de vacunación en el puesto de salud más cercano de 8:00 a 16:00 hrs."
      }
    }
  },
  {
    "id": "noticia-cat-social-01",
    "categoryId": "social_programs",
    "urgent": false,
    "originalUrl": "https://todomigobgt.gob.gt/desarrollo-social",
    "content": {
      "es": {
        "title": "Actualización del Padrón de Transferencias Monetarias del Bono Social",
        "summary": "MIDES inicia el período de verificación presencial para familias beneficiarias de subsidios nutricionales y escolares.",
        "citizenAction": "Acudir a la sede municipal del MIDES con copia de DPI y constancia de inscripción escolar de los hijos."
      }
    }
  },
  {
    "id": "noticia-cat-tramites-01",
    "categoryId": "procedures_services",
    "urgent": false,
    "originalUrl": "https://todomigobgt.gob.gt/tramites/licencias",
    "content": {
      "es": {
        "title": "Digitalización de Solicitudes para Licencias Sanitarias",
        "summary": "El MSPAS habilita ventanilla electrónica para consultar requisitos y dar seguimiento al trámite de establecimientos.",
        "citizenAction": "Ingresar al portal con tu número de expediente para consultar el arancel exacto y la lista de verificación previa."
      }
    }
  },
  {
    "id": "noticia-cat-seguridad-01",
    "categoryId": "security_alerts",
    "urgent": true,
    "originalUrl": "https://todomigobgt.gob.gt/conred/alertas",
    "content": {
      "es": {
        "title": "Aviso Meteorológico: Descenso de Temperaturas y Vientos Fuertes",
        "summary": "CONRED emite alerta informativa por ingreso de sistema frontal en la región del altiplano y centro del país.",
        "citizenAction": "Abrigarse adecuadamente, revisar techos de lámina y reportar emergencias al número 119."
      }
    }
  },
  {
    "id": "noticia-cat-empleo-01",
    "categoryId": "employment_development",
    "urgent": false,
    "originalUrl": "https://todomigobgt.gob.gt/mintrab/ferias",
    "content": {
      "es": {
        "title": "Feria Nacional de Empleo y Fondos para Emprendimiento",
        "summary": "Ministerio de Trabajo y Economía disponen de más de 3,000 vacantes y créditos blandos para microempresas.",
        "citizenAction": "Llevar currículum vitae impreso y digital a la sede departamental de 8:30 a 17:00 hrs."
      }
    }
  }
]
EOF
```

---

## 5. Comandos para Despachar y Enviar los Correos

### Opción A: Ejecutado desde otro contenedor Docker aparte
```bash
docker run --rm --network host -v $(pwd):/work -w /work curlimages/curl:latest \
  -X POST http://localhost:8081/api/news/dispatch \
  -H "Content-Type: application/json" \
  -d @noticias_todas_categorias.json
```

### Opción B: Con `curl` directo en una sola línea desde el host
```bash
curl -X POST http://localhost:8081/api/news/dispatch -H "Content-Type: application/json" -d @noticias_todas_categorias.json
```

---

## 6. Comandos para Auditar el Historial de Envíos

### Ver logs desde otro contenedor Docker:
```bash
docker run --rm --network host curlimages/curl:latest -s http://localhost:8081/api/logs
```

### Ver logs con `curl` directo:
```bash
curl -s http://localhost:8081/api/logs
```

### Ver logs en la interfaz web:
Abre en tu navegador:
```text
http://localhost:8081
```
En la pestaña **"Historial de Notificaciones"**.
