# Packs a clean release zip: dist/currency-converter-v<version>.zip
# Usage (from repo root):  powershell -ExecutionPolicy Bypass -File scripts\build.ps1
# Uses .NET ZipArchive with forward-slash entry names (Compress-Archive in
# Windows PowerShell 5.1 writes backslashes, which the Chrome Web Store may reject).

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$version = (Get-Content manifest.json -Raw | ConvertFrom-Json).version
$include = @(
  'manifest.json', 'background.js', 'popup.html', 'popup.css', 'popup.js',
  'i18n.js', 'currencies.js', '_locales', 'flags', 'fonts', 'icons', 'LICENSE'
)

New-Item -ItemType Directory dist -Force | Out-Null
$zipPath = Join-Path $root "dist\currency-converter-v$version.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

$zip = [System.IO.Compression.ZipFile]::Open($zipPath, 'Create')
$count = 0
try {
  foreach ($item in $include) {
    $full = Join-Path $root $item
    $files = if (Test-Path $full -PathType Container) { Get-ChildItem $full -Recurse -File } else { Get-Item $full }
    foreach ($f in $files) {
      $entry = $f.FullName.Substring($root.Length + 1).Replace('\', '/')
      [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $f.FullName, $entry, 'Optimal')
      $count++
    }
  }
} finally { $zip.Dispose() }

$kb = [math]::Round((Get-Item $zipPath).Length / 1KB)
Write-Host "Built dist\currency-converter-v$version.zip  ($count files, $kb KB)" -ForegroundColor Green
