import json
import urllib.parse
import re

json_path = 'src/data/mathSimulations.json'

with open(json_path, 'r') as f:
    sims = json.load(f)

count = 0
for sim_id, sim in sims.items():
    if count >= 30:
        break
        
    title = sim.get('title', '')
    clean_title = re.sub(r'(Practice|Exploration)?GR\.\s*(4-5|6-8|9-12)GRADES\s*(4-5|6-8|9-12)', '', title, flags=re.IGNORECASE).strip()
    
    prompt = f"A professional educational illustration for mathematics topic: {clean_title}. Vector art style, flat colors, clean design, highly educational, no text."
    encoded_prompt = urllib.parse.quote(prompt)
    
    # We use a seed based on the index to ensure it generates exactly the same image every time
    url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=800&height=450&nologo=true&seed={count*99}"
    
    sim['thumbnail'] = url
    count += 1

with open(json_path, 'w') as f:
    json.dump(sims, f, indent=2)

print("Injected Pollinations AI URLs into JSON successfully.")
