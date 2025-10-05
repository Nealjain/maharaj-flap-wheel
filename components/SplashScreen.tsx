'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline'

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if splash was already shown in this session
    const splashShown = sessionStorage.getItem('splashShown')
    
    if (!splashShown) {
      // Show after a short delay
      setTimeout(() => {
        setIsVisible(true)
      }, 500)
      
      sessionStorage.setItem('splashShown', 'true')
      
      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setIsVisible(false)
      }, 5000)
    }
  }, [])

  const handleClose = () => {
    setIsVisible(false)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 400, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 400, scale: 0.9 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-6 right-6 z-[100] max-w-sm w-full sm:w-96"
        >
          <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-xl shadow-2xl overflow-hidden">
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
            >
              <XMarkIcon className="h-4 w-4 text-white" />
            </button>

            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full blur-2xl"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 p-5 text-white">
              <div className="flex items-start space-x-3">
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-lg">
                    <span className="text-2xl font-bold text-primary-600">M</span>
                  </div>
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center space-x-2 mb-1">
                    <SparklesIcon className="h-4 w-4 text-yellow-300" />
                    <h3 className="text-sm font-semibold text-white/90">
                      Welcome!
                    </h3>
                  </div>
                  <h2 className="text-lg font-bold mb-1">
                    Maharj Flap Wheel
                  </h2>
                  <p className="text-xs text-white/80 mb-3">
                    Inventory Management System
                  </p>
                  
                  {/* Divider */}
                  <div className="h-px bg-white/20 mb-3"></div>
                  
                  {/* Creator Info */}
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold">N</span>
                    </div>
                    <div>
                      <a 
                        href="https://profile.nealjain.website" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs font-semibold hover:underline"
                      >
                        Neal Jain
                      </a>
                      <p className="text-xs text-white/70">Developer & Designer</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Version Badge */}
              <div className="mt-3 pt-3 border-t border-white/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60">Version 1.0.0</span>
                  <button
                    onClick={handleClose}
                    className="text-xs text-white/80 hover:text-white font-medium"
                  >
                    Dismiss →
                  </button>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 4.5, ease: "linear" }}
              className="absolute bottom-0 left-0 h-1 bg-white/30 origin-left"
              style={{ width: '100%' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
