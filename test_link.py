import re

links = [
    "https://www.vedantu.com/ncert-solutions/ncert-solutions-class-10-maths-chapter-1-real-numbers",
    "/revision-notes/cbse-class-10-maths-notes-chapter-1",
    "https://www.vedantu.com/textbook-solutions/ncert-exemplar-solutions-class-10-maths-chapter-1",
    "https://www.vedantu.com/rd-sharma-solutions/class-10-chapter-1-real-numbers-solutions",
    "https://www.vedantu.com/ncert-solutions/ncert-solutions-class-10-maths-chapter-1-exercise-1-1"
]

chapter_links = {}
for href in links:
    match = re.search(r'chapter-(\d+)', href)
    if match and "class-10-maths" in href and "ncert-solutions" in href:
        ch_num = int(match.group(1))
        if not href.startswith('http'):
            href = 'https://www.vedantu.com' + href
        if ch_num not in chapter_links or len(href) < len(chapter_links[ch_num]):
            chapter_links[ch_num] = href

print(chapter_links)
