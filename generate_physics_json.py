import urllib.request
import json
import os
import ssl

ssl._create_default_https_context = ssl._create_unverified_context

url = "https://phet.colorado.edu/services/metadata/1.2/simulations?format=json&type=html"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read())
        
        projects = data.get("projects", [])
        physics_sims = {}
        
        # We will manually map them to categories based on their names
        categories_map = {
            "Motion & Mechanics": ["motion", "force", "gravity", "friction", "kinematics", "projectile", "pendulum", "mass", "spring", "collision", "torque", "balance"],
            "Work, Energy & Power": ["energy", "work", "power", "skate", "hooke"],
            "Heat & Thermodynamics": ["heat", "thermo", "gas", "states of matter", "diffusion", "temperature", "blackbody", "friction"],
            "Sound & Waves": ["wave", "sound", "interference", "fourier", "resonance", "string", "optic", "lens", "color", "vision", "bend", "refraction"],
            "Electricity & Magnets": ["circuit", "charge", "electric", "magnet", "faraday", "ohm", "coulomb", "battery", "capacitor", "resistance", "wire", "generator", "john travoltage"],
            "Quantum & Light": ["quantum", "laser", "photoelectric", "rutherford", "bohr", "molecule", "atom", "nuclear", "decay", "half-life", "neon", "mri", "microwaves"]
        }
        
        sim_id_counter = 1
        
        for p in projects:
            sims = p.get("simulations", [])
            for s in sims:
                # We want English HTML5 sims
                if s.get("en"):
                    en_data = s.get("en", {})
                    title = en_data.get("title", "")
                    # The URL for html5 sim:
                    # https://phet.colorado.edu/sims/html/[name]/latest/[name]_en.html
                    # We will download them later, so let's just store the name
                    sim_name = p.get("name", "")
                    download_url = f"https://phet.colorado.edu/sims/html/{sim_name}/latest/{sim_name}_en.html?download"
                    
                    # Determine category
                    t_lower = title.lower()
                    assigned_category = "Other Physics"
                    for cat, keywords in categories_map.items():
                        if any(kw in t_lower or kw in sim_name.replace("-", " ") for kw in keywords):
                            assigned_category = cat
                            break
                            
                    # Let's filter out chemistry-only ones if possible, but many overlap.
                    # We will just accept all mapped ones if they didn't fall into "Other Physics", or we can take all and filter.
                    if assigned_category != "Other Physics":
                        # We only want it if we assigned it a physics category!
                        # Some overlap with chemistry (e.g., states of matter), which is fine.
                        
                        sim_obj = {
                            "id": f"phys_{sim_id_counter}",
                            "title": title,
                            "url": f"/simulations/{sim_name}_en.html",
                            "download_url": download_url,
                            "category": assigned_category
                        }
                        physics_sims[f"phys_{sim_id_counter}"] = sim_obj
                        sim_id_counter += 1

        print(f"Generated {len(physics_sims)} physics simulations.")
        
        # Write to src/data/physicsSimulations.json
        os.makedirs("src/data", exist_ok=True)
        with open("src/data/physicsSimulations.json", "w") as f:
            json.dump(physics_sims, f, indent=4)
            
except Exception as e:
    print(f"Error: {e}")
