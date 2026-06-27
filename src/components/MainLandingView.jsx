import React from 'react';
import { BookOpen, MonitorPlay, Lock } from 'lucide-react';
import '../MainLanding.css';

const MainLandingView = ({ onSelectRoute, isSignedIn, isAuthenticated }) => {
  const isSimulationsLocked = isSignedIn && !isAuthenticated;

  return (
    <div className="split-landing-container">
      <div className="split-half academics-half" onClick={() => onSelectRoute('academics')}>
        <div className="split-content">
          <BookOpen size={80} className="split-icon" />
          <h1>Academics</h1>
          <p>Comprehensive study materials, NCERT solutions, concepts, and board preparation.</p>
        </div>
      </div>
      <div 
        className="split-half simulations-half" 
        onClick={() => onSelectRoute('simulations')}
        style={isSimulationsLocked ? { opacity: 0.5, cursor: 'not-allowed', filter: 'grayscale(0.8)' } : {}}
      >
        <div className="split-content">
          {isSimulationsLocked ? <Lock size={80} className="split-icon" style={{ color: '#ff4d4d' }} /> : <MonitorPlay size={80} className="split-icon" />}
          <h1>Simulations {isSimulationsLocked && '(Locked)'}</h1>
          <p>Interactive 3D models and practical simulations for Math, Physics, Chemistry, and Biology.</p>
        </div>
      </div>
    </div>
  );
};

export default MainLandingView;
