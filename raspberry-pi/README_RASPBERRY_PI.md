# TODOMIGOBGT · Base de Datos y Notificaciones para Raspberry Pi 4

Sistema de almacenamiento de ciudadanos, preferencias de noticias y despachador de notificaciones por correo electrónico oficial diseñado para desplegarse de manera ultra-sencilla y con consumo mínimo de recursos en una **Raspberry Pi 4**.

---

##  Características Principales

- **Base de Datos SQLite 3 Integrada:**
  - 0 configuración de servidores pesados.
  - Modo WAL (*Write-Ahead Logging*) activado para máxima velocidad y tolerancia a cortes de energía en la Raspberry Pi.
  - Guarda: **Nombre**, **Correo Electrónico**, y **Múltiples Preferencias** por ciudadano.
  - Sistema de prevención de duplicados: garantiza que ningún usuario reciba la misma noticia más de una vez.
  - Auditoría completa de envíos (`SENT`, `FAILED`, marcas de tiempo y errores).

- **Despacho Automático de Correos por Categoría:**
  - Envía avisos únicamente a los usuarios suscritos a la categoría correspondiente de la nueva noticia.
  - Integrado con el servidor SMTP de Gmail:
    - **Servidor:** `smtp.gmail.com`
    - **Puerto:** `465` (SSL) o `587` (TLS)
    - **Contraseña de aplicación:** `lykc jsej osgf ezee`
    - **Nombre de aplicación:** `todomigobgt`
  - Plantilla oficial con diseño cívico guatemalteco (bandera azul-blanco-azul `#4997D0`, títulos, resumen, acción ciudadana destacada y enlace directo).

- **Interfaz Web & API REST:**
  - Portal web ciudadano para registro y consulta interactiva.
  - Panel administrativo para visualizar ciudadanos y el historial de notificaciones.
  - Endpoints REST para integración con pipelines o webhooks.

---

##  Modelo de Datos (SQLite)

```sql
-- Usuarios
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Categorías Oficiales
CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT
);

-- Preferencias (1 a N)
CREATE TABLE user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE(user_id, category_id)
);

-- Registro y Auditoría de Notificaciones Enviadas
CREATE TABLE notification_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    news_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    status TEXT NOT NULL, -- 'SENT', 'FAILED'
    sent_at TEXT NOT NULL,
    error_message TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, news_id)
);
```

### Categorías Soportadas:
1. `education_scholarships` - Educación y Becas
2. `health_wellbeing` - Salud y Prevención
3. `social_programs` - Apoyo Social
4. `procedures_services` - Trámites y Documentos
5. `security_alerts` - Alertas y Emergencias
6. `employment_development` - Empleo y Emprendimiento

---

##  Despliegue en Raspberry Pi 4

Tienes 3 métodos fáciles para desplegarlo en tu Raspberry Pi 4:

### Método 1: Instalación Rápida con Script (Recomendado)

En la terminal de tu Raspberry Pi:

```bash
cd reto-8-trebol-4-devop-plus/raspberry-pi
chmod +x setup_raspi.sh
./setup_raspi.sh
```

El script configurará la base de datos y te dará la URL para acceder. Para encender el servidor:

```bash
python3 server.py
```

### Método 2: Servicio en Segundo Plano (`systemd`)

Para que el servidor se inicie automáticamente cada vez que enciendas la Raspberry Pi:

```bash
sudo cp todomigobgt.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now todomigobgt.service

# Verificar estado
sudo systemctl status todomigobgt.service
```

### Método 3: Con Docker / Docker Compose

Si prefieres contenedores:

```bash
docker compose up -d
```

---

## ⚙️ Configuración (.env)

Copia o edita el archivo `.env`:

```ini
DB_PATH=todomigobgt.db
HOST=0.0.0.0
PORT=8080

# Configuración SMTP Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=tu_correo_gmail@gmail.com
SMTP_PASS=lykc jsej osgf ezee
SMTP_APP_NAME=todomigobgt
SENDER_NAME=TODOMIGOBGT Alertas Ciudadanas
```

> **Nota:** Cambia `SMTP_USER` por la dirección de Gmail desde la que se generó la contraseña de aplicación `lykc jsej osgf ezee`.

---

##  Uso desde la Línea de Comandos (CLI)

Puedes administrar todo desde SSH en la Raspberry Pi con `manage.py`:

### 1. Registrar un Usuario con Múltiples Preferencias
```bash
python3 manage.py add-user \
  --name "María Álvarez" \
  --email "maria@ejemplo.gt" \
  --categories "health_wellbeing,education_scholarships"
```

### 2. Listar Usuarios Registrados
```bash
python3 manage.py list-users
```

### 3. Listar Categorías Disponibles
```bash
python3 manage.py list-categories
```

### 4. Probar el Envío de Correo SMTP
```bash
python3 manage.py test-email --to "tu_correo@ejemplo.com"
```

### 5. Despachar Notificaciones desde un Archivo de Noticias
```bash
python3 manage.py dispatch --file ../news-pipeline/output/noticias.preview.json
```

### 6. Ver Estadísticas
```bash
python3 manage.py stats
```

---

##  API REST y Webhooks

El servidor expone los siguientes endpoints HTTP en el puerto `8080`:

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/` | Portal web interactivo para ciudadanos |
| `GET` | `/api/health` | Verificación de estado del servicio |
| `GET` | `/api/categories` | Lista de categorías disponibles |
| `GET` | `/api/users` | Lista de ciudadanos registrados |
| `POST` | `/api/users` | Registrar o actualizar un ciudadano |
| `POST` | `/api/news/dispatch` | Enviar noticias nuevas a los usuarios suscritos |
| `POST` | `/api/test-email` | Enviar correo de prueba SMTP |
| `GET` | `/api/logs` | Historial de auditoría de envíos |

### Ejemplo: Registrar usuario vía `curl`
```bash
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "email": "juan@correo.gt",
    "preferences": ["health_wellbeing", "procedures_services"]
  }'
```

### Ejemplo: Despachar una noticia vía Webhook
```bash
curl -X POST http://localhost:8080/api/news/dispatch \
  -H "Content-Type: application/json" \
  -d '{
    "id": "noticia-2026-001",
    "categoryId": "health_wellbeing",
    "source": "MSPAS",
    "originalUrl": "https://todomigobgt.gob.gt/noticias/vacunacion",
    "urgent": false,
    "content": {
      "es": {
        "title": "Jornada de Vacunación en Centros de Salud",
        "summary": "Inicia la campaña nacional de vacunación preventiva.",
        "citizenAction": "Presentarse con DPI y carnet de salud."
      }
    }
  }'
```
