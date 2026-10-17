# Script para download automatizado de modelos anatômicos 3D (.glb e buffers BodyParts3D)
# Fontes Open-Source:
# 1. BodyParts3D / DBCLS (CC BY-SA 2.1 JP) via ashemag/human-atlas
# 2. Modelos de Órgãos GLB (TA2 / Open Source) via thebuggeddev/anatomy

$ErrorActionPreference = "Stop"
$modelsDir = Join-Path $PSScriptRoot "..\public\models"
$cacheDir = Join-Path $PSScriptRoot "..\.cache_bodyparts3d"

New-Item -ItemType Directory -Force -Path $modelsDir | Out-Null
New-Item -ItemType Directory -Force -Path $cacheDir | Out-Null

Write-Host "==> [1/2] Baixando modelos .GLB de orgaos em alta resolucao para public/models/..." -ForegroundColor Cyan

$organGlbs = @(
  "heart.glb",
  "brain.glb",
  "lungs.glb",
  "liver.glb",
  "kidneys.glb",
  "intestine.glb",
  "pancreas.glb"
)

foreach ($file in $organGlbs) {
  $dest = Join-Path $modelsDir $file
  if (-not (Test-Path $dest) -or (Get-Item $dest).Length -lt 1000) {
    $url = "https://raw.githubusercontent.com/thebuggeddev/anatomy/main/public/models/$file"
    Write-Host "  -> Baixando $file..."
    curl.exe -sL $url -o $dest
  } else {
    Write-Host "  -> $file ja existe ($((Get-Item $dest).Length) bytes)"
  }
}

Write-Host "==> [2/2] Baixando malhas anatomicas BodyParts3D (2.234 sub-malhas) para montagem do Atlas .GLB..." -ForegroundColor Cyan

$atlasJsonDest = Join-Path $cacheDir "atlas.json"
if (-not (Test-Path $atlasJsonDest)) {
  curl.exe -sL "https://raw.githubusercontent.com/ashemag/human-atlas/main/public/models/atlas.json" -o $atlasJsonDest
}

for ($i = 0; $i -le 14; $i++) {
  $binName = "body-$i.bin"
  $binDest = Join-Path $cacheDir $binName
  if (-not (Test-Path $binDest) -or (Get-Item $binDest).Length -lt 1000) {
    $url = "https://raw.githubusercontent.com/ashemag/human-atlas/main/public/models/$binName"
    Write-Host "  -> Baixando chunk BodyParts3D $binName..."
    curl.exe -sL $url -o $binDest
  }
}

Write-Host "==> [3/3] Compilando malhas BodyParts3D + Orgaos em public/models/human_anatomy_atlas.glb..." -ForegroundColor Cyan
node (Join-Path $PSScriptRoot "build-atlas-glb.mjs")

Write-Host "==> Downloads e compilacao de modelos .GLB concluidos com sucesso!" -ForegroundColor Green

