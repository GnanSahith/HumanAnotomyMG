import requests
from bs4 import BeautifulSoup

url = "https://www.vedantu.com/ncert-solutions/ncert-solutions-class-10-maths-chapter-1-real-numbers"
headers = {"User-Agent": "Mozilla/5.0"}
resp = requests.get(url, headers=headers)
soup = BeautifulSoup(resp.text, 'html.parser')

print("Title:", soup.title.string if soup.title else "No title")

# Find blocks containing 'Ans' or 'Q1'
for div in soup.find_all('div'):
    text = div.get_text()
    if "Ans" in text and "Question" in text:
        print("Found Q&A block!")
        print(text[:200].replace('\n', ' '))
        break
else:
    print("No Q&A block found!")
