import json

with open('src/data/class_3_english.js', 'r') as f:
    js_content = f.read()

json_str = js_content.strip().replace("export default ", "")
if json_str.endswith(";"):
    json_str = json_str[:-1]

data = json.loads(json_str)
ch8 = data.get("chapter-8") or data.get("chapter8") or data.get("8")
if not ch8:
    print("Chapter 8 not found as a key.")
    print("Keys are:", list(data.keys()))
else:
    print(f"Chapter 8 has {len(ch8)} items.")
    for qa in ch8:
        print(f"Q: {qa['q']}")
        print(f"A: {qa['a']}")
