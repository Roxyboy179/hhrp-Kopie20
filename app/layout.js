import './globals.css';

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
      <body className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
