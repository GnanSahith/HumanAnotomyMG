import json
with open('debug_vedantu.json') as f:
    data = json.load(f)

page = data["props"]["pageProps"]["initialState"]["seo"]["categoryPage"]
print(type(page))
if isinstance(page, list):
    print(f"Length: {len(page)}")
    if len(page) > 0:
        print(type(page[0]))
        if isinstance(page[0], dict):
            print(list(page[0].keys()))
elif isinstance(page, dict):
    print(list(page.keys()))

