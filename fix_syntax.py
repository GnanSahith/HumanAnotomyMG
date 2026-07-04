import os

sim_dir = 'src/components/simulations'

def fix_syntax():
    count = 0
    for filename in os.listdir(sim_dir):
        if not filename.endswith('.jsx'): continue
        filepath = os.path.join(sim_dir, filename)
        
        with open(filepath, 'r') as f:
            content = f.read()
            
        original_content = content
        
        content = content.replace(
            "if (lastTimeRef && lastTimeRef.current !== undefined) lastTimeRef.current = ;",
            "if (lastTimeRef && lastTimeRef.current !== undefined) lastTimeRef.current = performance.now();"
        )
        
        if content != original_content:
            with open(filepath, 'w') as f:
                f.write(content)
            print(f"Fixed syntax in {filename}")
            count += 1
            
    print(f"Fixed {count} files.")

if __name__ == '__main__':
    fix_syntax()
