import json

title_map = {
    "hkpdxysv": "Number Patterns with Addition",
    "dmvzqbqj": "Number Patterns with Multiplication",
    "b5apx95m": "Number Patterns for Mixed Operations",
    "pnrnkvrj": "Exploring Patterns with Grids",
    "wcdguqjf": "Identifying Patterns in Input/Output Tables (1)",
    "wmmt7xhr": "Identifying Patterns in Input/Output Tables (2)",
    "rh4usghq": "Identifying Patterns in Input/Output Tables (3)",
    "t4fkp845": "Continuing Visual Patterns",
    "zdthcuav": "Division Models",
    "d9mmpebw": "Creating Division Equations",
    "ccra2fmc": "Multiplication and Division Word Problems",
    "dncz2ppm": "Estimating Products of Whole Numbers",
    "hfefkxwu": "Exploring Division Estimation",
    "njttrs7f": "Exploring Division Estimation Models",
    "peyfxhzs": "Estimating Division to the Nearest Ten",
    "yacyvtjn": "Understanding Products in Word Problems",
    "wnhzbdam": "Division Problems with Remainders",
    "vgp6zrta": "Dividing Whole Numbers",
    "pqmvhxzq": "Long Division With One-Digit Divisors",
    "daqswvxv": "Solving Long Division Step-by-Step",
    "fhqqu6w6": "Division Using an Area Model",
    "fusbjz9b": "Division Word Problems",
    "yabgjfmd": "Multiplication and Division Fact Families",
    "tjkyk2hj": "Multiplying Negative Numbers",
    "nyhvjcaq": "Card Sort - Multiplying and Dividing Integers",
    "mnruf8bu": "Solving One-Step Equations",
    "qcrgez64": "Information in Parts of a Whole",
    "e4wvxtvh": "Key Information for a Word Problem",
    "nkckjvyv": "Describing the Meaning of Parts in an Equation",
    "jjdh8gf3": "Solving Direct Variation Equations"
}

with open('src/data/mathSimulations.json', 'r') as f:
    data = json.load(f)

for key, new_title in title_map.items():
    if key in data:
        # We don't prepend "Practice: " or "Exploration: " because the cards already have a very clean look without it.
        # But wait, earlier I prepended it. Let's just use the clean title!
        data[key]['title'] = new_title

with open('src/data/mathSimulations.json', 'w') as f:
    json.dump(data, f, indent=2)

print("Titles updated successfully.")
