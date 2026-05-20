$sed = Join-Path $env:TEMP (Get-ChildItem $env:TEMP -Filter 'hhrp-iexpress-*' -Directory | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
$sed = Join-Path $sed 'package.sed'
if (-not (Test-Path $sed)) { Write-Error "SED file not found: $sed"; exit 1 }
(Get-Content $sed) -replace 'TargetName=.*','TargetName=HHRP Launcher Setup.exe' | Set-Content $sed -Encoding ASCII
$dest = Join-Path $PSScriptRoot '..\data\downloads'
& 'C:\WINDOWS\system32\iexpress.exe' /N /Q $sed /D $dest
Write-Output "iexpress exit: $LASTEXITCODE"
Get-ChildItem $dest -Filter '*Setup*.exe' -ErrorAction SilentlyContinue | Select-Object FullName,Length,LastWriteTime | Format-List -Property *
