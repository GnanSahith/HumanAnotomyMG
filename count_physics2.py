import urllib.request
import json

url = "https://phet.colorado.edu/services/metadata/1.2/simulations?format=json&type=html"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read())
        
        projects = data.get("projects", [])
        physics_count = 0
        total_html = 0
        
        for p in projects:
            sims = p.get("simulations", [])
            for s in sims:
                if s.get("type") == "html" and s.get("locale") == "en":
                    total_html += 1
                    
        print(f"Total HTML5 sims (en): {total_html}")
except Exception as e:
    print(f"Error: {e}")
