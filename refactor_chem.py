import os
import re

chemistry_files = [
    'CustomAcidBaseSolutions.jsx', 'CustomAtomicInteractions.jsx', 'CustomBalancingAct.jsx',
    'CustomBalancingChemicalEquations.jsx', 'CustomBalloonsandStaticElectricity.jsx', 'CustomBeersLawLab.jsx',
    'CustomBlackbodySpectrum.jsx', 'CustomBuildAMolecule.jsx', 'CustomBuildANucleus.jsx',
    'CustomBuildAnAtom.jsx', 'CustomBuoyancy.jsx', 'CustomBuoyancyBasics.jsx',
    'CustomConcentration.jsx', 'CustomCoulombsLaw.jsx', 'CustomDensity.jsx',
    'CustomDiffusion.jsx', 'CustomEnergyFormsandChanges.jsx', 'CustomFourierMakingWaves.jsx',
    'CustomGasProperties.jsx', 'CustomGasesIntro.jsx'
]

dir_path = 'src/components/simulations'

for filename in chemistry_files:
    filepath = os.path.join(dir_path, filename)
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r') as f:
        content = f.read()

    # 1. Remove Back button: <button onClick={onBack} ...> <ArrowLeft .../> ... </button>
    # It might span multiple lines.
    content = re.sub(r'<button[^>]*onClick=\{onBack\}[^>]*>[\s\S]*?<ArrowLeft[^>]*>[\s\S]*?</button>', '', content)
    
    # 2. Remove the {title} header. Usually <h1...> {title} </h1> or <h2...>{title}</h2>
    content = re.sub(r'<h[1-3][^>]*>[\s\S]*?\{title(?: \|\| [^}]+)?\}[\s\S]*?</h[1-3]>', '', content)
    
    # 3. Fix the Top Header background to transparent
    content = re.sub(r'background:\s*\'linear-gradient\([^)]+\)\'', "background: 'transparent'", content)
    content = re.sub(r'background:\s*\'rgba\(0,0,0,0\.5\)\'', "background: 'transparent'", content)
    content = re.sub(r'background:\s*\'rgba\(20,\s*20,\s*30,\s*0\.8\)\'', "background: 'rgba(255,255,255,0.05)'", content) # panels
    
    # Let's target the inner right-side control panels that have #1c1c1e or #14141e
    content = re.sub(r"'#1c1c1e'", "'rgba(255, 255, 255, 0.05)'", content)
    content = re.sub(r"'#14141e'", "'rgba(255, 255, 255, 0.05)'", content)
    
    # Fix the wrapper padding/margin so it's flush
    content = re.sub(r'justifyContent:\s*\'space-between\'', "justifyContent: 'flex-end'", content)
    
    with open(filepath, 'w') as f:
        f.write(content)
        
print("Refactoring complete.")
