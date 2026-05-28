#!/bin/bash
echo "Restoring original project files..."

# Restore from backups where available
for file in src/**/*.tsx src/**/*.ts; do
  if [ -f "$file.backup" ]; then
    echo "Restoring $file from .backup"
    cp "$file.backup" "$file"
  fi
  if [ -f "$file.backup2" ]; then
    echo "Restoring $file from .backup2"
    cp "$file.backup2" "$file"
  fi
  if [ -f "$file.backup3" ]; then
    echo "Restoring $file from .backup3"
    cp "$file.backup3" "$file"
  fi
done

# Fix exports for all page files
echo "Fixing exports..."
for file in src/pages/**/*.tsx; do
  if [ -f "$file" ]; then
    # Remove duplicate export default lines
    grep -v "export default" "$file" > "$file.tmp" 2>/dev/null || cat "$file" > "$file.tmp"
    
    # Get component name
    component_name=$(basename "$file" .tsx)
    
    # Add single export
    echo "" >> "$file.tmp"
    echo "export default $component_name;" >> "$file.tmp"
    
    mv "$file.tmp" "$file"
    echo "  Fixed $component_name"
  fi
done

echo "Restoration complete!"
