$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent
$PkgJson = Get-Content (Join-Path $Root 'rtl-extension\extension\package.json') -Raw | ConvertFrom-Json
$Version = $PkgJson.version
$Src = Join-Path $Root 'rtl-extension'
$Dist = Join-Path $Root 'dist'
$Out = Join-Path $Dist "rtl-$Version.vsix"
$Zip = Join-Path $Dist 'package.zip'

if (-not (Test-Path $Src)) {
	throw "Missing rtl-extension at $Src"
}
New-Item -ItemType Directory -Path $Dist -Force | Out-Null
if (Test-Path $Out) { Remove-Item $Out -Force }
if (Test-Path $Zip) { Remove-Item $Zip -Force }

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($Src, $Zip)
Move-Item $Zip $Out -Force
Write-Host "Built $Out ($((Get-Item $Out).Length) bytes)"
