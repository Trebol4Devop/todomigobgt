# Dockerfile optimizado para Raspberry Pi 4 (ARM64 / multi-arch)
FROM python:3.12-alpine

LABEL maintainer="TODOMIGOBGT Team"
LABEL description="Base de datos y Servicio de Notificaciones TODOMIGOBGT para Raspberry Pi 4"

# Crear usuario sin privilegios para mayor seguridad
RUN addgroup -S todomigobgt && adduser -S todomigobgt -G todomigobgt

WORKDIR /app

# Copiar archivos del servicio
COPY database.py mailer.py dispatcher.py server.py manage.py noticias_todas_categorias.json ./

# Crear directorio de base de datos
RUN mkdir -p /app/data

ENV HOST=0.0.0.0
ENV PORT=8080
ENV DB_PATH=/app/data/todomigobgt.db
ENV PYTHONUNBUFFERED=1

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

CMD ["python", "server.py"]
