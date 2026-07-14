import requests
from bs4 import BeautifulSoup
import json
import re
import os
import time

# Create data directory if it doesn't exist
os.makedirs('src/data', exist_ok=True)

# Parse chaptersData.js to get the structure
with open('src/chaptersData.js', 'r') as f:
    content = f.read()

# Extract JSON object from JS file
match = re.search(r'export const chaptersData = (\{[\s\S]+\});', content)
if not match:
    print("Could not find chaptersData in src/chaptersData.js")
    exit(1)

# A dirty but functional way to parse the JS object literal into Python dict
# using node
with open('temp_parse.cjs', 'w') as f:
    f.write(f"""
    const fs = require('fs');
    {match.group(0).replace('export const', 'const')}
    fs.writeFileSync('temp_chapters.json', JSON.stringify(chaptersData));
    """)
os.system('node temp_parse.cjs')
with open('temp_chapters.json', 'r') as f:
    chapters_data = json.load(f)

# Clean up temp files
os.remove('temp_parse.cjs')
os.remove('temp_chapters.json')

def slugify(text):
    return text.lower().replace(' ', '-')

def get_filename(cls_name, sub_name):
    return f"{cls_name.lower().replace(' ', '_')}_{sub_name.lower().replace(' ', '_')}.js"

total_files_expected = 0
for cls_name, subjects in chapters_data.items():
    total_files_expected += len(subjects)

print(f"Total combinations to scrape: {total_files_expected}")

headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

for cls_name, subjects in chapters_data.items():
    cls_slug = slugify(cls_name)
    
    for sub_name, chapters in subjects.items():
        if len(chapters) == 0:
            continue
            
        sub_slug = slugify(sub_name)
        filename = get_filename(cls_name, sub_name)
        filepath = os.path.join('src/data', filename)
        
        # if os.path.exists(filepath):
        #     print(f"[{cls_name} - {sub_name}] Already exists, skipping.")
        #     continue
            
        print(f"\n--- Scraping [{cls_name} - {sub_name}] ---")
        
        # Try both 'ncert-solutions-class-x-subject' and 'ncert-solutions-for-class-x-subject'
        base_urls = [
            f"https://www.vedantu.com/ncert-solutions/ncert-solutions-{cls_slug}-{sub_slug}",
            f"https://www.vedantu.com/ncert-solutions/ncert-solutions-for-{cls_slug}-{sub_slug}"
        ]
        
        index_resp = None
        for url in base_urls:
            resp = requests.get(url, headers=headers, timeout=10)
            if resp.status_code == 200:
                index_resp = resp
                break
                
        if not index_resp:
            print(f"[{cls_name} - {sub_name}] Index page not found (404). Creating empty data.")
            with open(filepath, 'w') as f:
                f.write("export default {};")
            continue
            
        soup = BeautifulSoup(index_resp.text, 'html.parser')
        links = soup.find_all('a', href=True)
        
        # Extract valid chapter links
        chapter_links = {}
        for link in links:
            href = link['href']
            # Match patterns like: ncert-solutions-class-12-maths-chapter-1
            # Or ncert-solutions-class-10-science-chapter-1-chemical-reactions
            match = re.search(r'chapter-(\d+)', href)
            if match and f"{cls_slug}-{sub_slug}" in href and "ncert-solutions" in href:
                ch_num = int(match.group(1))
                if not href.startswith('http'):
                    href = 'https://www.vedantu.com' + href
                
                # Keep the shortest URL for a given chapter, to avoid weird sub-topics
                if ch_num not in chapter_links or len(href) < len(chapter_links[ch_num]):
                    chapter_links[ch_num] = href
                    
        print(f"Found {len(chapter_links)} chapter links on index page.")
        
        scraped_data = {}
        for ch_num, url in chapter_links.items():
            print(f"  Scraping Chapter {ch_num}...")
            try:
                c_resp = requests.get(url, headers=headers, timeout=10)
                c_soup = BeautifulSoup(c_resp.text, "html.parser")
                script = c_soup.find("script", id="__NEXT_DATA__")
                
                if not script:
                    scraped_data[ch_num] = []
                    continue
                    
                data = json.loads(script.string)
                cat_page = data.get("props", {}).get("pageProps", {}).get("initialState", {}).get("seo", {}).get("categoryPage", {})
                html_payload = cat_page.get("footer", {}).get("description", "") if isinstance(cat_page, dict) else ""
                
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
                        
                    parts = re.split(r'\n(?:Ans|Answer)[\s\n]*[:.]?[\s\n]*', block, maxsplit=1, flags=re.IGNORECASE)
                    q_text = parts[0].strip()
                    a_text = parts[1].strip() if len(parts) > 1 else "Detailed solution available."
                    
                    # Clean answers
                    for keyword in ["\nImportant Formulas", "\nChapter Summary", "\nList of"]:
                        if keyword in a_text:
                            a_text = a_text.split(keyword)[0]
                            
                    q_text = q_text.replace('\\[', '$$').replace('\\]', '$$')
                    a_text = a_text.replace('\\[', '$$').replace('\\]', '$$')
                    
                    questions.append({
                        "q": q_text,
                        "a": a_text
                    })
                    
                scraped_data[ch_num] = questions
                print(f"    -> {len(questions)} questions")
            except Exception as e:
                print(f"    Failed Chapter {ch_num}: {e}")
                scraped_data[ch_num] = []
                
            time.sleep(0.5) # Avoid hammering the server too hard
            
        js_content = f"export default " + json.dumps(scraped_data, indent=2) + ";"
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(js_content)
            
        print(f"[{cls_name} - {sub_name}] Completed and saved.")
        
print("All scraping completed!")
