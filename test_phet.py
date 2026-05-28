import urllib.request
import json

url = "https://phet.colorado.edu/services/metadata/1.2/simulations?format=json&type=html"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        count = 0
        for proj in data.get("projects", []):
            if count >= 5: break
            print("Project:", proj.get("name"))
            for loc in proj.get("simulations", []):
                print(" Locale:", loc.get("locale"), "Title:", loc.get("title"))
            count += 1
except Exception as e:
    print(e)
