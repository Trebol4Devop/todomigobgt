#!/usr/bin/env bash
# run.sh - Iniciar el contenedor de TODOMIGOBGTGT en Raspberry Pi / Linux sin problemas de copiado
set -e

CONTAINER_NAME="todomigobgtgt-service"
IMAGE="spumapl/todomigobgtgt-service:latest"

echo "Deteniendo contenedor anterior si existe..."
docker rm -f $CONTAINER_NAME 2>/dev/null || true

echo "Iniciando $CONTAINER_NAME..."
docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  -p 8080:8080 \
  -v todomigobgtgt_data:/app/data \
  -e SMTP_USER="alejandrovasq0803@gmail.com" \
  -e SMTP_PASS="lykc jsej osgf ezee" \
  "$IMAGE"

echo " Contenedor iniciado exitosamente!"
echo "Ver logs con: docker logs -f $CONTAINER_NAME"
