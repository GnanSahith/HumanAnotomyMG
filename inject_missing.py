import os
import re

sim_dir = 'src/components/simulations'

def inject():
    count = 0
    for filename in os.listdir(sim_dir):
        if not filename.endswith('.jsx'): continue
        filepath = os.path.join(sim_dir, filename)
        
        with open(filepath, 'r') as f:
            content = f.read()
            
        original_content = content
        
        # Check if it already has globalIsPlaying
        if 'globalIsPlaying' in content:
            continue
            
        # Needs injection
        # Use re.DOTALL to match multi-line function signature
        content = re.sub(
            r'export default function (\w+)\(\{\s*(.*?)\s*\}\)\s*\{',
            r"export default function \1({\n  \2, isPlaying: globalIsPlaying, syncPlayState\n}) {\n  const [localIsPlaying, setLocalIsPlaying] = useState(false);\n  const isPlaying = typeof globalIsPlaying !== 'undefined' ? globalIsPlaying : localIsPlaying;\n  const setIsPlaying = typeof syncPlayState === 'function' ? syncPlayState : setLocalIsPlaying;",
            content,
            count=1,
            flags=re.DOTALL
        )
        
        if content != original_content:
            with open(filepath, 'w') as f:
                f.write(content)
            print(f"Injected into {filename}")
            count += 1
            
    print(f"Injected into {count} files.")

if __name__ == '__main__':
    inject()
