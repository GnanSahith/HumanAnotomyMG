import requests
import json
import re
from bs4 import BeautifulSoup
import time

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

scraped_data = {}

for ch_num, url in urls.items():
    print(f"Scraping Chapter {ch_num}...")
    try:
        resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
        soup = BeautifulSoup(resp.text, "html.parser")
        
        # We will extract all text blocks and look for "1. ", "2. ", or "Question" to identify Qs
        paragraphs = soup.find_all(['p', 'div', 'h3'])
        
        questions = []
        current_q = None
        current_ans = []
        
        for p in paragraphs:
            text = p.get_text().strip()
            if not text:
                continue
                
            # Basic heuristic to find questions vs answers
            if re.match(r'^(Question\s*\d+|\d+\.)', text) and len(text) > 15:
                if current_q:
                    questions.append({
                        "q": current_q,
                        "a": "\n".join(current_ans) if current_ans else "Detailed solution available in PDF."
                    })
                current_q = text
                current_ans = []
            elif current_q and (text.startswith("Ans:") or text.startswith("Answer") or "Solution" in text or len(text) > 20):
                # Avoid capturing massive menu items
                if "Vedantu" not in text and "Syllabus" not in text:
                    current_ans.append(text)
        
        if current_q:
            questions.append({
                "q": current_q,
                "a": "\n".join(current_ans) if current_ans else "Detailed solution available in PDF."
            })
            
        # Deduplicate and clean
        clean_questions = []
        seen = set()
        for item in questions:
            if item['q'] not in seen:
                seen.add(item['q'])
                clean_questions.append(item)
                
        scraped_data[ch_num] = clean_questions
        
    except Exception as e:
        print(f"Failed Chapter {ch_num}: {e}")
        scraped_data[ch_num] = []

js_content = "export const vedantuScrapedData = " + json.dumps(scraped_data, indent=2) + ";"

with open("src/vedantuScrapedData.js", "w", encoding="utf-8") as f:
    f.write(js_content)

print("Scraping completed! Data written to src/vedantuScrapedData.js")
