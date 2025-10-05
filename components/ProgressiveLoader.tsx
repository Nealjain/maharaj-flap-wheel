'use client'

import { motion } from 'framer-motion'

interface ProgressiveLoaderProps {
  type?: 'page' | 'section' | 'card' | 'inline'
  count?: number
  className?: string
}

export default function ProgressiveLoader({ 
  type = 'page', 
  count = 3, 
  className = '' 
}: ProgressiveLoaderProps) {
  const getLoaderContent = () => {
    switch (type) {
      case 'page':
        return (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-gray-300 dark:border-gray-700 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Loading...</p>
            </div>
          </div>
        )
      
      case 'section':
        return (
          <div className="space-y-4">
            {[...Array(count)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
              />
            ))}
          </div>
        )
      
      case 'card':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            </div>
          </div>
        )
      
      case 'inline':
        return (
          <div className="inline-flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-700 border-t-primary-600 rounded-full animate-spin" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Loading...</span>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className={className}>
      {getLoaderContent()}
    </div>
  )
}
