import json
import urllib.request
import os
import ssl

ssl._create_default_https_context = ssl._create_unverified_context

with open("src/data/physicsSimulations.json", "r") as f:
    data = json.load(f)

os.makedirs("public/simulations", exist_ok=True)

# Define a proper User-Agent
headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
}

for key, sim in data.items():
    # sim["url"] is "/simulations/projectile-motion_en.html"
    filename = sim["url"].split("/")[-1]
    sim_id = filename.replace("_en.html", "")
    
    download_url = f"https://phet.colorado.edu/sims/html/{sim_id}/latest/{sim_id}_en.html?download"
    local_path = f"public/simulations/{filename}"
    
    if not os.path.exists(local_path):
        print(f"Downloading {sim_id} from {download_url}...")
        try:
            req = urllib.request.Request(download_url, headers=headers)
            with urllib.request.urlopen(req) as response:
                with open(local_path, 'wb') as out_file:
                    out_file.write(response.read())
        except Exception as e:
            print(f"Failed to download {sim_id}: {e}")
    else:
        print(f"Already downloaded {sim_id}.")

