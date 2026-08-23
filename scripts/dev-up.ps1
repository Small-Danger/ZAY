# Stack ZAY 100 % Docker : Postgres + API + frontend.
# Ne pas lancer Nest sur l'hote en meme temps (port 4000).

$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$on4000 = netstat -ano | Select-String ":4000\s+.*LISTENING"
if ($on4000) {
  Write-Host "Attention : le port 4000 est deja pris (Nest hote ?). Stoppe-le avant d'allumer le backend Docker."
}

Write-Host "Demarrage postgres-zay + backend-zay + frontend-zay..."
docker compose up -d
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Site  http://localhost:9002"
Write-Host "API   http://localhost:4000/api/health"
