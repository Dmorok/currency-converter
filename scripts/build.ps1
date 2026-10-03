# Packs a clean release zip: dist/currency-converter-v<version>.zip
# Usage (from repo root):  powershell -ExecutionPolicy Bypass -File scripts\build.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$version = (Get-Content manifest.json -Raw | ConvertFrom-Json).version
$include = @(
  'manifest.json', 'background.js', 'popup.html', 'popup.css', 'popup.js',
  'i18n.js', 'currencies.js', 'flags', 'fonts', 'icons', 'LICENSE'
)

$stage = Join-Path $env:TEMP "cc-build-$version"
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory $stage | Out-Null
foreach ($item in $include) { Copy-Item $item -Destination $stage -Recurse }

New-Item -ItemType Directory dist -Force | Out-Null
$zip = "dist\currency-converter-v$version.zip"
if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $zip
Remove-Item $stage -Recurse -Force

$kb = [math]::Round((Get-Item $zip).Length / 1KB)
Write-Host "Built $zip ($kb KB)" -ForegroundColor Green
