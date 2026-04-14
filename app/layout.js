import './globals.css';
import RootClientLayout from './RootClientLayout';

export const metadata = {
  title: 'Hamburg Horizon RP - Bewerbungsportal',
  description: 'Werde Teil des Hamburg Horizon Roleplay Teams! Realismus trifft auf Spannung - Schreibe deine eigene Geschichte in unserem professionellen Roblox Roleplay Server. Jetzt bewerben und Teil einer lebendigen Community werden!',
  keywords: 'Hamburg Horizon RP, Roleplay, Roblox, Team Bewerbung, Hamburg RP, Roleplay Server, Community',
  authors: [{ name: 'Hamburg Horizon RP Team' }],
  openGraph: {
    title: 'Hamburg Horizon RP - Bewerbungsportal',
    description: 'Werde Teil des Hamburg Horizon Roleplay Teams! Realismus trifft auf Spannung - Schreibe deine eigene Geschichte in unserem professionellen Roblox Roleplay Server. Bewirb dich jetzt als Teammitglied oder für ein Praktikum!',
    url: 'https://hamburg-horizon-rp320.vercel.app',
    siteName: 'Hamburg Horizon RP',
    images: [
      {
        url: '/embed.webp',
        width: 1200,
        height: 630,
        alt: 'Hamburg Horizon RP - Realismus. Spannung. Deine Story.',
      },
    ],
    locale: 'de_DE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hamburg Horizon RP - Bewerbungsportal',
    description: 'Werde Teil des Hamburg Horizon Roleplay Teams! Realismus trifft auf Spannung - Schreibe deine eigene Geschichte. Bewirb dich jetzt!',
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
