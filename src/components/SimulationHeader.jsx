import React from 'react';
import { ArrowLeft, Play, Pause, RotateCcw, Atom, FlaskConical } from 'lucide-react';

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
                pointerEvents: 'none',
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
        </div>
    );
}
