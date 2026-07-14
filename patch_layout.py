import os
import re

filepath = '/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/SimulationLibraryLayout.jsx'

with open(filepath, 'r') as f:
    content = f.read()

# 1. Update lucide-react import
if 'Calculator' not in content:
    content = content.replace(
        "import { ArrowLeft, Search, Filter, PlayCircle, Lock, LayoutGrid, List } from 'lucide-react';",
        "import { ArrowLeft, Search, Filter, PlayCircle, Lock, LayoutGrid, List, Calculator, Hexagon, Ruler, PlusSquare, BarChart, Library } from 'lucide-react';"
    )

# 2. Add cleanTitle helper before SimulationLibraryLayout definition
if 'const cleanTitle =' not in content:
    content = content.replace(
        'export default function SimulationLibraryLayout',
        "const cleanTitle = (title) => {\n    if (!title) return '';\n    return title.replace(/(Practice|Exploration)?GR\\.\\s*(4-5|6-8|9-12)GRADES\\s*(4-5|6-8|9-12)/gi, (m, t) => t ? t + ': ' : '');\n};\n\nexport default function SimulationLibraryLayout"
    )

# 3. Update the fallback thumbnail logic
old_fallback = """                                        <div style={{
                                            width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1,
                                            background: `linear-gradient(135deg, hsl(${sim.id ? sim.id.split('').reduce((a,b)=>a+b.charCodeAt(0),0)%360 : 220}, 60%, 15%) 0%, #0f172a 100%)`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
                                        }}>
                                            <span style={{ fontSize: '64px', color: 'rgba(255,255,255,0.1)', fontWeight: 800, userSelect: 'none' }}>
                                                {sim.category ? sim.category.substring(0, 1).toUpperCase() : 'M'}
                                            </span>
                                            <PlayCircle size={32} color="rgba(255,255,255,0.2)" style={{ position: 'absolute' }} />
                                        </div>"""

new_fallback = """                                        <div style={{
                                            width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1,
                                            background: `linear-gradient(135deg, hsl(${Math.abs(sim.id ? sim.id.split('').reduce((a,b)=>((a<<5)-a)+b.charCodeAt(0),0) : 0)%360}, 70%, 25%) 0%, #0f172a 100%)`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
                                        }}>
                                            {(() => {
                                                const cat = (sim.category || '').toLowerCase();
                                                let Icon = Library;
                                                if (cat.includes('algebra')) Icon = Calculator;
                                                else if (cat.includes('geometry')) Icon = Hexagon;
                                                else if (cat.includes('measurement')) Icon = Ruler;
                                                else if (cat.includes('operations')) Icon = PlusSquare;
                                                else if (cat.includes('statistics') || cat.includes('data')) Icon = BarChart;
                                                return <Icon size={80} color="rgba(255,255,255,0.15)" strokeWidth={1.5} />;
                                            })()}
                                            <PlayCircle size={40} color="rgba(255,255,255,0.4)" style={{ position: 'absolute' }} />
                                        </div>"""

content = content.replace(old_fallback, new_fallback)

# 4. Use cleanTitle when displaying the title and remove textTransform: uppercase
content = content.replace(
    """                                <h3 style={{ 
                                    fontSize: '16px', fontWeight: 600, color: '#fff', 
                                    margin: '0 0 8px 0', lineHeight: 1.4,
                                    textTransform: 'uppercase', letterSpacing: '0.05em'
                                }}>
                                    {sim.title}
                                </h3>""",
    """                                <h3 style={{ 
                                    fontSize: '16px', fontWeight: 600, color: '#fff', 
                                    margin: '0 0 8px 0', lineHeight: 1.4,
                                    letterSpacing: '0.02em'
                                }}>
                                    {cleanTitle(sim.title)}
                                </h3>"""
)

with open(filepath, 'w') as f:
    f.write(content)
print("Layout patched successfully.")
