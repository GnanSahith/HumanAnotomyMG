import glob
import json
import requests
from bs4 import BeautifulSoup
import re

def get_tiwari_subject(file_name):
    # 'src/data/class_10_social_science.js' -> class=10, subject=social-science
    # EVS -> evs, etc.
    base = file_name.replace('src/data/class_', '').replace('.js', '')
    parts = base.split('_')
    
    # Example: '10_social_science' -> parts=['10', 'social', 'science']
    cls = parts[0]
    subject = "-".join(parts[1:])
    
    # Adjust subject mapping to Tiwari Academy slugs if needed
    if subject == 'maths':
        subject = 'math' # Tiwari usually uses 'math' or 'maths'? Let's check math vs maths.
        
    return cls, subject

def fetch_and_parse_tiwari(cls, subject, ch):
    if subject == "math":
        url = f"https://www.tiwariacademy.com/ncert-solutions/class-{cls}/maths/chapter-{ch}/"
    else:
        url = f"https://www.tiwariacademy.com/ncert-solutions/class-{cls}/{subject}/chapter-{ch}/"
        
    print(f"Fetching {url}")
    resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    if resp.status_code != 200:
        # Try alternate subject name
        if subject == "social-science":
            url = f"https://www.tiwariacademy.com/ncert-solutions/class-{cls}/social-studies/chapter-{ch}/"
            resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
            
    if resp.status_code != 200:
        print("  -> Failed to fetch.")
        return []
        
    soup = BeautifulSoup(resp.text, 'html.parser')
    content = soup.find('div', class_='entry-content') or soup
    full_text = content.get_text('\n', strip=True)
    
    pattern = re.compile(r'Question[\s\d]*:\s*(.*?)(?:Answer[\s\d]*:|Ans[\s\d.]*:)\s*(.*?)(?=Question[\s\d]*:|$)', re.IGNORECASE | re.DOTALL)
    matches = pattern.findall(full_text)
    
    results = []
    for q, a in matches:
        if len(q.strip()) > 5 and len(a.strip()) > 5:
            results.append({"q": q.strip(), "a": a.strip()})
            
    print(f"  -> Found {len(results)} fallback questions.")
    return results

total_backfilled = 0

for file in glob.glob('src/data/class_*.js'):
    with open(file, 'r') as f:
        js_content = f.read()
        
    try:
        json_str = js_content.strip().replace("export default ", "")
        if json_str.endswith(";"):
            json_str = json_str[:-1]
            
        data = json.loads(json_str)
        cls, subject = get_tiwari_subject(file)
        
        modified = False
        
        for ch, q_list in data.items():
            valid_questions = 0
            for qa in q_list:
                q_lower = qa['q'].lower()
                is_seo = 'cbse class' in q_lower or 'ncert solutions' in q_lower or 'important questions' in q_lower
                is_missing = qa['a'] == 'Detailed solution available.' or len(qa['a'].strip()) < 10
                
                if not is_seo and not is_missing:
                    valid_questions += 1
            
            if valid_questions == 0:
                # Chapter is empty or only has SEO links, try fallback!
                new_qas = fetch_and_parse_tiwari(cls, subject, ch)
                if len(new_qas) > 0:
                    data[ch] = new_qas
                    modified = True
                    total_backfilled += 1
                    
        if modified:
            with open(file, 'w') as f:
                f.write("export default " + json.dumps(data, indent=2) + ";\n")
                
    except Exception as e:
        print(f"Error parsing {file}: {e}")

print(f"\nTotal chapters backfilled: {total_backfilled}")
