import requests
from bs4 import BeautifulSoup
import re

url = "https://byjus.com/ncert-solutions-class-5-evs/chapter-21-like-father-like-daughter/"
headers = {"User-Agent": "Mozilla/5.0"}
resp = requests.get(url, headers=headers, timeout=10)
soup = BeautifulSoup(resp.text, 'html.parser')

text = soup.get_text('\n', strip=True)
q_matches = re.findall(r'.{0,50}Question.{0,50}', text, re.IGNORECASE)
for m in q_matches[:10]:
    print(m)
    
print("\n--- Byjus content ---")
content = soup.find('div', class_='entry-content') or soup.find('article') or soup.find('div', class_='row')
if content:
    content_text = content.get_text('\n', strip=True)
    print(content_text[:1000])

