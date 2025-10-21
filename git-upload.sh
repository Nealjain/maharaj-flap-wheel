#!/bin/bash

# Git upload script - commits and pushes without merge

echo "🚀 Starting git upload..."

# Add all changes
echo "📦 Adding all changes..."
git add .

# Show status
echo "📊 Current status:"
git status

# Commit with message
echo "💾 Creating commit..."
git commit -m "feat: Add item-wise due dates and remove price fields

- Added due_date column to order_items table
- Item-wise due dates in create/edit/view orders
- Color-coded due date badges (overdue, due soon, normal)
- Removed price fields from order forms
- Stock validation with visual warnings
- Allow orders even with insufficient stock
- Fixed available stock calculation in edit mode
- Auto-refresh order data after updates"

# Push to remote
echo "⬆️  Pushing to remote..."
git push origin HEAD

echo "✅ Upload complete!"
