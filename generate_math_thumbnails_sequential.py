import os
import json
import urllib.request
import urllib.parse
import re
import time

json_path = 'src/data/mathSimulations.json'
thumb_dir = 'public/thumbnails/math'
os.makedirs(thumb_dir, exist_ok=True)

with open(json_path, 'r') as f:
    sims = json.load(f)

count = 0
for sim_id, sim in sims.items():
    if count >= 30:
        break
        
    title = sim.get('title', '')
    clean_title = re.sub(r'(Practice|Exploration)?GR\.\s*(4-5|6-8|9-12)GRADES\s*(4-5|6-8|9-12)', '', title, flags=re.IGNORECASE).strip()
    
    thumb_filename = f"{sim_id}.png"
    thumb_path = os.path.join(thumb_dir, thumb_filename)
    
    if not os.path.exists(thumb_path):
        prompt = f"A professional educational illustration for mathematics topic: {clean_title}. Vector art style, flat colors, clean design, highly educational, no text."
        encoded_prompt = urllib.parse.quote(prompt)
        # Add a random seed to avoid caching issues and ensure uniqueness
        url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=800&height=450&nologo=true&seed={count*99}"
        
        print(f"Downloading {sim_id} ({clean_title})...", flush=True)
        retries = 3
        while retries > 0:
            try:
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
                with urllib.request.urlopen(req, timeout=30) as response, open(thumb_path, 'wb') as out_file:
                    out_file.write(response.read())
                print(f"  -> Success {sim_id}", flush=True)
                break
            except Exception as e:
                retries -= 1
                print(f"  -> Failed {sim_id}: {e}. Retries left: {retries}", flush=True)
                time.sleep(3)
        time.sleep(1.5) # Be polite to API

    # Update json
    sim['thumbnail'] = f"/thumbnails/math/{thumb_filename}"
    count += 1

with open(json_path, 'w') as f:
    json.dump(sims, f, indent=2)

print("Thumbnails generated and JSON updated successfully.", flush=True)
