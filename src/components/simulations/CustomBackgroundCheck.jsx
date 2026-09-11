import React from 'react';

export default function CustomBackgroundCheck({ onBack, title }) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      // The linear-gradient is 95% dark, making the background image barely visible
      background: `linear-gradient(rgba(10, 10, 20, 0.96), rgba(10, 10, 20, 0.96)), url('/bg_chem_physics.jpg')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{ fontSize: '3rem', textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>
        Background Check
      </h1>
      <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.6)', marginTop: '20px' }}>
        This is a test of the dim, faded physics/chemistry background.
      </p>
    </div>
  );
}
