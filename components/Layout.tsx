'use client'

import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Sidebar from './Sidebar'
import ProgressiveLoader from './ProgressiveLoader'
import MobileBottomNav from './MobileBottomNav'
import PageTransition from './PageTransition'

interface LayoutProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireAdmin?: boolean
}

export default function Layout({ children, requireAuth = true, requireAdmin = false }: LayoutProps) {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        console.log('Layout: No user found, redirecting to login')
        // Add a small delay to prevent race conditions
        const timer = setTimeout(() => {
          router.push('/login')
        }, 100)
        return () => clearTimeout(timer)
      }
      
      if (requireAdmin && !isAdmin) {
        console.log('Layout: User is not admin, redirecting to dashboard')
        router.push('/dashboard')
        return
      }
    } else {
      console.log('Layout: Auth still loading...')
    }
  }, [user, loading, isAdmin, requireAuth, requireAdmin, router])

  if (loading) {
    return <ProgressiveLoader type="page" />
  }

  if (requireAuth && !user) {
    return null
  }

  if (requireAdmin && !isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Sidebar />
      <main className="flex-1 w-full lg:ml-0">
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-4 pb-20 lg:pb-4">
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  )
}
