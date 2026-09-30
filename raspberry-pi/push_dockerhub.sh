#!/usr/bin/env bash
# push_dockerhub.sh - Construir y subir imagen multi-arquitectura a Docker Hub
# Soporta Raspberry Pi 4 (linux/arm64) y PC/Servidores (linux/amd64)

set -e

echo "=========================================================="
echo " Publicador de Imagen TODOMIGOBGT en Docker Hub"
echo "=========================================================="

# 1. Solicitar o verificar usuario de Docker Hub
if [ -z "$1" ]; then
    read -p "Ingresa tu usuario de Docker Hub: " DOCKER_USER
else
    DOCKER_USER="$1"
fi

if [ -z "$DOCKER_USER" ]; then
    echo " Error: El nombre de usuario de Docker Hub es requerido."
    exit 1
fi

IMAGE_NAME="todomigobgt-service"
TAG="${2:-latest}"
FULL_IMAGE="${DOCKER_USER}/${IMAGE_NAME}:${TAG}"

echo ""
echo " Imagen destino: ${FULL_IMAGE}"
echo " Arquitecturas: linux/amd64, linux/arm64 (Raspberry Pi 4)"
echo ""

# 2. Iniciar sesión en Docker Hub
echo " Verificando inicio de sesión en Docker Hub..."
docker login

# 3. Configurar builder de buildx para multi-arquitectura si no existe
BUILDER_NAME="todomigobgt-builder"
if ! docker buildx inspect "$BUILDER_NAME" > /dev/null 2>&1; then
    echo " Creando builder de buildx para compilación multi-arquitectura..."
    docker buildx create --name "$BUILDER_NAME" --use
else
    docker buildx use "$BUILDER_NAME"
fi
docker buildx inspect --bootstrap

# 4. Construir y subir a Docker Hub
echo " Construyendo y subiendo imagen multi-arquitectura..."
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t "${FULL_IMAGE}" \
  -t "${DOCKER_USER}/${IMAGE_NAME}:latest" \
  --push .

echo ""
echo "=========================================================="
echo " ¡Imagen subida exitosamente a Docker Hub!"
echo ""
echo " Para descargar y ejecutar en tu Raspberry Pi 4:"
echo "   docker run -d \\"
echo "     --name todomigobgt-service \\"
echo "     -p 8080:8080 \\"
echo "     -v ./data:/app/data \\"
echo "     -e SMTP_USER=tu_correo@gmail.com \\"
echo "     -e SMTP_PASS=\"lykc jsej osgf ezee\" \\"
echo "     ${FULL_IMAGE}"
echo "=========================================================="
