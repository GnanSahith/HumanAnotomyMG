import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings2 } from 'lucide-react';
const wavelengthToRGB = wavelength => {
  let R, G, B;
  if (wavelength >= 380 && wavelength < 440) {
    R = -(wavelength - 440) / (440 - 380);
    G = 0.0;
    B = 1.0;
  } else if (wavelength >= 440 && wavelength < 490) {
    R = 0.0;
    G = (wavelength - 440) / (490 - 440);
    B = 1.0;
  } else if (wavelength >= 490 && wavelength < 510) {
    R = 0.0;
    G = 1.0;
    B = -(wavelength - 510) / (510 - 490);
  } else if (wavelength >= 510 && wavelength < 580) {
    R = (wavelength - 510) / (580 - 510);
    G = 1.0;
    B = 0.0;
  } else if (wavelength >= 580 && wavelength < 645) {
    R = 1.0;
    G = -(wavelength - 645) / (645 - 580);
    B = 0.0;
  } else if (wavelength >= 645 && wavelength <= 780) {
    R = 1.0;
    G = 0.0;
    B = 0.0;
  } else {
    R = 0.0;
    G = 0.0;
    B = 0.0;
  }
  let factor;
  if (wavelength >= 380 && wavelength < 420) {
    factor = 0.3 + 0.7 * (wavelength - 380) / (420 - 380);
  } else if (wavelength >= 420 && wavelength < 701) {
    factor = 1.0;
  } else if (wavelength >= 701 && wavelength <= 780) {
    factor = 0.3 + 0.7 * (780 - wavelength) / (780 - 700);
  } else {
    factor = 0.0;
  }
  const rgb = [Math.round(R * factor * 255), Math.round(G * factor * 255), Math.round(B * factor * 255)];
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
};
const SOLUTES = {
  drink_mix: {
    name: 'Drink mix',
    r: 255,
    g: 0,
    b: 0,
    defaultLambda: 508,
    eps: 3.5
  },
  co_nitrate: {
    name: 'Cobalt (II) nitrate',
    r: 255,
    g: 50,
    b: 50,
    defaultLambda: 510,
    eps: 4.8
  },
  co_chloride: {
    name: 'Cobalt chloride',
    r: 255,
    g: 100,
    b: 150,
    defaultLambda: 510,
    eps: 4.2
  },
  k_dichromate: {
    name: 'Potassium dichromate',
    r: 255,
    g: 140,
    b: 0,
    defaultLambda: 350,
    eps: 3140
  },
  k_permanganate: {
    name: 'Potassium permanganate',
    r: 148,
    g: 0,
    b: 211,
    defaultLambda: 540,
    eps: 2400
  }
};
const CustomBeersLawLab = () => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({
    width: 800,
    height: 600
  });
  const [localIsPlaying, setLocalIsPlaying] = useState(true);
  const isPlaying = typeof globalIsPlaying !== 'undefined' ? globalIsPlaying : localIsPlaying;
  const setIsPlaying = typeof syncPlayState === 'function' ? syncPlayState : setLocalIsPlaying;
  const [laserOn, setLaserOn] = useState(false);
  const [mode, setMode] = useState('transmittance'); // 'absorbance' or 'transmittance'
  const [soluteKey, setSoluteKey] = useState('drink_mix');
  const [concentration, setConcentration] = useState(100); // uM
  const [pathLength, setPathLength] = useState(1); // cm
  const [laserWavelength, setLaserWavelength] = useState(SOLUTES['drink_mix'].defaultLambda);
  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (entry.contentRect) {
          setCanvasSize({
            width: entry.contentRect.width,
            height: entry.contentRect.height
          });
        }
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);
  const calculateEpsilon = (lambda, solute) => {
    const peak = solute.defaultLambda;
    const width = 60;
    return solute.eps * Math.exp(-Math.pow(lambda - peak, 2) / (2 * width * width));
  };
  const solute = SOLUTES[soluteKey];
  const eps = calculateEpsilon(laserWavelength, solute);
  const c = concentration / 1e6;
  const l = pathLength;
  const absorbance = eps * l * c * 1e4;
  const transmittance = Math.pow(10, -absorbance);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const {
      width,
      height
    } = canvasSize;
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, width, height);
    const centerY = height / 2;
    const cuvetteMaxWidth = 200;
    const cuvetteWidth = pathLength * (cuvetteMaxWidth / 2);
    const cuvetteHeight = 250;
    const cuvetteX = (width - cuvetteWidth) / 2;
    const cuvetteY = centerY - cuvetteHeight / 2;
    const alpha = Math.min(1, concentration / 500);
    ctx.fillStyle = `rgba(${solute.r}, ${solute.g}, ${solute.b}, ${alpha})`;
    ctx.fillRect(cuvetteX, cuvetteY, cuvetteWidth, cuvetteHeight);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 4;
    ctx.strokeRect(cuvetteX, cuvetteY, cuvetteWidth, cuvetteHeight);
    const laserBoxWidth = 80;
    const laserBoxHeight = 50;
    const laserBoxX = 50;
    const laserBoxY = centerY - laserBoxHeight / 2;
    ctx.fillStyle = '#374151';
    ctx.fillRect(laserBoxX, laserBoxY, laserBoxWidth, laserBoxHeight);
    ctx.fillStyle = laserOn ? '#10b981' : '#ef4444';
    ctx.beginPath();
    ctx.arc(laserBoxX + laserBoxWidth, laserBoxY + laserBoxHeight / 2, 8, 0, Math.PI * 2);
    ctx.fill();
    const detectorX = width - 150;
    const detectorY = centerY - 40;
    ctx.fillStyle = '#374151';
    ctx.fillRect(detectorX, detectorY, 120, 80);
    ctx.fillStyle = '#22c55e';
    ctx.font = '20px monospace';
    const displayValue = laserOn ? mode === 'transmittance' ? (transmittance * 100).toFixed(2) + '%' : absorbance.toFixed(2) : mode === 'transmittance' ? '0.00%' : '0.00';
    ctx.fillText(displayValue, detectorX + 10, centerY + 5);
    if (laserOn) {
      const beamColor = wavelengthToRGB(laserWavelength);
      ctx.fillStyle = beamColor;
      ctx.shadowColor = beamColor;
      ctx.shadowBlur = 10;
      ctx.globalCompositeOperation = 'screen';
      ctx.fillRect(laserBoxX + laserBoxWidth, centerY - 5, cuvetteX - (laserBoxX + laserBoxWidth), 10);
      ctx.fillRect(cuvetteX, centerY - 5, cuvetteWidth, 10);
      ctx.globalAlpha = Math.max(0.01, transmittance);
      ctx.fillRect(cuvetteX + cuvetteWidth, centerY - 5, detectorX - (cuvetteX + cuvetteWidth), 10);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;
    }
  }, [laserOn, mode, concentration, pathLength, laserWavelength, soluteKey, absorbance, transmittance, canvasSize]);
  const resetSimulation = () => {
    setLaserOn(false);
    setMode('transmittance');
    setSoluteKey('drink_mix');
    setConcentration(100);
    setPathLength(1);
    setLaserWavelength(SOLUTES['drink_mix'].defaultLambda);
    setIsPlaying(true);
  };
  return <div style={{
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: '#0a0a1a',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  }}>
        
        {/* 1. Transparent Header */}
        <div style={{
      padding: '16px 24px',
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      background: 'transparent',
      zIndex: 10
    }}>
            <div style={{
        display: 'flex',
        gap: '12px'
      }}>
                <button onClick={() => setIsPlaying(!isPlaying)}  style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff',
          padding: '8px 16px',
          borderRadius: '8px',
          cursor: 'pointer'
        }}>
                    {isPlaying ? <Pause size={18} /> : <Play size={18} />} {isPlaying ? 'Pause' : 'Play'}
                </button>
                <button onClick={resetSimulation}  style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff',
          padding: '8px 16px',
          borderRadius: '8px',
          cursor: 'pointer'
        }}>
                    <RotateCcw size={18} /> Reset
                </button>
            </div>
        </div>
        
        {/* 2. Full Bleed Canvas Container */}
        <div ref={containerRef} style={{
      flex: 1,
      position: 'relative',
      overflow: 'hidden'
    }}>
            <canvas ref={canvasRef} width={canvasSize.width} height={canvasSize.height} style={{
        width: '100%',
        height: '100%',
        display: 'block',
        objectFit: "contain"
      }} />
            
            {/* 3. Floating Right Control Panel */}
            <div style={{
        position: 'absolute',
        right: '40px',
        top: '20px',
        bottom: '20px',
        width: '340px',
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        padding: '24px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        color: '#fff'
      }}>
                
                <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          paddingBottom: '12px'
        }}>
                    <Settings2 size={20} color="rgba(255,255,255,0.7)" />
                    <h3 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 600
          }}>Controls</h3>
                </div>
                
                <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
                    <label style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.7)'
          }}>Laser Power</label>
                    <button style={{
            padding: '8px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            color: 'white',
            backgroundColor: laserOn ? '#ef4444' : '#10b981'
          }} onClick={() => setLaserOn(!laserOn)}>
                        {laserOn ? 'Turn OFF' : 'Turn ON'}
                    </button>
                </div>

                <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
                    <label style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.7)'
          }}>Detector Mode</label>
                    <div style={{
            display: 'flex',
            gap: '16px'
          }}>
                        <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              cursor: 'pointer'
            }}>
                            <input type="radio" value="transmittance" checked={mode === 'transmittance'} onChange={e => setMode(e.target.value)} />
                            Transmittance
                        </label>
                        <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              cursor: 'pointer'
            }}>
                            <input type="radio" value="absorbance" checked={mode === 'absorbance'} onChange={e => setMode(e.target.value)} />
                            Absorbance
                        </label>
                    </div>
                </div>

                <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
                    <label style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.7)'
          }}>Solute</label>
                    <select style={{
            padding: '8px',
            borderRadius: '8px',
            backgroundColor: 'rgba(0,0,0,0.3)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.2)',
            outline: 'none',
            cursor: 'pointer'
          }} value={soluteKey} onChange={e => {
            setSoluteKey(e.target.value);
            setLaserWavelength(SOLUTES[e.target.value].defaultLambda);
          }}>
                        {Object.keys(SOLUTES).map(key => <option key={key} value={key}>{SOLUTES[key].name}</option>)}
                    </select>
                </div>

                <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
                    <label style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.7)'
          }}>Concentration: {concentration} &mu;M</label>
                    <input type="range" min="0" max="500" value={concentration} onChange={e => setConcentration(Number(e.target.value))} style={{
            cursor: 'pointer'
          }} />
                </div>

                <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
                    <label style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.7)'
          }}>Path Length: {pathLength} cm</label>
                    <input type="range" min="0.5" max="2" step="0.1" value={pathLength} onChange={e => setPathLength(Number(e.target.value))} style={{
            cursor: 'pointer'
          }} />
                </div>

                <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
                    <label style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.7)'
          }}>Wavelength: {laserWavelength} nm</label>
                    <input type="range" min="380" max="780" value={laserWavelength} onChange={e => setLaserWavelength(Number(e.target.value))} style={{
            cursor: 'pointer'
          }} />
                </div>
            </div>
        </div>
    </div>;
};
export default CustomBeersLawLab;