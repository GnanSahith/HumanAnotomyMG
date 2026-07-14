import glob
import json

missing_data = []

for file in sorted(glob.glob('src/data/class_*.js')):
    base = file.replace('src/data/class_', '').replace('.js', '')
    parts = base.split('_')
    cls = parts[0]
    subject = " ".join(parts[1:]).title()
    
    with open(file, 'r') as f:
        js_content = f.read()
        
    try:
        json_str = js_content.strip().replace("export default ", "")
        if json_str.endswith(";"):
            json_str = json_str[:-1]
            
        data = json.loads(json_str)
        
        for ch, q_list in data.items():
            valid_questions = 0
            for qa in q_list:
                q_lower = qa['q'].lower()
                is_seo = 'cbse class' in q_lower or 'ncert solutions' in q_lower or 'important questions' in q_lower
                is_missing = qa['a'] == 'Detailed solution available.' or len(qa['a'].strip()) < 10
                
                if not is_seo and not is_missing:
                    valid_questions += 1
            
            if valid_questions == 0:
                missing_data.append((int(cls), subject, int(ch.replace('chapter-', '').replace('chapter', '')) if 'chapter' in ch else ch))
    except Exception as e:
        print(f"Error parsing {file}: {e}")

# Sort by Class then Subject then Chapter
missing_data.sort(key=lambda x: (x[0], x[1], x[2] if isinstance(x[2], int) else 999))

with open('/Users/gnansahith/.gemini/antigravity/brain/107ca816-07af-44c0-91ad-17ea12d689b1/missing_chapters_report.md', 'w') as f:
    f.write("# Remaining Missing Chapters Report\n\n")
    f.write(f"Total Missing: {len(missing_data)}\n\n")
    f.write("| Class | Subject | Chapter |\n")
    f.write("|---|---|---|\n")
    for cls, subj, ch in missing_data:
        f.write(f"| {cls} | {subj} | {ch} |\n")

print(f"Generated report with {len(missing_data)} missing chapters.")
