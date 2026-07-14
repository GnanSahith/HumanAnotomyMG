import requests
from bs4 import BeautifulSoup
import re
import json

def test_regex(url):
    print(f"\n--- Testing {url} ---")
    resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    soup = BeautifulSoup(resp.text, 'html.parser')
    content = soup.find('div', class_='entry-content') or soup
    
    # Grab all text in blocks to preserve newlines
    full_text = content.get_text('\n', strip=True)
    
    # Use Regex to extract Q&A blocks
    # Looking for "Question 1:" or "Question:" followed by text, then "Answer 1:" or "Answer:" or "Ans:" followed by text
    pattern = re.compile(r'Question[\s\d]*:\s*(.*?)(?:Answer[\s\d]*:|Ans[\s\d.]*:)\s*(.*?)(?=Question[\s\d]*:|$)', re.IGNORECASE | re.DOTALL)
    
    matches = pattern.findall(full_text)
    print(f"Found {len(matches)} questions.")
    
    for i, (q, a) in enumerate(matches[:3]):
        print(f"Q{i+1}: {q.strip()[:100]}")
        print(f"A{i+1}: {a.strip()[:100]}\n")

test_regex("https://www.tiwariacademy.com/ncert-solutions/class-9/science/chapter-1/")
test_regex("https://www.tiwariacademy.com/ncert-solutions/class-5/evs/chapter-21/")
test_regex("https://www.tiwariacademy.com/ncert-solutions/class-10/social-science/chapter-6/")

