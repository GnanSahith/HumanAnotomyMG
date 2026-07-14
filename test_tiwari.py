import requests
from bs4 import BeautifulSoup
import re

url = "https://www.tiwariacademy.com/ncert-solutions/class-5/evs/chapter-1/"
headers = {"User-Agent": "Mozilla/5.0"}
resp = requests.get(url, headers=headers, timeout=10)
soup = BeautifulSoup(resp.text, 'html.parser')

text = soup.get_text('\n', strip=True)
print("Status:", resp.status_code)
print("Content length:", len(text))
q_matches = re.findall(r'.{0,50}Question.{0,50}', text, re.IGNORECASE)
for m in q_matches[:10]:
    print(m)
