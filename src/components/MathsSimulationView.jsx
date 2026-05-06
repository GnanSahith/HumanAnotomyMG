import React, { useState } from 'react';
import { 
    ArrowLeft, Combine, Shapes, Type, Gamepad2, Grid as GridIcon, Scaling, 
    Hexagon, FlipHorizontal, Triangle, Copy, Ruler, RefreshCw, Box, MoveDiagonal,
    Activity, Hash, Calculator, Dices, Layers, PlayCircle
} from 'lucide-react';
import { mathCurriculum } from '../data/mathCurriculum';
import mathSimulations from '../data/mathSimulations.json';

const GeoGebraPlayer = ({ ggbUrl, id }) => {
    const containerRef = React.useRef(null);

    React.useEffect(() => {
        let isMounted = true;

        if (!window.GGBApplet) {
            let script = document.getElementById('ggb-script');
            if (!script) {
                script = document.createElement('script');
                script.id = 'ggb-script';
                script.src = 'https://cdn.geogebra.org/apps/deployggb.js';
                script.async = true;
                script.onload = () => { if (isMounted) initApplet(); };
                document.body.appendChild(script);
            } else {
                script.addEventListener('load', () => { if (isMounted) initApplet(); });
            }
        } else {
            // Add a small delay to ensure container layout is painted
            setTimeout(() => { if (isMounted) initApplet(); }, 100);
        }

        function initApplet() {
            if (!containerRef.current || !isMounted) return;
            
            // Calculate height carefully. Fallback if 0.
            const w = containerRef.current.clientWidth || 800;
            const h = containerRef.current.clientHeight || 600;

            const parameters = {
                "id": `ggbApplet_${id}`,
                "width": w,
                "height": h,
                "showMenuBar": false,
                "showAlgebraInput": false,
                "showToolBar": false,
                "showToolBarHelp": false,
                "showResetIcon": true,
                "enableLabelDrags": false,
                "enableShiftDragZoom": true,
                "enableRightClick": false,
                "errorDialogsActive": false,
                "useBrowserForJS": false,
                "allowStyleBar": false,
                "preventFocus": false,
                "showZoomButtons": true,
                "showFullscreenButton": true,
                "scale": 1,
                "disableAutoScale": false,
                "allowUpscale": false,
                "clickToLoad": false,
                "appName": "classic",
                "buttonRounding": 0.7,
                "buttonShadows": false,
                "language": "en",
                "filename": ggbUrl
            };
            const applet = new window.GGBApplet(parameters, true);
            const containerId = `ggb-element-${id}`;
            containerRef.current.innerHTML = ''; // Prevent duplicates
            containerRef.current.id = containerId;
            applet.inject(containerId);
        }

        return () => {
            isMounted = false;
        };
    }, [ggbUrl, id]);

    return (
        <div style={{ 
            width: '100%', 
            height: '100%', 
            minHeight: '600px', 
            background: '#fff',
            filter: 'invert(0.92) hue-rotate(180deg) brightness(1.1) contrast(0.9)'
        }}>
            <div ref={containerRef} style={{ width: '100%', height: '100%' }}></div>
        </div>
    );
};

// Subcomponents (Current Placeholders)
import AdjacentAngles from './MathsModules/AdjacentAngles';
import PartsOfAngle from './MathsModules/PartsOfAngle';
import NamingAngles from './MathsModules/NamingAngles';
import DrawingAnglesGame from './MathsModules/DrawingAnglesGame';
import CoordinatePlotter from './MathsModules/CoordinatePlotter';
import TriangleClassifier from './MathsModules/TriangleClassifier';
import GeometricEntities from './MathsModules/GeometricEntities';
import LineSymmetry from './MathsModules/LineSymmetry';
import PolygonExplorer from './MathsModules/PolygonExplorer';

export default function MathsSimulationView({ onBack }) {
    // Top-level router state: 'main_categories' -> 'curriculum_grid' -> 'simulation'
    const [viewState, setViewState] = useState('main_categories');
    // Active category for the second level (e.g., 'algebra', 'geometry')
    const [activeCategory, setActiveCategory] = useState(null);
    // Active topic for the third level (e.g., 'algebra_as_patterns')
    const [activeTopic, setActiveTopic] = useState(null);
    // Active specific material simulation index
    const [activeMaterialIndex, setActiveMaterialIndex] = useState(0);

    const mainCategories = [
        { id: 'algebra', label: 'Algebra', count: 277, icon: <Activity size={36} color="#6B4EFF" /> },
        { id: 'geometry', label: 'Geometry', count: 155, icon: <Shapes size={36} color="#F2C94C" /> },
        { id: 'measurement', label: 'Measurement', count: 146, icon: <Ruler size={36} color="#2D9CDB" /> },
        { id: 'number_sense', label: 'Number Sense', count: 184, icon: <Hash size={36} color="#27AE60" /> },
        { id: 'operations', label: 'Operations', count: 221, icon: <Calculator size={36} color="#EB5757" /> },
        { id: 'probability', label: 'Probability and Statistics', count: 77, icon: <Dices size={36} color="#9B51E0" /> },
    ];

    const renderActiveModule = () => {
        // Find all materials for the selected topic
        const topicMaterials = Object.values(mathSimulations || {}).filter(m => m.parentTopic === activeTopic);
        
        if (topicMaterials.length > 0) {
            const currentMaterial = topicMaterials[activeMaterialIndex] || topicMaterials[0];
            return (
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    <GeoGebraPlayer key={currentMaterial.url} ggbUrl={currentMaterial.url} id={currentMaterial.id || 'sim'} />
                    
                    {/* Navigation if multiple materials exist for this topic */}
                    {topicMaterials.length > 1 && (
                        <div style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '12px', background: 'rgba(0,0,0,0.6)', padding: '12px 24px', borderRadius: '100px', backdropFilter: 'blur(10px)', zIndex: 10, alignItems: 'center' }}>
                            <button 
                                onClick={() => setActiveMaterialIndex(i => Math.max(0, i - 1))}
                                disabled={activeMaterialIndex === 0}
                                style={{ background: 'transparent', border: 'none', color: activeMaterialIndex === 0 ? 'rgba(255,255,255,0.2)' : '#fff', cursor: activeMaterialIndex === 0 ? 'default' : 'pointer' }}
                            >
                                Prev
                            </button>
                            <span style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>
                                Part {activeMaterialIndex + 1} of {topicMaterials.length}
                            </span>
                            <button 
                                onClick={() => setActiveMaterialIndex(i => Math.min(topicMaterials.length - 1, i + 1))}
                                disabled={activeMaterialIndex === topicMaterials.length - 1}
                                style={{ background: 'transparent', border: 'none', color: activeMaterialIndex === topicMaterials.length - 1 ? 'rgba(255,255,255,0.2)' : '#fff', cursor: activeMaterialIndex === topicMaterials.length - 1 ? 'default' : 'pointer' }}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            );
        }
        
        // Placeholder for topics not yet downloaded
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.5)' }}>
                <PlayCircle size={64} style={{ marginBottom: '20px', opacity: 0.5 }} />
                <h3 style={{ fontSize: '24px', color: '#fff', marginBottom: '8px' }}>Simulation Loading Engine</h3>
                <p>The interactive GeoGebra simulation for this topic will be available once the download finishes.</p>
            </div>
        );
    };

    // --- PHASE 1: Main Categories View ---
    if (viewState === 'main_categories') {
        return (
            <div className="maths-layout" style={{ 
                flexDirection: 'column', 
                height: '100%', 
                overflowY: 'auto', 
                padding: '100px 40px 40px 40px', 
                alignItems: 'center',
                backgroundColor: 'rgba(74, 64, 150, 0.1)' 
            }}>
                <div style={{ width: '100%', maxWidth: '1200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
                        <button onClick={onBack} className="back-btn" style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.1)', borderRadius: '100px', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <ArrowLeft size={18} /> Back to Portal
                        </button>
                        <h1 style={{ margin: '0 0 0 20px', fontSize: '32px', fontWeight: '700' }}>Mathematics Interactive Library</h1>
                    </div>

                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '18px', marginBottom: '40px', maxWidth: '800px' }}>
                        Explore 1,060 interactive math modules ranging from elementary geometry to advanced calculus. Powered dynamically for seamless learning.
                    </p>

                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
                        gap: '24px' 
                    }}>
                        {mainCategories.map((cat) => (
                            <div 
                                key={cat.id}
                                onClick={() => {
                                    setActiveCategory(cat.id);
                                    setViewState('curriculum_grid');
                                }}
                                style={{
                                    background: '#ffffff',
                                    borderRadius: '16px',
                                    padding: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '24px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                                    color: '#333'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-6px)';
                                    e.currentTarget.style.boxShadow = '0 16px 32px rgba(0,0,0,0.2)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                                }}
                            >
                                <div style={{ 
                                    width: '80px', 
                                    height: '80px', 
                                    background: 'rgba(0,0,0,0.04)', 
                                    borderRadius: '16px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center' 
                                }}>
                                    {cat.icon}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#1a1a1a' }}>{cat.label}</h2>
                                    <span style={{ fontSize: '16px', fontWeight: '500', color: '#6B4EFF' }}>{cat.count} Resources</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // --- Sub Grid View (Dynamic Mapping) ---
    const TopicCard = ({ label, id, isActive, onClick }) => (
        <div 
            onClick={onClick}
            style={{
                background: 'rgba(255,255,255,0.03)',
                border: isActive ? '1px solid rgba(255, 214, 10, 0.4)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 214, 10, 0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            <div style={{
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.5)',
                padding: '10px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Layers size={18} />
            </div>
            <div style={{ 
                color: '#fff', 
                fontSize: '15px', 
                fontWeight: 500 
            }}>
                {label}
            </div>
        </div>
    );

    const GradeSection = ({ title, topics }) => (
        <div style={{ marginBottom: '40px' }}>
            <h3 style={{ 
                color: 'rgba(255,255,255,0.6)', 
                fontSize: '16px', 
                fontWeight: 600, 
                marginBottom: '16px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
            }}>
                {title}
            </h3>
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                gap: '16px' 
            }}>
                {topics.map((topic) => (
                    <TopicCard 
                        key={topic.id} 
                        label={topic.label} 
                        id={topic.id}
                        isActive={false}
                        onClick={() => {
                            setActiveTopic(topic.id);
                            setActiveMaterialIndex(0);
                            setViewState('simulation');
                        }}
                    />
                ))}
            </div>
        </div>
    );

    if (viewState === 'curriculum_grid' && activeCategory && mathCurriculum[activeCategory]) {
        const categoryData = mathCurriculum[activeCategory];
        
        return (
            <div className="maths-layout" style={{ flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '100px 40px 40px 40px', alignItems: 'center' }}>
                <div style={{ width: '100%', maxWidth: '1200px' }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
                        <button onClick={() => setViewState('main_categories')} className="back-btn" style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.1)', borderRadius: '100px', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <ArrowLeft size={18} /> Categories
                        </button>
                        <h1 style={{ margin: '0 0 0 20px', fontSize: '28px', fontWeight: '700' }}>{categoryData.label} Curriculum</h1>
                    </div>

                    {categoryData.grades.map((grade, index) => (
                        <GradeSection 
                            key={index}
                            title={grade.title}
                            topics={grade.topics}
                        />
                    ))}
                </div>
            </div>
        );
    }

    // --- Interactive Simulation State ---
    if (viewState === 'simulation' && activeCategory) {
        const categoryData = mathCurriculum[activeCategory];
        // Flatten all topics to find current title
        const allTopics = categoryData.grades.reduce((acc, grade) => [...acc, ...grade.topics], []);
        const activeTopicData = allTopics.find(t => t.id === activeTopic);
        
        // Get the specific title for the material if loaded
        const topicMaterials = Object.values(mathSimulations || {}).filter(m => m.parentTopic === activeTopic);
        const specificMaterialTitle = topicMaterials[activeMaterialIndex]?.title;
        
        return (
            <div className="maths-layout" style={{ padding: '100px 20px 20px 20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Main Interactive Screen Area - Full Width */}
                <div className="glass-panel" style={{ flex: 1, borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    
                    {/* Header Region (No longer absolute to avoid covering the applet) */}
                    <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.05)', zIndex: 10 }}>
                        <button onClick={() => setViewState('curriculum_grid')} className="back-btn" style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.1)', borderRadius: '100px', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
                            <ArrowLeft size={18} /> {categoryData.label}
                        </button>
                        <h2 style={{ margin: '0 0 0 20px', fontSize: '20px', fontWeight: '600', color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                            {activeTopicData ? activeTopicData.label : 'Simulation Module'}
                            {specificMaterialTitle && <span style={{ opacity: 0.7, fontSize: '16px', marginLeft: '12px', fontWeight: '400' }}>- {specificMaterialTitle}</span>}
                        </h2>
                    </div>

                    <div style={{ flex: 1, position: 'relative' }}>
                        {renderActiveModule()}
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
