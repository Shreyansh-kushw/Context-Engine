import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { ToastProvider } from '@/components/toast'
import { OwnerTokenProvider } from '@/components/owner-token-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Context Engine — RAG Document Intelligence',
  description:
    'Upload documents and chat with an AI that understands them. A sleek RAG-powered document intelligence and Q&A workspace.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0b0f17',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`dark ${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <ToastProvider>
          <OwnerTokenProvider>{children}</OwnerTokenProvider>
        </ToastProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

