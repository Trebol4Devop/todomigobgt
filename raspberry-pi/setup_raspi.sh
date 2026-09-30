#!/usr/bin/env bash
# setup_raspi.sh - Script de Instalación Automatizada para Raspberry Pi 4
set -e

echo "=========================================================="
echo " Instalador de Base de Datos y Notificaciones TODOMIGOBGT"
echo "   Optimizado para Raspberry Pi 4 (Raspberry Pi OS / Linux)"
echo "=========================================================="

# 1. Verificar Python 3
if ! command -v python3 &> /dev/null; then
    echo " Python 3 no está instalado. Instalando con apt..."
    sudo apt update && sudo apt install -y python3 python3-pip sqlite3
else
    echo " Python 3 detectado: $(python3 --version)"
fi

# 2. Configurar archivo .env
if [ ! -f .env ]; then
    echo "⚙️ Creando archivo de configuración .env desde plantilla..."
    cp .env.example .env
    echo "ℹ️ Se ha creado el archivo .env con la contraseña de aplicación SMTP preconfigurada."
fi

# 3. Inicializar la base de datos SQLite
echo " Inicializando base de datos SQLite..."
python3 -c "from database import TodoMiGobDB; db = TodoMiGobDB('todomigobgt.db'); print(' Tablas y categorías creadas exitosamente.')"

# 4. Obtener IP local de la Raspberry Pi
IP_ADDR=$(hostname -I | awk '{print $1}')
if [ -z "$IP_ADDR" ]; then
    IP_ADDR="localhost"
fi

echo "=========================================================="
echo " ¡Instalación Completada con Éxito!"
echo ""
echo "Opciones para iniciar el servicio en tu Raspberry Pi 4:"
echo ""
echo "1️⃣  Opción Directa (Recomendada y ligera, < 15MB RAM):"
echo "    python3 server.py"
echo ""
echo "2️⃣  Opción Servicio Systemd (arranque automático al encender):"
echo "    sudo cp todomigobgt.service /etc/systemd/system/"
echo "    sudo systemctl daemon-reload"
echo "    sudo systemctl enable --now todomigobgt.service"
echo "    sudo systemctl status todomigobgt.service"
echo ""
echo "3️⃣  Opción Docker Compose:"
echo "    docker compose up -d"
echo ""
echo " Accede a la interfaz web ciudadana desde cualquier celular o PC en tu red:"
echo "    http://${IP_ADDR}:8080"
echo "=========================================================="
