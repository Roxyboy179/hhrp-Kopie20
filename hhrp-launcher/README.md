# HHRP Launcher Installer

Dieses Verzeichnis enthält den NSIS-Installer für den HHRP Launcher.

## Erstellung

1. Installiere NSIS (https://nsis.sourceforge.io/Download)
2. Öffne ein PowerShell-Fenster im Projektstamm
3. Führe aus:

```powershell
npm run launcher:build-installer
```

Der Installer wird nach `data/downloads/HHRP Launcher Setup.exe` geschrieben.

## Verhalten

- Der Installer kopiert den Launcher nach `Program Files\HHRP Launcher`
- Er erstellt einen Startmenüeintrag und eine Desktop-Verknüpfung
- Er hinterlässt nach der Installation eine Deinstallationsroutine
