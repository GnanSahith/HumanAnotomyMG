import urllib.request
import json
url = "https://phet.colorado.edu/services/metadata/1.2/simulations?format=json&type=html"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        
        chem_ids = set()
        for cat_id, cat in data["categories"].items():
            name = cat.get("name", "").lower()
            if "chemistry" in name or str(cat.get("parent")) == "13" or str(cat_id) == "13":
                for sid in cat.get("simulationIds", []):
                    chem_ids.add(int(sid))
                    
        chem_sims = []
        for proj in data.get("projects", []):
            proj_name = proj.get("name", "")
            
            for sim in proj.get("simulations", []):
                # Is it a chemistry simulation?
                is_chem = False
                if int(sim.get("id", -1)) in chem_ids:
                    is_chem = True
                    
                en_sim = None
                for loc in sim.get("localizedSimulations", []):
                    if loc.get("locale") == "en":
                        en_sim = loc
                        break
                        
                if en_sim:
                    title = en_sim.get("title", "")
                    lower_t = title.lower()
                    
                    # Fallback keyword match if categories missed it
                    chem_keywords = ['chemistry', 'molecule', 'atom', 'acid', 'base', 'reaction', 'isotope', 'gas', 'molarity', 'concentration', 'balancing', 'reactant', 'product', 'ph scale', 'build', 'density', 'buoyancy', 'diffusion', 'states of matter', 'nuclear', 'decay', 'rutherford', 'coulomb', 'bond', 'polarity']
                    if any(k in lower_t or k in proj_name.lower() for k in chem_keywords):
                        exclude = ['math', 'fraction', 'area', 'calculus', 'function', 'graphing', 'vector', 'capacitor', 'circuit', 'magnet', 'faraday', 'pendulum', 'projectile', 'wave', 'optics', 'sound', 'color', 'vision', 'gravity', 'forces', 'motion', 'torque', 'friction']
                        if not any(x in lower_t or x in proj_name.lower() for x in exclude) or "gas" in lower_t or "density" in lower_t:
                            is_chem = True
                    
                    if is_chem:
                        clean_proj = proj_name.replace("html/", "")
                        
                        cat_name = "Quantum & Advanced Chemistry"
                        if any(k in lower_t for k in ["atom", "molecule", "isotope", "build", "shape", "polarity", "bond", "nuclear", "decay", "rutherford"]):
                            cat_name = "Atoms & Molecules"
                        elif any(k in lower_t for k in ["react", "balanc", "equation", "collision", "kinetics"]):
                            cat_name = "Reactions & Stoichiometry"
                        elif any(k in lower_t for k in ["acid", "base", "molar", "concentration", "ph", "solution", "beers", "beer"]):
                            cat_name = "Solutions, Acids & Bases"
                        elif any(k in lower_t for k in ["gas", "state", "thermo", "energy", "density", "buoyancy", "diffusion"]):
                            cat_name = "Thermodynamics & Gases"
                            
                        chem_sims.append({
                            "id": clean_proj,
                            "title": title,
                            "description": f"Interactive {title} simulation",
                            "url": en_sim.get("runUrl", f"https://phet.colorado.edu/sims/html/{clean_proj}/latest/{clean_proj}_en.html"),
                            "thumbnail": f"https://phet.colorado.edu/sims/html/{clean_proj}/latest/{clean_proj}-600.png",
                            "category": cat_name
                        })

        unique_sims = {sim["title"]: sim for sim in chem_sims}.values()
        chem_sims = list(unique_sims)

        print(f"Found {len(chem_sims)} total chemistry simulations!")
        with open("src/data/chemistrySimulations.json", "w") as f:
            json.dump(chem_sims, f, indent=4)
except Exception as e:
    print(e)
