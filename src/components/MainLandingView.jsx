import React from 'react';
import { BookOpen, MonitorPlay, Lock } from 'lucide-react';
import { useUser, useClerk } from '@clerk/clerk-react';
import '../MainLanding.css';

const MainLandingView = ({ onSelectRoute }) => {
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();

  const handleRouteClick = (route) => {
    if (!isSignedIn) {
      openSignIn();
    } else {
      onSelectRoute(route);
    }
  };

  return (
    <div className="split-landing-container">
      <div className="split-half academics-half" onClick={() => handleRouteClick('academics')}>
        <div className="split-content">
          <BookOpen size={80} className="split-icon" />
          <h1>Academics</h1>
          <p>Comprehensive study materials, NCERT solutions, concepts, and board preparation.</p>
          {!isSignedIn && <div style={{marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.7)'}}><Lock size={16}/> Sign in required</div>}
        </div>
      </div>
      <div className="split-half simulations-half" onClick={() => handleRouteClick('simulations')}>
        <div className="split-content">
          <MonitorPlay size={80} className="split-icon" />
          <h1>Simulations</h1>
          <p>Interactive 3D models and practical simulations for Math, Physics, Chemistry, and Biology.</p>
          {!isSignedIn && <div style={{marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.7)'}}><Lock size={16}/> Sign in required</div>}
        </div>
      </div>
    </div>
  );
};

export default MainLandingView;
