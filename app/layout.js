import './globals.css';
import RootClientLayout from './RootClientLayout';

export const metadata = {
  title: 'Hamburg Horizon RP',
  description: 'Realismus. Spannung. Deine Story. - Notruf Hamburg Roleplay',
  icons: {
    icon: '/favicon.ico',
  },
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
