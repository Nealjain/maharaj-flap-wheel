'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/lib/toast'
import {
  PlusIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  XMarkIcon,
  TrashIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface ReferenceId {
  id: string
  reference_code: string
  created_by: string
  valid_from: string
  valid_until: string
  max_uses: number
  current_uses: number
  status: 'active' | 'expired' | 'exhausted' | 'revoked'
  allowed_role: string
  notes: string
  created_at: string
}

export default function ReferenceIdsPage() {
  const { user, profile } = useAuth()
  const { addToast } = useToast()
  const [referenceIds, setReferenceIds] = useState<ReferenceId[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    valid_days: 7,
    max_uses: 1,
    allowed_role: 'staff',
    notes: ''
  })

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchReferenceIds()
    }
  }, [profile])

  const fetchReferenceIds = async () => {
    try {
      const { data, error } = await supabase
        .from('reference_ids')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setReferenceIds(data || [])
    } catch (error) {
      console.error('Error fetching reference IDs:', error)
      addToast('Failed to load reference IDs', 'error')
    } finally {
      setLoading(false)
    }
  }

  const generateReferenceId = async () => {
    try {
      // Generate reference code
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_reference_code')

      if (codeError) throw codeError

      const validUntil = new Date()
      validUntil.setDate(validUntil.getDate() + formData.valid_days)

      // Insert new reference ID
      const { error: insertError } = await supabase
        .from('reference_ids')
        .insert({
          reference_code: codeData,
          created_by: user?.id,
          valid_until: validUntil.toISOString(),
          max_uses: formData.max_uses,
          allowed_role: formData.allowed_role,
          notes: formData.notes
        })

      if (insertError) throw insertError

      addToast('Reference ID created successfully', 'success')
      setShowCreateModal(false)
      setFormData({
        valid_days: 7,
        max_uses: 1,
        allowed_role: 'staff',
        notes: ''
      })
      fetchReferenceIds()
    } catch (error) {
      console.error('Error creating reference ID:', error)
      addToast('Failed to create reference ID', 'error')
    }
  }

  const revokeReferenceId = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this reference ID?')) return

    try {
      const { error } = await supabase
        .from('reference_ids')
        .update({ status: 'revoked', updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error

      addToast('Reference ID revoked', 'success')
      fetchReferenceIds()
    } catch (error) {
      console.error('Error revoking reference ID:', error)
      addToast('Failed to revoke reference ID', 'error')
    }
  }

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    addToast('Reference code copied to clipboard', 'success')
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      case 'expired':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
      case 'exhausted':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      case 'revoked':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    }
  }

  if (profile?.role !== 'admin') {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            You don't have permission to access this page.
          </p>
        </div>
      </Layout>
    )
  }

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Reference ID Management
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Generate and manage registration reference codes
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Generate New
          </button>
        </div>

        {/* Reference IDs List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {referenceIds.length === 0 ? (
            <div className="text-center py-12">
              <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No reference IDs
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Generate a new reference ID to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Reference Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Usage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Valid Until
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {referenceIds.map((ref, index) => (
                    <motion.tr
                      key={ref.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <code className="text-sm font-mono text-gray-900 dark:text-white">
                            {ref.reference_code}
                          </code>
                          <button
                            onClick={() => copyToClipboard(ref.reference_code)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            {copiedCode === ref.reference_code ? (
                              <CheckIcon className="h-4 w-4 text-green-500" />
                            ) : (
                              <ClipboardDocumentIcon className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        {ref.notes && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {ref.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ref.status)}`}>
                          {ref.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {ref.current_uses} / {ref.max_uses}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {ref.allowed_role}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {new Date(ref.valid_until).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {ref.status === 'active' && (
                          <button
                            onClick={() => revokeReferenceId(ref.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowCreateModal(false)}></div>
            
            <div className="relative bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 z-10">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Generate Reference ID
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valid for (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={formData.valid_days}
                    onChange={(e) => setFormData({ ...formData, valid_days: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Maximum uses
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Allowed role
                  </label>
                  <select
                    value={formData.allowed_role}
                    onChange={(e) => setFormData({ ...formData, allowed_role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  >
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    placeholder="Purpose of this reference ID..."
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={generateReferenceId}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700"
                >
                  Generate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
