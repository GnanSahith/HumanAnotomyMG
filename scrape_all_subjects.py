import requests
import json
import re
from bs4 import BeautifulSoup

with open("subject_urls.json", "r") as f:
    subject_urls = json.load(f)

for sub, urls in subject_urls.items():
    print(f"\n--- Scraping {sub.upper()} ---")
    scraped_data = {}
    
    for ch_num_str, url in urls.items():
        ch_num = int(ch_num_str)
        print(f"Scraping Chapter {ch_num}...")
        try:
            resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
            soup = BeautifulSoup(resp.text, "html.parser")
            script = soup.find("script", id="__NEXT_DATA__")
            
            if not script:
                scraped_data[ch_num] = []
                continue
                
            data = json.loads(script.string)
            html_payload = data.get("props", {}).get("pageProps", {}).get("initialState", {}).get("seo", {}).get("categoryPage", {}).get("footer", {}).get("description", "")
            
            if not html_payload:
                scraped_data[ch_num] = []
                continue
                
            raw_text = BeautifulSoup(html_payload, "html.parser").get_text("\n", strip=True)
            blocks = re.split(r'\n(?=\d+\.\s+[A-Za-z])', raw_text)
            
            questions = []
            for block in blocks:
                block = block.strip()
                if not re.match(r'^\d+\.\s+', block):
                    continue
                    
                parts = re.split(r'\nAns:', block, maxsplit=1)
                
                q_text = parts[0].strip()
                a_text = parts[1].strip() if len(parts) > 1 else "Detailed solution available."
                
                a_text = a_text.split("\nImportant Formulas")[0]
                a_text = a_text.split("\nChapter Summary")[0]
                a_text = a_text.split("\nList of")[0]
                
                q_text = q_text.replace('\\[', '$$').replace('\\]', '$$')
                a_text = a_text.replace('\\[', '$$').replace('\\]', '$$')
                
                questions.append({
                    "q": q_text,
                    "a": a_text
                })
                
            scraped_data[ch_num] = questions
            print(f"  -> {len(questions)} questions")
            
        except Exception as e:
            print(f"Failed Chapter {ch_num}: {e}")
            scraped_data[ch_num] = []

    js_content = f"export const vedantu{sub.capitalize()}Data = " + json.dumps(scraped_data, indent=2) + ";"
    with open(f"src/vedantu{sub.capitalize()}Data.js", "w", encoding="utf-8") as f:
        f.write(js_content)

print("\nScraping for ALL subjects completed!")
