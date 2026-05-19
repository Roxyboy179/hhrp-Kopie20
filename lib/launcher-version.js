import fs from 'fs';
import path from 'path';

const VERSION_FILE = path.join(process.cwd(), 'data', 'launcher-version.json');
const EXE_FILE = path.join(process.cwd(), 'data', 'downloads', 'hhrp-launcher.exe');

export function getLauncherVersionMeta() {
  const raw = fs.readFileSync(VERSION_FILE, 'utf8');
  return JSON.parse(raw);
}

export function getLauncherExePath() {
  return EXE_FILE;
}

export function isLauncherExeAvailable() {
  return fs.existsSync(EXE_FILE);
}

export function getLauncherFileStats() {
  if (!isLauncherExeAvailable()) return null;
  const stat = fs.statSync(EXE_FILE);
  return {
    size: stat.size,
    sizeMB: Math.round((stat.size / (1024 * 1024)) * 10) / 10,
    updatedAt: stat.mtime.toISOString(),
  };
}

export function compareSemver(a, b) {
  const pa = String(a).split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const da = pa[i] || 0;
    const db = pb[i] || 0;
    if (da > db) return 1;
    if (da < db) return -1;
  }
  return 0;
}
