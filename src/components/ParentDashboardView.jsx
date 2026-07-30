import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, BookOpen, Activity, Award, User, Target, TrendingUp, Calendar, ChevronDown } from 'lucide-react';
import CertificatesModal from './CertificatesModal';
import { useLanguage } from '../LanguageContext';
import { mockStudents } from '../data/mockStudents';
import { db } from '../firebase';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';

const ParentDashboardView = ({ onBack, onGoToSimulations, onLogout }) => {
  const [timeRange, setTimeRange] = useState('weekly');
  const [showCertificatesModal, setShowCertificatesModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(mockStudents[0]);
  
  const [stats, setStats] = useState({
      totalSeconds: 0,
      mostActiveSubject: 'None',
      simulationsExplored: 0,
      streak: '0 Days'
  });
  const [activities, setActivities] = useState([]);
  const [subjectData, setSubjectData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const fetchAnalytics = async () => {
          if (!selectedStudent) return;
          setLoading(true);
          try {
              const q = query(
                  collection(db, 'users', selectedStudent.username, 'activityLogs'),
                  orderBy('timestamp', 'desc'),
                  limit(50)
              );
              const snapshot = await getDocs(q);
              
              let totalSecs = 0;
              const subjectCount = {};
              const uniqueSims = new Set();
              const recent = [];

              snapshot.forEach(doc => {
                  const data = doc.data();
                  if (data.type === 'SESSION_DURATION') {
                      totalSecs += data.details.durationSeconds || 0;
                      
                      const mod = data.details.module || 'unknown';
                      subjectCount[mod] = (subjectCount[mod] || 0) + (data.details.durationSeconds || 0);
                      
                      if (data.details.target) {
                          uniqueSims.add(data.details.target);
                      }

                      let dateString = 'Just now';
                      if (data.timestamp) {
                          const date = data.timestamp.toDate();
                          dateString = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                      }

                      recent.push({
                          id: doc.id,
                          action: "Explored Simulation",
                          target: data.details.target,
                          score: Math.floor((data.details.durationSeconds || 0) / 60) + "m",
                          time: dateString,
                          icon: <Activity size={18} color="#0a84ff" />
                      });
                  }
              });

              let topSubject = 'None';
              let maxTime = 0;
              const sData = [];
              const colors = ['#bf5af2', '#0a84ff', '#30d158', '#ff9f0a'];
              let colorIdx = 0;

              for (const [subj, time] of Object.entries(subjectCount)) {
                  if (time > maxTime) {
                      maxTime = time;
                      topSubject = subj.charAt(0).toUpperCase() + subj.slice(1);
                  }
                  sData.push({
                      name: subj.charAt(0).toUpperCase() + subj.slice(1),
                      value: Math.floor((time / Math.max(1, totalSecs)) * 100),
                      color: colors[colorIdx % colors.length]
                  });
                  colorIdx++;
              }

              setStats({
                  totalSeconds: totalSecs,
                  mostActiveSubject: topSubject,
                  simulationsExplored: uniqueSims.size,
                  streak: totalSecs > 0 ? '1 Day' : '0 Days'
              });
              setSubjectData(sData);
              setActivities(recent.slice(0, 10));

          } catch (err) {
              console.error("Error fetching analytics", err);
          }
          setLoading(false);
      };
      
      fetchAnalytics();
  }, [selectedStudent]);

  const formatTime = (totalSeconds) => {
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
  };

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
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, background: 'linear-gradient(135deg, #fff, #a0a0a0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'center', gap: '12px' }}>
              Student Analytics
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <select 
                  value={selectedStudent.username}
                  onChange={(e) => setSelectedStudent(mockStudents.find(s => s.username === e.target.value))}
                  style={{
                    background: 'rgba(107, 78, 255, 0.2)',
                    border: '1px solid rgba(107, 78, 255, 0.5)',
                    color: '#fff',
                    padding: '6px 32px 6px 12px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 600,
                    appearance: 'none',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  {mockStudents.map(s => (
                    <option key={s.username} value={s.username} style={{ background: '#1c1c24' }}>
                      {s.username}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6B4EFF' }} />
              </div>
            </h1>
            <p style={{ margin: '4px 0 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
              Monitoring progress for <span style={{ color: '#fff', fontWeight: 600 }}>{selectedStudent.username}</span> | Grade: {selectedStudent.grade}
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
          { title: 'Total Learning Time', value: formatTime(stats.totalSeconds), subtitle: loading ? 'Loading...' : 'Live tracking active', icon: <Clock size={24} color="#0a84ff" />, bg: 'rgba(10,132,255,0.1)', border: 'rgba(10,132,255,0.3)' },
          { title: 'Most Active Subject', value: stats.mostActiveSubject, subtitle: 'Based on time spent', icon: <Target size={24} color="#bf5af2" />, bg: 'rgba(191,90,242,0.1)', border: 'rgba(191,90,242,0.3)' },
          { title: 'Simulations Explored', value: stats.simulationsExplored, subtitle: 'Unique interactions', icon: <Activity size={24} color="#30d158" />, bg: 'rgba(48,209,88,0.1)', border: 'rgba(48,209,88,0.3)' },
          { title: 'Current Streak', value: stats.streak, subtitle: 'Active learning days', icon: <TrendingUp size={24} color="#ff9f0a" />, bg: 'rgba(255,159,10,0.1)', border: 'rgba(255,159,10,0.3)' }
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
            <div style={{ fontSize: '28px', fontWeight: 800, marginBottom: '4px' }}>{loading ? '...' : stat.value}</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{stat.subtitle}</div>
          </div>
        ))}
      </div>

      {/* Main Charts Area */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '20px' }}>
        
        {/* Activity Over Time */}
        <div style={{ background: 'rgba(20, 20, 30, 0.4)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="#0a84ff" /> Weekly Activity Trend
            </h2>
          </div>
          <div style={{ width: '100%', height: '300px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '10px', padding: '20px 0' }}>
            {/* CSS Bar Chart fallback */}
            {[0, 0, stats.totalSeconds > 0 ? 120 : 0, 0, 0, 0, 0].map((val, idx) => (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '100%', height: `${Math.max(5, (val / 120) * 100)}%`, background: 'linear-gradient(to top, rgba(10,132,255,0.1), rgba(10,132,255,0.8))', borderRadius: '8px 8px 0 0', position: 'relative' }}></div>
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
             {subjectData.length > 0 ? (
               <div style={{ width: '150px', height: '150px', borderRadius: '50%', background: 'conic-gradient(#bf5af2 0% 45%, #0a84ff 45% 75%, #30d158 75% 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#1c1c24' }}></div>
               </div>
             ) : (
               <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>No Data Available</div>
             )}
          </div>
          {/* Custom Legend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            {subjectData.map(subject => (
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        
        {/* Recent Activity List */}
        <div style={{ background: 'rgba(20, 20, 30, 0.4)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} color="#ff9f0a" /> Live Activity Feed
            </h2>
            <button 
              onClick={() => setShowCertificatesModal(true)}
              style={{ background: 'transparent', border: 'none', color: '#0a84ff', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}
            >
              View Certificates
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {loading ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.5)' }}>Syncing live data...</div>
            ) : activities.length > 0 ? activities.map(item => (
              <div 
                key={item.id} 
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', 
                  background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.02)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.01)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
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
            )) : (
                <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.4)', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                    No activity recorded for this student yet.
                </div>
            )}
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
