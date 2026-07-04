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
        
        # Replace the duplicate injection
        content = content.replace(
            "title, isPlaying: globalIsPlaying, syncPlayState, isPlaying: globalIsPlaying, syncPlayState",
            "title, isPlaying: globalIsPlaying, syncPlayState"
        )
        
        if content != original_content:
            with open(filepath, 'w') as f:
                f.write(content)
            files_modified += 1

print(f"Fixed {files_modified} files.")
