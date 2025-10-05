'use client'

export default function FastLoadingSpinner() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-gray-300 dark:border-gray-700 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  )
}
