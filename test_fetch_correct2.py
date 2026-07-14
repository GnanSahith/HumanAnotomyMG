import requests
from bs4 import BeautifulSoup
import json

url = "https://www.vedantu.com/ncert-solutions/ncert-solutions-class-10-maths-chapter-1-real-numbers"
headers = {"User-Agent": "Mozilla/5.0"}
resp = requests.get(url, headers=headers)
soup = BeautifulSoup(resp.text, 'html.parser')
script = soup.find("script", id="__NEXT_DATA__")
data = json.loads(script.string)

with open('debug_vedantu_correct.json', 'w') as f:
    json.dump(data, f, indent=2)
print("Saved debug_vedantu_correct.json")
