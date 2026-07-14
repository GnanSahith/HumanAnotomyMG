import json

with open('src/data/class_5_evs.js', 'r') as f:
    js_content = f.read()

json_str = js_content.strip().replace("export default ", "")
if json_str.endswith(";"):
    json_str = json_str[:-1]
    
data = json.loads(json_str)

ch21 = data.get("21")
print(f"Chapter 21 length: {len(ch21) if ch21 else 'NOT FOUND'}")
if ch21:
    for i, q in enumerate(ch21):
        print(f"Q{i+1}: {q['q']}")
        print(f"A{i+1}: {q['a'][:50]}...")
