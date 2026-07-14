import re
import json
import requests
from bs4 import BeautifulSoup

url = "https://www.vedantu.com/ncert-solutions/ncert-solutions-class-12-physics-chapter-1"
headers = {"User-Agent": "Mozilla/5.0"}
c_resp = requests.get(url, headers=headers, timeout=10)
c_soup = BeautifulSoup(c_resp.text, "html.parser")
script = c_soup.find("script", id="__NEXT_DATA__")
data = json.loads(script.string)

html_payload = data.get("props", {}).get("pageProps", {}).get("initialState", {}).get("seo", {}).get("categoryPage", {}).get("footer", {}).get("description", "")
raw_text = BeautifulSoup(html_payload, "html.parser").get_text("\n", strip=True)

blocks = re.split(r'\n(?=\d+\.\s+[A-Za-z])', raw_text)
questions = []

for block in blocks:
    block = block.strip()
    if not re.match(r'^\d+\.\s+', block):
        continue
        
    parts = re.split(r'\n(?:Ans|Answer)[\s\n]*[:.]?[\s\n]*', block, maxsplit=1, flags=re.IGNORECASE)
    q_text = parts[0].strip()
    a_text = parts[1].strip() if len(parts) > 1 else "Detailed solution available."
    
    questions.append({"q": q_text[:50], "a": a_text[:50]})

print(f"Extracted {len(questions)} questions")
