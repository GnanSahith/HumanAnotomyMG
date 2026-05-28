with open("src/components/ChemistrySimulationView.jsx", "r") as f:
    content = f.read()

# I need to add state for the loading overlay.
import re
content = content.replace("const [activeSimulation, setActiveSimulation] = useState(null);", 
                          "const [activeSimulation, setActiveSimulation] = useState(null);\n    const [isLoadingSim, setIsLoadingSim] = useState(false);\n")

# When activeSimulation is set, we start the loading overlay
setActiveSimPatch = """
                                        onClick={() => {
                                            setActiveSimulation(sim);
                                            setIsLoadingSim(true);
                                            setTimeout(() => setIsLoadingSim(false), 4500); // Hide splash after 4.5s
                                        }}
"""
content = re.sub(r'onClick=\{\(\) => setActiveSimulation\(sim\)\}', setActiveSimPatch.strip(), content)

# Now, the iframe wrapper needs the loading overlay and the logo hider.
old_iframe_block = """                    <div style={{
                        width: '100%',
                        height: '75vh',
                        background: '#fff',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <iframe 
                            src={activeSimulation.url} 
                            width="100%" 
                            height="100%" 
                            style={{ border: 'none' }}
                            allowFullScreen
                            title={activeSimulation.title}
                        ></iframe>
                    </div>"""

new_iframe_block = """                    <div style={{
                        width: '100%',
                        height: '75vh',
                        background: '#000',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        position: 'relative'
                    }}>
                        <iframe 
                            src={activeSimulation.url} 
                            width="100%" 
                            height="100%" 
                            style={{ border: 'none' }}
                            allowFullScreen
                            title={activeSimulation.title}
                        ></iframe>
                        
                        {/* Hides the PhET logo in the bottom right corner */}
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            width: '160px',
                            height: '45px',
                            background: '#000',
                            zIndex: 10
                        }}></div>

                        {/* Loading Screen Overlay to hide PhET splash screen */}
                        {isLoadingSim && (
                            <div style={{
                                position: 'absolute',
                                top: 0, left: 0, right: 0, bottom: 0,
                                background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
                                zIndex: 20,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff'
                            }}>
                                <FlaskConical size={64} color="#ff375f" style={{ marginBottom: '24px', animation: 'pulse 1.5s infinite' }} />
                                <h3 style={{ fontSize: '24px', margin: '0 0 8px 0', fontWeight: 600 }}>Loading Engine...</h3>
                                <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0 }}>Initializing interactive molecular simulation</p>
                                
                                <div style={{ 
                                    width: '200px', height: '4px', background: 'rgba(255,255,255,0.1)', 
                                    borderRadius: '100px', marginTop: '32px', overflow: 'hidden'
                                }}>
                                    <div style={{ 
                                        width: '100%', height: '100%', background: '#ff375f',
                                        animation: 'loadingBar 4.5s linear forwards'
                                    }}></div>
                                </div>
                            </div>
                        )}
                    </div>"""

content = content.replace(old_iframe_block, new_iframe_block)

# Add keyframes for animations in the file if they don't exist
style_block = """
<style>
    @keyframes loadingBar {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(0); }
    }
    @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.8; }
        100% { transform: scale(1); opacity: 1; }
    }
</style>
"""
if "loadingBar" not in content:
    content = content.replace("return (", "return (\n        <>\n" + style_block)
    content = content.replace("</div>\n    );\n}", "</div>\n        </>\n    );\n}")

with open("src/components/ChemistrySimulationView.jsx", "w") as f:
    f.write(content)

print("Patched iframe overlay and logo blocker")
