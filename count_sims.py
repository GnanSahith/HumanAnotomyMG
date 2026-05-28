import urllib.request
import json
import ssl

ssl._create_default_https_context = ssl._create_unverified_context
url = "https://phet.colorado.edu/services/metadata/1.2/simulations?format=json&type=html"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read())
        
        projects = data.get("projects", [])
        
        chem_count = 0
        phys_count = 0
        total_html5 = 0
        
        for p in projects:
            for s in p.get("simulations", []):
                if s.get("en"):
                    total_html5 += 1
                    
        # the API provides categories under data["categories"]?
        # or maybe we can just look at the data structure.
        print(f"Total English HTML5 simulations: {total_html5}")
except Exception as e:
    print(f"Error: {e}")
