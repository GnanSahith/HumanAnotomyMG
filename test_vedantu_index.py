import requests
from bs4 import BeautifulSoup
import json
import re

url = "https://www.vedantu.com/ncert-solutions/ncert-solutions-class-10-maths"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}
resp = requests.get(url, headers=headers)
print("Status:", resp.status_code)

soup = BeautifulSoup(resp.text, "html.parser")
links = soup.find_all('a', href=True)

chapter_links = []
for link in links:
    href = link['href']
    # Look for links that look like chapter links
    if 'chapter-' in href and 'class-10-maths' in href:
        if not href.startswith('http'):
            href = 'https://www.vedantu.com' + href
        if href not in chapter_links:
            chapter_links.append(href)

print(f"Found {len(chapter_links)} potential chapter links:")
for l in chapter_links[:5]:
    print(l)
