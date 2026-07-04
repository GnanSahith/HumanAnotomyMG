import os
import re

sim_dir = 'src/components/simulations'

def patch_all():
    count = 0
    for filename in os.listdir(sim_dir):
        if not filename.endswith('.jsx'): continue
        filepath = os.path.join(sim_dir, filename)
        
        with open(filepath, 'r') as f:
            content = f.read()
            
        original_content = content
        
        # 1. Inject isPlayingRef if not present, but only if the file HAS requestAnimationFrame
        if 'requestAnimationFrame' not in content:
            continue
            
        if 'const isPlayingRef = useRef(isPlaying);' not in content:
            # We must find where to inject it. Right after `const setIsPlaying = ...` is best.
            if 'const setIsPlaying =' in content:
                content = re.sub(
                    r'(const setIsPlaying = [^\n]+;)',
                    r'\1\n  const isPlayingRef = useRef(isPlaying);\n  useEffect(() => {\n    isPlayingRef.current = isPlaying;\n  }, [isPlaying]);',
                    content
                )
            else:
                print(f"Skipping {filename}: No setIsPlaying found.")
                continue

        # 2. Find all unique RAF callback names
        raf_matches = re.findall(r'requestAnimationFrame\(([a-zA-Z0-9_]+)\)', content)
        unique_names = set(raf_matches)
        
        for name in unique_names:
            # Look for the definition of `name`
            # Pattern 1: const name = (args) => {
            # Pattern 2: function name(args) {
            # Pattern 3: let name = (args) => {
            
            # We want to inject right after the opening brace.
            # Wait, `name` might be `updatePhysics`, `animate`, etc.
            
            # We will use a regex that finds the declaration and opening brace
            decl_pattern = r'(?:const|let|var)\s+' + name + r'\s*=\s*(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>\s*\{|function\s+' + name + r'\s*\([^)]*\)\s*\{'
            
            def inject_pause(match):
                match_text = match.group(0)
                # Ensure we haven't already injected here
                # We can't check easily without context, but we can check if the file already has 'if (!isPlayingRef.current)'
                
                injection = f"\n    if (!isPlayingRef.current) {{\n      requestAnimationFrame({name});\n      return;\n    }}"
                return match_text + injection
            
            if 'if (!isPlayingRef.current)' not in content:
                content = re.sub(decl_pattern, inject_pause, content)
            
        if content != original_content:
            with open(filepath, 'w') as f:
                f.write(content)
            print(f"Patched RAF in {filename}")
            count += 1
            
    print(f"Patched {count} files.")

if __name__ == '__main__':
    patch_all()
