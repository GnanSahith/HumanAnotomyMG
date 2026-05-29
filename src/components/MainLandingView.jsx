import React from 'react';
import { BookOpen, MonitorPlay } from 'lucide-react';
import '../MainLanding.css';

const MainLandingView = ({ onSelectRoute }) => {
  return (
    <div className="split-landing-container">
      <div className="split-half academics-half" onClick={() => onSelectRoute('academics')}>
        <div className="split-content">
          <BookOpen size={80} className="split-icon" />
          <h1>Academics</h1>
          <p>Comprehensive study materials, NCERT solutions, concepts, and board preparation.</p>
        </div>
      </div>
      <div className="split-half simulations-half" onClick={() => onSelectRoute('simulations')}>
        <div className="split-content">
          <MonitorPlay size={80} className="split-icon" />
          <h1>Simulations</h1>
          <p>Interactive 3D models and practical simulations for Math, Physics, Chemistry, and Biology.</p>
        </div>
      </div>
    </div>
  );
};

export default MainLandingView;
