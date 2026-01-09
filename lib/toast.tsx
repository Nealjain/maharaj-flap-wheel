'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (message: string, type?: Toast['type'], duration?: number, action?: Toast['action']) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: Toast['type'] = 'info', duration = 5000, action?: Toast['action']) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = { id, message, type, duration, action }

    setToasts(prev => [...prev, newToast])

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[], removeToast: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast, onRemove: (id: string) => void }) {
  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-500 text-white'
      case 'error':
        return 'bg-red-500 text-white'
      case 'warning':
        return 'bg-yellow-500 text-black'
      case 'info':
      default:
        return 'bg-blue-500 text-white'
    }
  }

  return (
    <div className={`px-4 py-3 rounded-lg shadow-lg ${getToastStyles()} max-w-sm`}>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium">{toast.message}</p>
        <div className="flex items-center gap-2">
          {toast.action && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toast.action?.onClick()
                onRemove(toast.id)
              }}
              className="text-xs font-bold underline hover:opacity-80 px-2 py-1 rounded bg-white/20 whitespace-nowrap"
            >
              {toast.action.label}
            </button>
          )}
          <button
            onClick={() => onRemove(toast.id)}
            className="text-white hover:text-gray-200"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Export toast function for easy use
export const toast = {
  success: (message: string, duration?: number) => {
    // This will be set by the provider
    console.log('Toast success:', message)
  },
  error: (message: string, duration?: number) => {
    console.log('Toast error:', message)
  },
  warning: (message: string, duration?: number) => {
    console.log('Toast warning:', message)
  },
  info: (message: string, duration?: number) => {
    console.log('Toast info:', message)
  }
}
