import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth'
import { OptimizedDataProvider } from '@/lib/optimized-data-provider'
import { ThemeProvider } from '@/lib/theme'
import Toaster from '@/components/Toaster'
import PWAInstall from '@/components/PWAInstall'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Maharaj Flap Wheel',
  description: 'Inventory management for Maharaj Flap Wheel',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Maharaj ERP',
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#2563eb',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <OptimizedDataProvider>
              <Toaster>
                {children}
              </Toaster>
              <PWAInstall />
            </OptimizedDataProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
