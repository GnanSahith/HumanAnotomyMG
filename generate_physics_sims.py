import json

# Curated list of top PhET HTML5 physics simulations
simulations = [
    # Motion & Mechanics
    ("projectile-motion", "Projectile Motion", "Motion & Mechanics"),
    ("forces-and-motion-basics", "Forces and Motion: Basics", "Motion & Mechanics"),
    ("gravity-and-orbits", "Gravity and Orbits", "Motion & Mechanics"),
    ("friction", "Friction", "Motion & Mechanics"),
    ("energy-skate-park", "Energy Skate Park", "Motion & Mechanics"),
    ("masses-and-springs", "Masses and Springs", "Motion & Mechanics"),
    ("pendulum-lab", "Pendulum Lab", "Motion & Mechanics"),
    ("balancing-act", "Balancing Act", "Motion & Mechanics"),
    ("collision-lab", "Collision Lab", "Motion & Mechanics"),
    ("center-and-variability", "Center and Variability", "Motion & Mechanics"),
    
    # Work, Energy & Power
    ("energy-skate-park-basics", "Energy Skate Park: Basics", "Work, Energy & Power"),
    ("hookes-law", "Hooke's Law", "Work, Energy & Power"),
    ("masses-and-springs-basics", "Masses and Springs: Basics", "Work, Energy & Power"),
    
    # Heat & Thermodynamics
    ("states-of-matter", "States of Matter", "Heat & Thermodynamics"),
    ("states-of-matter-basics", "States of Matter: Basics", "Heat & Thermodynamics"),
    ("gas-properties", "Gas Properties", "Heat & Thermodynamics"),
    ("diffusion", "Diffusion", "Heat & Thermodynamics"),
    ("energy-forms-and-changes", "Energy Forms and Changes", "Heat & Thermodynamics"),
    ("blackbody-spectrum", "Blackbody Spectrum", "Heat & Thermodynamics"),
    
    # Sound & Waves
    ("wave-on-a-string", "Wave on a String", "Sound & Waves"),
    ("wave-interference", "Wave Interference", "Sound & Waves"),
    ("sound-waves", "Sound Waves", "Sound & Waves"),
    ("normal-modes", "Normal Modes", "Sound & Waves"),
    ("fourier-making-waves", "Fourier: Making Waves", "Sound & Waves"),
    
    # Electricity, Magnets & Circuits
    ("circuit-construction-kit-dc", "Circuit Construction Kit: DC", "Electricity & Magnets"),
    ("circuit-construction-kit-dc-virtual-lab", "Circuit Construction Kit: DC - Virtual Lab", "Electricity & Magnets"),
    ("circuit-construction-kit-ac", "Circuit Construction Kit: AC", "Electricity & Magnets"),
    ("charges-and-fields", "Charges and Fields", "Electricity & Magnets"),
    ("faradays-law", "Faraday's Law", "Electricity & Magnets"),
    ("ohms-law", "Ohm's Law", "Electricity & Magnets"),
    ("coulombs-law", "Coulomb's Law", "Electricity & Magnets"),
    ("john-travoltage", "John Travoltage", "Electricity & Magnets"),
    ("capacitor-lab-basics", "Capacitor Lab: Basics", "Electricity & Magnets"),
    ("resistance-in-a-wire", "Resistance in a Wire", "Electricity & Magnets"),
    ("balloons-and-static-electricity", "Balloons and Static Electricity", "Electricity & Magnets"),
    
    # Light & Quantum Phenomena
    ("bending-light", "Bending Light", "Light & Quantum"),
    ("color-vision", "Color Vision", "Light & Quantum"),
    ("molecules-and-light", "Molecules and Light", "Light & Quantum"),
    ("rutherford-scattering", "Rutherford Scattering", "Light & Quantum"),
    ("models-of-the-hydrogen-atom", "Models of the Hydrogen Atom", "Light & Quantum"),
    ("photoelectric", "Photoelectric Effect", "Light & Quantum"),
    ("lasers", "Lasers", "Light & Quantum"),
    ("neon-lights-and-other-discharge-lamps", "Neon Lights", "Light & Quantum"),
    ("microwaves", "Microwaves", "Light & Quantum"),
    ("mri", "Simplified MRI", "Light & Quantum")
]

physics_dict = {}
for i, (sim_id, title, category) in enumerate(simulations, start=1):
    key = f"phys_{i}"
    physics_dict[key] = {
        "title": title,
        "description": f"Interactive {title} simulation",
        "url": f"https://phet.colorado.edu/sims/html/{sim_id}/latest/{sim_id}_en.html",
        "thumbnail": f"https://phet.colorado.edu/sims/html/{sim_id}/latest/{sim_id}-600.png",
        "category": category
    }

with open("src/data/physicsSimulations.json", "w") as f:
    json.dump(physics_dict, f, indent=4)

print(f"Successfully wrote {len(physics_dict)} simulations to src/data/physicsSimulations.json")
