import { supabase } from './supabase'

export async function adjustStock(
  itemId: string,
  adjustmentType: 'add' | 'remove' | 'set',
  quantity: number,
  currentStock: number,
  notes: string,
  userId: string | undefined
) {
  try {
    // Calculate new stock
    let newStock = currentStock
    let changeAmount = 0
    let transactionType = 'adjustment'

    if (adjustmentType === 'add') {
      newStock = currentStock + quantity
      changeAmount = quantity
      transactionType = 'addition'
    } else if (adjustmentType === 'remove') {
      newStock = Math.max(0, currentStock - quantity)
      changeAmount = -(quantity)
      transactionType = 'removal'
    } else {
      newStock = quantity
      changeAmount = quantity - currentStock
      transactionType = 'adjustment'
    }

    // Update item stock
    const { error: updateError } = await supabase
      .from('items')
      .update({ physical_stock: newStock })
      .eq('id', itemId)

    if (updateError) throw updateError

    // Log to stock ledger
    const { error: ledgerError } = await supabase
      .from('stock_ledger')
      .insert([{
        item_id: itemId,
        transaction_type: transactionType,
        quantity: changeAmount,
        balance_after: newStock,
        reference_type: 'manual_adjustment',
        notes: notes || null,
        created_by: userId || null
      }])

    if (ledgerError) {
      console.error('Error logging to stock ledger:', ledgerError)
      // Don't throw - stock was updated successfully
    }

    return { success: true, newStock }
  } catch (error) {
    console.error('Error adjusting stock:', error)
    return { success: false, error }
  }
}
