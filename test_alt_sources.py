import requests
from bs4 import BeautifulSoup

def test_url(name, url):
    print(f"\n--- Testing {name} ---")
    headers = {"User-Agent": "Mozilla/5.0"}
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, 'html.parser')
            # get a snippet
            if name == "LearnCBSE":
                content = soup.find('div', class_='entry-content')
            else:
                content = soup.body
            
            if content:
                print(content.get_text('\n', strip=True)[:300])
    except Exception as e:
        print(e)

test_url("LearnCBSE", "https://www.learncbse.in/ncert-solutions-for-class-9-science-chapter-1/")
test_url("TiwariAcademy", "https://www.tiwariacademy.com/ncert-solutions/class-9/science/chapter-1/")
test_url("Byjus", "https://byjus.com/ncert-solutions-class-9-science/chapter-1-matter-in-our-surroundings/")
