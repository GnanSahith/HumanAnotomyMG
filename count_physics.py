import urllib.request
import json

url = "https://phet.colorado.edu/services/metadata/1.2/simulations?format=json&type=html"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read())
        
        # Get all projects
        projects = data.get("projects", [])
        
        physics_sims = 0
        for p in projects:
            sims = p.get("simulations", [])
            for s in sims:
                if s.get("type") == "html":
                    # Check if it has a physics category or similar?
                    # The PhET structure actually has a 'categories' object in the root, maybe we can map them.
                    physics_sims += 1
        
        # Actually, let's find the specific physics categories
        categories = data.get("categories", [])
        physics_cat = None
        for cat in categories:
            if "physics" in cat.get("name", "").lower():
                physics_cat = cat
                break
                
        if physics_cat:
            physics_ids = set(physics_cat.get("simulationIds", []))
            print(f"Physics category ID: {physics_cat.get('id')}, Name: {physics_cat.get('name')}")
            print(f"Total simulations in physics category: {len(physics_ids)}")
        else:
            print("Physics category not found explicitly. Total HTML5 sims:", physics_sims)
            
except Exception as e:
    print(f"Error: {e}")
