import json
with open('src/vedantuScrapedData.js', 'r') as f:
    text = f.read()

text = text.replace('export const vedantuScrapedData = ', '')
data = json.loads(text)
for k, v in data.items():
    print(f"Chapter {k}: {len(v)} questions")
