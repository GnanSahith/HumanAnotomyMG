import requests
from bs4 import BeautifulSoup

url = "https://www.tiwariacademy.com/ncert-solutions/class-5/evs/chapter-21/"
headers = {"User-Agent": "Mozilla/5.0"}
resp = requests.get(url, headers=headers)
soup = BeautifulSoup(resp.text, 'html.parser')
content = soup.find('div', class_='entry-content') or soup

questions = []
for p in content.find_all('p'):
    text = p.get_text('\n', strip=True)
    if "Question:" in text or "Ans" in text:
        questions.append(text)

for q in questions[:10]:
    print("---")
    print(q[:200])
