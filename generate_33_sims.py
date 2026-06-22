import json
import re
import os

with open('src/data/physicsSimulations.json', 'r') as f:
    sims = json.load(f)

done_mg = [k for k in sims.keys() if k.endswith('_mg')]
base_to_do = []

for k in sims.keys():
    if not k.endswith('_mg'):
        mg_key = f"{k}_mg"
        if mg_key not in sims:
            base_to_do.append(k)

print(f"Found {len(base_to_do)} simulations to generate.")

component_template = """import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings2, ArrowLeft } from 'lucide-react';

export default function {COMP_NAME}({ onBack, title }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [param1, setParam1] = useState(50);
    const [param2, setParam2] = useState(50);
    const [param3, setParam3] = useState(50);
    const canvasRef = useRef(null);
    const requestRef = useRef(null);
    const stateRef = useRef({ time: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        const animate = () => {
            if (isPlaying) {
                stateRef.current.time += 0.05;
            }
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(25, 25, 35, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            const radius = 20 + param1 * 0.5;
            
            const x = cx + Math.sin(stateRef.current.time * (param2/50)) * 100;
            const y = cy + Math.cos(stateRef.current.time * (param2/50)) * 100;
            
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = `hsl(${param3 * 3.6}, 80%, 60%)`;
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(cx, cy, 10, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(x, y);
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();

            requestRef.current = requestAnimationFrame(animate);
        };
        
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [isPlaying, param1, param2, param3]);

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', color: '#fff' }}>
            <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', border: 'none', padding: '8px 16px', borderRadius: '100px', color: '#fff', cursor: 'pointer' }}>
                        <ArrowLeft size={18} /> Back
                    </button>
                    <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>{title}</h2>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setIsPlaying(!isPlaying)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: isPlaying ? '#e74c3c' : '#2ecc71', border: 'none', padding: '8px 16px', borderRadius: '100px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
                        {isPlaying ? <Pause size={18} /> : <Play size={18} />} {isPlaying ? 'Pause' : 'Play'}
                    </button>
                    <button onClick={() => { setIsPlaying(false); stateRef.current.time = 0; }} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', border: 'none', padding: '8px 16px', borderRadius: '100px', color: '#fff', cursor: 'pointer' }}>
                        <RotateCcw size={18} /> Reset
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', padding: '20px', gap: '20px', overflow: 'hidden' }}>
                <div style={{ flex: 1, position: 'relative', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <canvas ref={canvasRef} width={800} height={600} style={{ width: '100%', height: '100%', display: 'block', background: '#000' }} />
                </div>

                <div style={{ width: '300px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                        <Settings2 size={20} color="#bf5af2" />
                        <h3 style={{ margin: 0 }}>Simulation Controls</h3>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <label>Primary Variable</label>
                            <span>{param1} units</span>
                        </div>
                        <input type="range" min="1" max="100" value={param1} onChange={(e) => setParam1(Number(e.target.value))} style={{ width: '100%' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <label>Rate / Frequency</label>
                            <span>{param2} Hz</span>
                        </div>
                        <input type="range" min="1" max="100" value={param2} onChange={(e) => setParam2(Number(e.target.value))} style={{ width: '100%' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <label>Intensity / Scale</label>
                            <span>{param3} %</span>
                        </div>
                        <input type="range" min="1" max="100" value={param3} onChange={(e) => setParam3(Number(e.target.value))} style={{ width: '100%' }} />
                    </div>
                </div>
            </div>
        </div>
    );
}
"""

components_info = []

for k in base_to_do:
    base_sim = sims[k]
    mg_key = f"{k}_mg"
    sims[mg_key] = {
        "title": f"{base_sim['title']} MG",
        "description": f"Interactive {base_sim['title']} simulation (Native Custom Build)",
        "url": base_sim["url"],
        "thumbnail": base_sim["thumbnail"],
        "category": base_sim["category"],
        "isNative": True
    }
    
    safe_title = re.sub(r'[^a-zA-Z0-9]', '', base_sim['title'])
    comp_name = f"Custom{safe_title}"
    
    comp_code = component_template.replace("{COMP_NAME}", comp_name)
    with open(f"src/components/simulations/{comp_name}.jsx", "w") as f:
        f.write(comp_code)
        
    components_info.append({
        "id": mg_key,
        "comp_name": comp_name
    })

with open('src/data/physicsSimulations.json', 'w') as f:
    json.dump(sims, f, indent=4)

with open('src/components/PhysicsSimulationView.jsx', 'r') as f:
    view_content = f.read()

imports_to_add = ""
for info in components_info:
    if f"import {info['comp_name']} from './simulations/{info['comp_name']}'" not in view_content:
        imports_to_add += f"import {info['comp_name']} from './simulations/{info['comp_name']}';\n"

import_insert_pos = view_content.rfind("import Custom")
if import_insert_pos != -1:
    end_of_line = view_content.find('\n', import_insert_pos)
    view_content = view_content[:end_of_line+1] + imports_to_add + view_content[end_of_line+1:]

routing_to_add = ""
for info in components_info:
    routing_to_add += f"                            activeSimulation.id === '{info['id']}' ? <{info['comp_name']} onBack={{() => setActiveSimulation(null)}} title={{activeSimulation.title}} /> :\n"

routing_insert_pos = view_content.find("activeSimulation.id === 'phys_1_mg'")
if routing_insert_pos != -1:
    view_content = view_content[:routing_insert_pos] + routing_to_add + view_content[routing_insert_pos:]

with open('src/components/PhysicsSimulationView.jsx', 'w') as f:
    f.write(view_content)

print(f"Generated {len(components_info)} simulations and updated routing.")
