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
import { ChevronRight, Globe, User, ChevronDown, Sun, Moon } from 'lucide-react';
import { useLanguage } from './LanguageContext';

function App() {
  const { currentLanguage, toggleLanguage, t } = useLanguage();
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
    setActiveOrganId(null); // Reset organ when changing system
  };

  const handleBackToSystems = () => {
    setActiveSystemId(null);
    setActiveOrganId(null);
    setIsAccountView(false);
  };

  const handleReturnToPortal = () => {
    setIsLanding(true);
    setActiveModule(null);
  };

  return (
    <div className="app-container">
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

            <button
              onClick={() => setIsAccountView(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.color = 'var(--accent)'; }}
            >
              <User size={20} />
            </button>
          </div>
        </header>

      {/* Breadcrumbs for deep navigation */}
      {activeOrgan && (
        <div className="breadcrumbs glass-panel">
          <button onClick={handleBackToSystems}>Systems</button>
          <ChevronRight size={14} />
          <button onClick={() => setActiveOrganId(null)}>{t(activeSystem.name)}</button>
          <ChevronRight size={14} />
          <span className="current">{t(activeOrgan.name).replace(' (Model Coming Soon)', '')}</span>
        </div>
      )}

      {/* Main Routing */}
      {isLanding ? (
        <LandingView onEnter={(module) => { setIsLanding(false); setActiveModule(module); }} />
      ) : activeModule === 'maths' ? (
        <MathsSimulationView onBack={handleReturnToPortal} />
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
          {/* Always show the System View base (Sidebar) */}
          <SystemView
            system={activeSystem}
            onBack={handleBackToSystems}
            onSelectOrgan={setActiveOrganId}
            activeOrganId={activeOrganId}
          />

          {/* If an organ is selected, overlay or inject the Organ views */}
          {activeOrgan && (
            <div className="organ-content-area">
              <ModelViewer activeOrgan={activeOrgan} />
              <DetailsView activeOrgan={activeOrgan} />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default App;
