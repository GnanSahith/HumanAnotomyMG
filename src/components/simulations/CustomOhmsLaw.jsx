import React, { useState, useEffect, useRef } from 'react';

const CustomOhmsLawInner = () => {
  const [voltage, setVoltage] = useState(4.5); // Volts
  const [resistance, setResistance] = useState(500); // Ohms
  const canvasRef = useRef(null);

  const current = (voltage / resistance) * 1000; // mA

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const drawCircuit = () => {
      ctx.fillStyle = '#080816';
      ctx.fillRect(0, 0, width, height);
      
      ctx.strokeStyle = '#64748b'; // wire color
      ctx.lineWidth = 3;

      // Draw wire
      ctx.beginPath();
      ctx.moveTo(100, 100);
      ctx.lineTo(300, 100);
      ctx.lineTo(300, 200);
      ctx.lineTo(100, 200);
      ctx.closePath();
      ctx.stroke();

      // Draw battery (Voltage)
      ctx.fillStyle = '#3498db'; // blue battery
      ctx.fillRect(80, 130, 40, 40);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(90, 140, 20, 20); // visual representation
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`${voltage.toFixed(1)} V`, 40, 155);

      // Draw resistor (Resistance)
      ctx.fillStyle = '#d35400'; // dark orange resistor body
      ctx.fillRect(180, 80, 40, 40);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(180, 100);
      ctx.lineTo(190, 85);
      ctx.lineTo(200, 115);
      ctx.lineTo(210, 85);
      ctx.lineTo(220, 100);
      ctx.stroke();
      
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${resistance} Ω`, 180, 70);

      // Draw electrons flowing based on current
      const numElectrons = Math.max(1, Math.min(20, Math.floor(current / 2)));
      ctx.fillStyle = '#00f0ff'; // bright cyan electrons
      const time = Date.now() / 1000;
      for (let i = 0; i < numElectrons; i++) {
        const offset = ((time * current * 2) + (i * (400 / numElectrons))) % 400;
        let x, y;
        if (offset < 100) { // top wire right
            x = 200 + offset;
            y = 100;
        } else if (offset < 200) { // right wire down
            x = 300;
            y = 100 + (offset - 100);
        } else if (offset < 300) { // bottom wire left
            x = 300 - (offset - 200);
            y = 200;
        } else { // left wire up
            x = 100;
            y = 200 - (offset - 300);
        }
        
        // Clamp to circuit bounds
        x = Math.max(100, Math.min(300, x));
        y = Math.max(100, Math.min(200, y));

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    let animationId;
    const animate = () => {
      drawCircuit();
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => cancelAnimationFrame(animationId);
  }, [voltage, resistance, current]);

  const vSize = 1 + (voltage / 9);
  const rSize = 1 + (resistance / 1000);
  const iSize = 1 + (current / 9);

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
      {/* Centered Canvas & Formula Display */}
      <div style={{
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        width: '500px'
      }}>
        {/* Dynamic Formula Display */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(8px)',
          borderRadius: '24px',
          padding: '24px',
          width: '100%',
          height: '160px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '30px' }}>
            <div style={{ transform: `scale(${vSize})`, transition: 'transform 0.2s', fontSize: '48px', fontWeight: 'bold', color: '#3498db' }}>
              V
            </div>
            <div style={{ fontSize: '40px', fontWeight: 'bold', color: 'rgba(255,255,255,0.7)' }}>=</div>
            <div style={{ transform: `scale(${iSize})`, transition: 'transform 0.2s', fontSize: '48px', fontWeight: 'bold', color: '#e74c3c' }}>
              I
            </div>
            <div style={{ fontSize: '40px', fontWeight: 'bold', color: 'rgba(255,255,255,0.7)' }}>×</div>
            <div style={{ transform: `scale(${rSize})`, transition: 'transform 0.2s', fontSize: '48px', fontWeight: 'bold', color: '#2ecc71' }}>
              R
            </div>
          </div>
        </div>

        {/* Canvas Display */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '24px',
          padding: '20px',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
          width: '100%',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <canvas ref={canvasRef} width={400} height={300} style={{ display: 'block', borderRadius: '12px' }} />
        </div>
      </div>

      {/* Floating Control Panel */}
      <div style={{
        position: 'absolute',
        top: '90px',
        right: '20px',
        width: '320px',
        background: 'rgba(20, 20, 30, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(12px)',
        padding: '20px',
        borderRadius: '16px',
        zIndex: 10,
        color: 'white',
        fontFamily: "'Inter', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        pointerEvents: 'auto'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', margin: 0 }}>
          Circuit settings
        </h3>

        {/* Voltage */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: '#3498db', fontWeight: '600' }}>Voltage (V):</span>
            <span style={{ fontWeight: '600', fontFamily: 'monospace' }}>{voltage.toFixed(1)} V</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="9.0"
            step="0.1"
            value={voltage}
            onChange={(e) => setVoltage(parseFloat(e.target.value))}
            style={{ accentColor: '#3498db', cursor: 'pointer', width: '100%' }}
          />
        </div>

        {/* Resistance */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: '#2ecc71', fontWeight: '600' }}>Resistance (R):</span>
            <span style={{ fontWeight: '600', fontFamily: 'monospace' }}>{resistance} Ω</span>
          </div>
          <input
            type="range"
            min="10"
            max="1000"
            step="10"
            value={resistance}
            onChange={(e) => setResistance(parseInt(e.target.value))}
            style={{ accentColor: '#2ecc71', cursor: 'pointer', width: '100%' }}
          />
        </div>

        {/* Current Value Card */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '10px',
          padding: '12px',
          marginTop: '6px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Current (I) = V / R
          </span>
          <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#e74c3c', fontFamily: 'monospace' }}>
            {current.toFixed(1)} mA
          </span>
        </div>
      </div>
    </div>
  );
};

export default function CustomOhmsLaw({ onBack, title }) {
    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a1a', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100 }}>
                {onBack ? (
                    <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)', padding: '10px 20px', borderRadius: '12px', color: '#fff', cursor: 'pointer', transition: 'all 0.3s ease', fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                        ← Back
                    </button>
                ) : <div />}
                <h1 style={{ color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '24px', fontWeight: '600', textShadow: '0 2px 10px rgba(0,0,0,0.5)', margin: 0 }}>
                    {title || "Ohm's Law"}
                </h1>
                <div style={{ width: '100px' }}></div>
            </div>
            <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'auto' }}>
                 <CustomOhmsLawInner />
            </div>
        </div>
    );
}
