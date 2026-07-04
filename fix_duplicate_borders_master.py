import re
import os

sim_dir = "/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/simulations"

# The esbuild duplicate key warnings usually come from a specific duplicate snippet:
# background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)',
# followed by another border: on the next line.
# We will just remove the inline border declaration in the same line as the background.

for root, dirs, files in os.walk(sim_dir):
    for file in files:
        if file.endswith(".jsx"):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
            
            # Simple replacement
            new_content = content.replace(
                "background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)',",
                "background: 'rgba(20, 20, 30, 0.8)', backdropFilter: 'blur(12px)',"
            )
            
            if new_content != content:
                with open(filepath, 'w') as f:
                    f.write(new_content)
                print(f"Fixed borders in {file}")

