'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function AutoRefresh() {
  const router = useRouter()
  const lastActivityRef = useRef(Date.now())
  const isUserActiveRef = useRef(false)

  useEffect(() => {
    // Track user activity
    const updateActivity = () => {
      lastActivityRef.current = Date.now()
      isUserActiveRef.current = true
      
      // Reset active flag after 2 seconds of no activity
      setTimeout(() => {
        if (Date.now() - lastActivityRef.current >= 2000) {
          isUserActiveRef.current = false
        }
      }, 2000)
    }

    // Listen for user interactions
    const events = ['keydown', 'mousedown', 'touchstart', 'input', 'change', 'focus']
    events.forEach(event => {
      document.addEventListener(event, updateActivity)
    })

    // Refresh data every 5 seconds, but only if user is not active
    const interval = setInterval(() => {
      if (!isUserActiveRef.current) {
        router.refresh()
      }
    }, 5000)

    return () => {
      clearInterval(interval)
      events.forEach(event => {
        document.removeEventListener(event, updateActivity)
      })
    }
  }, [router])

  return null
}
