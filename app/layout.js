import './globals.css';
import RootClientLayout from './RootClientLayout';

export const metadata = {
  title: 'Bewerbungsportal - Hamburg Horizon RP',
  description: 'Offizielles Bewerbungsportal von Hamburg Horizon RP. Bewirb dich jetzt für unser Team! Wir suchen motivierte Mitglieder für Team-Positionen, Praktika und Beförderungen. Starte deine Karriere bei Hamburg Horizon Roleplay.',
  keywords: 'Hamburg Horizon RP, Bewerbung, Team, Praktikum, Uprank, Bewerbungsportal, Hamburg RP, Roleplay Team',
  authors: [{ name: 'Hamburg Horizon RP Team' }],
  openGraph: {
    title: 'Bewerbungsportal - Hamburg Horizon RP',
    description: 'Offizielles Bewerbungsportal von Hamburg Horizon RP. Bewirb dich jetzt für unser Team! Team-Bewerbung • Praktikum • Uprank. Werde Teil unserer professionellen Roleplay-Community und gestalte Hamburg Horizon mit uns!',
    url: 'https://hamburg-horizon-rp320.vercel.app',
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
    title: 'Bewerbungsportal - Hamburg Horizon RP',
    description: 'Offizielles Bewerbungsportal von Hamburg Horizon RP. Bewirb dich jetzt für unser Team! Team-Bewerbung • Praktikum • Uprank',
    images: ['/embed.webp'],
  },
  icons: {
    icon: '/logo.webp',
    apple: '/logo.webp',
  },
  themeColor: '#000000',
};

export default function RootLayout({ children }) {
  return (
    <html lang="de" className="dark">
      <body className="min-h-screen bg-[#080808] text-white antialiased">
        <RootClientLayout>{children}</RootClientLayout>
      </body>
    </html>
  );
}
