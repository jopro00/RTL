$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent
$ExtDir = Join-Path $Root 'rtl-extension\extension'
$PkgPath = Join-Path $ExtDir 'package.json'
$PkgJson = Get-Content $PkgPath -Raw | ConvertFrom-Json
$Version = $PkgJson.version
$Dist = Join-Path $Root 'dist'
$Out = Join-Path $Dist "rtl-$Version.vsix"
$Alias = Join-Path $Dist 'rtl.vsix'

if (-not (Test-Path $ExtDir)) {
	throw "Missing extension at $ExtDir"
}
New-Item -ItemType Directory -Path $Dist -Force | Out-Null
if (Test-Path $Out) { Remove-Item $Out -Force }
if (Test-Path $Alias) { Remove-Item $Alias -Force }

Push-Location $ExtDir
try {
	npx --yes @vscode/vsce@latest package --out $Out
	if ($LASTEXITCODE -ne 0) { throw "VSIX packaging failed (exit $LASTEXITCODE)" }
} finally {
	Pop-Location
}

Copy-Item $Out $Alias -Force
Write-Host "Built $Out ($((Get-Item $Out).Length) bytes)"
Write-Host "Also: $Alias"
