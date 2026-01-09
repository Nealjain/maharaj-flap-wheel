#!/bin/bash

# Script to remove console.log statements but keep console.error and console.warn

echo "🧹 Cleaning up console.log statements..."

# Find and remove console.log (but not console.error or console.warn)
find app -name "*.tsx" -o -name "*.ts" | while read file; do
  # Count console.log before
  before=$(grep -c "console\.log" "$file" 2>/dev/null || echo "0")
  
  if [ "$before" -gt 0 ]; then
    echo "📝 Cleaning $file ($before logs found)"
    
    # Remove console.log lines (but keep console.error and console.warn)
    sed -i.bak '/console\.log/d' "$file"
    
    # Remove backup file
    rm "${file}.bak"
  fi
done

echo "✅ Cleanup complete!"
echo ""
echo "Note: console.error() and console.warn() statements were preserved for debugging."
