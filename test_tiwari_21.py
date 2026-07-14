import requests
from bs4 import BeautifulSoup
import re

url = "https://www.tiwariacademy.com/ncert-solutions/class-5/evs/chapter-21/"
headers = {"User-Agent": "Mozilla/5.0"}
resp = requests.get(url, headers=headers)
soup = BeautifulSoup(resp.text, 'html.parser')
text = soup.get_text('\n', strip=True)

# Find all occurrences of "Question"
q_matches = re.findall(r'.{0,50}Question.{0,50}', text, re.IGNORECASE)
for m in q_matches[:10]:
    print("---", m)
