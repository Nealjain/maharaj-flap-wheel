'use client'

import { useEffect } from 'react'

/**
 * Global Enter key handler to ensure Enter submits forms everywhere
 * Works on both desktop and mobile keyboards
 */
export default function GlobalEnterKeyHandler() {
  useEffect(() => {
    const handleGlobalEnter = (e: KeyboardEvent) => {
      // Only handle Enter key
      if (e.key !== 'Enter') return
      
      // Don't handle if Shift is pressed (for new lines in textarea)
      if (e.shiftKey) return
      
      const target = e.target as HTMLElement
      
      // Don't handle for textarea (allow new lines)
      if (target.tagName === 'TEXTAREA') return
      
      // Don't handle for buttons (they have their own behavior)
      if (target.tagName === 'BUTTON') return
      
      // Don't handle for select (allow opening dropdown)
      if (target.tagName === 'SELECT') return
      
      // Handle for input fields
      if (target.tagName === 'INPUT') {
        const inputType = target.getAttribute('type')
        
        // Don't submit for these input types
        if (inputType === 'checkbox' || inputType === 'radio' || inputType === 'file') {
          return
        }
        
        // Find the closest form
        const form = target.closest('form')
        if (form) {
          e.preventDefault()
          
          // Use requestSubmit() to trigger validation and onSubmit handler
          form.requestSubmit()
        }
      }
    }

    // Add event listener
    document.addEventListener('keydown', handleGlobalEnter)
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleGlobalEnter)
    }
  }, [])

  // This component doesn't render anything
  return null
}
