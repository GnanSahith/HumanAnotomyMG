import React from 'react';

export default function CustomMathsBackgroundCheck() {
  return (
    <div className="maths-test-wrapper" style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      background: `linear-gradient(rgba(10, 10, 20, 0.95), rgba(10, 10, 20, 0.95)), url('/bg_maths.jpg')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'sans-serif',
      overflow: 'hidden'
    }}>
      <style>{`
        /* Attempt to make GeoGebra transparent, or blend it */
        .maths-test-wrapper > div { 
            background: transparent !important; 
        }
        .maths-test-wrapper .applet_scaler {
            opacity: 0.85;
            mix-blend-mode: screen;
        }
      `}</style>
      {/* We will let MathsSimulationView inject GeoGebraPlayer here instead, because GeoGebraPlayer is not exported! */}
    </div>
  );
}
