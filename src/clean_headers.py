import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Find the header div. It's usually the first div that contains onBack and has a style block.
    # Look for common header start patterns:
    # Pattern 1: <div style={{... top: '20px', left: '20px', right: '20px' ...}}>
    # Pattern 2: <div style={{ height: '80px' ...}}>
    
    # Let's find the position of "onBack" inside a button.
    # The header is almost always the FIRST absolute div or flex div with onBack.
    
    match = re.search(r'<div[^>]*style={{[^}]*(?:top:\s*[\'"]20px[\'"]|height:\s*[\'"]80px[\'"])[^>]*>.*?(?:onBack).*?', content, re.DOTALL)
    
    if not match:
        # Sometimes the header is not at top: 20px but maybe has flex and onBack
        match = re.search(r'<div[^>]*style={{[^}]*display:\s*[\'"]flex[\'"][^}]*}}>\s*(?:{onBack|<button onClick={onBack})', content, re.DOTALL)
        
    if not match:
        print(f"Skipping {filepath} (no header found)")
        return
        
    start_idx = match.start()
    
    # We need to find the matching closing div for this opening div
    open_divs = 0
    end_idx = -1
    
    # A simple tag counter for the matched div
    i = start_idx
    while i < len(content):
        if content.startswith('<div', i) or content.startswith('<nav', i) or content.startswith('<header', i):
            open_divs += 1
            i += 4
            continue
        elif content.startswith('</div', i) or content.startswith('</nav', i) or content.startswith('</header', i):
            open_divs -= 1
            if open_divs == 0:
                # Find the end of this tag
                end_idx = content.find('>', i) + 1
                break
            i += 5
            continue
        i += 1
        
    if end_idx == -1:
        print(f"Failed to find closing div in {filepath}")
        return
        
    # Check if the found block actually contains onBack
    block = content[start_idx:end_idx]
    if "onBack" not in block:
         print(f"Block doesn't contain onBack in {filepath}")
         return
         
    # Remove the block
    new_content = content[:start_idx] + content[end_idx:]
    
    # Now replace top: '90px' with top: '20px'
    new_content = new_content.replace("top: '90px'", "top: '20px'")
    new_content = new_content.replace('top: "90px"', 'top: "20px"')
    
    # Now remove any trailing comments before the div that got removed
    new_content = re.sub(r'{\s*/\*\s*(Top Header Bar|Header|Title Bar).*?\*/\s*}\s*\n?', '', new_content, flags=re.IGNORECASE)
    
    # Also clean up unused lucide-react imports like ArrowLeft, Atom, RotateCcw
    # But only if they aren't used elsewhere in the file.
    # We'll just leave them for now or do a simple replace.
    
    with open(filepath, 'w') as f:
        f.write(new_content)
    
    print(f"Cleaned {filepath}")

sim_dir = "/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/simulations"
for root, dirs, files in os.walk(sim_dir):
    for file in files:
        if file.endswith(".jsx"):
            filepath = os.path.join(root, file)
            # Only process files that have onBack in them
            with open(filepath, 'r') as f:
                if "onBack" in f.read():
                    process_file(filepath)

