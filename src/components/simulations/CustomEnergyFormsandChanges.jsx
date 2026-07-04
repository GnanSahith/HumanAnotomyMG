import React, { useState, useEffect, useRef } from 'react';
import { Sun, Droplets, Bike, Coffee, Settings, Battery, Lightbulb, Thermometer, Fan, Play, Pause, RotateCcw, AlertCircle, ArrowLeft, Settings2 } from 'lucide-react';
const ENERGY_TYPES = {
  MECHANICAL: {
    color: '#8b5cf6',
    label: 'Mechanical'
  },
  ELECTRICAL: {
    color: '#3b82f6',
    label: 'Electrical'
  },
  THERMAL: {
    color: '#ef4444',
    label: 'Thermal'
  },
  LIGHT: {
    color: '#eab308',
    label: 'Light'
  },
  CHEMICAL: {
    color: '#22c55e',
    label: 'Chemical'
  }
};
const SOURCES = {
  faucet: {
    id: 'faucet',
    label: 'Faucet',
    icon: Droplets,
    outputType: 'MECHANICAL',
    minIntensity: 0
  },
  sun: {
    id: 'sun',
    label: 'Sun',
    icon: Sun,
    outputType: 'LIGHT',
    minIntensity: 0
  },
  bicycle: {
    id: 'bicycle',
    label: 'Bicycle',
    icon: Bike,
    outputType: 'MECHANICAL',
    minIntensity: 0
  },
  teapot: {
    id: 'teapot',
    label: 'Teapot',
    icon: Coffee,
    outputType: 'THERMAL',
    minIntensity: 0
  }
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
export default function CustomEnergyFormsAndChanges({
  onBack,
  title
}) {
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
  const [dimensions, setDimensions] = useState({
    width: 900,
    height: 400
  });
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
    const update = time => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      if (isRunning) {
        setParticles(prev => {
          return prev.map(p => {
            let nextProgress = p.progress + dt * 0.5 * (intensity / 50 || 0.1);
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
            return {
              ...p,
              progress: nextProgress,
              stage: nextStage,
              type: nextType
            };
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
        x = stageWidth / 2 + p.progress * stageWidth;
      } else if (p.stage === 1) {
        x = stageWidth * 1.5 + p.progress * stageWidth;
      } else if (p.stage === 2) {
        x = stageWidth * 2.5;
        y = yCenter - p.progress * 100 + (Math.random() * 20 - 10);
        x += Math.random() * 40 - 20;
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
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#0a0a1a', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        
        
        
        {/* 2. Full Bleed Canvas Container */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            
            {/* THE CANVAS */}
            <canvas ref={canvasRef} width={dimensions.width} height={dimensions.height} style={{ width: '100%', height: '100%', display: 'block', position: 'absolute', top: 0, left: 0 }} />

            {/* In-Canvas Elements (Overlay in Center) */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ width: '100%', maxWidth: '900px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', padding: '0 40px' }}>
                {/* Source */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'auto' }}>
                  <div style={{ padding: '24px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', border: `2px solid ${isRunning ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`, backdropFilter: 'blur(8px)' }}>
                    <currentSource.icon size={64} color={isRunning && currentSource.id === 'sun' ? '#facc15' : 'rgba(255,255,255,0.8)'} />
                  </div>
                  <div style={{ marginTop: '16px', fontWeight: 600, color: '#fff' }}>{currentSource.label}</div>
                  
                  <div style={{ marginTop: '16px', width: '100%', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px' }}>
                    <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px', display: 'block', textAlign: 'center' }}>Intensity / Speed</label>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={intensity}
                      onChange={(e) => setIntensity(Number(e.target.value))}
                      style={{ width: '100%', cursor: 'pointer' }}
                    />
                  </div>
                </div>

                {/* Converter */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ padding: '24px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', border: `2px solid ${isConverterValid && isRunning ? '#a855f7' : 'rgba(255,255,255,0.1)'}`, opacity: isConverterValid ? 1 : 0.5, backdropFilter: 'blur(8px)' }}>
                    <currentConverter.icon size={64} color="rgba(255,255,255,0.8)" style={{ animation: isConverterValid && isRunning && currentConverter.id === 'generator' ? 'spin 2s linear infinite' : 'none' }} />
                  </div>
                  <div style={{ marginTop: '16px', fontWeight: 600, color: '#fff' }}>{currentConverter.label}</div>
                  <div style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.6)', padding: '4px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: '999px' }}>
                    {currentConverter.validInputs.join(', ')} → {currentConverter.outputType}
                  </div>
                </div>

                {/* Output */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ padding: '24px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', border: `2px solid ${isOutputValid && isRunning ? '#10b981' : 'rgba(255,255,255,0.1)'}`, opacity: isOutputValid ? 1 : 0.5, backdropFilter: 'blur(8px)' }}>
                    <currentOutput.icon size={64} color={isOutputValid && isRunning ? (currentOutput.id === 'light_bulb' ? '#facc15' : 'rgba(255,255,255,0.8)') : 'rgba(255,255,255,0.4)'} />
                  </div>
                  <div style={{ marginTop: '16px', fontWeight: 600, color: '#fff' }}>{currentOutput.label}</div>
                  <div style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.6)', padding: '4px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: '999px' }}>
                    {currentOutput.validInputs.join(', ')} → {currentOutput.outputType}
                  </div>
                </div>
              </div>
            </div>
            
            {/* 3. Floating Right Control Panel */}
            <div style={{ position: 'absolute', right: '40px', top: '20px', bottom: '20px', width: '340px', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px', color: '#fff' }}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                    <Settings2 color="rgba(255,255,255,0.7)" size={20} />
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Controls</h3>
                </div>

                {!isConverterValid && (
                  <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.3)', color: '#fb923c', fontSize: '14px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>The current source cannot power this converter.</span>
                  </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Energy Source</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {Object.values(SOURCES).map(s => (
                            <button
                                key={s.id}
                                onClick={() => setSource(s.id)}
                                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', background: source === s.id ? 'rgba(59, 130, 246, 0.2)' : 'rgba(0,0,0,0.2)', border: `1px solid ${source === s.id ? 'rgba(59, 130, 246, 0.5)' : 'transparent'}`, color: source === s.id ? '#3b82f6' : '#fff', cursor: 'pointer', textAlign: 'left' }}
                            >
                                <s.icon size={16} /> {s.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Converter</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {Object.values(CONVERTERS).map(c => (
                            <button
                                key={c.id}
                                onClick={() => setConverter(c.id)}
                                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', background: converter === c.id ? 'rgba(168, 85, 247, 0.2)' : 'rgba(0,0,0,0.2)', border: `1px solid ${converter === c.id ? 'rgba(168, 85, 247, 0.5)' : 'transparent'}`, color: converter === c.id ? '#a855f7' : '#fff', cursor: 'pointer', textAlign: 'left' }}
                            >
                                <c.icon size={16} /> {c.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Output</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {Object.values(OUTPUTS).map(o => (
                            <button
                                key={o.id}
                                onClick={() => setOutput(o.id)}
                                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', background: output === o.id ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0,0,0,0.2)', border: `1px solid ${output === o.id ? 'rgba(16, 185, 129, 0.5)' : 'transparent'}`, color: output === o.id ? '#10b981' : '#fff', cursor: 'pointer', textAlign: 'left' }}
                            >
                                <o.icon size={16} /> {o.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <h4 style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Legend</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                        {Object.entries(ENERGY_TYPES).map(([key, value]) => (
                            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: value.color }} />
                                {value.label}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}