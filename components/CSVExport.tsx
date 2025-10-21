'use client'

import { useState } from 'react'
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline'
import { exportToCSV, formatDate, formatDateTime } from '@/lib/csv-export'

interface CSVExportProps {
  data: any[]
  headers: string[]
  filename: string
  className?: string
  children?: React.ReactNode
}

export default function CSVExport({ 
  data, 
  headers, 
  filename, 
  className = '',
  children 
}: CSVExportProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    
    try {
      // Format the data for CSV export
      const formattedData = data.map(row => 
        headers.map(header => {
          const value = row[header.toLowerCase().replace(/\s+/g, '_')]
          
          // Format dates
          if (header.toLowerCase().includes('date') && value) {
            return formatDate(value)
          }
          
          // Format numbers
          if (typeof value === 'number') {
            return value.toString()
          }
          
          // Handle null/undefined values
          return value || ''
        })
      )

      exportToCSV({
        headers,
        rows: formattedData,
        filename: `${filename}_${new Date().toISOString().split('T')[0]}.csv`
      })
    } catch (error) {
      console.error('Error exporting CSV:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={isExporting || data.length === 0}
      className={`inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
      {isExporting ? 'Exporting...' : children || 'Export CSV'}
    </button>
  )
}
