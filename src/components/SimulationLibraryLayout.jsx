import React, { useState, useMemo } from 'react';
import { ArrowLeft, Search, Filter, PlayCircle, Lock, LayoutGrid, List, Calculator, Hexagon, Ruler, PlusSquare, BarChart, Library } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

const cleanTitle = (title) => {
    if (!title) return '';
    return title.replace(/(Practice|Exploration)?GR\.\s*(4-5|6-8|9-12)GRADES\s*(4-5|6-8|9-12)/gi, (m, t) => t ? t + ': ' : '');
};

export default function SimulationLibraryLayout({ 
    title, 
    icon, 
    simulations, 
    filters, // e.g., [{ id: 'subject', label: 'SUBJECT', options: [{ id: 'motion', label: 'Motion' }] }]
    onSimulationClick, 
    onBack,
    handleLockedItemClick,
    extractSearchText = (sim) => sim.title + ' ' + (sim.description || ''),
    matchFilter = (sim, filterId, selectedOptionIds) => true // callback to let parent decide how to filter
}) {
    const { t } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilters, setSelectedFilters] = useState({}); // { filterId: [optionId1, optionId2] }
    const [viewMode, setViewMode] = useState('grid');
    const [sortBy, setSortBy] = useState('newest');

    const toggleFilter = (filterId, optionId) => {
        setSelectedFilters(prev => {
            const currentSelected = prev[filterId] || [];
            if (currentSelected.includes(optionId)) {
                return { ...prev, [filterId]: currentSelected.filter(id => id !== optionId) };
            } else {
                return { ...prev, [filterId]: [...currentSelected, optionId] };
            }
        });
    };

    const filteredSimulations = useMemo(() => {
        let result = simulations.filter(sim => {
            // Search query filter
            const searchStr = extractSearchText(sim).toLowerCase();
            if (searchQuery && !searchStr.includes(searchQuery.toLowerCase())) {
                return false;
            }

            // Check all active filters
            for (const filter of filters) {
                const activeOptions = selectedFilters[filter.id] || [];
                if (activeOptions.length > 0) {
                    if (!matchFilter(sim, filter.id, activeOptions)) {
                        return false;
                    }
                }
            }
            return true;
        });

        // Sorting
        if (sortBy === 'az') {
            result = result.sort((a, b) => a.title.localeCompare(b.title));
        }
        return result;
    }, [simulations, searchQuery, selectedFilters, filters, matchFilter, extractSearchText, sortBy]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }} className="fade-in">
            {/* Top Navigation Bar */}
            <div className="glass-panel" style={{ 
                padding: '16px 24px', 
                borderBottom: '1px solid rgba(255,255,255,0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                flexShrink: 0
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button 
                        onClick={onBack}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            padding: '8px 16px', borderRadius: '100px',
                            color: '#fff', cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'; }}
                    >
                        <ArrowLeft size={18} /> {t('Back')}
                    </button>
                    <h1 style={{ fontSize: '24px', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px', color: '#fff' }}>
                        {icon}
                        {t(title)}
                    </h1>
                </div>

                {/* Search Bar */}
                <div style={{ position: 'relative', width: '400px' }}>
                    <Search size={18} color="rgba(255,255,255,0.5)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                        type="text" 
                        placeholder={t("Search simulations...")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 20px 12px 48px',
                            background: 'rgba(0,0,0,0.4)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '100px',
                            color: '#fff',
                            fontSize: '14px',
                            outline: 'none',
                            transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#bf5af2'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
                
                {/* Left Sidebar Filters */}
                <div className="glass-panel" style={{ 
                    width: '300px', 
                    borderRight: '1px solid rgba(255,255,255,0.1)', 
                    overflowY: 'auto',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '32px',
                    flexShrink: 0
                }}>
                    {filters.map(filterGroup => (
                        <div key={filterGroup.id}>
                            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                {t(filterGroup.label)}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {filterGroup.options.map(option => {
                                    const isSelected = (selectedFilters[filterGroup.id] || []).includes(option.id);
                                    return (
                                        <label key={option.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                            <input 
                                                type="checkbox" 
                                                style={{ display: 'none' }}
                                                checked={isSelected}
                                                onChange={() => toggleFilter(filterGroup.id, option.id)}
                                            />
                                            <div style={{
                                                width: '18px', height: '18px', borderRadius: '4px',
                                                border: isSelected ? '1px solid #bf5af2' : '1px solid rgba(255,255,255,0.3)',
                                                background: isSelected ? '#bf5af2' : 'transparent',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                transition: 'all 0.2s'
                                            }}>
                                                {isSelected && <div style={{ width: '10px', height: '10px', background: '#fff', borderRadius: '2px' }} />}
                                            </div>
                                            <span style={{ color: isSelected ? '#fff' : 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: isSelected ? 500 : 400 }}>
                                                {t(option.label)}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right Results Grid */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Results Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h2 style={{ fontSize: '20px', margin: 0, fontWeight: 600, color: '#fff' }}>
                            {filteredSimulations.length} {t('results')}
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.7)' }}>
                                <span style={{ fontSize: '14px' }}>Sort by:</span>
                                <select 
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '6px 12px', borderRadius: '8px', outline: 'none' }}
                                >
                                    <option value="newest">Newest</option>
                                    <option value="az">A-Z</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                                <button 
                                    onClick={() => setViewMode('grid')}
                                    style={{ padding: '8px', background: viewMode === 'grid' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: viewMode === 'grid' ? '#fff' : 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
                                ><LayoutGrid size={18} /></button>
                                <button 
                                    onClick={() => setViewMode('list')}
                                    style={{ padding: '8px', background: viewMode === 'list' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: viewMode === 'list' ? '#fff' : 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
                                ><List size={18} /></button>
                            </div>
                        </div>
                    </div>

                    {/* Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(300px, 1fr))' : '1fr',
                        gap: '24px'
                    }}>
                        {filteredSimulations.map((sim) => (
                            <div 
                                key={sim.id}
                                className="glass-panel"
                                onClick={() => {
                                    if (sim.isLocked) {
                                        handleLockedItemClick(() => onSimulationClick(sim));
                                    } else {
                                        onSimulationClick(sim);
                                    }
                                }}
                                style={{
                                    borderRadius: '24px',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(0,0,0,0.2)',
                                    position: 'relative',
                                    display: viewMode === 'list' ? 'flex' : 'block'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(191, 90, 242, 0.2)';
                                    e.currentTarget.style.borderColor = 'rgba(191, 90, 242, 0.5)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                                }}
                            >
                                <div style={{ 
                                    height: viewMode === 'list' ? '100%' : '180px', 
                                    width: viewMode === 'list' ? '300px' : '100%',
                                    position: 'relative', overflow: 'hidden', background: '#0a0a1a' 
                                }}>
                                    {sim.thumbnail ? (
                                        <img 
                                            src={sim.thumbnail} 
                                            alt={sim.title} 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0, zIndex: 1, pointerEvents: 'none' }}
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    ) : (
                                        <div style={{
                                            width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1,
                                            background: `linear-gradient(135deg, hsl(${Math.abs(sim.id ? sim.id.split('').reduce((a,b)=>((a<<5)-a)+b.charCodeAt(0),0) : 0)%360}, 70%, 25%) 0%, #0f172a 100%)`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
                                        }}>
                                            {(() => {
                                                const cat = (sim.category || '').toLowerCase();
                                                let Icon = Library;
                                                if (cat.includes('algebra')) Icon = Calculator;
                                                else if (cat.includes('geometry')) Icon = Hexagon;
                                                else if (cat.includes('measurement')) Icon = Ruler;
                                                else if (cat.includes('operations')) Icon = PlusSquare;
                                                else if (cat.includes('statistics') || cat.includes('data')) Icon = BarChart;
                                                return <Icon size={80} color="rgba(255,255,255,0.15)" strokeWidth={1.5} />;
                                            })()}
                                            <PlayCircle size={40} color="rgba(255,255,255,0.4)" style={{ position: 'absolute' }} />
                                        </div>
                                    )}
                                    {sim.isLocked && (
                                        <div style={{
                                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                                            zIndex: 4, display: 'flex', flexDirection: 'column',
                                            alignItems: 'center', justifyContent: 'center', gap: '8px'
                                        }}>
                                            <Lock size={32} color="#fff" />
                                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff', background: 'var(--accent)', padding: '4px 12px', borderRadius: '100px' }}>Premium</span>
                                        </div>
                                    )}
                                </div>
                                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#fff', fontWeight: 600 }}>{sim.title}</h3>
                                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '13px', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {sim.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
