import os
import re

sim_dir = "/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/simulations"

def find_closing_div(content, start_index):
    open_count = 0
    i = start_index
    while i < len(content):
        # Match opening div
        if content[i:].startswith('<div'):
            open_count += 1
            # Skip past this tag so we don't double count
            i += 4
            continue
        # Match closing div
        elif content[i:].startswith('</div'):
            open_count -= 1
            if open_count == 0:
                # Find the end of this closing tag
                end_tag = content.find('>', i)
                if end_tag != -1:
                    return end_tag + 1
            i += 5
            continue
        i += 1
    return -1

files_modified = 0

for root, dirs, files in os.walk(sim_dir):
    for file in files:
        if not file.endswith(".jsx"):
            continue
            
        filepath = os.path.join(root, file)
        with open(filepath, 'r') as f:
            content = f.read()
            
        original_content = content
        
        # We look for a <div that has height: '80px' or top: '20px'
        header_pattern = re.compile(r'<div[^>]*style=\{\{[^\}]*(?:height:\s*[\'"]80px[\'"]|top:\s*[\'"]20px[\'"])[^\}]*\}\}[^>]*>')
        
        # Find all matches
        matches = list(header_pattern.finditer(content))
        
        if not matches:
            continue
            
        offset = 0
        for match in matches:
            start = match.start() - offset
            
            # Find the closing tag
            end = find_closing_div(content, start)
            
            if end != -1:
                block = content[start:end]
                # Only remove it if it contains '{title' or 'Reset' or 'Play'
                if "{title" in block or "Reset" in block or "Play" in block or "title ||" in block:
                    # Remove it
                    content = content[:start] + content[end:]
                    offset += (end - start)
                    print(f"Removed duplicate header in {file}")
                
        if content != original_content:
            with open(filepath, 'w') as f:
                f.write(content)
            files_modified += 1

print(f"Modified {files_modified} files.")

