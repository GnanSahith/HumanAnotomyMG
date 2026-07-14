import re
import json
import os

with open('src/chaptersData.js', 'r') as f:
    text = f.read()

# Very basic regex to parse the JS object structure.
# But it's easier to just use node to execute and dump as JSON!
