import glob
import json

empty_count = 0
total_count = 0
empty_chapters = []

for file in glob.glob('src/data/class_*.js'):
    with open(file, 'r') as f:
        js_content = f.read()
    try:
        # Better JSON extraction
        json_str = js_content.strip().replace("export default ", "")
        if json_str.endswith(";"):
            json_str = json_str[:-1]
            
        data = json.loads(json_str)
        for ch, q_list in data.items():
            total_count += 1
            if not q_list:
                empty_count += 1
                empty_chapters.append(f"{file} - Chapter {ch}")
    except Exception as e:
        print(f"Error parsing {file}: {e}")

print(f"Total chapters: {total_count}")
print(f"Empty chapters: {empty_count}")
if empty_count > 0:
    for e in empty_chapters[:30]:
        print(e)
