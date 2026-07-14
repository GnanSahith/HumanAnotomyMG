import json
import requests
from bs4 import BeautifulSoup
import re
import os

with open('missing_chapters.json', 'r') as f:
    missing_chapters = json.load(f)

def fetch_and_parse_tiwari(cls, subject_slug, ch):
    tiwari_subject = subject_slug
    if subject_slug == 'maths': tiwari_subject = 'maths'
    elif subject_slug == 'social_science': tiwari_subject = 'social-science'
    elif subject_slug == 'political_science': tiwari_subject = 'political-science'
    elif subject_slug == 'business_studies': tiwari_subject = 'business-studies'
    
    url = f"https://www.tiwariacademy.com/ncert-solutions/class-{cls}/{tiwari_subject}/chapter-{ch}/"
    print(f"Fetching {url}")
    resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    
    if resp.status_code != 200:
        if tiwari_subject == 'social-science':
            url = f"https://www.tiwariacademy.com/ncert-solutions/class-{cls}/social-studies/chapter-{ch}/"
            resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
        elif tiwari_subject == 'maths':
            url = f"https://www.tiwariacademy.com/ncert-solutions/class-{cls}/math/chapter-{ch}/"
            resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
            
    if resp.status_code != 200:
        print("  -> Failed to fetch.")
        return []
        
    soup = BeautifulSoup(resp.text, 'html.parser')
    results = []
    
    # Try FAQ structure first
    faqs = soup.find_all('div', class_='sseo_faqcont')
    if faqs:
        for faq in faqs:
            q_div = faq.find('div', class_='sseo_faqtitle')
            a_div = faq.find('div', class_='sseo_faqdet')
            if q_div and a_div:
                q_text = q_div.get_text('\n', strip=True)
                a_text = a_div.get_text('\n', strip=True)
                if len(q_text) > 5 and len(a_text) > 5:
                    results.append({"q": q_text, "a": a_text})
    
    # If no results, try Regex format
    if not results:
        content = soup.find('div', class_='entry-content') or soup
        full_text = content.get_text('\n', strip=True)
        pattern = re.compile(r'Question[\s\d]*:\s*(.*?)(?:Answer[\s\d]*:|Ans[\s\d.]*:)\s*(.*?)(?=Question[\s\d]*:|$)', re.IGNORECASE | re.DOTALL)
        matches = pattern.findall(full_text)
        for q, a in matches:
            if len(q.strip()) > 5 and len(a.strip()) > 5:
                results.append({"q": q.strip(), "a": a.strip()})
            
    print(f"  -> Found {len(results)} fallback questions.")
    return results

# Group missing by file
missing_by_file = {}
for m in missing_chapters:
    f = m['fileName']
    if f not in missing_by_file:
        missing_by_file[f] = []
    missing_by_file[f].append(m)

total_backfilled = 0

for file_name, chapters in missing_by_file.items():
    if not os.path.exists(file_name):
        print(f"Creating new file {file_name}")
        data = {}
    else:
        with open(file_name, 'r') as f:
            js_content = f.read()
        json_str = js_content.strip().replace("export default ", "")
        if json_str.endswith(";"): json_str = json_str[:-1]
        try:
            data = json.loads(json_str)
        except:
            data = {}
            
    modified = False
    
    for m in chapters:
        cls = m['cls']
        subject_slug = m['subject']
        ch = m['chapter']
        
        new_qas = fetch_and_parse_tiwari(cls, subject_slug, ch)
        if len(new_qas) > 0:
            key = f"chapter-{ch}" if (data and '-' in list(data.keys())[0]) else str(ch)
            # Default to chapter-X if data is empty, or match existing
            if not data:
                key = str(ch)
            else:
                existing_keys = list(data.keys())
                if len(existing_keys) > 0:
                    if existing_keys[0].startswith('chapter-'): key = f"chapter-{ch}"
                    elif existing_keys[0].startswith('chapter'): key = f"chapter{ch}"
                    else: key = str(ch)
            
            data[key] = new_qas
            modified = True
            total_backfilled += 1
            
    if modified:
        with open(file_name, 'w') as f:
            f.write("export default " + json.dumps(data, indent=2) + ";\n")

print(f"\nTotal completely missing chapters backfilled: {total_backfilled}")
