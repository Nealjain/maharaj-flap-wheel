'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import { useData } from '@/lib/optimized-data-provider'
import { 
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

export default function CreateTransportCompanyPage() {
  const router = useRouter()
  const { createTransportCompany, transportCompanies } = useData()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name) {
      alert('Please fill in the company name')
      return
    }

    // Check for duplicate name
    const duplicateName = transportCompanies.find(company => company.name.toLowerCase() === formData.name.toLowerCase())
    if (duplicateName) {
      alert(`Transport company name "${formData.name}" already exists. Please use a different name.`)
      return
    }

    setLoading(true)
    console.log('Starting transport company creation...', formData)

    try {
      const result = await createTransportCompany(formData)
      console.log('Create transport company result:', result)

      if (result.error) {
        console.error('Error creating transport company:', result.error)
        if (result.error.message?.includes('duplicate') || result.error.message?.includes('unique')) {
          alert('A transport company with this name already exists. Please use a different name.')
        } else {
          alert(`Failed to create transport company: ${result.error.message || 'Please try again.'}`)
        }
      } else {
        console.log('Transport company created successfully, redirecting...')
        alert('Transport company created successfully!')
        router.push('/masters/transport-companies')
      }
    } catch (error: any) {
      console.error('Error creating transport company:', error)
      alert(`Failed to create transport company: ${error.message || 'Please try again.'}`)
    } finally {
      setLoading(false)
      console.log('Transport company creation finished')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create Transport Company
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Add a new logistics and shipping partner
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Company Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter transport company name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address
                </label>
                <textarea
                  name="address"
                  rows={3}
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter company address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter phone number"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Contact number for logistics coordination
                </p>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.push('/masters/transport-companies')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <XMarkIcon className="h-4 w-4 mr-2" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Create Transport Company
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
