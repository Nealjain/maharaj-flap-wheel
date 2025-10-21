/**
 * Utility to handle Enter key press on form inputs
 * Ensures Enter key submits the form on both mobile and desktop
 */

export function handleEnterKeyPress(
  event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  onSubmit?: () => void
) {
  if (event.key === 'Enter' && !event.shiftKey) {
    // For textarea, Shift+Enter should create new line
    // For input, Enter should submit
    const isTextarea = event.currentTarget.tagName === 'TEXTAREA'
    
    if (!isTextarea) {
      event.preventDefault()
      
      // Find the form and submit it
      const form = event.currentTarget.closest('form')
      if (form) {
        form.requestSubmit()
      } else if (onSubmit) {
        onSubmit()
      }
    }
  }
}

/**
 * Props to add to input elements to enable Enter key submission
 */
export const enterKeyProps = {
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => handleEnterKeyPress(e)
}

/**
 * Hook to add Enter key handler to all inputs in a form
 */
export function useEnterKeySubmit(formRef: React.RefObject<HTMLFormElement>) {
  React.useEffect(() => {
    const form = formRef.current
    if (!form) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        const target = e.target as HTMLElement
        
        // Don't submit on textarea (allow new lines)
        if (target.tagName === 'TEXTAREA') return
        
        // Don't submit on buttons
        if (target.tagName === 'BUTTON') return
        
        // Don't submit on select (allow opening dropdown)
        if (target.tagName === 'SELECT') return
        
        // Submit the form
        if (target.tagName === 'INPUT') {
          e.preventDefault()
          form.requestSubmit()
        }
      }
    }

    form.addEventListener('keydown', handleKeyDown)
    return () => form.removeEventListener('keydown', handleKeyDown)
  }, [formRef])
}

// Import React for the hook
import React from 'react'
