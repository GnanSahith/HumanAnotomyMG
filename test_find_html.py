import requests
from bs4 import BeautifulSoup

url = "https://www.vedantu.com/ncert-solutions/ncert-solutions-class-10-maths-chapter-1"
headers = {"User-Agent": "Mozilla/5.0"}
resp = requests.get(url, headers=headers)
soup = BeautifulSoup(resp.text, 'html.parser')

# Find all text blocks with some length
for div in soup.find_all('div'):
    text = div.get_text()
    if "Euclid" in text:
        print("Found Euclid in a div!")
        print(text[:200].replace('\n', ' '))
        break
