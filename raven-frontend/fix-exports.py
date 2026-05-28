import os
import re
import sys

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find all export default statements
    exports = list(re.finditer(r'export default \w+;', content))
    
    if len(exports) > 1:
        print(f"Fixing {filepath}: Found {len(exports)} export default statements")
        
        # Keep only the first one
        first_export = exports[0]
        last_export = exports[-1]
        
        # Remove all but the first
        new_content = content[:first_export.end()]
        
        # Add everything after the last export
        new_content += content[last_export.end():]
        
        # Write back
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        return True
    return False

def main():
    fixed_count = 0
    
    for root, dirs, files in os.walk('src'):
        for file in files:
            if file.endswith('.tsx'):
                filepath = os.path.join(root, file)
                if fix_file(filepath):
                    fixed_count += 1
    
    print(f"Fixed {fixed_count} files")
    
    # Also check for unclosed form tags in RegisterPage
    register_path = 'src/pages/auth/RegisterPage.tsx'
    if os.path.exists(register_path):
        with open(register_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        form_open = content.count('<form')
        form_close = content.count('</form')
        
        if form_open != form_close:
            print(f"Warning: {register_path} has {form_open} <form> tags but {form_close} </form> tags")
            # Try to fix by adding missing closing tag
            lines = content.split('\n')
            in_form = 0
            for i, line in enumerate(lines):
                if '<form' in line and '</form' not in line:
                    in_form += 1
                if '</form' in line:
                    in_form -= 1
                # If we reach end of component and still in form
                if '}' in line and in_form > 0:
                    # Add closing form tag before this line
                    lines.insert(i, '          </form>')
                    break
            
            with open(register_path, 'w', encoding='utf-8') as f:
                f.write('\n'.join(lines))
            print("Added missing </form> tag")

if __name__ == '__main__':
    main()
