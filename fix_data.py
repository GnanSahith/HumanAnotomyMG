import json
import re

with open('src/data.js', 'r') as f:
    text = f.read()

# Extract JSON
start_idx = text.find('export const systemsData = ') + len('export const systemsData = ')
json_text = text[start_idx:]
# remove trailing semicolon
if json_text.strip().endswith(';'):
    json_text = json_text.strip()[:-1]

try:
    data = json.loads(json_text)
except Exception as e:
    print("Error parsing json", e)
    exit(1)

# Paths
respiratory_models = {
    "entire": "./assets/models/Respiratory_System/Respiratory_System_01.fbx",
    "nose": "./assets/models/Respiratory_System/Nose.fbx",
    "pharynx": "./assets/models/Respiratory_System/Pharynx.fbx",
    "larynx": "./assets/models/Respiratory_System/Larynx.fbx",
    "trachea": "./assets/models/Respiratory_System/Trachea.fbx",
    "diaphragm": "./assets/models/Respiratory_System/Diaphragm.fbx"
}
circulatory_models = {
    "entire": "./assets/models/Circulatory_System/Circulatory_System.fbx",
    "heart": "./assets/models/Circulatory_System/Heart.fbx",
    "arteries": "./assets/models/Circulatory_System/Arteries.fbx",
    "veins": "./assets/models/Circulatory_System/Veins.fbx"
}
nervous_models = {
    "entire": "./assets/models/Nervous_System/Nervous_System.fbx",
    "brain": "./assets/models/Nervous_System/Brain_Lobe_Left.fbx",  # or combined if we had one
    "nerves": "./assets/models/Nervous_System/Nerves_Left.fbx"
}

for system in data:
    sid = system["id"]
    if sid == "respiratory":
        # Add entire
        entire = {
            "id": "respiratory_entire",
            "name": {"en": "Entire Respiratory System", "hi": "संपूर्ण श्वसन तंत्र", "te": "పూర్తి శ్వాసకోశ వ్యవస్థ"},
            "description": "The entire human respiratory system as a single combined model.",
            "modelSrc": respiratory_models["entire"]
        }
        # prepend entire to organs
        if system["organs"][0]["id"] != "respiratory_entire":
            system["organs"].insert(0, entire)
        for organ in system["organs"]:
            if organ["id"] in respiratory_models:
                organ["modelSrc"] = respiratory_models[organ["id"]]
    
    elif sid == "circulatory":
        entire = {
            "id": "circulatory_entire",
            "name": {"en": "Entire Circulatory System", "hi": "संपूर्ण परिसंचरण तंत्र", "te": "పూర్తి రక్త ప్రసరణ వ్యవస్థ"},
            "description": "The entire human circulatory system.",
            "modelSrc": circulatory_models["entire"]
        }
        if system["organs"][0]["id"] != "circulatory_entire":
            system["organs"].insert(0, entire)
        for organ in system["organs"]:
            if organ["id"] in circulatory_models:
                organ["modelSrc"] = circulatory_models[organ["id"]]

    elif sid == "nervous":
        entire = {
            "id": "nervous_entire",
            "name": {"en": "Entire Nervous System", "hi": "संपूर्ण तंत्रिका तंत्र", "te": "పూర్తి నాడీ వ్యవస్థ"},
            "description": "The entire human nervous system.",
            "modelSrc": nervous_models["entire"]
        }
        if system["organs"][0]["id"] != "nervous_entire":
            system["organs"].insert(0, entire)
        for organ in system["organs"]:
            if organ["id"] in nervous_models:
                organ["modelSrc"] = nervous_models[organ["id"]]

new_text = text[:start_idx] + json.dumps(data, indent=4) + ';\n'

with open('src/data.js', 'w') as f:
    f.write(new_text)

print("Updated data.js")
