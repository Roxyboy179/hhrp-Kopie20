import './globals.css'
import { Inter } from 'next/font/google'
import Navigation from '@/components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Hamburg Horizon RP - Bewerbungssystem',
  description: 'Bewerbungssystem für Hamburg Horizon Roleplay Server',
}

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body className={inter.className}>
        <Navigation />
        {children}
      </body>
    </html>
  )
}
