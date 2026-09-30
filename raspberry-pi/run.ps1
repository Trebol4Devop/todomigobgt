# run.ps1 - Iniciar contenedor en Windows sin problemas de saltos de linea
$ErrorActionPreference = "SilentlyContinue"

$ContainerName = "todomigobgtgt-service"
$Image = "spumapl/todomigobgtgt-service:latest"

Write-Host "Deteniendo contenedor anterior si existe..." -ForegroundColor Yellow
docker rm -f $ContainerName

$ErrorActionPreference = "Stop"
Write-Host "Iniciando $ContainerName..." -ForegroundColor Green
docker run -d `
  --name $ContainerName `
  --restart unless-stopped `
  -p 8080:8080 `
  -v todomigobgtgt_data:/app/data `
  -e SMTP_USER="alejandrovasq0803@gmail.com" `
  -e SMTP_PASS="lykc jsej osgf ezee" `
  $Image

Write-Host "`n[EXITO] Contenedor iniciado!" -ForegroundColor Green
Write-Host "Ver logs con: docker logs -f $ContainerName" -ForegroundColor Cyan
Write-Host "Abre en tu navegador: http://localhost:8080" -ForegroundColor Cyan
