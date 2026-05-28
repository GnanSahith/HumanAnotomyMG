import urllib.request
import json
url = "https://phet.colorado.edu/services/metadata/1.2/simulations?format=json&type=html"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        
        for k, v in data["categories"].items():
            name = v.get("name", "")
            if "chem" in name.lower():
                print(f"ID: {k}, Name: {name}, Children: {v.get('childrenIds')}, Sims: {len(v.get('simulationIds', []))}")
                
except Exception as e:
    print(e)
