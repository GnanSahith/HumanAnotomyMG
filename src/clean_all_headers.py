import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    modified = False
    while True:
        match = re.search(r'<div[^>]*style={{[^}]*(?:top:\s*[\'"]20px[\'"]|height:\s*[\'"]80px[\'"])[^>]*>.*?(?:onBack|← Back).*?', content, re.DOTALL)
        
        if not match:
            match = re.search(r'<div[^>]*style={{[^}]*display:\s*[\'"]flex[\'"][^}]*}}>\s*(?:{onBack|<button onClick={onBack}|{onBack && <button).*?', content, re.DOTALL)
            
        if not match:
            break
            
        start_idx = match.start()
        
        open_divs = 0
        end_idx = -1
        
        i = start_idx
        while i < len(content):
            if content.startswith('<div', i):
                tag_end = content.find('>', i)
                if tag_end != -1 and content[tag_end-1] == '/':
                    i = tag_end + 1
                    continue
                else:
                    open_divs += 1
                    i += 4
                    continue
            elif content.startswith('</div', i):
                open_divs -= 1
                if open_divs == 0:
                    end_idx = content.find('>', i) + 1
                    break
                i += 5
                continue
            i += 1
            
        if end_idx == -1:
            print(f"Failed to find closing div in {filepath} (loop)")
            break
            
        block = content[start_idx:end_idx]
        if "onBack" not in block and "← Back" not in block:
             print(f"Block doesn't contain onBack in {filepath} (loop)")
             break
             
        content = content[:start_idx] + content[end_idx:]
        modified = True

    if modified:
        # Some cleanups
        content = content.replace("top: '90px'", "top: '20px'")
        content = content.replace('top: "90px"', 'top: "20px"')
        content = re.sub(r'{\s*/\*\s*(Top Header Bar|Header|Title Bar).*?\*/\s*}\s*\n?', '', content, flags=re.IGNORECASE)
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Cleaned {filepath}")

sim_dir = "/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/simulations"
for root, dirs, files in os.walk(sim_dir):
    for file in files:
        if file.endswith(".jsx"):
            process_file(os.path.join(root, file))

