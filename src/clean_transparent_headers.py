import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Find the transparent header comment
    match = re.search(r'{\s*/\*\s*1\.\s*Transparent Header.*?NO BACK BUTTONS.*?NO TITLES.*?\*/\s*}', content, re.DOTALL | re.IGNORECASE)
    
    if not match:
        print(f"Skipping {filepath} (no transparent header found)")
        return
        
    start_idx = match.start()
    
    # We want to remove from start_idx. Let's find the first <div after this comment.
    div_start_match = re.search(r'<div', content[start_idx:])
    if not div_start_match:
        print(f"Failed to find div after comment in {filepath}")
        return
        
    div_start_idx = start_idx + div_start_match.start()
    
    open_divs = 0
    end_idx = -1
    
    i = div_start_idx
    while i < len(content):
        if content.startswith('<div', i):
            tag_end = content.find('>', i)
            if content[tag_end-1] == '/':
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
        
    # Also optionally remove any trailing comments right after the main comment
    # But it's safer to just delete the block from start_idx to end_idx
    # Let's verify that this block contains 'Reset' or 'Play' to ensure we are deleting the right thing
    block = content[start_idx:end_idx]
    if "Reset" not in block and "Play" not in block and "setIsPlaying" not in block:
        print(f"Block doesn't look like controls in {filepath}")
        return
        
    new_content = content[:start_idx] + content[end_idx:]
    
    # We should also remove the "Move Play/Pause and Reset buttons here..." comment if it is outside start_idx
    new_content = re.sub(r'{\s*/\*\s*Move Play/Pause and Reset buttons here.*?\*/\s*}\s*\n?', '', new_content, flags=re.IGNORECASE)
    
    with open(filepath, 'w') as f:
        f.write(new_content)
    
    print(f"Cleaned {filepath}")

sim_dir = "/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/simulations"
for root, dirs, files in os.walk(sim_dir):
    for file in files:
        if file.endswith(".jsx"):
            filepath = os.path.join(root, file)
            # Only process files that have "NO BACK BUTTONS"
            with open(filepath, 'r') as f:
                if "NO BACK BUTTONS" in f.read():
                    process_file(filepath)

