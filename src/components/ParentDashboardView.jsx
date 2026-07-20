import React, { useState } from 'react';
import { ArrowLeft, Clock, BookOpen, Activity, Award, User, Target, TrendingUp, Calendar } from 'lucide-react';
import CertificatesModal from './CertificatesModal';
import { useLanguage } from '../LanguageContext';

const recentActivity = [
  { id: 1, action: "Completed Assessment", target: "Algebra Basics", score: "9/10", time: "2 hours ago", icon: <Award size={18} color="#30d158" /> },
  { id: 2, action: "Explored Simulation", target: "Molecule Shapes", score: null, time: "5 hours ago", icon: <Activity size={18} color="#0a84ff" /> },
  { id: 3, action: "Studied Module", target: "Quantum Physics", score: null, time: "Yesterday", icon: <BookOpen size={18} color="#bf5af2" /> },
  { id: 4, action: "Completed Assessment", target: "Chemical Bonding", score: "10/10", time: "Yesterday", icon: <Award size={18} color="#30d158" /> },
];

const ParentDashboardView = ({ onBack, onGoToSimulations, onLogout }) => {
  const [timeRange, setTimeRange] = useState('weekly');
  const [showCertificatesModal, setShowCertificatesModal] = useState(false);

  return (
    <div style={{ 
      height: '100vh', 
      overflowY: 'auto',
      padding: '40px 40px', 
      paddingTop: '140px',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      width: '100%',
      margin: '0 auto',
      boxSizing: 'border-box',
      animation: 'fadeIn 0.5s ease-out'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={onBack}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '50%', width: '44px', height: '44px', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer',
              transition: 'all 0.2s ease', backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, background: 'linear-gradient(135deg, #fff, #a0a0a0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Student Analytics
            </h1>
            <p style={{ margin: '4px 0 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
              Monitoring progress for <span style={{ color: '#fff', fontWeight: 600 }}>Alex Student</span>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', background: 'rgba(20,20,30,0.5)', borderRadius: '12px', padding: '4px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
            {['daily', 'weekly', 'monthly'].map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                style={{
                  background: timeRange === range ? 'rgba(255,255,255,0.1)' : 'transparent',
                  border: 'none', borderRadius: '8px', padding: '6px 16px', color: timeRange === range ? '#fff' : 'rgba(255,255,255,0.5)',
                  fontSize: '13px', fontWeight: timeRange === range ? 600 : 400, cursor: 'pointer', transition: 'all 0.2s ease',
                  textTransform: 'capitalize'
                }}
              >
                {range}
              </button>
            ))}
          </div>
          {onGoToSimulations && (
            <button
              onClick={onGoToSimulations}
              style={{
                background: 'linear-gradient(135deg, #bf5af2, #0a84ff)',
                border: 'none', borderRadius: '12px', padding: '10px 20px', color: '#fff',
                fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease',
                boxShadow: '0 4px 14px rgba(10,132,255,0.3)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              View Simulations
            </button>
          )}
          {onLogout && (
            <button
              onClick={onLogout}
              style={{
                background: 'rgba(255,69,58,0.1)', border: '1px solid rgba(255,69,58,0.2)',
                borderRadius: '12px', padding: '10px 16px', color: '#ff453a',
                fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,69,58,0.2)'; e.currentTarget.style.borderColor = 'rgba(255,69,58,0.4)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,69,58,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,69,58,0.2)'; }}
            >
              Sign Out
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
        {[
          { title: 'Total Learning Time', value: '14h 45m', subtitle: '+2.5h from last week', icon: <Clock size={24} color="#0a84ff" />, bg: 'rgba(10,132,255,0.1)', border: 'rgba(10,132,255,0.3)' },
          { title: 'Most Active Subject', value: 'Mathematics', subtitle: '45% of total time', icon: <Target size={24} color="#bf5af2" />, bg: 'rgba(191,90,242,0.1)', border: 'rgba(191,90,242,0.3)' },
          { title: 'Simulations Explored', value: '34', subtitle: 'Top 10% of class', icon: <Activity size={24} color="#30d158" />, bg: 'rgba(48,209,88,0.1)', border: 'rgba(48,209,88,0.3)' },
          { title: 'Current Streak', value: '5 Days', subtitle: 'Personal best: 12 days', icon: <TrendingUp size={24} color="#ff9f0a" />, bg: 'rgba(255,159,10,0.1)', border: 'rgba(255,159,10,0.3)' }
        ].map((stat, i) => (
          <div key={i} style={{ 
            background: 'rgba(20, 20, 30, 0.4)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '24px',
            border: `1px solid rgba(255,255,255,0.05)`, position: 'relative', overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: stat.bg, filter: 'blur(30px)', borderRadius: '50%' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ background: stat.bg, border: `1px solid ${stat.border}`, width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {stat.icon}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 600 }}>{stat.title}</div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, marginBottom: '4px' }}>{stat.value}</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{stat.subtitle}</div>
          </div>
        ))}
      </div>

      {/* Main Charts Area (Replaced Recharts with glowing pure CSS placeholders to prevent React 19 crashes) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '20px' }}>
        
        {/* Activity Over Time */}
        <div style={{ background: 'rgba(20, 20, 30, 0.4)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="#0a84ff" /> Learning Activity (Minutes)
            </h2>
          </div>
          <div style={{ width: '100%', height: '300px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '10px', padding: '20px 0' }}>
            {/* CSS Bar Chart fallback */}
            {[45, 120, 80, 150, 95, 180, 210].map((val, idx) => (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '100%', height: `${(val / 210) * 100}%`, background: 'linear-gradient(to top, rgba(10,132,255,0.1), rgba(10,132,255,0.8))', borderRadius: '8px 8px 0 0', position: 'relative' }}></div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][idx]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Subject Breakdown */}
        <div style={{ background: 'rgba(20, 20, 30, 0.4)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '18px', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={18} color="#bf5af2" /> Subject Distribution
          </h2>
          <div style={{ width: '100%', flex: 1, minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             {/* Simple CSS Donut representation */}
             <div style={{ width: '150px', height: '150px', borderRadius: '50%', background: 'conic-gradient(#bf5af2 0% 45%, #0a84ff 45% 75%, #30d158 75% 90%, #ff9f0a 90% 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#1c1c24' }}></div>
             </div>
          </div>
          {/* Custom Legend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            {[
              { name: 'Mathematics', value: 45, color: '#bf5af2' },
              { name: 'Physics', value: 30, color: '#0a84ff' },
              { name: 'Chemistry', value: 15, color: '#30d158' },
              { name: 'Biology', value: 10, color: '#ff9f0a' }
            ].map(subject => (
              <div key={subject.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: subject.color }}></div>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{subject.name}</span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{subject.value}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
         {/* Top Simulations */}
        <div style={{ background: 'rgba(20, 20, 30, 0.4)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ fontSize: '18px', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="#30d158" /> Top Simulations
          </h2>
          <div style={{ width: '100%', height: '250px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '15px' }}>
             {[
              { name: 'Wave on a String', views: 24, fill: '#bf5af2' },
              { name: "Coulomb's Law", views: 18, fill: '#0a84ff' },
              { name: 'Trigonometry Tour', views: 15, fill: '#30d158' },
              { name: 'Human Heart 3D', views: 12, fill: '#ff453a' },
             ].map((sim, idx) => (
                <div 
                  key={idx} 
                  onClick={onGoToSimulations}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '15px', padding: '8px', borderRadius: '12px',
                    cursor: 'pointer', transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: '120px', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>{sim.name}</div>
                  <div style={{ flex: 1, height: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${(sim.views / 24) * 100}%`, height: '100%', background: sim.fill, borderRadius: '10px' }}></div>
                  </div>
                  <div style={{ width: '30px', fontSize: '13px', fontWeight: 600, textAlign: 'right' }}>{sim.views}</div>
                </div>
             ))}
          </div>
        </div>

        {/* Recent Activity List */}
        <div style={{ background: 'rgba(20, 20, 30, 0.4)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} color="#ff9f0a" /> Recent Activity
            </h2>
            <button 
              onClick={() => setShowCertificatesModal(true)}
              style={{ background: 'transparent', border: 'none', color: '#0a84ff', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}
            >
              View Certificates
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {recentActivity.map(item => (
              <div 
                key={item.id} 
                onClick={() => setShowCertificatesModal(true)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', 
                  background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.02)',
                  cursor: 'pointer', transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{item.action}</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{item.target}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {item.score && <div style={{ fontSize: '14px', fontWeight: 700, color: '#30d158' }}>{item.score}</div>}
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: item.score ? '2px' : '0' }}>{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
      
      <CertificatesModal 
        isOpen={showCertificatesModal} 
        onClose={() => setShowCertificatesModal(false)} 
      />
    </div>
  );
};

export default ParentDashboardView;
