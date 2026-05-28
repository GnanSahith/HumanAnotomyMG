"""
Image-aware scraper for Vedantu NCERT Solutions.
Extracts both text AND image URLs from answers, embedding them as markdown ![alt](url).
"""
import requests
import json
import re
import time
from bs4 import BeautifulSoup, NavigableString, Tag

def scrape_chapter(url):
    """Scrape a single chapter, preserving images in answers."""
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
    
    # Walk the DOM tree and build a text stream that preserves images as markdown
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
    
    raw_text = extract_rich_text(inner_soup)
    
    # Clean up excessive newlines
    raw_text = re.sub(r'\n{3,}', '\n\n', raw_text)
    
    # Split into question blocks (handles "1. Question" or "1: Question")
    blocks = re.split(r'\n(?=\d+[\.:]\s+[A-Za-z(])', raw_text)
    
    questions = []
    for block in blocks:
        block = block.strip()
        if not re.match(r'^\d+[\.:]\s+', block):
            continue
        
        # Split on Ans: or Ans. (various formats observed across subjects)
        parts = re.split(r'\n\s*Ans\s*[:.]\s*|\n\s*ANS\s*[:.]\s*|\n\s*Answer\s*[:.]\s*', block, maxsplit=1)
        
        q_text = parts[0].strip()
        a_text = parts[1].strip() if len(parts) > 1 else "Detailed solution available."
        
        # Clean trailing noise
        for noise in ["Important Formulas", "Chapter Summary", "List of"]:
            a_text = a_text.split(f"\n{noise}")[0]
        
        # Convert LaTeX delimiters
        q_text = q_text.replace('\\[', '$$').replace('\\]', '$$')
        a_text = a_text.replace('\\[', '$$').replace('\\]', '$$')
        
        questions.append({"q": q_text, "a": a_text})
    
    return questions


def scrape_subject(subject_name, urls_dict):
    """Scrape all chapters for a subject."""
    all_data = {}
    for ch_num_str, url in urls_dict.items():
        ch_num = int(ch_num_str)
        print(f"  Chapter {ch_num}...", end=" ", flush=True)
        try:
            qs = scrape_chapter(url)
            all_data[ch_num] = qs
            print(f"{len(qs)} questions")
        except Exception as e:
            print(f"FAILED: {e}")
            all_data[ch_num] = []
        time.sleep(0.5)  # Rate limit
    return all_data


if __name__ == "__main__":
    with open("subject_urls.json", "r") as f:
        subject_urls = json.load(f)
    
    for sub, urls in subject_urls.items():
        print(f"\n=== Scraping {sub.upper()} (with images) ===")
        data = scrape_subject(sub, urls)
        
        # Count improvements
        empty = sum(1 for qs in data.values() for q in qs if q["a"] == "Detailed solution available.")
        imgs = sum(1 for qs in data.values() for q in qs if "![" in q["a"])
        total = sum(len(qs) for qs in data.values())
        print(f"  Total: {total}, With images: {imgs}, Still empty: {empty}")
        
        js_var = f"vedantu{sub.capitalize()}Data"
        js_content = f"export const {js_var} = " + json.dumps(data, indent=2) + ";"
        with open(f"src/{js_var}.js", "w", encoding="utf-8") as f:
            f.write(js_content)
        print(f"  Saved to src/{js_var}.js")
    
    print("\n✅ All subjects re-scraped with image support!")
