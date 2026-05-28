"""
Scrape remaining Class 12 subjects: English, Economics, Business Studies
Uses the image-aware DOM walker from scrape_with_images.py
"""
import requests
import json
import re
import time
from bs4 import BeautifulSoup, NavigableString, Tag

def extract_rich_text(element):
    """Walk DOM and convert to text + markdown images."""
    parts = []
    for child in element.children:
        if isinstance(child, NavigableString):
            parts.append(str(child))
        elif isinstance(child, Tag):
            if child.name == 'img':
                src = child.get('src', '')
                alt = child.get('alt', 'Diagram')
                if src and 'seo/content-images' in src:
                    parts.append(f'\n![{alt}]({src})\n')
            elif child.name == 'br':
                parts.append('\n')
            elif child.name in ('div', 'p'):
                inner = extract_rich_text(child)
                parts.append('\n' + inner + '\n')
            else:
                parts.append(extract_rich_text(child))
    return ''.join(parts)


def scrape_chapter(url):
    """Scrape a single chapter with image support."""
    resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=15)
    soup = BeautifulSoup(resp.text, "html.parser")
    script = soup.find("script", id="__NEXT_DATA__")
    
    if not script:
        return []
    
    data = json.loads(script.string)
    html_payload = (data.get("props", {}).get("pageProps", {})
                    .get("initialState", {}).get("seo", {})
                    .get("categoryPage", {}).get("footer", {})
                    .get("description", ""))
    
    if not html_payload:
        return []
    
    inner_soup = BeautifulSoup(html_payload, "html.parser")
    raw_text = extract_rich_text(inner_soup)
    raw_text = re.sub(r'\n{3,}', '\n\n', raw_text)
    
    # Split into question blocks
    blocks = re.split(r'\n(?=\d+[\.:]\s+[A-Za-z(])', raw_text)
    
    questions = []
    for block in blocks:
        block = block.strip()
        if not re.match(r'^\d+[\.:]\s+', block):
            continue
        
        # Split on Ans:/Ans./Answer:
        parts = re.split(r'\n\s*Ans\s*[:.]\s*|\n\s*ANS\s*[:.]\s*|\n\s*Answer\s*[:.]\s*', block, maxsplit=1)
        
        q_text = parts[0].strip()
        a_text = parts[1].strip() if len(parts) > 1 else "Detailed solution available."
        
        # Clean trailing noise
        for noise in ["Important Formulas", "Chapter Summary", "List of", "FAQs", "Frequently Asked"]:
            a_text = a_text.split(f"\n{noise}")[0]
        
        q_text = q_text.replace('\\[', '$$').replace('\\]', '$$')
        a_text = a_text.replace('\\[', '$$').replace('\\]', '$$')
        
        questions.append({"q": q_text, "a": a_text})
    
    return questions


# === Subject URL Maps ===
subject_configs = {
    "English": {
        str(i): f"https://www.vedantu.com/ncert-solutions/ncert-solutions-class-12-english-flamingo-chapter-{i}"
        for i in range(1, 9)
    },
    "Economics": {
        # Micro (Ch 1-6) + Macro (Ch 7-12)
        **{str(i): f"https://www.vedantu.com/ncert-solutions/ncert-solutions-class-12-micro-economics-chapter-{i}" for i in range(1, 7)},
        **{str(i): f"https://www.vedantu.com/ncert-solutions/ncert-solutions-class-12-macro-economics-chapter-{i-6}" for i in range(7, 13)},
    },
    "Business_studies": {
        str(i): f"https://www.vedantu.com/ncert-solutions/ncert-solutions-class-12-business-studies-chapter-{i}"
        for i in range(1, 13)
    },
}

if __name__ == "__main__":
    for subject_name, urls in subject_configs.items():
        print(f"\n=== Scraping {subject_name.upper()} ===")
        all_data = {}
        
        for ch_num_str, url in urls.items():
            ch_num = int(ch_num_str)
            print(f"  Chapter {ch_num}...", end=" ", flush=True)
            try:
                qs = scrape_chapter(url)
                all_data[ch_num] = qs
                print(f"{len(qs)} questions")
            except Exception as e:
                print(f"FAILED: {e}")
                all_data[ch_num] = []
            time.sleep(0.5)
        
        # Stats
        total = sum(len(qs) for qs in all_data.values())
        empty = sum(1 for qs in all_data.values() for q in qs if q["a"] == "Detailed solution available.")
        imgs = sum(1 for qs in all_data.values() for q in qs if "![" in q["a"])
        print(f"  Total: {total}, With images: {imgs}, Still empty: {empty}")
        
        # Save as JS
        # Normalize name for the JS variable (e.g., Business_studies -> Businessstudies)
        clean_name = subject_name.replace("_", "")
        js_var = f"vedantu{clean_name}Data"
        js_content = f"export const {js_var} = " + json.dumps(all_data, indent=2) + ";"
        filepath = f"src/{js_var}.js"
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(js_content)
        print(f"  Saved to {filepath}")
    
    print("\n✅ All remaining subjects scraped!")
