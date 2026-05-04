import './globals.css';
import RootClientLayout from './RootClientLayout';

export const metadata = {
  title: 'HHRP',
  description: 'Offizielles Bewerbungsportal von Hamburg Horizon RP. Bewirb dich jetzt für unser Team! Wir suchen motivierte Mitglieder für Team-Positionen, Praktika und Beförderungen. Starte deine Karriere bei Hamburg Horizon Roleplay.',
  keywords: 'Hamburg Horizon RP, Bewerbung, Team, Praktikum, Uprank, Bewerbungsportal, Hamburg RP, Roleplay Team',
  authors: [{ name: 'Hamburg Horizon RP Team' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://hamburg-horizon-rp320.vercel.app'),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'HHRP',
  },
  openGraph: {
    title: 'HHRP',
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
    title: 'HHRP',
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
        
        {/* Inline Styles für sofortigen Loading Screen */}
        <style dangerouslySetInnerHTML={{__html: `
          #app-loader {
            position: fixed;
            inset: 0;
            background: #050505;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            transition: opacity 0.3s ease-out;
          }
          #app-loader.hidden {
            opacity: 0;
            pointer-events: none;
          }
          .loader-spinner {
            width: 48px;
            height: 48px;
            border: 4px solid rgba(255,255,255,0.1);
            border-top-color: var(--theme-accent, #667eea);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .loader-logo {
            width: 80px;
            height: 80px;
            margin-bottom: 24px;
            border-radius: 24px;
            animation: pulse 2s ease-in-out infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(0.95); }
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

m
