import os
import re

def find_closing_div(content, start_idx):
    # Safely find the closing </div> matching the opening <div at start_idx
    open_divs = 0
    i = start_idx
    while i < len(content):
        if content.startswith('<div', i):
            # check for self-closing <div />
            tag_end = content.find('>', i)
            if tag_end != -1 and content[tag_end-1] == '/':
                i = tag_end + 1
            else:
                open_divs += 1
                i += 4
        elif content.startswith('</div', i):
            open_divs -= 1
            if open_divs == 0:
                return content.find('>', i) + 1
            i += 5
        else:
            i += 1
    return -1

def clean_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    original_content = content
    modified = False

    # 1. Clean onBack headers
    # Look for a div that contains a button with onBack or text '← Back' / 'Back to Library'
    # It must be within a reasonable distance from the start of the div to avoid matching the whole file.
    # We will find all <div tags, and for each, check if it's a top-level header candidate.
    
    # regex for header div start
    header_starts = list(re.finditer(r'<div[^>]*style={{[^}]*(?:top:\s*[\'"]20px[\'"]|height:\s*[\'"]80px[\'"]|display:\s*[\'"]flex[\'"])[^}]*}}[^>]*>', content))
    
    for match in reversed(header_starts):
        start_idx = match.start()
        end_idx = find_closing_div(content, start_idx)
        if end_idx != -1:
            block = content[start_idx:end_idx]
            # Must contain back button stuff OR title stuff but NOT inner component calls
            if ("<button onClick={onBack}" in block or "← Back" in block or "Back to Library" in block) and "<Custom" not in block:
                content = content[:start_idx] + content[end_idx:]
                modified = True

    # 2. Clean Transparent Headers
    t_match = re.search(r'{\s*/\*\s*1\.\s*Transparent Header.*?NO BACK BUTTONS.*?NO TITLES.*?\*/\s*}', content, re.DOTALL | re.IGNORECASE)
    if t_match:
        start_idx = t_match.start()
        div_start_match = re.search(r'<div', content[start_idx:])
        if div_start_match:
            div_start_idx = start_idx + div_start_match.start()
            end_idx = find_closing_div(content, div_start_idx)
            if end_idx != -1:
                content = content[:start_idx] + content[end_idx:]
                modified = True

    # 3. Clean any other trailing transparent header comments
    content = re.sub(r'{\s*/\*\s*(Top Header Bar|Header|Title Bar|Move Play/Pause and Reset buttons here).*?\*/\s*}\s*\n?', '', content, flags=re.IGNORECASE)

    # 4. Replace top: '90px' with top: '20px'
    content = content.replace("top: '90px'", "top: '20px'")
    content = content.replace('top: "90px"', 'top: "20px"')

    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Cleaned {filepath}")

sim_dir = "/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/simulations"
for root, dirs, files in os.walk(sim_dir):
    for file in files:
        if file.endswith(".jsx"):
            clean_file(os.path.join(root, file))

