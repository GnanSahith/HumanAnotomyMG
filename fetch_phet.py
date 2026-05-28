import urllib.request
import json
import re

url = "https://phet.colorado.edu/services/metadata/1.2/simulations?format=json&type=html"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
except Exception as e:
    print("Error:", e)
    exit(1)

chem_keywords = ['chemistry', 'molecule', 'atom', 'acid', 'base', 'reaction', 'isotope', 'gas', 'molarity', 'concentration', 'balancing', 'reactant', 'product', 'ph scale', 'build']

chem_sims = []
for proj in data.get("projects", []):
    proj_name = proj.get("name", "")
    for sim in proj.get("simulations", []):
        en_sim = None
        for loc in sim.get("localizedSimulations", []):
            if loc.get("locale") == "en":
                en_sim = loc
                break
                
        if en_sim:
            title = en_sim.get("title", "")
            
            is_chem = any(k in title.lower() or k in proj_name.lower() for k in chem_keywords)
            
            if is_chem:
                # remove 'html/' from proj_name if it exists
                clean_proj = proj_name.replace("html/", "")
                
                embed_url = en_sim.get("runUrl", f"https://phet.colorado.edu/sims/html/{clean_proj}/latest/{clean_proj}_en.html")
                thumb = f"https://phet.colorado.edu/sims/html/{clean_proj}/latest/{clean_proj}-600.png"
                
                chem_sims.append({
                    "id": clean_proj,
                    "title": title,
                    "description": f"Interactive {title} simulation",
                    "url": embed_url,
                    "thumbnail": thumb
                })

print(f"Found {len(chem_sims)} chemistry simulations")
with open("src/data/chemistrySimulations.json", "w") as f:
    json.dump(chem_sims, f, indent=4)
