import json

with open('debug_vedantu.json') as f:
    data = json.load(f)

info = data["props"]["pageProps"]["initialState"]["seo"]["info"]
print(list(info.keys()))
if "content" in info:
    print(info["content"][:200])

