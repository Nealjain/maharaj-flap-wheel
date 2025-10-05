'use client'

import { ToastProvider } from '@/lib/toast'
import { ReactNode } from 'react'

export default function Toaster({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>
}
