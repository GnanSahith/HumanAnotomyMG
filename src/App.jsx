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
import PricingView from './components/PricingView';
import ParentDashboardView from './components/ParentDashboardView';
import { ChevronRight, Globe, ChevronDown, Sun, Moon, LogOut, ArrowLeft, LayoutDashboard, User, Settings } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import LoginModal from './components/LoginModal';
import ParentLoginModal from './components/ParentLoginModal';
import DeveloperPanel from './components/DeveloperPanel';
import { useLanguage } from './LanguageContext';
import SelectionTooltip from './components/SelectionTooltip';
import Chatbot from './components/Chatbot';

function App() {
  const { currentLanguage, toggleLanguage, t } = useLanguage();
  const [user, setUser] = useState(null);
  const isSignedIn = !!user;
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsAuthenticated(true);
        const storedUsername = localStorage.getItem('logged_in_username');
        if (!storedUsername) {
          setLoggedInUsername(currentUser.email);
          localStorage.setItem('logged_in_username', currentUser.email);
        } else {
          setLoggedInUsername(storedUsername);
        }
        localStorage.setItem('human_anatomy_auth', 'true');
      }
    });
    return () => unsubscribe();
  }, []);
  const [appMode, setAppMode] = useState('root'); // 'root', 'academics', 'subject_content', 'simulations', 'pricing'
  const [activeSubject, setActiveSubject] = useState(null);
  const [isLanding, setIsLanding] = useState(true);
  const [activeModule, setActiveModule] = useState(null);
  const [isAccountView, setIsAccountView] = useState(false);
  const [activeSystemId, setActiveSystemId] = useState(null);
  const [activeOrganId, setActiveOrganId] = useState(null);
  const [initialSimulationId, setInitialSimulationId] = useState(null);
  const [initialSimulationCategory, setInitialSimulationCategory] = useState(null);
  const [cameFromQuestion, setCameFromQuestion] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('human_anatomy_auth') === 'true';
  });
  const [loggedInUsername, setLoggedInUsername] = useState(() => {
    return localStorage.getItem('logged_in_username') || '';
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showParentLoginModal, setShowParentLoginModal] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const profileDropdownRef = useRef(null);
  
  // Chatbot states
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [chatbotQuery, setChatbotQuery] = useState('');
  
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Apply the theme to the root HTML element so CSS variable overrides work globally
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsLangDropdownOpen(false); setIsSettingsOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
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

  const handleAuthRequiredNavigation = (module) => {
    setIsLanding(false);
    setActiveModule(module);
  };

  const handleLockedItemClick = (onSuccess) => {
    if (isAuthenticated) {
      onSuccess();
    } else if (isSignedIn) {
      setAppMode('pricing');
    } else {
      setShowLoginModal(true);
    }
  };

  const handleFastSwitch = (newUsername) => {
    setLoggedInUsername(newUsername);
    localStorage.setItem('logged_in_username', newUsername);
    setIsProfileDropdownOpen(false);
  };

  const handleLogout = async () => {
    if (isSignedIn) {
      await signOut(auth);
    }
    localStorage.removeItem('human_anatomy_auth');
    localStorage.removeItem('logged_in_username');
    localStorage.removeItem('current_session_id');
    setIsAuthenticated(false);
    setLoggedInUsername('');
    setAppMode('root');
  };

  useEffect(() => {
    if (isAuthenticated && loggedInUsername) {
      const unsub = onSnapshot(doc(db, 'users', loggedInUsername), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const localSession = localStorage.getItem('current_session_id');
          if (data.currentSessionId && localSession && data.currentSessionId !== localSession) {
             if (loggedInUsername !== 'gnansahithmg@admin.local') {
               alert('You have been logged out because your account was accessed from another device.');
               handleLogout();
             }
          }
        }
      });
      return () => unsub();
    }
  }, [isAuthenticated, loggedInUsername]);

  const handleRouteSelect = (route) => {
    if (route === 'simulations') {
      if (!isAuthenticated) {
        setShowLoginModal(true);
        return;
      }
    }
    setCameFromQuestion(false); // Reset when navigating normally
    setAppMode(route);
  };

  const handleBackToQuestion = () => {
    setAppMode('chapters');
    setCameFromQuestion(false);
  };

  const handleNavigateToSimulation = (module, simId, categoryId) => {
    if (module === 'biology') {
      if (simId) handleSelectSystem(simId);
    } else {
      setInitialSimulationId(simId);
      setInitialSimulationCategory(categoryId);
    }
    setCameFromQuestion(true);
    handleAuthRequiredNavigation(module);
    setAppMode('simulations');
  };

  const isIframe = new URLSearchParams(window.location.search).get('mobile_sim') === 'true';

  if (isMobileView) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#12121a', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <DeveloperPanel isMobileView={isMobileView} setIsMobileView={setIsMobileView} />
        <div style={{
          width: '375px',
          height: '812px',
          border: '14px solid #000',
          borderRadius: '40px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          position: 'relative'
        }}>
          {/* iPhone style notch */}
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '120px', height: '25px', background: '#000', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', zIndex: 9999 }}></div>
          <iframe 
            src={window.location.pathname + '?mobile_sim=true'}
            style={{ width: '100%', height: '100%', border: 'none', background: 'var(--bg-primary)' }}
            title="Mobile Simulator"
          />
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`app-container ${appMode === 'simulations' && (activeModule === 'maths' || activeModule === 'chemistry' || activeModule === 'physics') ? 'maths-view-active' : ''}`}
    >
      {!isIframe && <DeveloperPanel isMobileView={isMobileView} setIsMobileView={setIsMobileView} />}
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
        
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            
            <div className="custom-dropdown-container" ref={dropdownRef} onClick={() => setIsSettingsOpen(!isSettingsOpen)}>
                <button
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
                  className="settings-btn"
                >
                  <Settings size={20} />
                </button>
                
                {isSettingsOpen && (
                  <div className="custom-dropdown-menu" style={{ width: '220px', padding: '10px', right: 0 }}>
                    {/* Theme Toggle inside settings */}
                    <div className="dropdown-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={(e) => { e.stopPropagation(); setTheme(theme === 'dark' ? 'light' : 'dark'); }}>
                      <span>Theme</span>
                      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    </div>
                    
                    {/* Language Switcher inside settings */}
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '4px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Language</div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className={`dropdown-item ${currentLanguage === 'en' ? 'active' : ''}`} style={{ padding: '4px 8px', flex: 1, textAlign: 'center' }} onClick={(e) => { e.stopPropagation(); toggleLanguage('en'); }}>EN</button>
                        <button className={`dropdown-item ${currentLanguage === 'hi' ? 'active' : ''}`} style={{ padding: '4px 8px', flex: 1, textAlign: 'center' }} onClick={(e) => { e.stopPropagation(); toggleLanguage('hi'); }}>HI</button>
                        <button className={`dropdown-item ${currentLanguage === 'te' ? 'active' : ''}`} style={{ padding: '4px 8px', flex: 1, textAlign: 'center' }} onClick={(e) => { e.stopPropagation(); toggleLanguage('te'); }}>TE</button>
                      </div>
                    </div>

                    {/* Parent Dashboard inside settings */}
                    {['GnanSahith@MG', 'MyGnanAD', 'MGRoot01', 'gnansahithmg@admin.local', 'mygnanad@admin.local', 'mgroot01@admin.local', 'CharanKumar@MG', 'SandhyaRekha@MG', 'VishnuKranthi@MG', 'charankumarmg@student.local', 'sandhyarekhamg@student.local', 'vishnukranthimg@student.local'].includes(loggedInUsername) && (
                      <div className="dropdown-item" onClick={(e) => {
                        e.stopPropagation();
                        setIsSettingsOpen(false);
                        if (localStorage.getItem('parent_logged_in') === 'true') {
                          setAppMode('dashboard');
                        } else {
                          setShowParentLoginModal(true);
                        }
                      }}>
                        <LayoutDashboard size={16} style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} />
                        Parent Dashboard
                      </div>
                    )}
                    
                    {/* User Profile Fast Switch (Root only) */}
                    {['GnanSahith@MG', 'MyGnanAD', 'MGRoot01', 'gnansahithmg@admin.local', 'mygnanad@admin.local', 'mgroot01@admin.local'].includes(loggedInUsername) ? (
                      <div style={{ padding: '8px 12px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Switch User</div>
                        <div className="dropdown-item" onClick={(e) => { e.stopPropagation(); handleFastSwitch('CharanKumar@MG'); }}>CharanKumar</div>
                        <div className="dropdown-item" onClick={(e) => { e.stopPropagation(); handleFastSwitch('SandhyaRekha@MG'); }}>SandhyaRekha</div>
                        <div className="dropdown-item" onClick={(e) => { e.stopPropagation(); handleFastSwitch('MyGnanAD'); }}>MyGnanAD</div>
                      </div>
                    ) : (
                      <div style={{ padding: '8px 12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Logged in as: <br/><strong style={{color: '#fff'}}>{loggedInUsername.replace('@MG', '')}</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>
            {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  style={{
                    background: 'var(--accent)',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '8px 20px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '14px',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span className="hide-on-mobile">Logout</span> <LogOut size={16} />
                </button>
            ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  style={{
                    background: 'var(--accent)',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '8px 20px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '14px',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span className="hide-on-mobile">Login</span> <LogOut size={16} />
                </button>
            )}
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
        <MainLandingView onSelectRoute={handleRouteSelect} isSignedIn={isSignedIn} isAuthenticated={isAuthenticated} />
      ) : appMode === 'pricing' ? (
        <PricingView onBack={() => setAppMode('simulations')} />
      ) : appMode === 'academics' ? (
        <AcademicsView 
          onBack={() => setAppMode('root')}
          onSelectSubject={(subject) => {
            setActiveSubject(subject);
            setAppMode('subject_content');
          }} 
        />
      ) : appMode === 'subject_content' ? (
        <SubjectContentView 
          subject={activeSubject} 
          onBack={() => {
            setActiveSubject(null);
            setAppMode('academics');
          }} 
          onNavigateToSimulation={handleNavigateToSimulation}
        />
      ) : appMode === 'simulations' ? (
        !isAuthenticated ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#fff', gap: '20px' }}>
            <h2 style={{ fontSize: '32px' }}>Access Denied</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>Simulations are exclusively available to Administrator and Root logins.</p>
            <button onClick={handleReturnToPortal} style={{ padding: '12px 24px', background: 'var(--accent)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
              Return to Home
            </button>
          </div>
        ) : isLanding ? (
          <LandingView onEnter={handleAuthRequiredNavigation} loggedInUsername={loggedInUsername} />
        ) : activeModule === 'maths' ? (
          <MathsSimulationView onBack={handleBackToSimulations} handleLockedItemClick={handleLockedItemClick} isSignedIn={isSignedIn} initialSimulationId={initialSimulationId} initialCategory={initialSimulationCategory} />
        ) : activeModule === 'chemistry' ? (
          <ChemistrySimulationView onBack={handleBackToSimulations} handleLockedItemClick={handleLockedItemClick} isSignedIn={isSignedIn} initialSimulationId={initialSimulationId} initialCategory={initialSimulationCategory} />
        ) : activeModule === 'physics' ? (
          <PhysicsSimulationView onBack={handleBackToSimulations} handleLockedItemClick={handleLockedItemClick} isSignedIn={isSignedIn} initialSimulationId={initialSimulationId} initialCategory={initialSimulationCategory} />
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
                  <ModelViewer activeOrgan={activeOrgan} activeSystem={activeSystem} />
                  <DetailsView activeOrgan={activeOrgan} activeSystem={activeSystem} />
                </>
              )}
            </SystemView>
          </div>
        ) : null
      ) : appMode === 'dashboard' ? (
        <ParentDashboardView 
          isStudentView={localStorage.getItem('parent_logged_in') !== 'true'}
          studentUsername={loggedInUsername}
          onBack={handleReturnToPortal} 
          onGoToSimulations={(module, simId, categoryId) => handleNavigateToSimulation(module, simId, categoryId)}
          onLogout={() => {
            localStorage.removeItem('parent_logged_in');
            setAppMode('root');
          }}
        />
      ) : null}

      {appMode === 'simulations' && cameFromQuestion && (
        <button
          onClick={handleBackToQuestion}
          style={{
            position: 'fixed',
            bottom: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: 'linear-gradient(135deg, rgba(191,90,242,0.9), rgba(10,132,255,0.9))',
            color: '#ffffff',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '30px',
            fontSize: '15px',
            fontWeight: 600,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(-50%) translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(191,90,242,0.4)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateX(-50%) translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)'; }}
        >
          <ArrowLeft size={18} />
          Back to Question
        </button>
      )}

      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        defaultTab={isSignedIn ? 'administrator' : 'student'}
        onSuccess={(username) => {
          setIsAuthenticated(true);
          localStorage.setItem('human_anatomy_auth', 'true');
          if (username) {
              localStorage.setItem('logged_in_username', username);
              setLoggedInUsername(username);
          }
          setShowLoginModal(false);
        }}
      />

      <ParentLoginModal 
        isOpen={showParentLoginModal}
        onClose={() => setShowParentLoginModal(false)}
        onSuccess={() => {
          setShowParentLoginModal(false);
          setAppMode('dashboard');
        }}
      />

      <SelectionTooltip 
        onAskChatbot={(text) => {
          setChatbotQuery(text);
          setIsChatbotOpen(true);
        }} 
      />
      
      <Chatbot 
        isOpen={isChatbotOpen} 
        setIsOpen={setIsChatbotOpen} 
        onClose={() => setIsChatbotOpen(false)}
        initialQuery={chatbotQuery}
      />
    </div>
  );
}

export default App;
