!include "MUI2.nsh"

!ifndef PRODUCT_NAME
  !define PRODUCT_NAME "HHRP Launcher"
!endif
!ifndef PRODUCT_EXECUTABLE
  !define PRODUCT_EXECUTABLE "HHRP Launcher.exe"
!endif
!ifndef INSTALLER_EXE
  !define INSTALLER_EXE "HHRP Launcher Setup.exe"
!endif
!ifndef SOURCE_DIR
  !define SOURCE_DIR "dist\\win-unpacked"
!endif

Name "${PRODUCT_NAME}"
OutFile "${INSTALLER_EXE}"
InstallDir "$PROGRAMFILES\\${PRODUCT_NAME}"
RequestExecutionLevel admin
ShowInstDetails show
ShowUninstDetails show

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_INSTFILES

Section "Install"
  SetOutPath "$INSTDIR"
  File /r "${SOURCE_DIR}\\*.*"
  CreateDirectory "$SMPROGRAMS\\${PRODUCT_NAME}"
  CreateShortCut "$SMPROGRAMS\\${PRODUCT_NAME}\\${PRODUCT_NAME}.lnk" "$INSTDIR\\${PRODUCT_EXECUTABLE}" "" "$INSTDIR\\${PRODUCT_EXECUTABLE}" 0
  CreateShortCut "$DESKTOP\\${PRODUCT_NAME}.lnk" "$INSTDIR\\${PRODUCT_EXECUTABLE}" "" "$INSTDIR\\${PRODUCT_EXECUTABLE}" 0
  WriteUninstaller "$INSTDIR\\Uninstall ${PRODUCT_NAME}.exe"
SectionEnd

Section "Uninstall"
  Delete "$DESKTOP\\${PRODUCT_NAME}.lnk"
  Delete "$SMPROGRAMS\\${PRODUCT_NAME}\\${PRODUCT_NAME}.lnk"
  Delete "$INSTDIR\\Uninstall ${PRODUCT_NAME}.exe"
  RMDir /r "$INSTDIR"
  RMDir "$SMPROGRAMS\\${PRODUCT_NAME}"
SectionEnd
