with open("src/components/ChemistrySimulationView.jsx", "r") as f:
    content = f.read()

import re

# We want to conditionally render the top header.
old_header = """            <div className="maths-header glass-panel" style={{ padding: '24px', margin: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <button 
                            onClick={onBack}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                padding: '8px 16px', borderRadius: '100px',
                                color: '#fff', cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'; }}
                        >
                            <ArrowLeft size={18} /> {t('Back to Portal')}
                        </button>
                        <h1 style={{ fontSize: '32px', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <FlaskConical size={36} color="#ff375f" />
                            {t('Chemistry Interactive Library')}
                        </h1>
                    </div>
                </div>

                <div style={{ position: 'relative', width: '100%', maxWidth: '600px' }}>
                    <Search size={20} color="rgba(255,255,255,0.5)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                        type="text" 
                        placeholder={t("Search simulations...")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '16px 20px 16px 48px',
                            background: 'rgba(0,0,0,0.4)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '16px',
                            color: '#fff',
                            fontSize: '16px',
                            outline: 'none',
                            transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#ff375f'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                </div>
            </div>"""

new_header = """            {!activeSimulation && (
                <div className="maths-header glass-panel" style={{ padding: '24px', margin: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <button 
                                onClick={onBack}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    padding: '8px 16px', borderRadius: '100px',
                                    color: '#fff', cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'; }}
                            >
                                <ArrowLeft size={18} /> {t('Back to Portal')}
                            </button>
                            <h1 style={{ fontSize: '32px', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <FlaskConical size={36} color="#ff375f" />
                                {t('Chemistry Interactive Library')}
                            </h1>
                        </div>
                    </div>

                    <div style={{ position: 'relative', width: '100%', maxWidth: '600px' }}>
                        <Search size={20} color="rgba(255,255,255,0.5)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input 
                            type="text" 
                            placeholder={t("Search simulations...")}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '16px 20px 16px 48px',
                                background: 'rgba(0,0,0,0.4)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '16px',
                                color: '#fff',
                                fontSize: '16px',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#ff375f'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                        />
                    </div>
                </div>
            )}"""

content = content.replace(old_header, new_header)

# Now for the active simulation view
# I want to change the active simulation container to flex: 1, and make it fill the screen properly.
old_active = """                <div style={{ margin: '0 24px' }} className="fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '24px', margin: 0 }}>{activeSimulation.title}</h2>
                        <button 
                            onClick={() => setActiveSimulation(null)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                background: 'rgba(255, 55, 95, 0.2)',
                                border: '1px solid rgba(255, 55, 95, 0.3)',
                                padding: '8px 16px', borderRadius: '100px',
                                color: '#ff375f', cursor: 'pointer'
                            }}
                        >
                            <X size={18} /> Close Simulation
                        </button>
                    </div>
                    <div style={{
                        width: '100%',
                        height: '75vh',
                        background: '#000',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        position: 'relative'
                    }}>"""

new_active = """                <div style={{ margin: '24px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)' }} className="fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ padding: '8px', background: 'rgba(255,55,95,0.2)', borderRadius: '12px', border: '1px solid rgba(255,55,95,0.3)' }}>
                                <FlaskConical size={24} color="#ff375f" />
                            </div>
                            <h2 style={{ fontSize: '24px', margin: 0, fontWeight: 600 }}>{activeSimulation.title}</h2>
                        </div>
                        <button 
                            onClick={() => setActiveSimulation(null)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                padding: '8px 16px', borderRadius: '100px',
                                color: '#fff', cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontWeight: 500
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 55, 95, 0.8)'; e.currentTarget.style.borderColor = '#ff375f'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'; }}
                        >
                            <ArrowLeft size={18} /> Back to Library
                        </button>
                    </div>
                    
                    {/* The Simulation Container */}
                    <div style={{
                        flex: 1,
                        width: '100%',
                        background: '#000',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                        border: '2px solid rgba(255, 255, 255, 0.15)',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {/* We use a wrapper with aspect-ratio to keep it constrained neatly regardless of screen size */}
                        <div style={{
                            width: '100%',
                            height: '100%',
                            position: 'relative'
                        }}>"""

# We need to make sure we close the inner div added in new_active
# Specifically, we replaced `<div style={{...}}` with a flex container and an inner aspect-ratio container.
# We need to add one more `</div>` at the end of the active block.
# Let's do a simple regex or string replace.

content = content.replace(old_active, new_active)

old_active_end = """                        )}
                    </div>
                </div>
            ) : ("""

new_active_end = """                        )}
                        </div>
                    </div>
                </div>
            ) : ("""

content = content.replace(old_active_end, new_active_end)


with open("src/components/ChemistrySimulationView.jsx", "w") as f:
    f.write(content)

print("Patched successfully")
