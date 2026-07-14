import requests
from bs4 import BeautifulSoup
import re

url = "https://byjus.com/ncert-solutions-class-9-science/chapter-1-matter-in-our-surroundings/"
headers = {"User-Agent": "Mozilla/5.0"}
resp = requests.get(url, headers=headers, timeout=10)
soup = BeautifulSoup(resp.text, 'html.parser')

text = soup.get_text('\n', strip=True)
q_matches = re.findall(r'.{0,50}Question\s*1.{0,50}', text, re.IGNORECASE)
for m in q_matches[:5]:
    print(m)
    
print("\n--- Let's look at div class='entry-content' or similar ---")
content = soup.find('div', class_='entry-content') or soup.find('article') or soup.find('div', class_='row')
if content:
    content_text = content.get_text('\n', strip=True)
    print(content_text[1000:2000])

