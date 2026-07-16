import React, { useState } from 'react';
import { ChevronDown, BookOpen, ArrowLeft } from 'lucide-react';
import '../Academics.css';

const AcademicsView = ({ onSelectSubject, onBack }) => {
  const [expandedClass, setExpandedClass] = useState('class_12');

  const ncertClasses = [
    { id: 'class_12', label: 'Class 12', fullName: 'NCERT Solutions for Class 12', subjects: ['Physics', 'Maths', 'Chemistry', 'Biology', 'English', 'Business Studies', 'Economics', 'Accountancy', 'History', 'Geography', 'Political Science'] },
    { id: 'class_11', label: 'Class 11', fullName: 'NCERT Solutions for Class 11', subjects: ['Physics', 'Maths', 'Chemistry', 'Biology', 'English', 'Business Studies', 'Economics', 'Accountancy', 'History', 'Geography', 'Political Science'] },
    { id: 'class_10', label: 'Class 10', fullName: 'NCERT Solutions for Class 10', subjects: ['Maths', 'Science', 'English', 'Social Science'] },
    { id: 'class_9', label: 'Class 9', fullName: 'NCERT Solutions for class 9', subjects: ['Maths', 'Science', 'English', 'Social Science'] },
    { id: 'class_8', label: 'Class 8', fullName: 'NCERT Solutions for class 8', subjects: ['Maths', 'Science', 'English', 'Social Science'] },
    { id: 'class_7', label: 'Class 7', fullName: 'NCERT Solutions for class 7', subjects: ['Maths', 'Science', 'English', 'Social Science'] },
    { id: 'class_6', label: 'Class 6', fullName: 'NCERT Solutions for class 6', subjects: ['Maths', 'Science', 'English', 'Social Science'] },
    { id: 'class_5', label: 'Class 5', fullName: 'NCERT Solutions for class 5', subjects: ['Maths', 'EVS', 'English'] },
    { id: 'class_4', label: 'Class 4', fullName: 'NCERT Solutions for class 4', subjects: ['Maths', 'EVS', 'English'] },
    { id: 'class_3', label: 'Class 3', fullName: 'NCERT Solutions for Class 3', subjects: ['Maths', 'EVS', 'English'] },
    { id: 'class_2', label: 'Class 2', fullName: 'NCERT Solutions for Class 2', subjects: ['Maths', 'English'] },
    { id: 'class_1', label: 'Class 1', fullName: 'NCERT Solutions for Class 1', subjects: ['Maths', 'English'] },
    { id: 'books', label: 'NCERT Books', fullName: 'NCERT Books', subjects: ['All Books PDF'] },
    { id: 'exempler', label: 'NCERT Exempler', fullName: 'NCERT Exempler', subjects: ['Maths Exemplar', 'Science Exemplar'] },
  ];

  return (
    <div className="academics-glass-container fade-in-scale">
      <div className="academics-header" style={{ position: 'relative' }}>
        {onBack && (
          <button 
            className="icon-btn" 
            onClick={onBack} 
            style={{ position: 'absolute', left: '0', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)' }}
            title="Back"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <h1 className="academics-title">NCERT Solutions</h1>
        <p className="academics-subtitle">Select your grade and subject to explore premium study materials.</p>
      </div>

      <div className="classes-accordion">
        {ncertClasses.map((cls) => (
          <div key={cls.id} className={`class-glass-card ${expandedClass === cls.id ? 'expanded' : ''}`}>
            {/* Header / Trigger */}
            <div 
              className="class-card-header"
              onClick={() => setExpandedClass(expandedClass === cls.id ? null : cls.id)}
            >
              <h2>{cls.fullName}</h2>
              <ChevronDown className={`expand-icon ${expandedClass === cls.id ? 'rotated' : ''}`} size={24} />
            </div>

            {/* Expanded Content (Subjects Grid) */}
            <div className="class-subjects-container">
              <div className="subjects-grid">
                {cls.subjects?.map((sub, idx) => {
                  const fullSubjectName = `${cls.fullName} ${sub}`;
                  return (
                    <div 
                      key={idx}
                      className="subject-glass-pill"
                      onClick={() => onSelectSubject({ label: fullSubjectName, class: cls.label, subject: sub })}
                    >
                      {sub}
                    </div>
                  );
                })}
                {cls.subjects.length === 0 && (
                  <div className="coming-soon-text">Subjects coming soon...</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AcademicsView;
