import requests
from bs4 import BeautifulSoup
import json

subjects = ["chemistry", "maths", "biology"]
results = {}

for sub in subjects:
    url = f"https://www.vedantu.com/ncert-solutions/ncert-solutions-class-12-{sub}"
    resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    soup = BeautifulSoup(resp.text, "html.parser")
    links = soup.find_all("a", href=True)
    ch_urls = {}
    for link in links:
        href = link["href"]
        if f"/ncert-solutions-class-12-{sub}-chapter-" in href:
            # extract chapter number
            try:
                ch_num_str = href.split("chapter-")[1].split("-")[0]
                ch_num = int(ch_num_str)
                full_url = "https://www.vedantu.com" + href if href.startswith("/") else href
                if "vedantu.com" not in full_url:
                    full_url = "https://www.vedantu.com" + full_url
                if ch_num not in ch_urls:
                    ch_urls[ch_num] = full_url
            except:
                pass
    results[sub] = ch_urls
    print(f"Found {len(ch_urls)} chapters for {sub}")

with open("subject_urls.json", "w") as f:
    json.dump(results, f, indent=2)
