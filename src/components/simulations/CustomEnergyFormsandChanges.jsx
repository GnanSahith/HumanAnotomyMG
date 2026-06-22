import React, { useState, useEffect, useRef } from 'react';
import { 
  Sun, Droplets, Bike, Coffee, 
  Settings, Battery, 
  Lightbulb, Thermometer, Fan,
  Play, Pause, RotateCcw, AlertCircle,
  ArrowLeft
} from 'lucide-react';

const ENERGY_TYPES = {
  MECHANICAL: { color: '#8b5cf6', label: 'Mechanical' },
  ELECTRICAL: { color: '#3b82f6', label: 'Electrical' },
  THERMAL: { color: '#ef4444', label: 'Thermal' },
  LIGHT: { color: '#eab308', label: 'Light' },
  CHEMICAL: { color: '#22c55e', label: 'Chemical' },
};

const SOURCES = {
  faucet: { id: 'faucet', label: 'Faucet', icon: Droplets, outputType: 'MECHANICAL', minIntensity: 0 },
  sun: { id: 'sun', label: 'Sun', icon: Sun, outputType: 'LIGHT', minIntensity: 0 },
  bicycle: { id: 'bicycle', label: 'Bicycle', icon: Bike, outputType: 'MECHANICAL', minIntensity: 0 },
  teapot: { id: 'teapot', label: 'Teapot', icon: Coffee, outputType: 'THERMAL', minIntensity: 0 }
};

const CONVERTERS = {
  generator: { 
    id: 'generator', 
    label: 'Generator', 
    icon: Settings,
    validInputs: ['MECHANICAL', 'THERMAL'],
    outputType: 'ELECTRICAL'
  },
  solar_panel: { 
    id: 'solar_panel', 
    label: 'Solar Panel', 
    icon: Battery,
    validInputs: ['LIGHT'],
    outputType: 'ELECTRICAL'
  }
};

const OUTPUTS = {
  water_heater: { 
    id: 'water_heater', 
    label: 'Water Heater', 
    icon: Thermometer,
    validInputs: ['ELECTRICAL'],
    outputType: 'THERMAL'
  },
  light_bulb: { 
    id: 'light_bulb', 
    label: 'Light Bulb', 
    icon: Lightbulb,
    validInputs: ['ELECTRICAL'],
    outputType: 'LIGHT'
  },
  fan: { 
    id: 'fan', 
    label: 'Fan', 
    icon: Fan,
    validInputs: ['ELECTRICAL'],
    outputType: 'MECHANICAL'
  }
};

export default function CustomEnergyFormsAndChanges({ onBack, title }) {
  const [source, setSource] = useState('faucet');
  const [converter, setConverter] = useState('generator');
  const [output, setOutput] = useState('water_heater');
  const [intensity, setIntensity] = useState(50);
  const [isRunning, setIsRunning] = useState(false);
  const [particles, setParticles] = useState([]);
  
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const simAreaRef = useRef(null);
  
  const [isBackHovered, setIsBackHovered] = useState(false);
  const [isResetHovered, setIsResetHovered] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 900, height: 400 });

  useEffect(() => {
    const handleResize = () => {
      if (simAreaRef.current) {
        setDimensions({
          width: simAreaRef.current.clientWidth,
          height: simAreaRef.current.clientHeight
        });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    const timer = setTimeout(handleResize, 100);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);
  
  const currentSource = SOURCES[source];
  const currentConverter = CONVERTERS[converter];
  const currentOutput = OUTPUTS[output];
  
  const isConverterValid = currentConverter.validInputs.includes(currentSource.outputType);
  const isOutputValid = currentOutput.validInputs.includes(currentConverter.outputType) && isConverterValid;

  useEffect(() => {
    if (isRunning && isOutputValid) {
      const interval = setInterval(() => {
        if (Math.random() < intensity / 100) {
          const id = Date.now() + Math.random();
          setParticles(prev => [...prev, {
            id,
            progress: 0,
            stage: 0,
            type: currentSource.outputType
          }]);
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isRunning, intensity, source, converter, output, isOutputValid]);

  useEffect(() => {
    let lastTime = performance.now();
    const update = (time) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      
      if (isRunning) {
        setParticles(prev => {
          return prev.map(p => {
            let nextProgress = p.progress + (dt * 0.5 * (intensity / 50 || 0.1));
            let nextStage = p.stage;
            let nextType = p.type;
            
            if (nextProgress >= 1) {
              nextStage++;
              nextProgress = 0;
              
              if (nextStage === 1) {
                nextType = currentConverter.outputType;
              } else if (nextStage === 2) {
                nextType = currentOutput.outputType;
              }
            }
            
            return { ...p, progress: nextProgress, stage: nextStage, type: nextType };
          }).filter(p => p.stage < 3);
        });
      }
      animationRef.current = requestAnimationFrame(update);
    };
    
    animationRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationRef.current);
  }, [isRunning, intensity, currentConverter, currentOutput]);

  const drawParticles = (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    
    const stageWidth = width / 3;
    const yCenter = height / 2;
    
    particles.forEach(p => {
      let x = 0;
      let y = yCenter;
      
      if (p.stage === 0) {
        x = (stageWidth / 2) + p.progress * stageWidth;
      } else if (p.stage === 1) {
        x = (stageWidth * 1.5) + p.progress * stageWidth;
      } else if (p.stage === 2) {
        x = (stageWidth * 2.5);
        y = yCenter - (p.progress * 100) + (Math.random() * 20 - 10);
        x += (Math.random() * 40 - 20);
      }
      
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = ENERGY_TYPES[p.type].color;
      ctx.fill();
      
      ctx.fillStyle = 'white';
      ctx.font = '8px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('E', x, y);
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const render = () => {
      drawParticles(ctx, canvas.width, canvas.height);
      requestAnimationFrame(render);
    };
    
    const aid = requestAnimationFrame(render);
    return () => cancelAnimationFrame(aid);
  }, [particles]);

  const reset = () => {
    setIntensity(50);
    setParticles([]);
    setIsRunning(false);
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a1a', overflow: 'hidden', color: '#fff' }}>
      
      {/* Top Header Bar */}
      <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        {/* Back Button */}
        <button
          onClick={() => onBack && onBack()}
          onMouseEnter={() => setIsBackHovered(true)}
          onMouseLeave={() => setIsBackHovered(false)}
          style={{
            background: isBackHovered ? 'rgba(255, 55, 95, 0.8)' : 'rgba(255, 255, 255, 0.1)',
            border: isBackHovered ? '1px solid #ff375f' : '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            borderRadius: '8px',
            padding: '8px 16px',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            outline: 'none',
            fontFamily: "'Inter', sans-serif"
          }}
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        {/* Title */}
        <h1 style={{ color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '24px', fontWeight: '600', textShadow: '0 2px 10px rgba(0,0,0,0.5)', margin: 0 }}>
          {title || "Energy Forms and Changes"}
        </h1>

        {/* Right actions (Start/Pause, Reset) */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setIsRunning(!isRunning)}
            style={{
              background: isRunning ? 'rgba(231, 76, 60, 0.2)' : 'rgba(46, 204, 113, 0.2)',
              border: isRunning ? '1px solid rgba(231, 76, 60, 0.4)' : '1px solid rgba(46, 204, 113, 0.4)',
              backdropFilter: 'blur(10px)',
              color: isRunning ? '#e74c3c' : '#2ecc71',
              borderRadius: '8px',
              padding: '8px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              outline: 'none',
              fontFamily: "'Inter', sans-serif",
              fontWeight: '600'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = isRunning ? 'rgba(231, 76, 60, 0.3)' : 'rgba(46, 204, 113, 0.3)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = isRunning ? 'rgba(231, 76, 60, 0.2)' : 'rgba(46, 204, 113, 0.2)';
            }}
          >
            {isRunning ? <Pause size={16} /> : <Play size={16} />}
            <span>{isRunning ? 'Pause' : 'Start'}</span>
          </button>
          <button
            onClick={reset}
            onMouseEnter={() => setIsResetHovered(true)}
            onMouseLeave={() => setIsResetHovered(false)}
            style={{
              background: isResetHovered ? 'rgba(52, 152, 219, 0.4)' : 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              borderRadius: '8px',
              padding: '8px 16px',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              outline: 'none',
              fontFamily: "'Inter', sans-serif"
            }}
          >
            <RotateCcw size={16} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Converter Warning Alert */}
      {!isConverterValid && (
        <div style={{
          position: 'absolute',
          top: '90px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(231, 76, 60, 0.2)',
          border: '1px solid rgba(231, 76, 60, 0.4)',
          backdropFilter: 'blur(10px)',
          color: '#e74c3c',
          padding: '12px 24px',
          borderRadius: '12px',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontFamily: "'Inter', sans-serif",
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          pointerEvents: 'auto'
        }}>
          <AlertCircle size={20} />
          <span>The current source cannot power this converter. Try changing the source or converter.</span>
        </div>
      )}

      {/* Simulation Area */}
      <div 
        ref={simAreaRef}
        style={{
          position: 'absolute',
          top: '90px',
          bottom: '310px',
          left: '20px',
          right: '20px',
          zIndex: 1
        }}
      >
        <canvas 
          ref={canvasRef} 
          width={dimensions.width} 
          height={dimensions.height} 
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1
          }}
        />
        
        {/* Components Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          pointerEvents: 'none',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          alignItems: 'center',
          padding: '0 40px'
        }}>
          {/* Source */}
          <div className="flex flex-col items-center justify-center p-6" style={{ pointerEvents: 'auto' }}>
            <div className={`p-6 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border-2 shadow-xl transition-all duration-300 ${isRunning ? 'border-[#3498db] shadow-[#3498db]/20 scale-105' : 'border-slate-700'}`}>
              <currentSource.icon size={64} className={isRunning && currentSource.id === 'sun' ? 'text-yellow-400 animate-pulse' : 'text-slate-300'} />
            </div>
            <div className="mt-4 font-semibold text-lg text-white" style={{ fontFamily: "'Inter', sans-serif" }}>{currentSource.label}</div>
            
            <div className="mt-4 w-full max-w-[200px] p-3 rounded-xl border border-slate-800/80 backdrop-blur-md">
              <label className="text-xs text-slate-400 mb-1.5 block text-center uppercase tracking-wider font-semibold">Intensity / Speed</label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                style={{ accentColor: '#3498db', cursor: 'pointer', width: '100%' }}
              />
            </div>
          </div>

          {/* Converter */}
          <div className="flex flex-col items-center justify-center p-6 border-l border-r border-slate-800/40" style={{ pointerEvents: 'auto' }}>
            <div className={`p-6 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border-2 shadow-xl transition-all duration-300 ${isConverterValid && isRunning ? 'border-[#bf5af2] shadow-[#bf5af2]/20 scale-105' : 'border-slate-700'} ${!isConverterValid ? 'opacity-40' : ''}`}>
              <currentConverter.icon 
                size={64} 
                className={`text-slate-300 ${isConverterValid && isRunning && currentConverter.id === 'generator' ? 'animate-spin' : ''}`}
                style={{ animationDuration: `${2000 / (intensity || 1)}ms` }}
              />
            </div>
            <div className="mt-4 font-semibold text-lg text-white" style={{ fontFamily: "'Inter', sans-serif" }}>{currentConverter.label}</div>
            <div className="mt-2 text-xs font-mono text-slate-400 px-3 py-1 rounded-full border border-slate-800">
              {currentConverter.validInputs.join(', ')} → {currentConverter.outputType}
            </div>
          </div>

          {/* Output */}
          <div className="flex flex-col items-center justify-center p-6" style={{ pointerEvents: 'auto' }}>
            <div className={`p-6 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border-2 shadow-xl transition-all duration-300 ${isOutputValid && isRunning ? 'border-[#2ecc71] shadow-[#2ecc71]/20 scale-105' : 'border-slate-700'} ${!isOutputValid ? 'opacity-40' : ''}`}>
              <currentOutput.icon 
                size={64} 
                className={`${isOutputValid && isRunning ? (currentOutput.id === 'light_bulb' ? 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]' : 'text-slate-300') : 'text-slate-500'} ${isOutputValid && isRunning && currentOutput.id === 'fan' ? 'animate-spin' : ''}`}
                style={{ animationDuration: `${1500 / (intensity || 1)}ms` }}
              />
            </div>
            <div className="mt-4 font-semibold text-lg text-white" style={{ fontFamily: "'Inter', sans-serif" }}>{currentOutput.label}</div>
            <div className="mt-2 text-xs font-mono text-slate-400 px-3 py-1 rounded-full border border-slate-800">
              {currentOutput.validInputs.join(', ')} → {currentOutput.outputType}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Control Panel */}
      <div style={{
        position: 'absolute',
        top: '90px', right: '20px', width: '380px', maxHeight: 'calc(100% - 110px)', overflowY: 'auto',
        background: 'rgba(20, 20, 30, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(12px)',
        padding: '20px',
        borderRadius: '16px',
        zIndex: 10,
        color: 'white',
        fontFamily: "'Inter', sans-serif",
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
        pointerEvents: 'auto'
      }}>
        <div className="flex flex-col gap-6">
          {/* Energy Source Selection */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Energy Source</h3>
            <div className="space-y-2">
              {Object.values(SOURCES).map(s => {
                const isSelected = source === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSource(s.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: isSelected ? 'rgba(52, 152, 219, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      border: isSelected ? '1px solid rgba(52, 152, 219, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
                      color: isSelected ? '#3498db' : '#ccc',
                      fontWeight: isSelected ? '600' : 'normal',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                      textAlign: 'left'
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.color = '#fff';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.color = '#ccc';
                      }
                    }}
                  >
                    <s.icon size={18} />
                    <span style={{ fontSize: '13px' }}>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Converter Selection */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Converter</h3>
            <div className="space-y-2">
              {Object.values(CONVERTERS).map(c => {
                const isSelected = converter === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setConverter(c.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: isSelected ? 'rgba(191, 90, 242, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      border: isSelected ? '1px solid rgba(191, 90, 242, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
                      color: isSelected ? '#bf5af2' : '#ccc',
                      fontWeight: isSelected ? '600' : 'normal',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                      textAlign: 'left'
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.color = '#fff';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.color = '#ccc';
                      }
                    }}
                  >
                    <c.icon size={18} />
                    <span style={{ fontSize: '13px' }}>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Output Selection */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Output</h3>
            <div className="space-y-2">
              {Object.values(OUTPUTS).map(o => {
                const isSelected = output === o.id;
                return (
                  <button
                    key={o.id}
                    onClick={() => setOutput(o.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: isSelected ? 'rgba(46, 204, 113, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      border: isSelected ? '1px solid rgba(46, 204, 113, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
                      color: isSelected ? '#2ecc71' : '#ccc',
                      fontWeight: isSelected ? '600' : 'normal',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                      textAlign: 'left'
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.color = '#fff';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.color = '#ccc';
                      }
                    }}
                  >
                    <o.icon size={18} />
                    <span style={{ fontSize: '13px' }}>{o.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={{
          marginTop: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.2)',
          padding: '8px',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          {Object.entries(ENERGY_TYPES).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm" style={{ backgroundColor: value.color }}>
                E
              </div>
              <span className="text-xs font-semibold text-slate-300" style={{ fontFamily: "'Inter', sans-serif" }}>{value.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
