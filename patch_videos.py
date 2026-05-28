import json

with open("src/data.js", "r") as f:
    content = f.read()

# We need to extract the JS object, modify it, and write it back.
# Since it's a JS file exporting a const array, we can use string replacement or regex.

content = content.replace(
    '"videoSrc": "https://res.cloudinary.com/dy1gyundx/video/upload/v1777416345/Digestive_System_01_g6e8j8.mp4"',
    '"videoSrc": "/assets/videos/Digestive_System.mp4"'
)

# For respiratory, it currently has no videoSrc. We need to insert it.
# Let's find "id": "respiratory" and add videoSrc after description or something.

import re

# Find respiratory system object block
resp_match = re.search(r'("id": "respiratory".*?"iconName": "Wind",)', content, re.DOTALL)
if resp_match:
    block = resp_match.group(1)
    new_block = block + '\n        "videoSrc": "/assets/videos/Respiratory_System.mp4",'
    content = content.replace(block, new_block)

with open("src/data.js", "w") as f:
    f.write(content)

print("Done")
