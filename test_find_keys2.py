import json

with open('debug_vedantu_correct.json') as f:
    data = json.load(f)

def search_str(d, s):
    if isinstance(d, dict):
        for k, v in d.items():
            if isinstance(v, str) and s in v:
                print(f"Found '{s}' in key '{k}'")
            search_str(v, s)
    elif isinstance(d, list):
        for v in d:
            if isinstance(v, str) and s in v:
                print(f"Found '{s}' in list item")
            search_str(v, s)

search_str(data, "Euclid")
