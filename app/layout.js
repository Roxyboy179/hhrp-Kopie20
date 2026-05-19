import './globals.css';
import RootClientLayout from './RootClientLayout';

export const metadata = {
  title: 'HHRP Launcher',
  description: 'Offizielles Bewerbungsportal von Hamburg Horizon RP. Bewirb dich jetzt für unser Team! Wir suchen motivierte Mitglieder für Team-Positionen, Praktika und Beförderungen. Starte deine Karriere bei Hamburg Horizon Roleplay.',
  keywords: 'Hamburg Horizon RP, Bewerbung, Team, Praktikum, Uprank, Bewerbungsportal, Hamburg RP, Roleplay Team',
  authors: [{ name: 'Hamburg Horizon RP Team' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://hamburg-horizon-rp320.vercel.app'),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'HHRP Launcher',
  },
  openGraph: {
    title: 'HHRP Launcher',
    description: 'Offizielles Bewerbungsportal von Hamburg Horizon RP. Bewirb dich jetzt für unser Team! Team-Bewerbung • Praktikum • Uprank. Werde Teil unserer professionellen Roleplay-Community und gestalte Hamburg Horizon mit uns!',
    url: '/',
    siteName: 'Hamburg Horizon RP',
    images: [
      {
        url: '/embed.webp',
        width: 1200,
        height: 630,
        alt: 'Hamburg Horizon RP Bewerbungsportal - Jetzt bewerben!',
      },
    ],
    locale: 'de_DE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HHRP Launcher',
    description: 'Offizielles Bewerbungsportal von Hamburg Horizon RP. Bewirb dich jetzt für unser Team! Team-Bewerbung • Praktikum • Uprank',
    images: ['/embed.webp'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    other: [
      { rel: 'mask-icon', url: '/icon-192.png', color: '#f0abfc' },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="de" className="dark">
      <head>
        {/* Preconnect für bessere Performance */}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_BASE_URL || 'https://hamburg-horizon-rp320.vercel.app'} />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_BASE_URL || 'https://hamburg-horizon-rp320.vercel.app'} />
        {/* Preload kritische Assets */}
        <link rel="preload" as="image" href="/logo.webp" />
        
        {/* Inline Styles — HHRP Launcher Startbildschirm (gleiches Layout wie Splash) */}
        <style dangerouslySetInnerHTML={{__html: `
          #app-loader {
            position: fixed;
            inset: 0;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            transition: opacity 0.5s ease-out;
          }
          #app-loader.hidden {
            opacity: 0;
            pointer-events: none;
          }
          .loader-inner {
            text-align: center;
            position: relative;
            z-index: 1;
          }
          .loader-glow {
            position: absolute;
            width: 400px;
            height: 400px;
            border-radius: 50%;
            background: rgba(99, 102, 241, 0.12);
            filter: blur(120px);
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
          }
          .loader-logo-wrap {
            position: relative;
            width: 96px;
            height: 96px;
            margin: 0 auto 28px;
          }
          .loader-logo {
            width: 96px;
            height: 96px;
            border-radius: 24px;
            box-shadow: 0 20px 60px rgba(99, 102, 241, 0.35);
          }
          .loader-ring {
            position: absolute;
            inset: -6px;
            border-radius: 28px;
            border: 2px dashed rgba(99, 102, 241, 0.25);
            animation: spin 12s linear infinite;
          }
          .loader-title {
            font-size: 1.5rem;
            font-weight: 800;
            color: #fff;
            letter-spacing: -0.02em;
            margin-bottom: 6px;
          }
          .loader-sub {
            font-size: 0.65rem;
            text-transform: uppercase;
            letter-spacing: 0.25em;
            color: rgba(255,255,255,0.4);
            margin-bottom: 24px;
          }
          .loader-bar {
            width: 220px;
            height: 4px;
            background: rgba(99, 102, 241, 0.1);
            border-radius: 999px;
            overflow: hidden;
            margin: 0 auto 10px;
          }
          .loader-bar-fill {
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, rgba(99,102,241,0.6), rgba(99,102,241,1));
            border-radius: 999px;
            animation: loaderProgress 2.5s ease-out forwards;
            box-shadow: 0 0 16px rgba(99, 102, 241, 0.5);
          }
          .loader-status {
            font-size: 0.65rem;
            color: rgba(99, 102, 241, 0.55);
            letter-spacing: 0.08em;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes loaderProgress {
            0% { width: 0%; }
            40% { width: 55%; }
            75% { width: 88%; }
            100% { width: 100%; }
          }
        `}} />
      </head>
      <body className="min-h-screen bg-[#080808] text-white antialiased">
        {/* Sofortiger Loading Screen - erscheint INSTANT */}
        <div id="app-loader">
          <div style={{ textAlign: 'center' }}>
            <img src="/logo.webp" alt="HHRP" className="loader-logo" style={{ margin: '0 auto' }} />
            <div className="loader-spinner" style={{ margin: '0 auto' }}></div>
          </div>
        </div>
        
        <RootClientLayout>{children}</RootClientLayout>
        
        {/* Script zum Ausblenden des Loaders nach dem Laden */}
        <script dangerouslySetInnerHTML={{__html: `
          // Methode 1: React sendet "ready" Event
          window.addEventListener('react-ready', function() {
            setTimeout(function() {
              const loader = document.getElementById('app-loader');
              if (loader) {
                loader.classList.add('hidden');
                setTimeout(function() { loader.remove(); }, 300);
              }
            }, 200);
          });
          
          // Methode 2 (Fallback): Nach window.load mit Verzögerung
          window.addEventListener('load', function() {
            setTimeout(function() {
              const loader = document.getElementById('app-loader');
              if (loader && !loader.classList.contains('hidden')) {
                loader.classList.add('hidden');
                setTimeout(function() { loader.remove(); }, 300);
              }
            }, 2000); // 2s nach load event
          });
          
          // Methode 3 (Safety): Spätestens nach 10 Sekunden
          setTimeout(function() {
            const loader = document.getElementById('app-loader');
            if (loader && !loader.classList.contains('hidden')) {
              loader.classList.add('hidden');
              setTimeout(function() { loader.remove(); }, 300);
            }
          }, 10000);
        `}} />
      </body>
    </html>
  );
}
