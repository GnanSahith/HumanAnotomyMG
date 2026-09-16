import React, { useState } from 'react';
import { ArrowLeft, Play, Pause, RotateCcw, Atom, FlaskConical, Info, X } from 'lucide-react';

/**
 * SimulationHeader — Universal header for all simulations.
 * Provides: Back button | Simulation Title | Play/Pause + Reset buttons
 *
 * Props:
 *   title        {string}   - Simulation name
 *   onBack       {fn}       - Navigate back to library
 *   isPlaying    {bool}     - Current play/pause state
 *   onTogglePlay {fn}       - Toggle play/pause
 *   onReset      {fn}       - Reset the simulation
 *   subject      {string}   - 'physics' | 'chemistry' (for icon color)
 */
export default function SimulationHeader({
    title,
    onBack,
    isPlaying,
    onTogglePlay,
    onReset,
    subject = 'physics',
}) {
    const [showVideoModal, setShowVideoModal] = useState(false);
    
    let helpVideoUrl = null;
    if (title && title.includes('Circuit Construction Kit')) {
        helpVideoUrl = '/videos/Circuit Construction Kit.mp4';
    } else if (title && title.includes('Masses and Springs')) {
        helpVideoUrl = '/videos/Masses and Springs.mp4';
    } else if (title && title.includes('States of Matter')) {
        helpVideoUrl = '/videos/States of Matter.mp4';
    }
    const isChemistry = subject === 'chemistry';
    const accentColor  = isChemistry ? '#ff375f' : '#bf5af2';
    const accentRgb    = isChemistry ? '255,55,95' : '191,90,242';

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 20px',
            background: 'rgba(12,12,20,0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: `1px solid rgba(${accentRgb},0.18)`,
            flexShrink: 0,
            zIndex: 100,
            position: 'relative',
            height: '60px',
            boxSizing: 'border-box',
        }}>
            {/* ── LEFT: Back Button ── */}
            <button
                onClick={onBack}
                aria-label="Back to Library"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    color: 'rgba(255,255,255,0.85)',
                    padding: '7px 16px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 500,
                    backdropFilter: 'blur(8px)',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.background = `rgba(${accentRgb},0.22)`;
                    e.currentTarget.style.borderColor = `rgba(${accentRgb},0.5)`;
                    e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
                }}
            >
                <ArrowLeft size={15} />
                Back to Library
            </button>

            {/* ── CENTER: Title ── */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                pointerEvents: 'auto',
            }}>
                <div style={{
                    padding: '6px',
                    background: `rgba(${accentRgb},0.15)`,
                    borderRadius: '9px',
                    border: `1px solid rgba(${accentRgb},0.3)`,
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0,
                }}>
                    {isChemistry
                        ? <FlaskConical size={18} color={accentColor} />
                        : <Atom size={18} color={accentColor} />
                    }
                </div>
                <h2 style={{
                    margin: 0,
                    color: '#fff',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '16px',
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '420px',
                }}>
                    {title || 'Simulation'}
                </h2>
                {helpVideoUrl && (
                    <button
                        onClick={() => setShowVideoModal(true)}
                        title="How to use this simulation"
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#fff',
                            pointerEvents: 'auto',
                            transition: 'all 0.2s',
                            marginLeft: '4px'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                    >
                        <Info size={16} />
                    </button>
                )}
            </div>

            {/* ── RIGHT: Play/Pause + Reset ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                {/* Play / Pause */}
                <button
                    onClick={onTogglePlay}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '7px',
                        background: isPlaying
                            ? `rgba(${accentRgb},0.22)`
                            : 'rgba(255,255,255,0.07)',
                        border: `1px solid ${isPlaying
                            ? `rgba(${accentRgb},0.55)`
                            : 'rgba(255,255,255,0.14)'}`,
                        color: isPlaying ? accentColor : 'rgba(255,255,255,0.85)',
                        padding: '7px 16px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 600,
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = `rgba(${accentRgb},0.3)`;
                        e.currentTarget.style.borderColor = `rgba(${accentRgb},0.65)`;
                        e.currentTarget.style.color = accentColor;
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = isPlaying
                            ? `rgba(${accentRgb},0.22)`
                            : 'rgba(255,255,255,0.07)';
                        e.currentTarget.style.borderColor = isPlaying
                            ? `rgba(${accentRgb},0.55)`
                            : 'rgba(255,255,255,0.14)';
                        e.currentTarget.style.color = isPlaying
                            ? accentColor
                            : 'rgba(255,255,255,0.85)';
                    }}
                >
                    {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                    {isPlaying ? 'Pause' : 'Play'}
                </button>

                {/* Reset */}
                <button
                    onClick={onReset}
                    aria-label="Reset simulation"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '7px',
                        background: 'rgba(52,199,89,0.1)',
                        border: '1px solid rgba(52,199,89,0.3)',
                        color: '#34c759',
                        padding: '7px 16px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 600,
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(52,199,89,0.22)';
                        e.currentTarget.style.borderColor = 'rgba(52,199,89,0.55)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(52,199,89,0.1)';
                        e.currentTarget.style.borderColor = 'rgba(52,199,89,0.3)';
                    }}
                >
                    <RotateCcw size={13} />
                    Reset
                </button>
            
            </div>
            {/* ── VIDEO MODAL ── */}
            {showVideoModal && helpVideoUrl && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)'
                }}>
                    <div style={{
                        width: '80%',
                        maxWidth: '1000px',
                        background: '#1c1c24',
                        borderRadius: '16px',
                        border: `1px solid rgba(${accentRgb}, 0.3)`,
                        overflow: 'hidden',
                        position: 'relative',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '16px 24px',
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(0,0,0,0.2)'
                        }}>
                            <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Info size={20} color={accentColor} /> Help Video
                            </h3>
                            <button
                                onClick={() => setShowVideoModal(false)}
                                style={{
                                    background: 'none', border: 'none', color: '#fff',
                                    cursor: 'pointer', padding: '4px', display: 'flex'
                                }}
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div style={{ width: '100%', aspectRatio: '16/9', background: '#000' }}>
                            <video 
                                src={helpVideoUrl} 
                                controls 
                                autoPlay 
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
