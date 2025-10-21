import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth'
import { OptimizedDataProvider } from '@/lib/optimized-data-provider'
import { ThemeProvider } from '@/lib/theme'
import Toaster from '@/components/Toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Maharaj Flap Wheel',
  description: 'Inventory management for Maharaj Flap Wheel',
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
            </OptimizedDataProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
