import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'KENI | Defina Seu Movimento',
    template: '%s | KENI',
  },
  description: 'A nova referência em moda esportiva urbana. Tênis, roupas e acessórios premium para quem define seu movimento.',
  keywords: ['keni', 'tênis', 'roupas esportivas', 'streetwear', 'moda urbana', 'corrida'],
  robots: { index: true, follow: true },
  openGraph: {
    title: 'KENI | Defina Seu Movimento',
    description: 'A nova referência em moda esportiva urbana.',
    type: 'website',
    locale: 'pt_BR',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0a0a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,800;0,900;1,900&family=Barlow:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
