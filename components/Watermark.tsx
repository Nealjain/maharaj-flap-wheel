'use client'

export default function Watermark() {
  return (
    <div className="fixed bottom-4 right-4 z-50 pointer-events-none select-none">
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="w-5 h-5 bg-primary-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">N</span>
            </div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Neal Jain
            </span>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">|</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            v1.0.0
          </span>
        </div>
      </div>
    </div>
  )
}
