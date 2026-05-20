import fs from 'fs';
import { NextResponse } from 'next/server';
import {
  getLauncherExePath,
  getLauncherInstallerPath,
  getLauncherVersionMeta,
  isLauncherExeAvailable,
  isLauncherInstallerAvailable,
} from '@/lib/launcher-version';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const installerRequested = url.searchParams.get('installer') === '1';

    const installerAvailable = isLauncherInstallerAvailable();
    const portableAvailable = isLauncherExeAvailable();

    if (!installerAvailable && !portableAvailable) {
      return NextResponse.json(
        { error: 'Launcher noch nicht veröffentlicht. Bitte später erneut versuchen.' },
        { status: 404 }
      );
    }

    const meta = getLauncherVersionMeta();
    const useInstaller = installerRequested && installerAvailable;
    const filePath = useInstaller
      ? getLauncherInstallerPath()
      : portableAvailable
      ? getLauncherExePath()
      : getLauncherInstallerPath();
    const stat = fs.statSync(filePath);
    const fileName = useInstaller
      ? meta.installerFileName || 'HHRP Launcher Setup.exe'
      : meta.fileName || 'HHRP Launcher.exe';

    const stream = fs.createReadStream(filePath);
    const webStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => controller.enqueue(chunk));
        stream.on('end', () => controller.close());
        stream.on('error', (err) => controller.error(err));
      },
      cancel() {
        stream.destroy();
      },
    });

    return new NextResponse(webStream, {
      headers: {
        'Content-Type': 'application/x-msdownload',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': String(stat.size),
        'Cache-Control': 'no-store, max-age=0',
        'X-Launcher-Version': meta.version || '1.0.0',
      },
    });
  } catch (e) {
    console.error('[exe/download]', e);
    return NextResponse.json(
      { error: 'Download fehlgeschlagen' },
      { status: 500 }
    );
  }
}
