import requests
import json
import re
from bs4 import BeautifulSoup

url = "https://www.vedantu.com/ncert-solutions/ncert-solutions-class-12-physics-chapter-2-electrostatic-potential-and-capacitance"
resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
soup = BeautifulSoup(resp.text, "html.parser")
script = soup.find("script", id="__NEXT_DATA__")
data = json.loads(script.string)
html_payload = data.get("props", {}).get("pageProps", {}).get("initialState", {}).get("seo", {}).get("categoryPage", {}).get("footer", {}).get("description", "")

raw_text = BeautifulSoup(html_payload, "html.parser").get_text("\n", strip=True)
blocks = re.split(r'\n(?=\d+\.\s+[A-Za-z])', raw_text)

for block in blocks:
    if re.match(r'^\d+\.\s+', block.strip()):
        if "Important Formulas" in block or "Chapter Summary" in block:
            print("BREAKING AT:", block.strip()[:40])
            break
