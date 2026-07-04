import os
import re

sim_dir = "/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/simulations"

files_modified = 0

for root, dirs, files in os.walk(sim_dir):
    for file in files:
        if not file.endswith(".jsx"):
            continue
            
        filepath = os.path.join(root, file)
        with open(filepath, 'r') as f:
            content = f.read()
            
        original_content = content
        
        # 1. Match the initial state value
        match = re.search(r'const\s+\[\s*isPlaying\s*,\s*setIsPlaying\s*\]\s*=\s*useState\((.*?)\);', content)
        if not match:
            # Maybe it uses `playing, setPlaying`? We only care about `isPlaying` for now
            continue
            
        initial_value = match.group(1)
        
        # Replace the useState line with our bridge
        bridge_code = f"""const [localIsPlaying, setLocalIsPlaying] = useState({initial_value});
  const isPlaying = typeof globalIsPlaying !== 'undefined' ? globalIsPlaying : localIsPlaying;
  const setIsPlaying = typeof syncPlayState === 'function' ? syncPlayState : setLocalIsPlaying;"""
  
        content = content.replace(match.group(0), bridge_code)
        
        # 2. Inject props into the component signature
        # We look for a line containing `title` inside the props destructuring.
        # This is a bit fragile but usually works since they all have `title`.
        # Easiest way: look for `title` followed by `})` or `} )` or `} ` or `,`
        # Actually, let's just replace `title` with `title, isPlaying: globalIsPlaying, syncPlayState` 
        # ONLY in the function signature.
        
        # Let's find the first occurrence of `function ` or `const ` that defines the component
        # and replace `title` inside its args.
        
        # Better: use regex to match `function Name({ ... title ... })`
        # Let's just do a naive replace of `title` with `title, isPlaying: globalIsPlaying, syncPlayState`
        # but only for the first occurrence of `title\n` or `title }` or `title,` in the file.
        # It's safer to just look for `{ onBack, title }` or similar.
        
        content = re.sub(r'title(\s*\}?\))', r'title, isPlaying: globalIsPlaying, syncPlayState\1', content, count=1)
        content = re.sub(r'title(\s*,)', r'title, isPlaying: globalIsPlaying, syncPlayState\1', content, count=1)
        
        if content != original_content:
            with open(filepath, 'w') as f:
                f.write(content)
            files_modified += 1
            print(f"Injected state bridge into {file}")

print(f"Modified {files_modified} files.")
