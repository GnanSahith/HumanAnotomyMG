import requests
import json
import re
from bs4 import BeautifulSoup

urls = {
    1: "https://www.vedantu.com/ncert-solutions/ncert-solutions-class-12-physics-chapter-1-electric-charges-and-fields",
    2: "https://www.vedantu.com/ncert-solutions/ncert-solutions-class-12-physics-chapter-2-electrostatic-potential-and-capacitance",
    3: "https://www.vedantu.com/ncert-solutions/ncert-solutions-class-12-physics-chapter-3-current-electricity",
    4: "https://www.vedantu.com/ncert-solutions/ncert-solutions-class-12-physics-chapter-4-moving-charges-and-magnetism",
    5: "https://www.vedantu.com/ncert-solutions/ncert-solutions-class-12-physics-chapter-5-magnetism-and-matter",
    6: "https://www.vedantu.com/ncert-solutions/ncert-solutions-class-12-physics-chapter-6-electromagnetic-induction",
    7: "https://www.vedantu.com/ncert-solutions/ncert-solutions-class-12-physics-chapter-7-alternating-current",
    8: "https://www.vedantu.com/ncert-solutions/ncert-solutions-class-12-physics-chapter-8-electromagnetic-waves",
    9: "https://www.vedantu.com/ncert-solutions/ncert-solutions-class-12-physics-chapter-9-ray-optics-and-optical-instruments",
    10: "https://www.vedantu.com/ncert-solutions/ncert-solutions-class-12-physics-chapter-10-wave-optics",
    11: "https://www.vedantu.com/ncert-solutions/ncert-solutions-class-12-physics-chapter-11-dual-nature-of-radiation-and-matter",
    12: "https://www.vedantu.com/ncert-solutions/ncert-solutions-class-12-physics-chapter-12-atoms",
    13: "https://www.vedantu.com/ncert-solutions/ncert-solutions-class-12-physics-chapter-13-nuclei",
    14: "https://www.vedantu.com/ncert-solutions/ncert-solutions-class-12-physics-chapter-14-semiconductor-electronic-material-devices-and-simple-circuits"
}

# The maximum expected official NCERT questions per chapter
expected_counts = {
    1: 34, 2: 11, 3: 15, 4: 13, 5: 8, 6: 10, 7: 11,
    8: 5, 9: 30, 10: 10, 11: 19, 12: 17, 13: 15, 14: 11
}

scraped_data = {}

for ch_num, url in urls.items():
    print(f"Scraping exact HTML payload for Chapter {ch_num}...")
    try:
        resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
        soup = BeautifulSoup(resp.text, "html.parser")
        script = soup.find("script", id="__NEXT_DATA__")
        
        if not script:
            print(f"No NEXT_DATA for Chapter {ch_num}")
            scraped_data[ch_num] = []
            continue
            
        data = json.loads(script.string)
        html_payload = data.get("props", {}).get("pageProps", {}).get("initialState", {}).get("seo", {}).get("categoryPage", {}).get("footer", {}).get("description", "")
        
        if not html_payload:
            print(f"No HTML payload for Chapter {ch_num}")
            scraped_data[ch_num] = []
            continue
            
        # Parse the pristine HTML
        content_soup = BeautifulSoup(html_payload, "html.parser")
        
        # Iterate over block-level elements to prevent fragmenting child spans/mathjax
        elements = content_soup.find_all(['p', 'h3', 'h4', 'li'])
        
        questions = []
        current_q = None
        current_ans = []
        
        # We enforce strict matching to avoid pulling in random junk or formula lists
        for el in elements:
            text = el.get_text(" ", strip=True)
            if not text:
                continue
                
            # If we hit "List of Important Formulas" or "Chapter Summary", we stop capturing to prevent junk
            if "Important Formulas" in text or "Chapter Summary" in text or "Deleted Syllabus" in text or "Other Study Material" in text:
                break
                
            # Match strict question format: "1. ", "2. ", "1.2. ", etc.
            if re.match(r'^(?:Q?\s*\d+(?:\.\d+)?\.)\s+[A-Za-z]', text) or re.match(r'^(?:\d+\.)\s+[A-Z]', text):
                if current_q:
                    questions.append({
                        "q": current_q,
                        "a": "\n".join(current_ans) if current_ans else "Detailed solution available in PDF."
                    })
                current_q = text
                current_ans = []
            elif current_q:
                # Append to answer
                # Only add if it's not a tiny fragment unless it's a math piece
                if len(text) > 2 and "Table of Content" not in text:
                    if text not in current_ans: # avoid duplicate nested spans
                        current_ans.append(text)
        
        if current_q:
            questions.append({
                "q": current_q,
                "a": "\n".join(current_ans) if current_ans else "Detailed solution available in PDF."
            })
            
        # Deduplicate and Cap at expected limit + buffer (to allow sub-questions or additional exercises)
        max_q = expected_counts.get(ch_num, 30) * 1.5
        clean_questions = []
        seen = set()
        for item in questions:
            # The question text should be substantial, not just a number
            if item['q'] not in seen and len(item['q']) > 15:
                seen.add(item['q'])
                # Clean answer of redundant "Ans: Ans:"
                a_clean = item['a']
                if a_clean.startswith("Ans: Ans:"):
                    a_clean = a_clean[5:].strip()
                clean_questions.append({"q": item['q'], "a": a_clean})
                
                if len(clean_questions) >= max_q:
                    break
                    
        scraped_data[ch_num] = clean_questions
        print(f"  -> Extracted {len(clean_questions)} questions.")
        
    except Exception as e:
        print(f"Failed Chapter {ch_num}: {e}")
        scraped_data[ch_num] = []

js_content = "export const vedantuScrapedData = " + json.dumps(scraped_data, indent=2) + ";"

with open("src/vedantuScrapedData.js", "w", encoding="utf-8") as f:
    f.write(js_content)

print("Scraping completed! Clean data written to src/vedantuScrapedData.js")
