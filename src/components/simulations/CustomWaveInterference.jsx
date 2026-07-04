import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings2, Activity, Droplets, Atom, ArrowLeft, Maximize2 } from 'lucide-react';
export default function CustomWaveInterference({
  onBack,
  title, isPlaying: globalIsPlaying, syncPlayState
}) {
  const [localIsPlaying, setLocalIsPlaying] = useState(true);
  const isPlaying = typeof globalIsPlaying !== 'undefined' ? globalIsPlaying : localIsPlaying;
  const setIsPlaying = typeof syncPlayState === 'function' ? syncPlayState : setLocalIsPlaying;

  // Parameters
  const [numSources, setNumSources] = useState(2);
  const [frequency, setFrequency] = useState(0.2); // controls k and omega
  const [separation, setSeparation] = useState(60);
  const canvasRef = useRef(null);
  const offscreenRef = useRef(null);
  const requestRef = useRef(null);
  const timeRef = useRef(0);
  const renderWidth = 250;
  const renderHeight = 250;
  const containerWidth = 600;
  const containerHeight = 600;
  const renderCanvas = () => {
    if (!isPlaying) {
      requestRef.current = requestAnimationFrame(renderCanvas);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!offscreenRef.current) {
      const off = document.createElement('canvas');
      off.width = renderWidth;
      off.height = renderHeight;
      offscreenRef.current = off;
    }
    const offCanvas = offscreenRef.current;
    const offCtx = offCanvas.getContext('2d');
    const imageData = offCtx.createImageData(renderWidth, renderHeight);
    const data = imageData.data;
    const t = timeRef.current;
    timeRef.current += frequency * 1.5;
    const k = frequency * 1.5; // Wave number

    const cy = renderHeight / 2;
    let s1x = renderWidth / 2;
    let s2x = renderWidth / 2;
    let s1y = cy;
    let s2y = cy;
    if (numSources === 2) {
      s1y = cy - separation / 2;
      s2y = cy + separation / 2;
    }
    for (let y = 0; y < renderHeight; y++) {
      for (let x = 0; x < renderWidth; x++) {
        let val = 0;

        // Distance to source 1
        let d1 = Math.sqrt((x - s1x) ** 2 + (y - s1y) ** 2);
        val += Math.sin(d1 * k - t);
        if (numSources === 2) {
          let d2 = Math.sqrt((x - s2x) ** 2 + (y - s2y) ** 2);
          val += Math.sin(d2 * k - t);
        }

        // Normalize based on number of sources
        val = val / numSources;

        // Color mapping: Water like (blue/cyan)
        // When val is 1 (crest), bright cyan
        // When val is -1 (trough), dark blue
        // When val is 0, medium blue

        const intensity = (val + 1) / 2; // 0 to 1

        const r = 10 + intensity * 40;
        const g = 50 + intensity * 150;
        const b = 150 + intensity * 105;
        const idx = (y * renderWidth + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }
    offCtx.putImageData(imageData, 0, 0);

    // Draw sources as small dots
    offCtx.fillStyle = '#fff';
    offCtx.beginPath();
    offCtx.arc(s1x, s1y, 3, 0, Math.PI * 2);
    offCtx.fill();
    if (numSources === 2) {
      offCtx.beginPath();
      offCtx.arc(s2x, s2y, 3, 0, Math.PI * 2);
      offCtx.fill();
    }

    // Disable smoothing for sharp pixels or enable for smooth waves
    ctx.imageSmoothingEnabled = true;
    ctx.clearRect(0, 0, containerWidth, containerHeight);
    ctx.drawImage(offCanvas, 0, 0, containerWidth, containerHeight);
    requestRef.current = requestAnimationFrame(renderCanvas);
  };
  useEffect(() => {
    requestRef.current = requestAnimationFrame(renderCanvas);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, numSources, frequency, separation]);
  const resetSim = () => {
    timeRef.current = 0;
    setNumSources(2);
    setFrequency(0.2);
    setSeparation(60);
  };
  return <div style={{
    width: '100%',
    height: '100%',
    position: 'relative',
    background: '#0a0a1a',
    overflow: 'hidden',
    color: '#fff',
    fontFamily: "'Inter', sans-serif"
  }}>
            {/* Left Control Panel: Playback Controls */}
            

            {/* Right Control Panel: Parameters */}
            <div style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      background: 'rgba(20, 20, 30, 0.8)',
      border: '1px solid rgba(255,255,255,0.1)',
      backdropFilter: 'blur(12px)',
      padding: '20px',
      borderRadius: '16px',
      width: '300px',
      zIndex: 10,
      color: 'white',
      fontFamily: "'Inter', sans-serif",
      maxHeight: 'calc(100% - 120px)',
      overflowY: 'auto'
    }}>
                <h3 style={{
        margin: '0 0 15px 0',
        fontSize: '16px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        paddingBottom: '10px',
        color: '#fff',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
                    <Settings2 size={18} /> Wave Parameters
                </h3>

                {/* Wave Sources */}
                <div style={{
        marginBottom: '20px'
      }}>
                    <label style={{
          fontSize: '14px',
          color: '#fff',
          fontWeight: 500,
          display: 'block',
          marginBottom: '10px'
        }}>Wave Sources</label>
                    <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px'
        }}>
                        <button onClick={() => setNumSources(1)} style={{
            padding: '10px',
            borderRadius: '8px',
            cursor: 'pointer',
            background: numSources === 1 ? 'rgba(52, 152, 219, 0.3)' : 'rgba(255,255,255,0.05)',
            color: 'white',
            border: `1px solid ${numSources === 1 ? '#3498db' : 'rgba(255,255,255,0.1)'}`,
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}>
                            <Droplets size={16} /> Single
                        </button>
                        <button onClick={() => setNumSources(2)} style={{
            padding: '10px',
            borderRadius: '8px',
            cursor: 'pointer',
            background: numSources === 2 ? 'rgba(52, 152, 219, 0.3)' : 'rgba(255,255,255,0.05)',
            color: 'white',
            border: `1px solid ${numSources === 2 ? '#3498db' : 'rgba(255,255,255,0.1)'}`,
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}>
                            <Activity size={16} /> Double
                        </button>
                    </div>
                </div>

                {/* Frequency */}
                <div style={{
        marginBottom: '20px'
      }}>
                    <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '14px',
          marginBottom: '8px'
        }}>
                        <span style={{
            fontWeight: 500
          }}>Frequency</span>
                        <span style={{
            color: 'rgba(255,255,255,0.5)',
            fontFamily: 'monospace'
          }}>{Math.round(frequency * 100)} Hz</span>
                    </div>
                    <input type="range" min="0.05" max="0.5" step="0.01" value={frequency} onChange={e => setFrequency(parseFloat(e.target.value))} style={{
          width: '100%',
          accentColor: '#3498db',
          background: 'rgba(255,255,255,0.1)',
          height: '6px',
          borderRadius: '3px',
          outline: 'none',
          cursor: 'pointer'
        }} />
                </div>

                {/* Separation (Only for 2 sources) */}
                <div style={{
        opacity: numSources === 2 ? 1 : 0.3,
        pointerEvents: numSources === 2 ? 'auto' : 'none',
        transition: 'opacity 0.2s',
        marginBottom: '20px'
      }}>
                    <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '14px',
          marginBottom: '8px'
        }}>
                        <span style={{
            fontWeight: 500
          }}>Source Separation</span>
                        <span style={{
            color: 'rgba(255,255,255,0.5)',
            fontFamily: 'monospace'
          }}>{separation} px</span>
                    </div>
                    <input type="range" min="20" max="150" step="5" value={separation} onChange={e => setSeparation(parseInt(e.target.value))} style={{
          width: '100%',
          accentColor: '#3498db',
          background: 'rgba(255,255,255,0.1)',
          height: '6px',
          borderRadius: '3px',
          outline: 'none',
          cursor: 'pointer'
        }} />
                </div>

                {/* Info Box */}
                <div style={{
        padding: '12px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '8px',
        fontSize: '13px',
        color: 'rgba(255,255,255,0.7)',
        lineHeight: '1.5'
      }}>
                    <p style={{
          margin: '0 0 6px 0',
          fontWeight: '600',
          color: '#fff'
        }}>Interference Pattern</p>
                    Switch to <strong>Double</strong> sources to observe constructive and destructive interference. Adjust the <strong>Separation</strong> and <strong>Frequency</strong> to see how the nodal lines change.
                </div>
            </div>

            {/* Canvas Container */}
            <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
      background: '#04040c'
    }}>
                <div style={{
        position: 'relative',
        width: `${containerWidth}px`,
        height: `${containerHeight}px`,
        border: '4px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        overflow: 'hidden',
        background: '#000',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
      }}>
                    <canvas ref={canvasRef} width={containerWidth} height={containerHeight} style={{
          position: 'absolute',
          top: 0,
          left: 0,
          display: 'block',
          width: '100%',
          height: '100%'
        }} />
                </div>
            </div>
        </div>;
}