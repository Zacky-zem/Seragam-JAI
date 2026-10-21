import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Seragam JAI | PT Jatim Autocomp Indonesia',
  description: 'Portal publik pengajuan dan distribusi seragam PT Jatim Autocomp Indonesia.',
  generator: 'Next.js',
  icons: {
    icon: [
      {
        url: '/seragam-jai/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/seragam-jai/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/seragam-jai/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/seragam-jai/apple-icon.jpeg',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#0b3154',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className="light">
      <body className="bg-background text-foreground antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
