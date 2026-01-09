'use client'

import { usePathname, useRouter } from 'next/navigation'
import { 
  HomeIcon, 
  ShoppingCartIcon, 
  CubeIcon, 
  Cog6ToothIcon 
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  ShoppingCartIcon as ShoppingCartIconSolid,
  CubeIcon as CubeIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid
} from '@heroicons/react/24/solid'

export default function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    { 
      name: 'Home', 
      path: '/dashboard', 
      icon: HomeIcon, 
      iconSolid: HomeIconSolid 
    },
    { 
      name: 'Orders', 
      path: '/orders', 
      icon: ShoppingCartIcon, 
      iconSolid: ShoppingCartIconSolid 
    },
    { 
      name: 'Stock', 
      path: '/stock', 
      icon: CubeIcon, 
      iconSolid: CubeIconSolid 
    },
    { 
      name: 'More', 
      path: '/masters', 
      icon: Cog6ToothIcon, 
      iconSolid: Cog6ToothIconSolid 
    },
  ]

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === path
    return pathname?.startsWith(path)
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const active = isActive(item.path)
          const Icon = active ? item.iconSolid : item.icon
          
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors ${
                active
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{item.name}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
