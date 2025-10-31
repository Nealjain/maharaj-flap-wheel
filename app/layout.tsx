import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth'
import { OptimizedDataProvider } from '@/lib/optimized-data-provider'
import { ThemeProvider } from '@/lib/theme'
import Toaster from '@/components/Toaster'
import AutoRefresh from '@/components/AutoRefresh'
import { Analytics } from '@vercel/analytics/next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Maharaja Flap Wheel',
  description: 'Inventory management for Maharaja Flap Wheel',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <OptimizedDataProvider>
              <AutoRefresh />
              <Toaster>
                {children}
              </Toaster>
            </OptimizedDataProvider>
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
