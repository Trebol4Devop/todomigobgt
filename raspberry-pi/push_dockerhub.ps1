# push_dockerhub.ps1 - Construir y subir imagen multi-arquitectura a Docker Hub desde Windows PowerShell
param (
    [Parameter(Position = 0, Mandatory = $false)]
    [string]$DockerUser,
    [Parameter(Position = 1, Mandatory = $false)]
    [string]$Tag = "latest"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " [DOCKER HUB] Publicador de Imagen TODOMIGOBGT (Windows)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

if (-not $DockerUser) {
    $DockerUser = Read-Host "Ingresa tu usuario de Docker Hub"
}

if (-not $DockerUser) {
    Write-Host "[ERROR] El usuario de Docker Hub es requerido." -ForegroundColor Red
    exit 1
}

$ImageName = "todomigobgt-service"
$FullImage = "${DockerUser}/${ImageName}:${Tag}"
$LatestImage = "${DockerUser}/${ImageName}:latest"

Write-Host "`n[INFO] Imagen destino: $FullImage" -ForegroundColor Yellow
Write-Host "[INFO] Arquitecturas: linux/amd64, linux/arm64 (Raspberry Pi 4)`n" -ForegroundColor Yellow

# Iniciar sesion
Write-Host "[1/3] Iniciando sesion en Docker Hub..." -ForegroundColor Green
docker login

# Configurar buildx
$BuilderName = "todomigobgt-builder"
$builderExists = docker buildx ls | Select-String -Pattern $BuilderName
if (-not $builderExists) {
    Write-Host "[2/3] Creando builder de buildx para soporte ARM64 (Raspberry Pi)..." -ForegroundColor Green
    docker buildx create --name $BuilderName --use
} else {
    docker buildx use $BuilderName
}
docker buildx inspect --bootstrap

# Construir y subir
Write-Host "[3/3] Construyendo y subiendo imagen multi-arquitectura..." -ForegroundColor Green
docker buildx build `
  --platform linux/amd64,linux/arm64 `
  -t $FullImage `
  -t $LatestImage `
  --push .

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "[EXITO] Imagen subida exitosamente a Docker Hub!" -ForegroundColor Green
Write-Host "`n[DESPLIEGUE] Para descargar y correr en tu Raspberry Pi 4:" -ForegroundColor Yellow
Write-Host "docker run -d --name todomigobgt-service -p 8080:8080 -v ./data:/app/data -e SMTP_USER=tu_correo@gmail.com -e SMTP_PASS='lykc jsej osgf ezee' $FullImage" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan
