import os
import re

sim_dir = 'src/components/simulations'

def patch_files():
    count = 0
    for filename in os.listdir(sim_dir):
        if not filename.endswith('.jsx'): continue
        filepath = os.path.join(sim_dir, filename)
        
        with open(filepath, 'r') as f:
            content = f.read()
            
        if 'const updatePhysics =' not in content:
            continue
            
        original_content = content
        
        # 1. Inject isPlayingRef after setIsPlaying
        if 'const isPlayingRef = useRef(isPlaying);' not in content:
            content = re.sub(
                r'(const setIsPlaying = [^\n]+;)',
                r'\1\n  const isPlayingRef = useRef(isPlaying);\n  useEffect(() => {\n    isPlayingRef.current = isPlaying;\n  }, [isPlaying]);',
                content
            )
            
        # 2. Inject early return in updatePhysics
        # We need to find `const updatePhysics = (time) => {` or similar
        # and insert the check.
        if 'if (!isPlayingRef.current) {' not in content:
            content = re.sub(
                r'(const updatePhysics = \((.*?)\) => \{)',
                r'\1\n    if (!isPlayingRef.current) {\n      if (lastTimeRef && lastTimeRef.current !== undefined) lastTimeRef.current = \2;\n      requestRef.current = requestAnimationFrame(updatePhysics);\n      return;\n    }',
                content
            )
            
        if content != original_content:
            with open(filepath, 'w') as f:
                f.write(content)
            print(f"Patched {filename}")
            count += 1
            
    print(f"Patched {count} files.")

if __name__ == '__main__':
    patch_files()
