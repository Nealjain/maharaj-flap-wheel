'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/lib/toast'
import {
    CloudArrowUpIcon,
    DocumentArrowDownIcon,
    TableCellsIcon,
    CheckCircleIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '@/lib/auth'

type ImportType = 'items' | 'companies' | 'transport_companies' | 'orders'

const IMPORT_TYPES: { id: ImportType; label: string; columns: string[] }[] = [
    {
        id: 'items',
        label: 'Items (Inventory)',
        columns: ['sku', 'name', 'description', 'unit', 'physical_stock', 'custom_unit']
    },
    {
        id: 'companies',
        label: 'Companies (Customers)',
        columns: ['name', 'address', 'gst_number']
    },
    {
        id: 'transport_companies',
        label: 'Transport Companies',
        columns: ['name', 'address', 'phone']
    },
    {
        id: 'orders',
        label: 'Orders',
        columns: ['order_ref', 'customer_name', 'sku', 'quantity', 'price', 'status', 'due_date']
    }
]

export default function ImportPage() {
    const { addToast } = useToast()
    const [activeType, setActiveType] = useState<ImportType>('items')
    const [file, setFile] = useState<File | null>(null)
    const [previewData, setPreviewData] = useState<any[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const [uploadStats, setUploadStats] = useState<{ total: number; success: number; failed: number; errors: string[] } | null>(null)

    const downloadTemplate = () => {
        const typeConfig = IMPORT_TYPES.find(t => t.id === activeType)!
        const ws = XLSX.utils.json_to_sheet([
            typeConfig.columns.reduce((acc, col) => ({ ...acc, [col]: '' }), {})
        ])
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, activeType)
        XLSX.writeFile(wb, `${activeType}_template.xlsx`)
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        setFile(selectedFile)
        const reader = new FileReader()
        reader.onload = (evt) => {
            const bstr = evt.target?.result
            const wb = XLSX.read(bstr, { type: 'binary' })
            const wsname = wb.SheetNames[0]
            const ws = wb.Sheets[wsname]
            const data = XLSX.utils.sheet_to_json(ws)
            setPreviewData(data)
            setUploadStats(null)
        }
        reader.readAsBinaryString(selectedFile)
    }



    const { user } = useAuth()

    const processImport = async () => {
        if (!previewData.length) return

        setIsUploading(true)
        setUploadStats(null)

        const activeConfig = IMPORT_TYPES.find(t => t.id === activeType)!

        // 1. Column Validation
        const fileColumns = Object.keys(previewData[0])
        const missingColumns = activeConfig.columns.filter(col => !fileColumns.includes(col))

        if (missingColumns.length > 0) {
            setUploadStats({
                total: 0,
                success: 0,
                failed: 0,
                errors: [
                    `CRITICAL: Invalid File Format.`,
                    `Missing columns: ${missingColumns.join(', ')}`,
                    `Expected: ${activeConfig.columns.join(', ')}`,
                    `Suggestion: Please download the correct template for ${activeConfig.label} and try again.`
                ]
            })
            setIsUploading(false)
            return
        }

        let successCount = 0
        let failedCount = 0
        const errors: string[] = []

        try {
            // Pre-process for Orders: Group by order_ref
            let processingData = previewData
            let orderGroups: { [key: string]: any[] } = {}

            if (activeType === 'orders') {
                previewData.forEach((row, idx) => {
                    const ref = row.order_ref || `__single_${idx}`
                    if (!orderGroups[ref]) orderGroups[ref] = []
                    orderGroups[ref].push({ ...row, _origIdx: idx })
                })
                // Convert groups to array of orders for iteration
                // Each "item" in processingData will now represent an ORDER (with multiple items)
                // We'll iterate manually for orders
            }

            if (activeType === 'orders') {
                // Orders Import Logic
                for (const ref of Object.keys(orderGroups)) {
                    const rows = orderGroups[ref]
                    const firstRow = rows[0]
                    const rowIdxDisplay = rows.map(r => r._origIdx + 1).join(', ')

                    try {
                        if (!firstRow.customer_name) throw new Error(`Missing Customer Name`)
                        if (!user?.id) throw new Error('User not authenticated')

                        // 1. Find Company
                        const { data: company } = await supabase
                            .from('companies')
                            .select('id')
                            .eq('name', firstRow.customer_name)
                            .single()

                        if (!company) throw new Error(`Company '${firstRow.customer_name}' not found`)

                        // 2. Validate all Items first
                        const itemsToInsert = []
                        for (const row of rows) {
                            if (!row.sku) throw new Error(`Missing SKU for an item`)
                            const { data: item } = await supabase
                                .from('items')
                                .select('id')
                                .eq('sku', row.sku)
                                .single()

                            if (!item) throw new Error(`Item SKU '${row.sku}' not found`)

                            itemsToInsert.push({
                                item_id: item.id,
                                quantity: Number(row.quantity) || 1,
                                price: Number(row.price) || 0,
                                delivered_quantity: 0
                            })
                        }

                        // 3. Create Order
                        const { data: order, error: orderError } = await supabase
                            .from('orders')
                            .insert({
                                company_id: company.id,
                                created_by: user.id,
                                status: firstRow.status?.toLowerCase() || 'pending',
                                due_date: firstRow.due_date ? new Date(firstRow.due_date).toISOString() : null,
                                notes: `Imported via Excel (Ref: ${ref})`
                            })
                            .select()
                            .single()

                        if (orderError) throw orderError
                        if (!order) throw new Error('Failed to create order')

                        // 4. Create Order Items
                        const orderItems = itemsToInsert.map(item => ({
                            order_id: order.id,
                            ...item
                        }))

                        const { error: itemsError } = await supabase
                            .from('order_items')
                            .insert(orderItems)

                        if (itemsError) {
                            // Try to cleanup order if items fail? 
                            // For complex imports, maybe just log error.
                            throw itemsError
                        }

                        successCount += rows.length // Count items or orders? Let's count rows processed.

                    } catch (err: any) {
                        console.error(`Group ${ref} error:`, err)
                        rows.forEach(() => failedCount++) // Mark all rows in group as failed
                        errors.push(`Order Ref '${ref}' (Rows ${rowIdxDisplay}): ${err.message}`)
                    }
                }

            } else {
                // ... Existing logic for Items/Companies/Transport ...
                for (let index = 0; index < processingData.length; index++) {
                    const row = processingData[index]
                    try {
                        const rowData = row as any
                        let error = null

                        // Data cleaning/validation
                        if (activeType === 'items') {
                            // ... (rest of the existing logic) ...
                            if (!rowData.sku || !rowData.name) throw new Error('Missing SKU or Name')

                            // Check if exists
                            const { data: existing } = await supabase
                                .from('items')
                                .select('id')
                                .eq('sku', rowData.sku)
                                .single()

                            if (existing) {
                                // Update
                                const { error: updateError } = await supabase
                                    .from('items')
                                    .update({
                                        name: rowData.name,
                                        description: rowData.description,
                                        unit: rowData.unit || 'pcs',
                                        physical_stock: Number(rowData.physical_stock) || 0,
                                        custom_unit: rowData.custom_unit
                                    })
                                    .eq('id', existing.id)
                                error = updateError
                            } else {
                                // Insert
                                const { error: insertError } = await supabase
                                    .from('items')
                                    .insert({
                                        sku: rowData.sku,
                                        name: rowData.name,
                                        description: rowData.description,
                                        unit: rowData.unit || 'pcs',
                                        physical_stock: Number(rowData.physical_stock) || 0,
                                        custom_unit: rowData.custom_unit
                                    })
                                error = insertError
                            }
                        } else if (activeType === 'companies') {
                            if (!rowData.name) throw new Error('Missing Company Name')

                            const { data: existing } = await supabase
                                .from('companies')
                                .select('id')
                                .eq('name', rowData.name)
                                .single()

                            if (existing) {
                                const { error: updateError } = await supabase
                                    .from('companies')
                                    .update({
                                        address: rowData.address,
                                        gst_number: rowData.gst_number
                                    })
                                    .eq('id', existing.id)
                                error = updateError
                            } else {
                                const { error: insertError } = await supabase
                                    .from('companies')
                                    .insert({
                                        name: rowData.name,
                                        address: rowData.address,
                                        gst_number: rowData.gst_number
                                    })
                                error = insertError
                            }
                        } else if (activeType === 'transport_companies') {
                            if (!rowData.name) throw new Error('Missing Transport Name')

                            const { data: existing } = await supabase
                                .from('transport_companies')
                                .select('id')
                                .eq('name', rowData.name)
                                .single()

                            if (existing) {
                                const { error: updateError } = await supabase
                                    .from('transport_companies')
                                    .update({
                                        address: rowData.address,
                                        phone: rowData.phone
                                    })
                                    .eq('id', existing.id)
                                error = updateError
                            } else {
                                const { error: insertError } = await supabase
                                    .from('transport_companies')
                                    .insert({
                                        name: rowData.name,
                                        address: rowData.address,
                                        phone: rowData.phone
                                    })
                                error = insertError
                            }
                        }

                        if (error) throw error
                        successCount++
                    } catch (err: any) {
                        console.error(`Row ${index + 1} error:`, err)
                        failedCount++
                        errors.push(`Row ${index + 1}: ${err.message}`)
                    }
                }
            }

            setUploadStats({
                total: previewData.length,
                success: successCount,
                failed: failedCount,
                errors
            })

            if (successCount > 0) {
                addToast(`Successfully imported ${successCount} records`, 'success')
            }
            if (failedCount > 0) {
                addToast(`Failed to import ${failedCount} records`, 'warning')
            }

        } catch (err: any) {
            console.error('Import failed:', err)
            addToast('Critical error during import', 'error')
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <Layout requireAdmin>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <TableCellsIcon className="h-8 w-8 text-primary-600" />
                        Data Import
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Bulk upload data using Excel files. Please download the template first to ensure correct formatting.
                    </p>
                </div>

                {/* Type Selection */}
                <div className="flex space-x-4 mb-8">
                    {IMPORT_TYPES.map((type) => (
                        <button
                            key={type.id}
                            onClick={() => {
                                setActiveType(type.id)
                                setFile(null)
                                setPreviewData([])
                                setUploadStats(null)
                            }}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeType === type.id
                                ? 'bg-primary-600 text-white shadow-md'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                                }`}
                        >
                            {type.label}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Upload Section */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                1. Download Template
                            </h2>
                            <button
                                onClick={downloadTemplate}
                                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border border-gray-300 dark:border-gray-600"
                            >
                                <DocumentArrowDownIcon className="h-5 w-5" />
                                <span>Download {activeType} Template</span>
                            </button>
                            <p className="mt-2 text-xs text-gray-500">
                                Contains columns: {IMPORT_TYPES.find(t => t.id === activeType)?.columns.join(', ')}
                            </p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                2. Upload File
                            </h2>
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                                <input
                                    type="file"
                                    accept=".xlsx, .xls, .csv"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="cursor-pointer flex flex-col items-center space-y-2"
                                >
                                    <CloudArrowUpIcon className="h-10 w-10 text-gray-400" />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {file ? file.name : 'Click to select Excel file'}
                                    </span>
                                </label>
                            </div>
                        </div>

                        {uploadStats && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`rounded-lg p-6 border ${uploadStats.failed === 0
                                    ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800'
                                    : 'bg-orange-50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-800'
                                    }`}
                            >
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Import Results</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Total Rows:</span>
                                        <span className="font-medium">{uploadStats.total}</span>
                                    </div>
                                    <div className="flex justify-between text-green-600 dark:text-green-400">
                                        <span>Successful:</span>
                                        <span className="font-bold">{uploadStats.success}</span>
                                    </div>
                                    <div className="flex justify-between text-red-600 dark:text-red-400">
                                        <span>Failed:</span>
                                        <span className="font-bold">{uploadStats.failed}</span>
                                    </div>
                                </div>
                                {uploadStats.errors.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <p className="font-medium text-red-600 mb-2 text-xs uppercase">Errors Log</p>
                                        <div className="max-h-40 overflow-y-auto text-xs text-red-600 space-y-1">
                                            {uploadStats.errors.map((err, i) => (
                                                <div key={i}>{err}</div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>

                    {/* Preview Section */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 flex flex-col h-full">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Data Preview {previewData.length > 0 && `(${previewData.length} rows)`}
                                </h2>
                                {previewData.length > 0 && !uploadStats && (
                                    <button
                                        onClick={processImport}
                                        disabled={isUploading}
                                        className="flex items-center space-x-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-lg"
                                    >
                                        {isUploading ? (
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <CheckCircleIcon className="h-5 w-5" />
                                        )}
                                        <span>{isUploading ? 'Importing...' : 'Start Import'}</span>
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 overflow-auto p-0">
                                {previewData.length > 0 ? (
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                                            <tr>
                                                {Object.keys(previewData[0]).map((header) => (
                                                    <th
                                                        key={header}
                                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap"
                                                    >
                                                        {header}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {previewData.slice(0, 50).map((row, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                    {Object.values(row).map((val: any, i) => (
                                                        <td
                                                            key={i}
                                                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300"
                                                        >
                                                            {val}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                                        <TableCellsIcon className="h-12 w-12 mb-2 opacity-50" />
                                        <p>No data loaded yet. Upload an Excel file to preview.</p>
                                    </div>
                                )}
                            </div>
                            {previewData.length > 50 && (
                                <div className="p-4 bg-gray-50 dark:bg-gray-700 text-center text-xs text-gray-500 dark:text-gray-400">
                                    Showing first 50 rows only
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}
