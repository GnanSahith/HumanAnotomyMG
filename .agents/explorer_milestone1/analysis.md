# Analysis and Refactoring Plan

This analysis examines the current styling, structure, and props of `CustomCircuitConstructionKitDC.jsx` and outlines the exact changes required to migrate it to the Design System without affecting the internal physics solver or simulation loops.

## Current Component Overview

### Props
- `onBack`: (Function) Invoked when the user clicks the "Go back" back button.
- `title`: (String) Displayed as the header title, defaulting to `'Circuit Construction Kit (DC)'`.

### Structure
1. **Outer Wrapper**: Standard `div` with a vertical flex layout (`flex flex-col h-screen w-full`).
2. **Top Header**: Structured as a flex block inside the main document flow.
3. **Workspace Area**: Splits the remaining screen height horizontally into:
   - **Canvas Container**: Centered canvas using flex centering.
   - **Aside Panel**: A right-side docked sidebar (`w-80`) with styling `bg-slate-900/90`.

---

## Design System Target Styling

### 1. Global Wrapper
- **Target Style**: `style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a1a' }}`
- **Changes**: Remove vertical flex (`flex-col`) and height class `h-screen`, and apply absolute/relative positioning layout since elements are absolute.

### 2. Top Header Bar
- **Target Style**: `style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}`
- **Changes**: Detach from document flow, float it above the canvas layer.

### 3. Glassmorphic Buttons
- **Back Button**:
  - Class: `ds-btn-glass ds-btn-back`
  - Normal style: `background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)', color: 'white', cursor: 'pointer', transition: 'all 0.3s ease', borderRadius: '8px', padding: '10px 20px'`
  - Hover style: `background: 'rgba(255, 55, 95, 0.8)', borderColor: '#ff375f'`
- **Reset Button ("Clear Board")**:
  - Class: `ds-btn-glass ds-btn-reset`
  - Normal style: Same glassmorphism base.
  - Hover style: `background: 'rgba(52, 152, 219, 0.4)', borderColor: '#3498db'`

### 4. Floating Control Panels
- **Sidebar Panel (`aside`)**:
  - Convert to floating box:
    ```javascript
    style={{
      position: 'absolute',
      right: '20px',
      top: '100px',
      bottom: '20px',
      width: '320px',
      display: 'flex',
      flexDirection: 'column',
      background: 'rgba(20, 20, 30, 0.8)',
      border: '1px solid rgba(255,255,255,0.1)',
      backdropFilter: 'blur(12px)',
      padding: '20px',
      borderRadius: '16px',
      zIndex: 10,
      color: 'white',
      fontFamily: "'Inter', sans-serif",
      overflowY: 'auto'
    }}
    ```
- **HUD & Alerts**:
  - Standardize help HUD and burnout alerts as glassmorphic absolute floating components on the left side, mirroring the right sidebar layout.

### 5. Checkboxes, Sliders & Toggles
- Apply `style={{ accentColor: '#3498db' }}` directly to the HTML inputs (`type="checkbox"` and `type="range"`) and replace Tailwind focus ring colors with `#3498db`.

### 6. Canvas Wrapper
- **Target Style**: `style={{ position: 'absolute', inset: 0, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}`
- **Canvas Element Style**: Add `style={{ pointerEvents: 'auto' }}` so interactions work while wrapper click-through is enabled.

---

## Proposed Diff/Plan

Here is the precise JSX modification plan for the return block:

```diff
<<<<
  return (
    <div
      ref={containerRef}
      className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 font-sans selection:bg-sky-500 selection:text-white"
    >
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 shadow-md backdrop-blur-md z-10">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center justify-center p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              {title || 'Circuit Construction Kit (DC)'}
            </h1>
            <p className="text-xs text-slate-400">Build, test, and solve custom DC circuits interactively</p>
          </div>
        </div>

        {/* Presets dropdown & reset */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 bg-slate-800/80 rounded-lg p-1 border border-slate-700">
            <span className="text-xs font-semibold px-2 text-slate-400">Presets:</span>
            <button
              onClick={() => loadPreset('simple')}
              className="text-xs px-2.5 py-1 rounded-md bg-slate-900 text-slate-300 hover:bg-slate-700 transition"
            >
              Simple
            </button>
            <button
              onClick={() => loadPreset('series')}
              className="text-xs px-2.5 py-1 rounded-md bg-slate-900 text-slate-300 hover:bg-slate-700 transition"
            >
              Series
            </button>
            <button
              onClick={() => loadPreset('parallel')}
              className="text-xs px-2.5 py-1 rounded-md bg-slate-900 text-slate-300 hover:bg-slate-700 transition"
            >
              Parallel
            </button>
            <button
              onClick={() => loadPreset('short')}
              className="text-xs px-2.5 py-1 rounded-md bg-slate-900 text-slate-300 hover:bg-slate-700 transition"
            >
              Short Circuit
            </button>
          </div>

          <button
            onClick={() => loadPreset('empty')}
            className="flex items-center justify-center space-x-1 px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900/80 border border-red-800/50 text-red-200 text-xs font-semibold transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Board</span>
          </button>
        </div>
      </header>

      {/* Main workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 relative bg-slate-950 flex items-center justify-center p-4">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-full max-h-full aspect-[4/3] block"
          />

          {/* Help Overlay HUD */}
          <div className="absolute bottom-6 left-6 pointer-events-none bg-slate-900/90 border border-slate-800 backdrop-blur rounded-lg p-3 max-w-xs text-xs space-y-1.5 text-slate-400">
            <div className="font-semibold text-slate-200 flex items-center space-x-1">
              <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
              <span>Interactive Controls</span>
            </div>
            <div>• Drag component <span className="text-sky-300">body</span> to translate.</div>
            <div>• Drag endpoints <span className="text-sky-300">(dashed rings)</span> to route.</div>
            <div>• Snap endpoints together to establish joints.</div>
            <div>• Click switches to toggle open/closed.</div>
            <div>• Double-click is disabled; use sidebar to delete.</div>
          </div>

          {/* Burnout alarm */}
          {burnoutNotice && (
            <div className="absolute top-6 left-6 bg-red-950/90 border border-red-800 backdrop-blur rounded-lg p-3 max-w-xs text-xs space-y-1.5 text-red-200 animate-pulse flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <div>
                <div className="font-bold text-red-100">Component Burned Out!</div>
                <div>{burnoutNotice}</div>
                <div className="text-[10px] text-red-300 mt-1">Select the component and click "Repair" to restore.</div>
              </div>
            </div>
          )}
        </div>

        {/* Control Sidebar */}
        <aside className="w-80 border-l border-slate-800 bg-slate-900/90 backdrop-blur-md flex flex-col overflow-y-auto">
          {/* Section 1: Component Palette */}
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-sm font-bold tracking-wider text-slate-400 uppercase mb-3 flex items-center space-x-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Add Components</span>
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleAddComponent('wire')}
                className="flex items-center space-x-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 transition"
              >
                <div className="w-3 h-3 bg-slate-400 rounded-full" />
                <span>Wire</span>
              </button>
              <button
                onClick={() => handleAddComponent('battery')}
                className="flex items-center space-x-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 transition"
              >
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Battery</span>
              </button>
              <button
                onClick={() => handleAddComponent('resistor')}
                className="flex items-center space-x-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 transition"
              >
                <Sliders className="w-4 h-4 text-rose-500" />
                <span>Resistor</span>
              </button>
              <button
                onClick={() => handleAddComponent('bulb')}
                className="flex items-center space-x-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 transition"
              >
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                <span>Light Bulb</span>
              </button>
              <button
                onClick={() => handleAddComponent('switch')}
                className="flex items-center space-x-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 transition"
              >
                <Power className="w-4 h-4 text-indigo-400" />
                <span>Switch</span>
              </button>
            </div>
          </div>

          {/* Section 2: Interactive Tools */}
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-sm font-bold tracking-wider text-slate-400 uppercase mb-3 flex items-center space-x-2">
              <Activity className="w-4 h-4 text-sky-400" />
              <span>Measurement Tools</span>
            </h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-800 border border-slate-700 cursor-pointer hover:bg-slate-700/60 transition">
                <span className="text-xs text-slate-200 flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span>Enable Voltmeter</span>
                </span>
                <input
                  type="checkbox"
                  checked={showVoltmeter}
                  onChange={(e) => {
                    setShowVoltmeter(e.target.checked);
                    if (e.target.checked) {
                      setVoltmeterBox({ x: 580, y: 120 });
                      setVoltmeterRed({ x: 550, y: 220 });
                      setVoltmeterBlack({ x: 620, y: 220 });
                    }
                  }}
                  className="rounded border-slate-600 bg-slate-900 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-900 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-800 border border-slate-700 cursor-pointer hover:bg-slate-700/60 transition">
                <span className="text-xs text-slate-200 flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <span>Enable Ammeter</span>
                </span>
                <input
                  type="checkbox"
                  checked={showAmmeter}
                  onChange={(e) => {
                    setShowAmmeter(e.target.checked);
                    if (e.target.checked) {
                      setAmmeterProbe({ x: 600, y: 150 });
                    }
                  }}
                  className="rounded border-slate-600 bg-slate-900 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-900 w-4 h-4"
                />
              </label>
            </div>
          </div>

          {/* Section 3: Visual Settings */}
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-sm font-bold tracking-wider text-slate-400 uppercase mb-3 flex items-center space-x-2">
              <Eye className="w-4 h-4 text-violet-400" />
              <span>Simulation Options</span>
            </h3>
            <div className="space-y-4">
              {/* Flow Visualizer Selection */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1.5 uppercase">Current Flow Visuals</label>
                <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setCurrentFlowType('electrons')}
                    className={`text-[10px] py-1 px-1.5 rounded font-medium transition ${currentFlowType === 'electrons' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Electrons
                  </button>
                  <button
                    onClick={() => setCurrentFlowType('conventional')}
                    className={`text-[10px] py-1 px-1.5 rounded font-medium transition ${currentFlowType === 'conventional' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Conventional
                  </button>
                  <button
                    onClick={() => setCurrentFlowType('none')}
                    className={`text-[10px] py-1 px-1.5 rounded font-medium transition ${currentFlowType === 'none' ? 'bg-slate-800 text-slate-200' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    None
                  </button>
                </div>
              </div>

              {/* View toggle */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1.5 uppercase">Display View Mode</label>
                <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setIsSchematic(false)}
                    className={`text-[10px] py-1 px-1.5 rounded font-medium transition ${!isSchematic ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Realistic
                  </button>
                  <button
                    onClick={() => setIsSchematic(true)}
                    className={`text-[10px] py-1 px-1.5 rounded font-medium transition ${isSchematic ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Schematic
                  </button>
                </div>
              </div>

              {/* Grid lock toggle */}
              <label className="flex items-center justify-between p-1 cursor-pointer">
                <span className="text-xs text-slate-300">Lock to Grid (20px)</span>
                <input
                  type="checkbox"
                  checked={snapToGrid}
                  onChange={(e) => setSnapToGrid(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900 w-4 h-4"
                />
              </label>
            </div>
          </div>

          {/* Section 4: Component Editor */}
          <div className="flex-1 p-4">
            <h3 className="text-sm font-bold tracking-wider text-slate-400 uppercase mb-3 flex items-center space-x-2">
              <Settings className="w-4 h-4 text-amber-400" />
              <span>Component Editor</span>
            </h3>

            {selectedComp ? (
              <div className="space-y-4 p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div>
                  <div className="text-xs text-slate-400 uppercase font-semibold">Type</div>
                  <div className="text-sm font-bold capitalize text-white flex items-center space-x-1.5 mt-0.5">
                    {selectedComp.type === 'bulb' && <Lightbulb className="w-4 h-4 text-yellow-400" />}
                    {selectedComp.type === 'battery' && <Zap className="w-4 h-4 text-amber-500" />}
                    {selectedComp.type === 'resistor' && <Sliders className="w-4 h-4 text-rose-500" />}
                    {selectedComp.type === 'wire' && <div className="w-2.5 h-2.5 bg-slate-400 rounded-full" />}
                    {selectedComp.type === 'switch' && <Power className="w-4 h-4 text-indigo-400" />}
                    <span>{selectedComp.type}</span>
                  </div>
                </div>

                {/* Status indicator */}
                <div>
                  <div className="text-xs text-slate-400 uppercase font-semibold">Status</div>
                  {selectedComp.isBurnedOut ? (
                    <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded bg-red-950/80 border border-red-800 text-red-400 mt-1">
                      <ZapOff className="w-3 h-3" />
                      <span>FUSED / BURNED OUT</span>
                    </span>
                  ) : selectedComp.type === 'switch' ? (
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border mt-1 ${selectedComp.isOpen ? 'bg-indigo-950/80 border-indigo-800 text-indigo-300' : 'bg-emerald-950/80 border-emerald-800 text-emerald-300'}`}>
                      {selectedComp.isOpen ? 'OPEN' : 'CLOSED'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 mt-1">
                      <Check className="w-3 h-3" />
                      <span>FUNCTIONAL</span>
                    </span>
                  )}
                </div>

                {/* Value adjustment slider */}
                {['battery', 'resistor', 'bulb'].includes(selectedComp.type) && (
                  <div>
                    <label className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
                      <span>
                        {selectedComp.type === 'battery' ? 'Voltage (V)' : 'Resistance (\u03A9)'}
                      </span>
                      <span className="text-white font-mono bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">
                        {selectedComp.value.toFixed(1)}
                        {selectedComp.type === 'battery' ? ' V' : ' \u03A9'}
                      </span>
                    </label>
                    <input
                      type="range"
                      min={selectedComp.type === 'battery' ? '0.0' : '0.5'}
                      max={selectedComp.type === 'battery' ? '120.0' : '100.0'}
                      step={selectedComp.type === 'battery' ? '1.0' : '0.5'}
                      value={selectedComp.value}
                      disabled={selectedComp.isBurnedOut}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setComponents(prev => prev.map(c => {
                          if (c.id === selectedCompId) {
                            return { ...c, value: val };
                          }
                          return c;
                        }));
                      }}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500 disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-col space-y-2 pt-2">
                  {selectedComp.isBurnedOut && (
                    <button
                      onClick={handleRepair}
                      className="flex items-center justify-center space-x-1 w-full px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold shadow transition"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Repair Component</span>
                    </button>
                  )}

                  <button
                    onClick={handleDisconnect}
                    className="flex items-center justify-center space-x-1 w-full px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition"
                    title="Separate endpoints to break snaps"
                  >
                    <span>Unsnap Terminals</span>
                  </button>

                  <button
                    onClick={handleDelete}
                    className="flex items-center justify-center space-x-1 w-full px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 border border-red-800/40 text-red-300 text-xs font-semibold transition"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span>Delete Component</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40 text-slate-500">
                <Sliders className="w-8 h-8 text-slate-700 mb-2" />
                <p className="text-xs">Select a component on the canvas to configure parameters, delete, or disconnect it.</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
====
  return (
    <div
      ref={containerRef}
      className="text-slate-100 font-sans selection:bg-sky-500 selection:text-white"
      style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a1a', overflow: 'hidden' }}
    >
      <style>{`
        .ds-btn-glass {
          background: rgba(255, 255, 255, 0.1) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          backdrop-filter: blur(10px) !important;
          -webkit-backdrop-filter: blur(10px) !important;
          color: white !important;
          cursor: pointer !important;
          transition: all 0.3s ease !important;
          border-radius: 8px !important;
          padding: 10px 20px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-weight: 500 !important;
        }
        .ds-btn-back:hover {
          background: rgba(255, 55, 95, 0.8) !important;
          border-color: #ff375f !important;
          box-shadow: 0 0 15px rgba(255, 55, 95, 0.4) !important;
        }
        .ds-btn-reset:hover {
          background: rgba(52, 152, 219, 0.4) !important;
          border-color: #3498db !important;
          box-shadow: 0 0 15px rgba(52, 152, 219, 0.2) !important;
        }
        .ds-sidebar-item {
          background: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          transition: all 0.2s ease !important;
        }
        .ds-sidebar-item:hover {
          background: rgba(255, 255, 255, 0.1) !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
        }
      `}</style>

      {/* Header */}
      <header
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          right: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10
        }}
      >
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="ds-btn-glass ds-btn-back"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              {title || 'Circuit Construction Kit (DC)'}
            </h1>
            <p className="text-xs text-slate-400">Build, test, and solve custom DC circuits interactively</p>
          </div>
        </div>

        {/* Presets dropdown & reset */}
        <div className="flex items-center space-x-3">
          <div
            style={{
              background: 'rgba(20, 20, 30, 0.8)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              padding: '6px 12px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span className="text-xs font-semibold px-2 text-slate-400">Presets:</span>
            <button
              onClick={() => loadPreset('simple')}
              className="text-xs px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 transition"
            >
              Simple
            </button>
            <button
              onClick={() => loadPreset('series')}
              className="text-xs px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 transition"
            >
              Series
            </button>
            <button
              onClick={() => loadPreset('parallel')}
              className="text-xs px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 transition"
            >
              Parallel
            </button>
            <button
              onClick={() => loadPreset('short')}
              className="text-xs px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 transition"
            >
              Short Circuit
            </button>
          </div>

          <button
            onClick={() => loadPreset('empty')}
            className="ds-btn-glass ds-btn-reset space-x-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Board</span>
          </button>
        </div>
      </header>

      {/* Canvas Wrapper */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}
      >
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            pointerEvents: 'auto',
            background: '#0f172a',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            maxWidth: '90%',
            maxHeight: '80%',
            aspectRatio: '4/3',
            display: 'block'
          }}
        />
      </div>

      {/* Help Overlay HUD */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          width: '280px',
          background: 'rgba(20, 20, 30, 0.8)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          padding: '16px',
          borderRadius: '16px',
          zIndex: 10,
          color: 'white',
          fontFamily: "'Inter', sans-serif",
          pointerEvents: 'none',
          fontSize: '12px'
        }}
        className="space-y-1.5"
      >
        <div className="font-semibold text-slate-200 flex items-center space-x-1">
          <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
          <span>Interactive Controls</span>
        </div>
        <div>• Drag component <span className="text-sky-300">body</span> to translate.</div>
        <div>• Drag endpoints <span className="text-sky-300">(dashed rings)</span> to route.</div>
        <div>• Snap endpoints together to establish joints.</div>
        <div>• Click switches to toggle open/closed.</div>
        <div>• Double-click is disabled; use sidebar to delete.</div>
      </div>

      {/* Burnout alarm */}
      {burnoutNotice && (
        <div
          style={{
            position: 'absolute',
            top: '100px',
            left: '20px',
            width: '280px',
            background: 'rgba(127, 29, 29, 0.8)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            padding: '16px',
            borderRadius: '16px',
            zIndex: 10,
            color: 'white',
            fontFamily: "'Inter', sans-serif",
            fontSize: '12px'
          }}
          className="animate-pulse flex items-start space-x-2"
        >
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <div>
            <div className="font-bold text-red-100">Component Burned Out!</div>
            <div>{burnoutNotice}</div>
            <div className="text-[10px] text-red-300 mt-1">Select the component and click "Repair" to restore.</div>
          </div>
        </div>
      )}

      {/* Control Sidebar (Floating Aside Panel) */}
      <aside
        style={{
          position: 'absolute',
          right: '20px',
          top: '100px',
          bottom: '20px',
          width: '320px',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(20, 20, 30, 0.8)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          padding: '20px',
          borderRadius: '16px',
          zIndex: 10,
          color: 'white',
          fontFamily: "'Inter', sans-serif",
          overflowY: 'auto'
        }}
        className="space-y-4"
      >
        {/* Section 1: Component Palette */}
        <div className="pb-4 border-b border-white/10">
          <h3 className="text-sm font-bold tracking-wider text-slate-400 uppercase mb-3 flex items-center space-x-2">
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Add Components</span>
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleAddComponent('wire')}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-200 transition ds-sidebar-item"
            >
              <div className="w-3 h-3 bg-slate-400 rounded-full" />
              <span>Wire</span>
            </button>
            <button
              onClick={() => handleAddComponent('battery')}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-200 transition ds-sidebar-item"
            >
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Battery</span>
            </button>
            <button
              onClick={() => handleAddComponent('resistor')}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-200 transition ds-sidebar-item"
            >
              <Sliders className="w-4 h-4 text-rose-500" />
              <span>Resistor</span>
            </button>
            <button
              onClick={() => handleAddComponent('bulb')}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-200 transition ds-sidebar-item"
            >
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              <span>Light Bulb</span>
            </button>
            <button
              onClick={() => handleAddComponent('switch')}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-200 transition ds-sidebar-item"
            >
              <Power className="w-4 h-4 text-indigo-400" />
              <span>Switch</span>
            </button>
          </div>
        </div>

        {/* Section 2: Interactive Tools */}
        <div className="pb-4 border-b border-white/10">
          <h3 className="text-sm font-bold tracking-wider text-slate-400 uppercase mb-3 flex items-center space-x-2">
            <Activity className="w-4 h-4 text-sky-400" />
            <span>Measurement Tools</span>
          </h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition">
              <span className="text-xs text-slate-200 flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span>Enable Voltmeter</span>
              </span>
              <input
                type="checkbox"
                checked={showVoltmeter}
                onChange={(e) => {
                  setShowVoltmeter(e.target.checked);
                  if (e.target.checked) {
                    setVoltmeterBox({ x: 580, y: 120 });
                    setVoltmeterRed({ x: 550, y: 220 });
                    setVoltmeterBlack({ x: 620, y: 220 });
                  }
                }}
                style={{ accentColor: '#3498db' }}
                className="rounded border-slate-600 bg-slate-900 focus:ring-[#3498db] focus:ring-offset-slate-900 w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition">
              <span className="text-xs text-slate-200 flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span>Enable Ammeter</span>
              </span>
              <input
                type="checkbox"
                checked={showAmmeter}
                onChange={(e) => {
                  setShowAmmeter(e.target.checked);
                  if (e.target.checked) {
                    setAmmeterProbe({ x: 600, y: 150 });
                  }
                }}
                style={{ accentColor: '#3498db' }}
                className="rounded border-slate-600 bg-slate-900 focus:ring-[#3498db] focus:ring-offset-slate-900 w-4 h-4"
              />
            </label>
          </div>
        </div>

        {/* Section 3: Visual Settings */}
        <div className="pb-4 border-b border-white/10">
          <h3 className="text-sm font-bold tracking-wider text-slate-400 uppercase mb-3 flex items-center space-x-2">
            <Eye className="w-4 h-4 text-violet-400" />
            <span>Simulation Options</span>
          </h3>
          <div className="space-y-4">
            {/* Flow Visualizer Selection */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1.5 uppercase">Current Flow Visuals</label>
              <div className="grid grid-cols-3 gap-1 bg-black/30 p-1 rounded-lg border border-white/10">
                <button
                  onClick={() => setCurrentFlowType('electrons')}
                  className={`text-[10px] py-1 px-1.5 rounded font-medium transition ${currentFlowType === 'electrons' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Electrons
                </button>
                <button
                  onClick={() => setCurrentFlowType('conventional')}
                  className={`text-[10px] py-1 px-1.5 rounded font-medium transition ${currentFlowType === 'conventional' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Conventional
                </button>
                <button
                  onClick={() => setCurrentFlowType('none')}
                  className={`text-[10px] py-1 px-1.5 rounded font-medium transition ${currentFlowType === 'none' ? 'bg-white/10 text-slate-200' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  None
                </button>
              </div>
            </div>

            {/* View toggle */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1.5 uppercase">Display View Mode</label>
              <div className="grid grid-cols-2 gap-1 bg-black/30 p-1 rounded-lg border border-white/10">
                <button
                  onClick={() => setIsSchematic(false)}
                  className={`text-[10px] py-1 px-1.5 rounded font-medium transition ${!isSchematic ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Realistic
                </button>
                <button
                  onClick={() => setIsSchematic(true)}
                  className={`text-[10px] py-1 px-1.5 rounded font-medium transition ${isSchematic ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Schematic
                </button>
              </div>
            </div>

            {/* Grid lock toggle */}
            <label className="flex items-center justify-between p-1 cursor-pointer">
              <span className="text-xs text-slate-300">Lock to Grid (20px)</span>
              <input
                type="checkbox"
                checked={snapToGrid}
                onChange={(e) => setSnapToGrid(e.target.checked)}
                style={{ accentColor: '#3498db' }}
                className="rounded border-slate-700 bg-slate-950 focus:ring-[#3498db] focus:ring-offset-slate-900 w-4 h-4"
              />
            </label>
          </div>
        </div>

        {/* Section 4: Component Editor */}
        <div className="flex-1">
          <h3 className="text-sm font-bold tracking-wider text-slate-400 uppercase mb-3 flex items-center space-x-2">
            <Settings className="w-4 h-4 text-amber-400" />
            <span>Component Editor</span>
          </h3>

          {selectedComp ? (
            <div className="space-y-4 p-3 bg-black/30 border border-white/10 rounded-xl">
              <div>
                <div className="text-xs text-slate-400 uppercase font-semibold">Type</div>
                <div className="text-sm font-bold capitalize text-white flex items-center space-x-1.5 mt-0.5">
                  {selectedComp.type === 'bulb' && <Lightbulb className="w-4 h-4 text-yellow-400" />}
                  {selectedComp.type === 'battery' && <Zap className="w-4 h-4 text-amber-500" />}
                  {selectedComp.type === 'resistor' && <Sliders className="w-4 h-4 text-rose-500" />}
                  {selectedComp.type === 'wire' && <div className="w-2.5 h-2.5 bg-slate-400 rounded-full" />}
                  {selectedComp.type === 'switch' && <Power className="w-4 h-4 text-indigo-400" />}
                  <span>{selectedComp.type}</span>
                </div>
              </div>

              {/* Status indicator */}
              <div>
                <div className="text-xs text-slate-400 uppercase font-semibold">Status</div>
                {selectedComp.isBurnedOut ? (
                  <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded bg-red-950/80 border border-red-800 text-red-400 mt-1">
                    <ZapOff className="w-3 h-3" />
                    <span>FUSED / BURNED OUT</span>
                  </span>
                ) : selectedComp.type === 'switch' ? (
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border mt-1 ${selectedComp.isOpen ? 'bg-indigo-950/80 border-indigo-800 text-indigo-300' : 'bg-emerald-950/80 border-emerald-800 text-emerald-300'}`}>
                    {selectedComp.isOpen ? 'OPEN' : 'CLOSED'}
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 mt-1">
                    <Check className="w-3 h-3" />
                    <span>FUNCTIONAL</span>
                  </span>
                )}
              </div>

              {/* Value adjustment slider */}
              {['battery', 'resistor', 'bulb'].includes(selectedComp.type) && (
                <div>
                  <label className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
                    <span>
                      {selectedComp.type === 'battery' ? 'Voltage (V)' : 'Resistance (\u03A9)'}
                    </span>
                    <span className="text-white font-mono bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">
                      {selectedComp.value.toFixed(1)}
                      {selectedComp.type === 'battery' ? ' V' : ' \u03A9'}
                    </span>
                  </label>
                  <input
                    type="range"
                    min={selectedComp.type === 'battery' ? '0.0' : '0.5'}
                    max={selectedComp.type === 'battery' ? '120.0' : '100.0'}
                    step={selectedComp.type === 'battery' ? '1.0' : '0.5'}
                    value={selectedComp.value}
                    disabled={selectedComp.isBurnedOut}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setComponents(prev => prev.map(c => {
                        if (c.id === selectedCompId) {
                          return { ...c, value: val };
                        }
                        return c;
                      }));
                    }}
                    style={{ accentColor: '#3498db' }}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col space-y-2 pt-2">
                {selectedComp.isBurnedOut && (
                  <button
                    onClick={handleRepair}
                    className="flex items-center justify-center space-x-1 w-full px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold shadow transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Repair Component</span>
                  </button>
                )}

                <button
                  onClick={handleDisconnect}
                  className="flex items-center justify-center space-x-1 w-full px-3 py-1.5 rounded-lg text-slate-300 text-xs font-semibold ds-sidebar-item"
                  title="Separate endpoints to break snaps"
                >
                  <span>Unsnap Terminals</span>
                </button>

                <button
                  onClick={handleDelete}
                  className="flex items-center justify-center space-x-1 w-full px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 border border-red-800/40 text-red-300 text-xs font-semibold transition"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>Delete Component</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center border border-dashed border-white/10 rounded-xl bg-black/20 text-slate-500">
              <Sliders className="w-8 h-8 text-slate-700 mb-2" />
              <p className="text-xs">Select a component on the canvas to configure parameters, delete, or disconnect it.</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
```
