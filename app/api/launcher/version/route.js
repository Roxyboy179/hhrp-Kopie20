import { NextResponse } from 'next/server';
import {
  getLauncherVersionMeta,
  getLauncherFileStats,
  isLauncherExeAvailable,
} from '@/lib/launcher-version';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const meta = getLauncherVersionMeta();
    const base =
      process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') ||
      'https://hhrp24.de';

    const file = getLauncherFileStats();
    const available = isLauncherExeAvailable();

    return NextResponse.json({
      ...meta,
      available,
      downloadUrl: `${base}/api/exe/download`,
      downloadPage: `${base}/exe/download`,
      file: file
        ? {
            size: file.size,
            sizeMB: file.sizeMB,
            updatedAt: file.updatedAt,
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
