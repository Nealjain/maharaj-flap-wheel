#!/bin/bash

# Create .env.local file with Supabase credentials
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=https://fefudfesrzwigzinhpoe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlZnVkZmVzcnp3aWd6aW5ocG9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NjkwMTcsImV4cCI6MjA3NTA0NTAxN30.lCIKsSJJt6iyoWoXDaff69hsISBrHdwb1dp5Xr2Rt3Q
EOF

echo "Environment file created successfully!"
echo "You can now run: npm run dev"
