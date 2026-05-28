#!/bin/bash

echo "Fixing duplicate exports in all .tsx files..."

# Process all .tsx files
find src -name "*.tsx" -type f | while read file; do
  echo "Checking $file..."
  
  # Count export default lines
  count=$(grep -c "export default" "$file")
  
  if [ "$count" -gt 1 ]; then
    echo "  Found $count export default lines in $file"
    
    # Create backup
    cp "$file" "$file.backup.$(date +%s)"
    
    # Use awk to keep only the last export default (most likely the correct one)
    awk '
      BEGIN { found = 0 }
      /export default/ {
        if (found) {
          # Skip this duplicate line
          next
        }
        found = 1
      }
      { print }
    ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
    
    echo "  Fixed $file"
  fi
done

echo "Done fixing duplicate exports!"
