import requests
from bs4 import BeautifulSoup
import re
url = "https://www.tiwariacademy.com/ncert-solutions/class-10/social-science/chapter-6/"
resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
soup = BeautifulSoup(resp.text, 'html.parser')
content = soup.find('div', class_='entry-content') or soup
text = content.get_text('\n', strip=True)

# print snippets containing Question or Ans
for p in text.split('\n'):
    if "Question" in p or "Ans" in p or "Q." in p:
        print(p)
