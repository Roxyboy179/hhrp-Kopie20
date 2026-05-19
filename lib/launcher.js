/** Branding & Events für den HHRP Launcher (PWA) */

export const LAUNCHER_NAME = 'HHRP Launcher';
export const LAUNCHER_SHORT = 'HHRP';
export const LAUNCHER_TAGLINE = 'Hamburg Horizon Roleplay';

export const LAUNCHER_INSTALL_EVENT = 'hhrp-launcher-install';

export function isLauncherStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );
}

export function triggerLauncherInstallAnimation() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(LAUNCHER_INSTALL_EVENT));
}
