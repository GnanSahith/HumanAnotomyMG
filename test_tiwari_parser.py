import requests
from bs4 import BeautifulSoup
import re
import json

def parse_tiwari(url):
    print(f"\nParsing {url} ...")
    resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    if resp.status_code != 200:
        print("Failed to fetch.")
        return
        
    soup = BeautifulSoup(resp.text, 'html.parser')
    content = soup.find('div', class_='entry-content') or soup
    
    # It's better to iterate over paragraphs
    questions = []
    current_q = None
    current_a = None
    state = None
    
    for p in content.find_all(['p', 'h3', 'h4', 'div']):
        # only direct text, to avoid getting too much nested stuff
        text = p.get_text('\n', strip=True)
        if not text:
            continue
            
        lower_text = text.lower()
        
        # Check if it's a question start
        if lower_text.startswith("question ") or lower_text.startswith("question:"):
            # Save previous
            if current_q and current_a:
                questions.append({"q": current_q.strip(), "a": current_a.strip()})
            
            # Start new question
            current_q = text
            current_a = ""
            state = "Q"
        elif lower_text.startswith("answer ") or lower_text.startswith("answer:"):
            current_a = text
            state = "A"
        elif lower_text.startswith("ans.") or lower_text.startswith("ans:"):
            current_a = text
            state = "A"
        else:
            if state == "Q":
                current_q += "\n" + text
            elif state == "A":
                current_a += "\n" + text
                
    if current_q and current_a:
        questions.append({"q": current_q.strip(), "a": current_a.strip()})
        
    print(f"Extracted {len(questions)} questions.")
    for i, qa in enumerate(questions[:3]):
        print(f"Q{i+1}: {qa['q'][:100]}")
        print(f"A{i+1}: {qa['a'][:100]}\n")

parse_tiwari("https://www.tiwariacademy.com/ncert-solutions/class-9/science/chapter-1/")
parse_tiwari("https://www.tiwariacademy.com/ncert-solutions/class-5/evs/chapter-21/")
parse_tiwari("https://www.tiwariacademy.com/ncert-solutions/class-10/social-science/chapter-6/")

