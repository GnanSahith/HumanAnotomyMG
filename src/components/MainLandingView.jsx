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
    Users,
    Award,
    Zap,
    BookOpen
} from 'lucide-react';
import '../MainLanding.css';

const MainLandingView = ({ onSelectRoute }) => {
  return (
    <div className="landing-page-container">
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-orb orb-primary"></div>
          <div className="hero-orb orb-secondary"></div>
          <div className="hero-grid-overlay"></div>
        </div>
        
        <div className="hero-content">
          <div className="hero-text" data-aos="fade-up">
            <div className="hero-badge">Next-Generation Learning</div>
            <h1>Interactive Simulations</h1>
            <h2 className="hero-highlight">Explore the Universe.</h2>
            <p className="hero-subtitle">
              Transforming complex theoretical concepts into visual, experiential, and interactive 3D models.
            </p>
            <div className="hero-actions mt-4">
              <button className="btn-primary btn-large" onClick={() => onSelectRoute('simulations')}>
                <Play size={20} /> Start Exploring
              </button>
              <button className="btn-secondary btn-large" onClick={() => onSelectRoute('academics')}>
                View Curriculums
              </button>
            </div>
            
            <div className="hero-metrics mt-5">
               <div className="metric"><span className="text-accent">600+</span> Schools</div>
               <div className="metric-divider"></div>
               <div className="metric"><span className="text-accent">55k+</span> Students</div>
               <div className="metric-divider"></div>
               <div className="metric"><span className="text-accent">4</span> Core Subjects</div>
            </div>
          </div>
          
          <div className="hero-visual" data-aos="fade-left" data-aos-delay="200">
             <div className="floating-cards-container">
                <div className="float-card card-physics glass-panel">
                   <div className="card-icon-bg"><Atom size={32} /></div>
                   <div className="card-info">
                      <h4>Physics</h4>
                      <span>Quantum Mechanics</span>
                   </div>
                </div>
                
                <div className="float-card card-chemistry glass-panel">
                   <div className="card-icon-bg"><FlaskConical size={32} /></div>
                   <div className="card-info">
                      <h4>Chemistry</h4>
                      <span>Molecular Structures</span>
                   </div>
                </div>
                
                <div className="float-card card-math glass-panel">
                   <div className="card-icon-bg"><Calculator size={32} /></div>
                   <div className="card-info">
                      <h4>Mathematics</h4>
                      <span>Calculus & Geometry</span>
                   </div>
                </div>

                <div className="float-card card-biology glass-panel">
                   <div className="card-icon-bg"><Dna size={32} /></div>
                   <div className="card-info">
                      <h4>Biology</h4>
                      <span>Cellular Organisms</span>
                   </div>
                </div>
                
                <div className="central-glow"></div>
             </div>
          </div>
        </div>
      </section>

      {/* Stats Strip Section */}
      <section className="stats-strip glass-panel">
         <div className="stat-item" data-aos="fade-up" data-aos-delay="100">
            <div className="stat-icon text-blue"><Users size={28} /></div>
            <div>
               <h3>Immersive Learning</h3>
               <p>Gamified educational models</p>
            </div>
         </div>
         <div className="stat-item" data-aos="fade-up" data-aos-delay="200">
            <div className="stat-icon text-orange"><Zap size={28} /></div>
            <div>
               <h3>Real-Time Data</h3>
               <p>Instant physics & chemistry parameters</p>
            </div>
         </div>
         <div className="stat-item" data-aos="fade-up" data-aos-delay="300">
            <div className="stat-icon text-purple"><BookOpen size={28} /></div>
            <div>
               <h3>Curriculum Aligned</h3>
               <p>CBSE, ICSE, and IB standards</p>
            </div>
         </div>
      </section>

      {/* What We Offer Section */}
      <section className="offer-section">
        <div className="section-header text-center" data-aos="fade-up">
          <h3 className="section-subtitle">WHAT WE OFFER</h3>
          <h2 className="section-title">Master complex subjects using interactive <br/> <span className="text-accent text-gradient">3D simulations</span></h2>
          
          <div className="feature-badges">
            <div className="badge glass-panel"><Clock size={16} className="text-blue"/> Self-paced Learning</div>
            <div className="badge glass-panel"><Smartphone size={16} className="text-purple"/> Multi-device Support</div>
            <div className="badge glass-panel"><Wifi size={16} className="text-green"/> 24/7 Accessibility</div>
          </div>
        </div>

        <div className="subject-cards-grid">
          <div className="subject-card physics-card glass-panel" data-aos="fade-up" data-aos-delay="100" onClick={() => onSelectRoute('simulations')}>
            <div className="card-bg-glow"></div>
            <div className="card-icon-wrapper"><Atom size={40} /></div>
            <div className="card-content">
                <h3>Physics</h3>
                <p>Explore the laws of nature through interactive experiments. Understand kinematics, thermodynamics, and quantum physics visually.</p>
            </div>
            <div className="card-arrow"><ArrowRight size={20} /></div>
          </div>

          <div className="subject-card chemistry-card glass-panel" data-aos="fade-up" data-aos-delay="200" onClick={() => onSelectRoute('simulations')}>
            <div className="card-bg-glow"></div>
            <div className="card-icon-wrapper"><FlaskConical size={40} /></div>
            <div className="card-content">
                <h3>Chemistry</h3>
                <p>Visualize chemical reactions, discover the molecular world, and run virtual titrations in a completely safe digital environment.</p>
            </div>
            <div className="card-arrow"><ArrowRight size={20} /></div>
          </div>

          <div className="subject-card math-card glass-panel" data-aos="fade-up" data-aos-delay="300" onClick={() => onSelectRoute('simulations')}>
            <div className="card-bg-glow"></div>
            <div className="card-icon-wrapper"><Calculator size={40} /></div>
            <div className="card-content">
                <h3>Mathematics</h3>
                <p>Visualize abstract concepts, plot complex functions, and solve geometry problems with our dynamic 3D interactive models.</p>
            </div>
            <div className="card-arrow"><ArrowRight size={20} /></div>
          </div>

          <div className="subject-card biology-card glass-panel" data-aos="fade-up" data-aos-delay="400" onClick={() => onSelectRoute('simulations')}>
            <div className="card-bg-glow"></div>
            <div className="card-icon-wrapper"><Dna size={40} /></div>
            <div className="card-content">
                <h3>Biology</h3>
                <p>Explore the living world inside out. From cellular structures to human anatomy, witness biology through hyper-realistic 3D rendering.</p>
            </div>
            <div className="card-arrow"><ArrowRight size={20} /></div>
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
            <h2 className="section-title">Where Learning Becomes an <br/><span className="text-gradient">Experience.</span></h2>
            <p className="about-description">
              At MyGnan, we are reimagining the way students learn by transforming complex concepts into interactive, visual and experiential learning experiences through cutting-edge digital simulations.
            </p>
            
            <div className="about-features">
               <div className="about-feature glass-panel">
                  <div className="feature-icon-wrapper text-purple"><Eye size={24} /></div>
                  <div className="feature-text">
                     <h4>Visual Learning</h4>
                     <p>See concepts come to life with interactive 3D models.</p>
                  </div>
               </div>
               
               <div className="about-feature glass-panel">
                  <div className="feature-icon-wrapper text-blue"><Pointer size={24} /></div>
                  <div className="feature-text">
                     <h4>Deep Interaction</h4>
                     <p>Interact with parameters in real-time to witness immediate results.</p>
                  </div>
               </div>
               
               <div className="about-feature glass-panel">
                  <div className="feature-icon-wrapper text-green"><TestTube size={24} /></div>
                  <div className="feature-text">
                     <h4>Experiential Design</h4>
                     <p>Experiment safely and understand naturally through simulation.</p>
                  </div>
               </div>
               
               <div className="about-feature glass-panel">
                  <div className="feature-icon-wrapper text-orange"><Cpu size={24} /></div>
                  <div className="feature-text">
                     <h4>Technology-Driven</h4>
                     <p>Powered by WebGL, 3D simulations, and modern educational tools.</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Call to Action Section */}
      <section className="cta-section" data-aos="fade-up">
         <div className="cta-container glass-panel">
             <div className="cta-bg-glow"></div>
             <h2>Ready to Revolutionize Your Classroom?</h2>
             <p>Join over 600+ partner schools and empower your students with immersive learning today.</p>
             <button className="btn-primary btn-large mt-4" onClick={() => onSelectRoute('simulations')}>
               Enter the Simulations <ArrowRight size={20} />
             </button>
         </div>
      </section>

      {/* Footer padding */}
      <div style={{ height: '80px' }}></div>
    </div>
  );
};

const GlobeWireframe = () => (
    <svg viewBox="0 0 100 100" className="wireframe-globe">
        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="0.5" />
        <ellipse cx="50" cy="50" rx="45" ry="15" fill="none" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="0.5" />
        <ellipse cx="50" cy="50" rx="15" ry="45" fill="none" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="0.5" />
        <ellipse cx="50" cy="50" rx="45" ry="30" fill="none" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="0.5" />
        <ellipse cx="50" cy="50" rx="30" ry="45" fill="none" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="0.5" />
        <path d="M 5,50 L 95,50" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="0.5" />
        <path d="M 50,5 L 50,95" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="0.5" />
    </svg>
)

export default MainLandingView;
