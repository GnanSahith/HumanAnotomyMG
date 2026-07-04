import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    match = re.search(r'<div[^>]*style={{[^}]*(?:top:\s*[\'"]20px[\'"]|height:\s*[\'"]80px[\'"])[^>]*>.*?(?:onBack).*?', content, re.DOTALL)
    
    if not match:
        match = re.search(r'<div[^>]*style={{[^}]*display:\s*[\'"]flex[\'"][^}]*}}>\s*(?:{onBack|<button onClick={onBack})', content, re.DOTALL)
        
    if not match:
        print(f"Skipping {filepath} (no header found)")
        return
        
    start_idx = match.start()
    
    open_divs = 0
    end_idx = -1
    
    i = start_idx
    while i < len(content):
        # Check for self-closing div like <div />
        if content.startswith('<div', i):
            tag_end = content.find('>', i)
            if content[tag_end-1] == '/':
                # Self closing div
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
        print(f"Failed to find closing div in {filepath}")
        return
        
    block = content[start_idx:end_idx]
    if "onBack" not in block:
         print(f"Block doesn't contain onBack in {filepath}")
         return
         
    new_content = content[:start_idx] + content[end_idx:]
    
    new_content = new_content.replace("top: '90px'", "top: '20px'")
    new_content = new_content.replace('top: "90px"', 'top: "20px"')
    
    new_content = re.sub(r'{\s*/\*\s*(Top Header Bar|Header|Title Bar).*?\*/\s*}\s*\n?', '', new_content, flags=re.IGNORECASE)
    
    with open(filepath, 'w') as f:
        f.write(new_content)
    
    print(f"Cleaned {filepath}")

failed_files = [
    "/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/simulations/CustomNeonLights.jsx",
    "/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/simulations/CustomFaradaysLaw.jsx",
    "/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/simulations/CustomNormalModes.jsx",
    "/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/simulations/CustomStatesOfMatter.jsx",
    "/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/simulations/CustomMicrowaves.jsx",
    "/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/simulations/CustomStatesOfMatterBasics.jsx"
]

for filepath in failed_files:
    if os.path.exists(filepath):
        process_file(filepath)

