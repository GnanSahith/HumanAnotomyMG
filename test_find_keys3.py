import json

with open('debug_vedantu_correct.json') as f:
    data = json.load(f)

def search_str(d, s, path=""):
    if isinstance(d, dict):
        for k, v in d.items():
            if isinstance(v, str) and s in v:
                print(f"Found '{s}' in: {path}.{k}")
            search_str(v, path + "." + k)
    elif isinstance(d, list):
        for i, v in enumerate(d):
            if isinstance(v, str) and s in v:
                print(f"Found '{s}' in list item {path}[{i}]")
            search_str(v, path + f"[{i}]")

search_str(data, "Euclid")
