'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import { supabase } from '@/lib/supabase'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  ScaleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface Unit {
  id: string
  name: string
  abbreviation: string
  type: 'standard' | 'custom'
  created_at: string
}

export default function UnitsPage() {
  const router = useRouter()
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    abbreviation: ''
  })

  // Standard units that come pre-configured
  const standardUnits = [
    { name: 'Pieces', abbreviation: 'pcs', type: 'standard' as const },
    { name: 'Kilograms', abbreviation: 'kg', type: 'standard' as const },
    { name: 'Grams', abbreviation: 'g', type: 'standard' as const },
    { name: 'Meters', abbreviation: 'm', type: 'standard' as const },
    { name: 'Centimeters', abbreviation: 'cm', type: 'standard' as const },
    { name: 'Liters', abbreviation: 'l', type: 'standard' as const },
    { name: 'Milliliters', abbreviation: 'ml', type: 'standard' as const },
    { name: 'Box', abbreviation: 'box', type: 'standard' as const },
    { name: 'Set', abbreviation: 'set', type: 'standard' as const },
    { name: 'Pair', abbreviation: 'pair', type: 'standard' as const }
  ]

  useEffect(() => {
    fetchCustomUnits()
  }, [])

  const fetchCustomUnits = async () => {
    try {
      // Get all items with custom units
      const { data, error } = await supabase
        .from('items')
        .select('custom_unit')
        .not('custom_unit', 'is', null)
        .neq('custom_unit', '')

      if (error) throw error

      // Extract unique custom units
      const customUnitsSet = new Set<string>()
      data?.forEach(item => {
        if (item.custom_unit) {
          customUnitsSet.add(item.custom_unit)
        }
      })

      // Create custom units array
      const customUnits: Unit[] = Array.from(customUnitsSet).map((unit, index) => ({
        id: `custom-${index}`,
        name: unit,
        abbreviation: unit.toLowerCase(),
        type: 'custom' as const,
        created_at: new Date().toISOString()
      }))

      // Combine standard and custom units
      const allUnits: Unit[] = [
        ...standardUnits.map((unit, index) => ({
          id: `standard-${index}`,
          ...unit,
          created_at: new Date().toISOString()
        })),
        ...customUnits
      ]

      setUnits(allUnits)
    } catch (error) {
      console.error('Error fetching units:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUnits = units.filter(unit =>
    unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.abbreviation.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleOpenModal = (unit?: Unit) => {
    if (unit) {
      setEditingUnit(unit)
      setFormData({
        name: unit.name,
        abbreviation: unit.abbreviation
      })
    } else {
      setEditingUnit(null)
      setFormData({ name: '', abbreviation: '' })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingUnit(null)
    setFormData({ name: '', abbreviation: '' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.abbreviation) {
      alert('Please fill in all fields')
      return
    }

    // For now, we'll just show a message since units are derived from items
    alert('Custom units are automatically created when you add items with custom units. Go to Items → Create Item → Use custom unit.')
    handleCloseModal()
  }

  const handleDelete = async (unit: Unit) => {
    if (unit.type === 'standard') {
      alert('Cannot delete standard units')
      return
    }

    if (!confirm(`Delete unit "${unit.name}"? This will affect all items using this unit.`)) {
      return
    }

    try {
      // Update all items using this custom unit to use 'pcs' instead
      const { error } = await supabase
        .from('items')
        .update({ custom_unit: null, unit: 'pcs' })
        .eq('custom_unit', unit.name)

      if (error) throw error

      alert('Unit deleted successfully')
      fetchCustomUnits()
    } catch (error) {
      console.error('Error deleting unit:', error)
      alert('Failed to delete unit')
    }
  }

  const getUsageCount = (unit: Unit) => {
    // This would need to query the database
    // For now, return 0
    return 0
  }

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Units Management
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage measurement units for your items
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => router.push('/masters/items/create')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Custom Unit
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                How to add custom units
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <p>
                  Custom units are created automatically when you add items. Go to{' '}
                  <button
                    onClick={() => router.push('/masters/items/create')}
                    className="font-medium underline hover:text-blue-900 dark:hover:text-blue-100"
                  >
                    Items → Create Item
                  </button>
                  {' '}and check "Use custom unit" to add units like "Rolls", "Bundles", etc.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search units..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Units Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUnits.map((unit, index) => (
            <motion.div
              key={unit.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${
                    unit.type === 'standard' 
                      ? 'bg-blue-100 dark:bg-blue-900/20' 
                      : 'bg-orange-100 dark:bg-orange-900/20'
                  }`}>
                    <ScaleIcon className={`h-5 w-5 ${
                      unit.type === 'standard'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-orange-600 dark:text-orange-400'
                    }`} />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      {unit.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {unit.abbreviation}
                    </p>
                  </div>
                </div>
                {unit.type === 'custom' && (
                  <button
                    onClick={() => handleDelete(unit)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    title="Delete unit"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              <div className="mt-3 flex items-center justify-between">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  unit.type === 'standard'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                    : 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
                }`}>
                  {unit.type === 'standard' ? 'Standard' : 'Custom'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredUnits.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <ScaleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No units found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Try adjusting your search or add a new custom unit
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}
