import requests
from bs4 import BeautifulSoup

url = "https://www.vedantu.com/ncert-solutions/ncert-solutions-class-5-evs-chapter-21"
headers = {"User-Agent": "Mozilla/5.0"}
resp = requests.get(url, headers=headers)
soup = BeautifulSoup(resp.text, 'html.parser')

print(f"Total div text length: {len(soup.get_text())}")

# Let's search for "Q1" or "Question" in the visible text
visible_text = soup.get_text('\n', strip=True)
import re
q_matches = re.findall(r'.{0,50}Question.{0,50}', visible_text, re.IGNORECASE)
print(f"Found {len(q_matches)} matches for 'Question'")
for m in q_matches[:10]:
    print(m)
