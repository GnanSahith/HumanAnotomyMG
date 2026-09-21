import React from 'react';
import { 
    Play, 
    Atom, 
    FlaskConical, 
    Calculator, 
    Dna,
    Clock,
    Smartphone,
    Wifi,
    Eye,
    Pointer,
    TestTube,
    Cpu,
    ArrowRight,
    MonitorPlay
} from 'lucide-react';
import '../MainLanding.css';

const MainLandingView = ({ onSelectRoute }) => {
  return (
    <div className="landing-page-container">
      
      {/* Navbar Overlay */}
      <nav className="landing-navbar glass-panel">
        <div className="nav-logo">
          <MonitorPlay size={24} className="text-accent" />
          <span>MyGnan</span>
        </div>
        <div className="nav-links">
          <button className="nav-link active">Home</button>
          <button className="nav-link" onClick={() => onSelectRoute('academics')}>Curriculums</button>
          <button className="nav-link" onClick={() => onSelectRoute('simulations')}>Simulations</button>
        </div>
        <div className="nav-actions">
          <button className="btn-primary" onClick={() => onSelectRoute('simulations')}>
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-orb orb-blue"></div>
          <div className="hero-orb orb-purple"></div>
        </div>
        
        <div className="hero-content">
          <div className="hero-text" data-aos="fade-right">
            <h1>Interactive Simulations</h1>
            <h2 className="hero-highlight">Explore</h2>
            <p className="hero-subtitle">
              Visualize <span className="dot">•</span> Experiment <span className="dot">•</span> Learn <span className="dot">•</span> Grow
            </p>
            <button className="btn-primary btn-large mt-4" onClick={() => onSelectRoute('simulations')}>
              <Play size={20} /> Start Exploring
            </button>
          </div>
          
          <div className="hero-visual" data-aos="fade-left">
             <div className="laptop-mockup glass-panel">
                 <div className="laptop-screen">
                     <div className="sim-preview-grid">
                        <div className="sim-node physics-node"><Atom size={32} /><span>Physics</span></div>
                        <div className="sim-node chemistry-node"><FlaskConical size={32} /><span>Chemistry</span></div>
                        <div className="sim-node math-node"><Calculator size={32} /><span>Mathematics</span></div>
                        <div className="sim-node biology-node"><Dna size={32} /><span>Biology</span></div>
                     </div>
                 </div>
                 <div className="laptop-base"></div>
             </div>
          </div>
        </div>
      </section>

      {/* What We Offer Section */}
      <section className="offer-section">
        <div className="section-header text-center" data-aos="fade-up">
          <h3 className="section-subtitle">WHAT WE OFFER</h3>
          <h2 className="section-title">Learn interactive lessons using simulations <br/> <span className="text-accent">any time and anywhere</span></h2>
          
          <div className="feature-badges">
            <div className="badge glass-panel"><Clock size={18} className="badge-icon text-blue"/> Learn at your own pace</div>
            <div className="badge glass-panel"><Smartphone size={18} className="badge-icon text-purple"/> Access on any device</div>
            <div className="badge glass-panel"><Wifi size={18} className="badge-icon text-green"/> Any time Anywhere</div>
          </div>
        </div>

        <div className="subject-cards-grid">
          <div className="subject-card physics-card glass-panel" data-aos="fade-up" data-aos-delay="100" onClick={() => onSelectRoute('simulations')}>
            <div className="card-bg-glow"></div>
            <Atom size={48} className="card-icon" />
            <div className="card-content">
                <h3>Physics</h3>
                <p>Explore the laws of nature through interactive experiments.</p>
            </div>
          </div>

          <div className="subject-card chemistry-card glass-panel" data-aos="fade-up" data-aos-delay="200" onClick={() => onSelectRoute('simulations')}>
            <div className="card-bg-glow"></div>
            <FlaskConical size={48} className="card-icon" />
            <div className="card-content">
                <h3>Chemistry</h3>
                <p>Visualize chemical reactions and discover the molecular world.</p>
            </div>
          </div>

          <div className="subject-card math-card glass-panel" data-aos="fade-up" data-aos-delay="300" onClick={() => onSelectRoute('simulations')}>
            <div className="card-bg-glow"></div>
            <Calculator size={48} className="card-icon" />
            <div className="card-content">
                <h3>Mathematics</h3>
                <p>Visualize concepts and solve problems with interactive models.</p>
            </div>
          </div>

          <div className="subject-card biology-card glass-panel" data-aos="fade-up" data-aos-delay="400" onClick={() => onSelectRoute('simulations')}>
            <div className="card-bg-glow"></div>
            <Dna size={48} className="card-icon" />
            <div className="card-content">
                <h3>Biology</h3>
                <p>Explore the living world with interactive 3D models.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="about-section">
        <div className="about-grid">
          <div className="about-image-col" data-aos="fade-right">
             <div className="about-image-wrapper glass-panel">
                <div className="globe-hologram">
                    <GlobeWireframe />
                </div>
                <div className="about-image-overlay"></div>
             </div>
          </div>
          
          <div className="about-content-col" data-aos="fade-left">
            <h3 className="section-subtitle">ABOUT US</h3>
            <h2 className="section-title">Where Learning Becomes an <span className="text-accent">Experience.</span></h2>
            <p className="about-description">
              At MyGnan, we are reimagining the way students learn by transforming complex concepts into interactive, visual and experiential learning experiences through simulations.
            </p>
            
            <div className="about-features">
               <div className="about-feature">
                  <div className="feature-icon-wrapper text-purple"><Eye size={24} /></div>
                  <div className="feature-text">
                     <h4>Visual</h4>
                     <p>See concepts come to life with interactive 3D models ...</p>
                  </div>
               </div>
               
               <div className="about-feature">
                  <div className="feature-icon-wrapper text-blue"><Pointer size={24} /></div>
                  <div className="feature-text">
                     <h4>Interactive</h4>
                     <p>Interact with concepts and change parameters to see results ...</p>
                  </div>
               </div>
               
               <div className="about-feature">
                  <div className="feature-icon-wrapper text-green"><TestTube size={24} /></div>
                  <div className="feature-text">
                     <h4>Experiential</h4>
                     <p>Experiment, observe and understand through simulation ...</p>
                  </div>
               </div>
               
               <div className="about-feature">
                  <div className="feature-icon-wrapper text-orange"><Cpu size={24} /></div>
                  <div className="feature-text">
                     <h4>Technology-Driven</h4>
                     <p>Powered by 3D, simulations, interactive models and modern digital tools ...</p>
                  </div>
               </div>
            </div>

            <button className="btn-secondary mt-4" onClick={() => onSelectRoute('simulations')}>
               Explore More <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>
      
      {/* Footer padding */}
      <div style={{ height: '100px' }}></div>
    </div>
  );
};

const GlobeWireframe = () => (
    <svg viewBox="0 0 100 100" className="wireframe-globe">
        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(59, 130, 246, 0.5)" strokeWidth="1" />
        <ellipse cx="50" cy="50" rx="45" ry="20" fill="none" stroke="rgba(59, 130, 246, 0.5)" strokeWidth="1" />
        <ellipse cx="50" cy="50" rx="20" ry="45" fill="none" stroke="rgba(59, 130, 246, 0.5)" strokeWidth="1" />
        <path d="M 5,50 L 95,50" stroke="rgba(59, 130, 246, 0.5)" strokeWidth="1" />
        <path d="M 50,5 L 50,95" stroke="rgba(59, 130, 246, 0.5)" strokeWidth="1" />
    </svg>
)

export default MainLandingView;
