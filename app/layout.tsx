import type { Metadata } from 'next'
import { ThemeProvider } from '../components/tabs/player-and-opponent/components/theme-context'
import './globals.css'

export const metadata: Metadata = {
  title: 'Expedition Battle Calculator - Whiteout Survival',
  description: 'Accurate and modern Whiteout Survival rally and expedition battle calculator. Includes rally stat breakdown, troop buffs, advanced projections, and battle simulation tools.',
  keywords: [
    'Whiteout Survival',
    'Expedition',
    'Battle Calculator',
    'Rally Calculator',
    'Troop Stats',
    'Rally Buffs',
    'Troop Simulation',
    'Hero Buffs',
    'Battle Simulator',
    'Game Tools'
  ],
  authors: [{ name: 'SҜ¥ŇΣŦƗĆ', url: 'https://github.com/Skynet2005' }],
  creator: 'Expedition Tools Dev Team',
  applicationName: 'Whiteout Survival Expedition Calculator',
  metadataBase: new URL('http://localhost:3000/'),
  openGraph: {
    title: 'Expedition Battle Calculator - Whiteout Survival',
    description: 'Battle rally and troop calculator for Whiteout Survival with detailed stats, buff analysis, and accurate projections.',
    url: 'http://localhost:3000/',
    images: [
      {
        url: '/whiteout-expedition-calculator-og.png',
        width: 1200,
        height: 630,
        alt: 'Expedition Battle Calculator Whiteout Survival'
      }
    ],
    type: 'website',
    siteName: 'Expedition Battle Calculator'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Expedition Battle Calculator - Whiteout Survival',
    description: 'Whiteout Survival Rally Calculator: troop buffs, stats, and advanced expedition battle simulator.',
    images: ['/favicon.png'],
    creator: '@Skynet2005'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-theme="dark" className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />
        {/* Additional meta for accessibility and SEO */}
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

