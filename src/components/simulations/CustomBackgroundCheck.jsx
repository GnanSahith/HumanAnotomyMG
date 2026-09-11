import React from 'react';
import CustomPendulumLab from './CustomPendulumLab';
import CustomBalancingChemicalEquations from './CustomBalancingChemicalEquations';

export default function CustomBackgroundCheck({ onBack, title, isPlaying, syncPlayState, onTogglePlay, type }) {
  return (
    <div className="test-wrapper" style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      background: `linear-gradient(rgba(10, 10, 20, 0.95), rgba(10, 10, 20, 0.95)), url('/bg_chem_physics.jpg')`,
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
        /* Force the simulation container to be transparent so our image shows through */
        .test-wrapper > div { 
            background: transparent !important; 
        }
      `}</style>
      {type === 'chemistry' ? (
        <CustomBalancingChemicalEquations 
          onBack={onBack} 
          title={title} 
          isPlaying={isPlaying} 
          syncPlayState={syncPlayState} 
          onTogglePlay={onTogglePlay} 
        />
      ) : (
        <CustomPendulumLab 
          onBack={onBack} 
          title={title} 
          isPlaying={isPlaying} 
          syncPlayState={syncPlayState} 
          onTogglePlay={onTogglePlay} 
        />
      )}
    </div>
  );
}
