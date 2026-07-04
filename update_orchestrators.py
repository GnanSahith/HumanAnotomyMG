import os

files_to_update = [
    "/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/PhysicsSimulationView.jsx",
    "/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/ChemistrySimulationView.jsx",
    "/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/MathsSimulationView.jsx"
]

for filepath in files_to_update:
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            content = f.read()
        
        # We only want to add syncPlayState={setIsPlaying} to the <Custom... /> components, not <SimulationHeader />.
        # But wait, SimulationHeader might also get it if we blindly replace.
        # Let's replace: isPlaying={isPlaying} onTogglePlay={handleTogglePlay}
        # with: isPlaying={isPlaying} onTogglePlay={handleTogglePlay} syncPlayState={setIsPlaying}
        
        # But let's make sure we don't duplicate it.
        new_content = content.replace(
            "isPlaying={isPlaying} onTogglePlay={handleTogglePlay} />",
            "isPlaying={isPlaying} onTogglePlay={handleTogglePlay} syncPlayState={setIsPlaying} />"
        )
        
        if new_content != content:
            with open(filepath, 'w') as f:
                f.write(new_content)
            print(f"Updated {os.path.basename(filepath)}")

