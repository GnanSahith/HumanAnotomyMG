import re

files_to_fix = [
    "/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/simulations/CustomProjectileMotion.jsx",
    "/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/simulations/CustomFriction.jsx",
    "/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/simulations/CustomStatesOfMatter.jsx",
    "/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/simulations/CustomStatesOfMatterBasics.jsx",
    "/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/simulations/CustomCollisionLab.jsx"
]

for filepath in files_to_fix:
    with open(filepath, 'r') as f:
        content = f.read()
    
    # We will replace the specific lines that have duplicate borders.
    # The esbuild error shows:
    # background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)',
    # followed by another border:.
    # We can just remove the border: '1px solid rgba(255,255,255,0.1)', from that specific line.
    
    content = content.replace(
        "background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)',",
        "background: 'rgba(20, 20, 30, 0.8)', backdropFilter: 'blur(12px)',"
    )
    
    # CustomStatesOfMatter has:
    # background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)',
    # wait, in CustomStatesOfMatter it was:
    # background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)',
    # border: '1px solid rgba(255,255,255,0.15)',
    
    with open(filepath, 'w') as f:
        f.write(content)

