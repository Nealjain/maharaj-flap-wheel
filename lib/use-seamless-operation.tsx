'use client'

import { useState, useCallback } from 'react'

interface UseSeamlessOperationOptions {
  onSuccess?: (data?: any) => void
  onError?: (error: any) => void
  successMessage?: string
  errorMessage?: string
}

export function useSeamlessOperation(options: UseSeamlessOperationOptions = {}) {
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<{
    show: boolean
    message: string
    type: 'success' | 'error' | 'info'
  }>({
    show: false,
    message: '',
    type: 'success'
  })

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }))
    }, 3000)
  }, [])

  const execute = useCallback(async <T,>(
    operation: () => Promise<T>,
    optimisticUpdate?: () => void
  ): Promise<T | null> => {
    try {
      // Apply optimistic update immediately
      if (optimisticUpdate) {
        optimisticUpdate()
      }

      // Show subtle loading indicator
      setIsLoading(true)

      // Execute operation in background
      const result = await operation()

      // Show success toast
      if (options.successMessage) {
        showToast(options.successMessage, 'success')
      }

      // Call success callback
      if (options.onSuccess) {
        options.onSuccess(result)
      }

      return result
    } catch (error: any) {
      console.error('Operation failed:', error)

      // Show error toast
      const errorMsg = options.errorMessage || error.message || 'Operation failed'
      showToast(errorMsg, 'error')

      // Call error callback
      if (options.onError) {
        options.onError(error)
      }

      return null
    } finally {
      setIsLoading(false)
    }
  }, [options, showToast])

  return {
    execute,
    isLoading,
    toast,
    showToast,
    closeToast: () => setToast(prev => ({ ...prev, show: false }))
  }
}
