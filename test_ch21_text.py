import requests
import json
from bs4 import BeautifulSoup
import re

url = "https://www.vedantu.com/ncert-solutions/ncert-solutions-class-5-evs-chapter-21"
headers = {"User-Agent": "Mozilla/5.0"}
resp = requests.get(url, headers=headers)
soup = BeautifulSoup(resp.text, 'html.parser')
script = soup.find("script", id="__NEXT_DATA__")
data = json.loads(script.string)

desc = data['props']['pageProps']['initialState']['seo']['categoryPage']['footer']['description']
raw_text = BeautifulSoup(desc, 'html.parser').get_text('\n', strip=True)

blocks = re.split(r'\n(?=\d+\.\s+[A-Za-z])', raw_text)
print(f"Number of blocks split by \n1. : {len(blocks)}")

print("\n--- FIRST 1000 CHARS OF RAW TEXT ---")
print(raw_text[:1000])
