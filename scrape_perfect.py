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

scraped_data = {}

for ch_num, url in urls.items():
    print(f"Scraping exact HTML payload for Chapter {ch_num}...")
    try:
        resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
        soup = BeautifulSoup(resp.text, "html.parser")
        script = soup.find("script", id="__NEXT_DATA__")
        
        if not script:
            continue
            
        data = json.loads(script.string)
        html_payload = data.get("props", {}).get("pageProps", {}).get("initialState", {}).get("seo", {}).get("categoryPage", {}).get("footer", {}).get("description", "")
        
        if not html_payload:
            continue
            
        # Get perfectly flat text with newlines to prevent ANY fragmentation of equations!
        raw_text = BeautifulSoup(html_payload, "html.parser").get_text("\n", strip=True)
        
        # Split purely by newlines followed by a number and dot.
        blocks = re.split(r'\n(?=\d+\.\s+[A-Za-z])', raw_text)
        
        questions = []
        for block in blocks:
            block = block.strip()
            # Must actually start with a number
            if not re.match(r'^\d+\.\s+', block):
                continue
                
            # Allow the loop to continue. The junk will be cleanly split off later.
            # Split the question and answer
            parts = re.split(r'\nAns:', block, maxsplit=1)
            
            q_text = parts[0].strip()
            a_text = parts[1].strip() if len(parts) > 1 else "Detailed solution available."
            
            # Additional cleanup of known Vedantu junk
            a_text = a_text.split("\nImportant Formulas")[0]
            a_text = a_text.split("\nChapter Summary")[0]
            a_text = a_text.split("\nList of")[0]
            
            # Format math equations to use $$ block or $ inline so react-markdown can parse it perfectly
            q_text = q_text.replace('\\[', '$$').replace('\\]', '$$')
            a_text = a_text.replace('\\[', '$$').replace('\\]', '$$')
            
            questions.append({
                "q": q_text,
                "a": a_text
            })
            
        scraped_data[ch_num] = questions
        print(f"  -> Extracted {len(questions)} perfect questions.")
        
    except Exception as e:
        print(f"Failed Chapter {ch_num}: {e}")
        scraped_data[ch_num] = []

js_content = "export const vedantuScrapedData = " + json.dumps(scraped_data, indent=2) + ";"

with open("src/vedantuScrapedData.js", "w", encoding="utf-8") as f:
    f.write(js_content)

print("Scraping completed! Flawless data written to src/vedantuScrapedData.js")
