import requests
import json
from bs4 import BeautifulSoup

url = "https://www.vedantu.com/ncert-solutions/ncert-solutions-class-5-evs-chapter-21"
headers = {"User-Agent": "Mozilla/5.0"}
resp = requests.get(url, headers=headers)
soup = BeautifulSoup(resp.text, 'html.parser')
script = soup.find("script", id="__NEXT_DATA__")
data = json.loads(script.string)

cat_page = data.get("props", {}).get("pageProps", {}).get("initialState", {}).get("seo", {}).get("categoryPage", {})
if isinstance(cat_page, dict):
    print("Found categoryPage as dict")
    desc = cat_page.get("footer", {}).get("description", "")
    print(f"Description length: {len(desc)}")
    
    # Also check other places just in case
    print(list(cat_page.keys()))
else:
    print("categoryPage is not a dict")
