import { NextResponse } from 'next/server';
import {
  getLauncherVersionMeta,
  getLauncherFileStats,
  getLauncherInstallerFileStats,
  isLauncherExeAvailable,
  isLauncherInstallerAvailable,
} from '@/lib/launcher-version';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const meta = getLauncherVersionMeta();
    const base =
      process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') ||
      'https://hhrp24.de';

    const file = getLauncherFileStats();
    const installerFile = getLauncherInstallerFileStats();
    const available = isLauncherExeAvailable();
    const installerAvailable = isLauncherInstallerAvailable();

    return NextResponse.json({
      ...meta,
      available,
      installerAvailable,
      downloadUrl: `${base}/api/exe/download`,
      installerDownloadUrl: `${base}/api/exe/download?installer=1`,
      downloadPage: `${base}/exe/download`,
      file: file
        ? {
            size: file.size,
            sizeMB: file.sizeMB,
            updatedAt: file.updatedAt,
          }
        : null,
      installerFile: installerFile
        ? {
            size: installerFile.size,
            sizeMB: installerFile.sizeMB,
            updatedAt: installerFile.updatedAt,
          }
        : null,
    });
  } catch (e) {
    console.error('[launcher/version]', e);
    return NextResponse.json(
      { error: 'Versionsinformationen nicht verfügbar' },
      { status: 500 }
    );
  }
}
