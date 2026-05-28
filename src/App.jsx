import React, { useState, useEffect, useRef } from 'react';
import { systemsData } from './data';
import LandingView from './components/LandingView';
import HomeView from './components/HomeView';
import SystemView from './components/SystemView';
import ModelViewer from './components/ModelViewer';
import DetailsView from './components/DetailsView';
import AccountView from './components/AccountView';
import InteractiveTestView from './components/InteractiveTestView';
import InteractiveDigestiveView from './components/InteractiveDigestiveView_v2'; // V2: label tracks organ
import HumanAnatomyDigestiveView from './components/HumanAnatomyDigestiveView';
import MathsSimulationView from './components/MathsSimulationView';
import ChemistrySimulationView from './components/ChemistrySimulationView';
import PhysicsSimulationView from './components/PhysicsSimulationView';
import MainLandingView from './components/MainLandingView';
import AcademicsView from './components/AcademicsView';
import SubjectContentView from './components/SubjectContentView';
import { ChevronRight, Globe, ChevronDown, Sun, Moon } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { useLanguage } from './LanguageContext';

function App() {
  const { currentLanguage, toggleLanguage, t } = useLanguage();
  const [appMode, setAppMode] = useState('root'); // 'root', 'academics', 'subject_content', 'simulations'
  const [activeSubject, setActiveSubject] = useState(null);
  const [isLanding, setIsLanding] = useState(true);
  const [activeModule, setActiveModule] = useState(null);
  const [isAccountView, setIsAccountView] = useState(false);
  const [activeSystemId, setActiveSystemId] = useState(null);
  const [activeOrganId, setActiveOrganId] = useState(null);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Apply the theme to the root HTML element so CSS variable overrides work globally
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeSystem = systemsData.find((s) => s.id === activeSystemId);
  const activeOrgan = activeSystem?.organs.find((o) => o.id === activeOrganId);

  // Handlers
  const handleSelectSystem = (systemId) => {
    setActiveSystemId(systemId);
    if (systemId === 'digestive') {
      setActiveOrganId('digestive_entire');
    } else {
      setActiveOrganId(null);
    }
  };

  const handleBackToSystems = () => {
    setActiveSystemId(null);
    setActiveOrganId(null);
    setIsAccountView(false);
  };

  const handleReturnToPortal = () => {
    setAppMode('root');
    setActiveSubject(null);
    setIsLanding(true);
    setActiveModule(null);
    setActiveSystemId(null);
    setActiveOrganId(null);
  };

  const handleBackToSimulations = () => {
    setIsLanding(true);
    setActiveModule(null);
    setActiveSystemId(null);
    setActiveOrganId(null);
  };

  return (
    <div className={`app-container ${appMode === 'simulations' && (activeModule === 'maths' || activeModule === 'chemistry' || activeModule === 'physics') ? 'maths-view-active' : ''}`}>
      {/* Background blobs for Apple Vision Pro style feeling */}
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>
      <div className="bg-blob blob-3"></div>
      <div className="bg-blob blob-4"></div>

      {/* Global Top Bar (Glassmorphism Pill) */}
      <header className="global-header-pill">
        <div onClick={handleReturnToPortal} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <img 
            src={theme === 'dark' ? './assets/logo_white.png' : './assets/logo_black.png'} 
            alt="MYGNAN Logo" 
            style={{ height: '45px', objectFit: 'contain' }} 
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div className="custom-dropdown-container" ref={dropdownRef} onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}>
              <Globe size={18} />
              <span>
                {currentLanguage === 'en' ? 'English' : currentLanguage === 'hi' ? 'हिन्दी' : 'తెలుగు'}
              </span>
              <ChevronDown size={16} className={`dropdown-chevron ${isLangDropdownOpen ? 'open' : ''}`} />

              {isLangDropdownOpen && (
                <div className="custom-dropdown-menu">
                  <div className={`dropdown-item ${currentLanguage === 'en' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); toggleLanguage('en'); setIsLangDropdownOpen(false); }}>English</div>
                  <div className={`dropdown-item ${currentLanguage === 'hi' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); toggleLanguage('hi'); setIsLangDropdownOpen(false); }}>हिन्दी</div>
                  <div className={`dropdown-item ${currentLanguage === 'te' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); toggleLanguage('te'); setIsLangDropdownOpen(false); }}>తెలుగు</div>
                </div>
              )}
            </div>

            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; e.currentTarget.style.color = 'var(--accent)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <SignedIn>
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    userButtonAvatarBox: {
                      width: '40px',
                      height: '40px'
                    }
                  }
                }}
              />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button
                  style={{
                    background: 'var(--accent)',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '8px 20px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 14px 0 rgba(10, 132, 255, 0.39)',
                    marginLeft: '8px'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'none' }}
                >
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </header>

      {/* Breadcrumbs for deep navigation */}
      {activeSystem && (
        <div className="breadcrumbs glass-panel">
          <button onClick={handleBackToSystems}>Systems</button>
          <ChevronRight size={14} />
          {activeOrgan ? (
            <>
              <button onClick={() => setActiveOrganId(null)}>{t(activeSystem.name)}</button>
              <ChevronRight size={14} />
              <span className="current">{t(activeOrgan.name).replace(' (Model Coming Soon)', '')}</span>
            </>
          ) : (
            <span className="current">{t(activeSystem.name)}</span>
          )}
        </div>
      )}

      {/* Main Routing */}
      {appMode === 'root' ? (
        <MainLandingView onSelectRoute={setAppMode} />
      ) : appMode === 'academics' ? (
        <AcademicsView onSelectSubject={(subject) => {
          setActiveSubject(subject);
          setAppMode('subject_content');
        }} />
      ) : appMode === 'subject_content' ? (
        <SubjectContentView 
          subject={activeSubject} 
          onBack={() => {
            setActiveSubject(null);
            setAppMode('academics');
          }} 
        />
      ) : appMode === 'simulations' ? (
        isLanding ? (
          <LandingView onEnter={(module) => { setIsLanding(false); setActiveModule(module); }} />
        ) : activeModule === 'maths' ? (
          <MathsSimulationView onBack={handleBackToSimulations} />
        ) : activeModule === 'chemistry' ? (
          <ChemistrySimulationView onBack={handleBackToSimulations} />
        ) : activeModule === 'physics' ? (
          <PhysicsSimulationView onBack={handleBackToSimulations} />
        ) : activeModule === 'biology' && isAccountView ? (
          <AccountView />
        ) : activeModule === 'biology' && !activeSystemId ? (
          <HomeView systems={systemsData} onSelectSystem={handleSelectSystem} />
        ) : activeModule === 'biology' && activeSystemId === 'cars' ? (
          <InteractiveTestView onBack={handleBackToSystems} />
        ) : activeModule === 'biology' && activeSystemId === 'digestive_interactive' ? (
          <InteractiveDigestiveView onBack={handleBackToSystems} />
        ) : activeModule === 'biology' && activeSystemId === 'digestive_combined' ? (
          <HumanAnatomyDigestiveView onBack={handleBackToSystems} />
        ) : activeModule === 'biology' ? (
          <div className="system-container fade-in-scale">
            {/* Use the 3-panel layout via SystemView children */}
            <SystemView
              system={activeSystem}
              onBack={handleBackToSystems}
              onSelectOrgan={setActiveOrganId}
              activeOrganId={activeOrganId}
            >
              {activeOrgan && (
                <>
                  <ModelViewer activeOrgan={activeOrgan} />
                  <DetailsView activeOrgan={activeOrgan} />
                </>
              )}
            </SystemView>
          </div>
        ) : null
      ) : null}
    </div>
  );
}

export default App;
