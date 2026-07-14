import requests
from bs4 import BeautifulSoup

url = "https://www.tiwariacademy.com/ncert-solutions/class-9/science/chapter-1/"
resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
soup = BeautifulSoup(resp.text, 'html.parser')
content = soup.find('div', class_='entry-content') or soup

for p in content.find_all('p'):
    text = p.get_text('\n', strip=True)
    if "Question" in text:
        print("TAG:", p.name)
        print("TEXT:", repr(text))
        print("LOWER:", repr(text.lower()))
        print("STARTSWITH 'question':", text.lower().startswith("question"))
        break
