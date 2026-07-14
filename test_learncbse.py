import requests
from bs4 import BeautifulSoup
import re

url = "https://www.learncbse.in/ncert-solutions-class-9-science-chapter-1/"
headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}
try:
    resp = requests.get(url, headers=headers, timeout=10)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        # In LearnCBSE, usually questions are in <strong> tags or similar
        content = soup.find('div', class_='entry-content')
        if content:
            print("Found entry-content")
            # Let's just print a bit of text
            print(content.get_text('\n', strip=True)[:500])
        else:
            print("No entry-content found")
except Exception as e:
    print(f"Error: {e}")
