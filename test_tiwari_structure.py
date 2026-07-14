import requests
from bs4 import BeautifulSoup

url = "https://www.tiwariacademy.com/ncert-solutions/class-9/science/chapter-1/"
headers = {"User-Agent": "Mozilla/5.0"}
resp = requests.get(url, headers=headers)
soup = BeautifulSoup(resp.text, 'html.parser')

# Find content div, maybe 'entry-content' or similar
content = soup.find('div', class_='entry-content') or soup
# Look for strong tags or p tags that contain "Question"
questions = []
for p in content.find_all('p'):
    text = p.get_text('\n', strip=True)
    if "Question" in text or "Ans" in text:
        questions.append(text)

print(f"Found {len(questions)} snippets.")
for q in questions[:10]:
    print("---")
    print(q[:200])

