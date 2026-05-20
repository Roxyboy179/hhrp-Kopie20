$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$installerScript = Join-Path $scriptDir 'installer.nsi'
$sourceDir = Join-Path $scriptDir 'dist\win-unpacked'
$outputFile = Resolve-Path -Path (Join-Path $scriptDir '..\data\downloads\HHRP Launcher Setup.exe') -ErrorAction SilentlyContinue
if (-not $outputFile) {
    $outputFile = Join-Path $scriptDir '..\data\downloads\HHRP Launcher Setup.exe'
}

$makensis = Get-Command makensis -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
if (-not $makensis) {
    Write-Error "makensis.exe wurde nicht gefunden. Bitte installiere NSIS und stelle sicher, dass makensis im PATH verfügbar ist."
    Write-Output "Download: https://nsis.sourceforge.io/Download"
    exit 1
}

if (-not (Test-Path $sourceDir)) {
    Write-Error "Quelldateien für den Installer wurden nicht gefunden: $sourceDir"
    exit 1
}

Write-Output "Baue HHRP Launcher Installer..."
& "$makensis" /V4 /DOUTPUT_FILE="$outputFile" "$installerScript"

if ($LASTEXITCODE -ne 0) {
    Write-Error "NSIS hat einen Fehler zurückgegeben: Exit-Code $LASTEXITCODE"
    exit $LASTEXITCODE
}

Write-Output "Installer erstellt: $outputFile"
