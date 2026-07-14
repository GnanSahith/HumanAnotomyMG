import os
import json

# Modify chapters_data in memory and run just class 10 maths
with open('src/data/chapters_data.js', 'r') as f:
    js_content = f.read()

# very hacky way to get the dict
json_str = js_content.split("export default ")[1].split(";")[0]
chapters_data = json.loads(json_str)

import scrape_massive

scrape_massive.chapters_data = {"Class 10": {"Maths": chapters_data["Class 10"]["Maths"]}}

