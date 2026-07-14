import os
import json
import urllib.request
import urllib.parse
import time
import re

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
    
    # Check if thumbnail already exists
    thumb_filename = f"{sim_id}.png"
    thumb_path = os.path.join(thumb_dir, thumb_filename)
    
    if not os.path.exists(thumb_path):
        prompt = f"A professional educational illustration for mathematics topic: {clean_title}. Vector art style, flat colors, clean design, highly educational, no text."
        encoded_prompt = urllib.parse.quote(prompt)
        url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=800&height=450&nologo=true"
        
        print(f"Downloading thumbnail for {sim_id} ({clean_title})...")
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response, open(thumb_path, 'wb') as out_file:
                out_file.write(response.read())
            time.sleep(0.5) # small delay to be polite
        except Exception as e:
            print(f"Failed to download {sim_id}: {e}")
            continue

    # Update json
    sim['thumbnail'] = f"/thumbnails/math/{thumb_filename}"
    count += 1

with open(json_path, 'w') as f:
    json.dump(sims, f, indent=2)

print("Thumbnails generated and JSON updated successfully.")
