import json

with open('debug_vedantu.json') as f:
    data = json.load(f)

def search_str(d, path=""):
    if isinstance(d, dict):
        for k, v in d.items():
            if isinstance(v, str) and "Euclid" in v:
                print(f"Found 'Euclid' in: {path}.{k}")
            search_str(v, path + "." + k)
    elif isinstance(d, list):
        for i, v in enumerate(d):
            if isinstance(v, str) and "Euclid" in v:
                print(f"Found 'Euclid' in list item {path}[{i}]")
            search_str(v, path + f"[{i}]")

search_str(data, "root")
