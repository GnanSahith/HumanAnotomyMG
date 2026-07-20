import React from 'react';
import { X, Award, Medal, Star } from 'lucide-react';

const CertificatesModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const certificates = [
    { id: 1, title: 'Algebra Master', date: 'Oct 12, 2023', score: '98%', icon: <Award size={32} color="#bf5af2" /> },
    { id: 2, title: 'Quantum Physics Intro', date: 'Nov 05, 2023', score: '100%', icon: <Star size={32} color="#ff9f0a" /> },
    { id: 3, title: 'Chemical Bonding Basics', date: 'Jan 18, 2024', score: '95%', icon: <Medal size={32} color="#30d158" /> },
  ];

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        background: 'rgba(20, 20, 30, 0.9)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px', width: '100%', maxWidth: '600px', padding: '30px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)', position: 'relative'
      }}>
        <button 
          onClick={onClose}
          style={{
            position: 'absolute', top: '20px', right: '20px', background: 'transparent',
            border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
        >
          <X size={24} />
        </button>

        <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Award color="#bf5af2" /> Student Certificates & Achievements
        </h2>

        <div style={{ display: 'grid', gap: '16px' }}>
          {certificates.map(cert => (
            <div key={cert.id} style={{
              display: 'flex', alignItems: 'center', gap: '20px', padding: '20px',
              background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)',
              transition: 'transform 0.2s ease, background 0.2s ease', cursor: 'pointer'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
            >
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '50%' }}>
                {cert.icon}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: '18px' }}>{cert.title}</h3>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Issued: {cert.date}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#30d158', fontSize: '20px', fontWeight: 'bold' }}>{cert.score}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>Grade</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CertificatesModal;
