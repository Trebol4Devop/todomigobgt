# Guía para Subir y Desplegar TODOMIGOBGT en Docker Hub

Esta guía te muestra cómo compilar y publicar la imagen de Docker en **Docker Hub** con soporte multi-arquitectura (**ARM64** para Raspberry Pi 4 y **AMD64** para PC/Servidores).

---

##  Requisitos Previos

1. Una cuenta activa en [Docker Hub](https://hub.docker.com/).
2. Docker Desktop o Docker Engine instalado y en ejecución en tu computadora.

---

##  Método 1: Usando los Scripts Automatizados (Más Fácil)

### En Windows (PowerShell):
Abre una terminal de PowerShell dentro de la carpeta `raspberry-pi` y ejecuta:

```powershell
.\push_dockerhub.ps1 -DockerUser TU_USUARIO_DOCKERHUB
```

### En Linux / Mac / WSL:
Abre una terminal dentro de la carpeta `raspberry-pi` y ejecuta:

```bash
chmod +x push_dockerhub.sh
./push_dockerhub.sh TU_USUARIO_DOCKERHUB
```

El script se encargará automáticamente de:
1. Solicitar tu inicio de sesión en Docker Hub (`docker login`).
2. Configurar `docker buildx` para soporte multi-arquitectura.
3. Compilar simultáneamente para `linux/arm64` (Raspberry Pi 4) y `linux/amd64` (PC).
4. Subir la imagen etiquetada con `:latest` a tu repositorio de Docker Hub.

---

##  Método 2: Comandos Manuales Paso a Paso

Si prefieres ejecutar los comandos manualmente:

### Paso 1: Iniciar sesión en Docker Hub
```bash
docker login
```
*(Ingresa tu usuario y contraseña/token de Docker Hub).*

### Paso 2: Crear el Builder Multi-Arquitectura (Buildx)
La Raspberry Pi 4 utiliza la arquitectura **ARM64**. Para que la imagen funcione tanto en tu PC como en la Raspberry Pi, utiliza `buildx`:

```bash
docker buildx create --name todomigobgt-builder --use
docker buildx inspect --bootstrap
```

### Paso 3: Compilar y Subir la Imagen Multi-Plataforma
Reemplaza `TU_USUARIO` por tu usuario de Docker Hub:

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t TU_USUARIO/todomigobgt-service:latest \
  --push .
```

---

##  Método 3: Publicación Automática con GitHub Actions

Ya se configuró el flujo de trabajo en [`.github/workflows/docker-publish.yml`](file:///C:/Users/HP/Documents/Progra/reto-8-trebol-4-devop-plus/.github/workflows/docker-publish.yml).

Para activarlo:
1. Ve a tu repositorio en GitHub -> **Settings** -> **Secrets and variables** -> **Actions**.
2. Agrega dos secretos:
   - `DOCKERHUB_USERNAME`: Tu usuario de Docker Hub.
   - `DOCKERHUB_TOKEN`: Tu Personal Access Token de Docker Hub (lo generas en *Account Settings* -> *Security* en Docker Hub).
3. Cada vez que hagas un `git push` a `main` o crees un tag, GitHub Actions compilará la imagen multi-arquitectura y la subirá automáticamente a Docker Hub.

---

##  ¿Cómo Desplegar la Imagen en la Raspberry Pi 4?

Una vez publicada en Docker Hub, en tu Raspberry Pi 4 solo necesitas ejecutar:

### Opción A: Con `docker run` directo
```bash
docker run -d \
  --name todomigobgt-service \
  --restart unless-stopped \
  -p 8080:8080 \
  -v ./data:/app/data \
  -e SMTP_USER=tu_correo@gmail.com \
  -e SMTP_PASS="lykc jsej osgf ezee" \
  TU_USUARIO/todomigobgt-service:latest
```

### Opción B: Con `docker-compose.yml`
Edita el archivo `.env` en tu Raspberry Pi agregando:
```ini
DOCKER_IMAGE=TU_USUARIO/todomigobgt-service:latest
SMTP_USER=tu_correo@gmail.com
```

Y ejecuta:
```bash
docker compose up -d
```

¡Listo! El servicio se descargará de Docker Hub y estará corriendo en el puerto `8080` de tu Raspberry Pi 4.
