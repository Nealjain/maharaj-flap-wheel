const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fefudfesrzwigzinhpoe.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlZnVkZmVzcnp3aWd6aW5ocG9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NjkwMTcsImV4cCI6MjA3NTA0NTAxN30.lCIKsSJJt6iyoWoXDaff69hsISBrHdwb1dp5Xr2Rt3Q'

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedData() {
  try {
    console.log('🌱 Seeding sample data...')

    // Create sample companies
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .insert([
        {
          name: 'ABC Manufacturing Ltd',
          address: '123 Industrial Area, Mumbai',
          gst_number: '27ABCDE1234F1Z5'
        },
        {
          name: 'XYZ Industries',
          address: '456 Business Park, Delhi',
          gst_number: '07FGHIJ5678K1L2'
        },
        {
          name: 'PQR Enterprises',
          address: '789 Commercial Zone, Bangalore',
          gst_number: '29MNOPQ9012R3S4'
        }
      ])
      .select()

    if (companiesError) {
      console.error('Error creating companies:', companiesError)
    } else {
      console.log('✅ Created companies:', companies.length)
    }

    // Create sample transport companies
    const { data: transportCompanies, error: transportError } = await supabase
      .from('transport_companies')
      .insert([
        {
          name: 'Fast Logistics',
          address: '100 Transport Hub, Mumbai',
          phone: '+91-9876543210'
        },
        {
          name: 'Quick Delivery',
          address: '200 Logistics Center, Delhi',
          phone: '+91-9876543211'
        }
      ])
      .select()

    if (transportError) {
      console.error('Error creating transport companies:', transportError)
    } else {
      console.log('✅ Created transport companies:', transportCompanies.length)
    }

    // Create sample items
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .insert([
        {
          sku: 'FW001',
          name: 'Flap Wheel 4 inch',
          description: '4 inch flap wheel for metal finishing',
          unit: 'pcs',
          physical_stock: 100,
          reserved_stock: 0
        },
        {
          sku: 'FW002',
          name: 'Flap Wheel 6 inch',
          description: '6 inch flap wheel for heavy duty work',
          unit: 'pcs',
          physical_stock: 50,
          reserved_stock: 0
        },
        {
          sku: 'FW003',
          name: 'Flap Wheel 8 inch',
          description: '8 inch flap wheel for large surfaces',
          unit: 'pcs',
          physical_stock: 25,
          reserved_stock: 0
        },
        {
          sku: 'AB001',
          name: 'Abrasive Belt 2x72',
          description: '2x72 inch abrasive belt',
          unit: 'pcs',
          physical_stock: 200,
          reserved_stock: 0
        },
        {
          sku: 'AB002',
          name: 'Abrasive Belt 3x78',
          description: '3x78 inch abrasive belt',
          unit: 'pcs',
          physical_stock: 150,
          reserved_stock: 0
        }
      ])
      .select()

    if (itemsError) {
      console.error('Error creating items:', itemsError)
    } else {
      console.log('✅ Created items:', items.length)
    }

    console.log('🎉 Sample data seeding completed!')
    console.log('You can now test order creation with this data.')

  } catch (error) {
    console.error('Error seeding data:', error)
  }
}

seedData()
