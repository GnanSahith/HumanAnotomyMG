import React from 'react';
import { FaBrain, FaHeartbeat } from 'react-icons/fa';

const iconMap = {
    brain: <FaBrain size={20} />,
    heart: <FaHeartbeat size={20} />
};

export default function Sidebar({ data, activeOrganId, onSelect }) {
    return (
        <aside className="sidebar glass-panel">
            <h1>
                <span style={{ color: "var(--accent)" }}>3D</span>
                Anatomy
            </h1>

            <div style={{ marginBottom: "24px" }}>
                <p style={{ fontSize: "14px", marginBottom: "8px" }}>Explore Human Organs</p>
                <div style={{ height: "1px", background: "var(--border-color)", width: "100%" }} />
            </div>

            <ul className="organ-list">
                {data.map((organ) => {
                    const isActive = organ.id === activeOrganId;
                    return (
                        <li key={organ.id}>
                            <button
                                className={`organ-btn ${isActive ? 'active' : ''}`}
                                onClick={() => onSelect(organ.id)}
                            >
                                <div className="icon-wrapper">
                                    {iconMap[organ.id]}
                                </div>
                                {organ.name}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </aside>
    );
}
