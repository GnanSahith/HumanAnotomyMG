import React, { useState } from 'react';
import { ChevronRight, FileText, ArrowLeft } from 'lucide-react';
import { chaptersData } from '../chaptersData';
import { GenericChapterData } from './GenericChapterData';
import '../SubjectContent.css';

const SubjectContentView = ({ subject, onBack, onNavigateToSimulation }) => {
  const [activeChapter, setActiveChapter] = useState(null);

  const className = subject?.class || "Class 12";
  const subjectName = subject?.subject || "Physics";
  const title = subject?.label || `NCERT Solutions For ${className} ${subjectName}`;
  
  // Retrieve the chapter list dynamically from our new data file
  const chapterList = chaptersData[className]?.[subjectName] || [];

  return (
    <div className="subject-content-container fade-in-scale">
      {/* Breadcrumbs */}
      <div className="content-breadcrumbs">
        <span onClick={() => { setActiveChapter(null); onBack(); }} className="clickable-crumb">NCERT Solutions</span>
        <ChevronRight size={14} />
        <span onClick={() => { setActiveChapter(null); onBack(); }} className="clickable-crumb">{className}</span>
        <ChevronRight size={14} />
        <span onClick={() => setActiveChapter(null)} className={activeChapter ? "clickable-crumb" : "current-crumb"}>{subjectName}</span>
        {activeChapter && (
          <>
            <ChevronRight size={14} />
            <span className="current-crumb">{activeChapter.title}</span>
          </>
        )}
      </div>

      {/* Main Title */}
      <h1 className="content-main-title">{activeChapter ? activeChapter.title : title}</h1>
      <p className="content-subtitle">
        {activeChapter 
          ? "Official NCERT Solutions • Digitized & Verified" 
          : "Comprehensive step-by-step solutions for academic year 2025-26."}
      </p>

      {/* Chapters Grid / List OR Chapter Content View */}
      <div className="chapters-container">
        {activeChapter ? (
           // Render the extracted PDF data
           <div className="chapter-reader-mode">
              <button className="back-btn" onClick={() => setActiveChapter(null)}>
                 <ArrowLeft size={16} /> Back to Chapters
              </button>
              
              <GenericChapterData chapter={activeChapter} subjectName={subjectName} className={className} onNavigateToSimulation={onNavigateToSimulation} />
           </div>
        ) : (
          chapterList.length > 0 ? (
            <div className="chapter-list">
              {(chapterList || []).map((chapter) => (
                <div key={chapter.id} className="chapter-glass-card" onClick={() => setActiveChapter(chapter)}>
                  <div className="chapter-icon-box">
                    <FileText size={20} />
                  </div>
                  <div className="chapter-info">
                    <h3>{chapter.title}</h3>
                    <p>View PDF Solutions & Explanations</p>
                  </div>
                  <button className="view-btn">Read Now</button>
                </div>
              ))}
            </div>
          ) : (
             <div className="no-chapters-box">
                <FileText size={40} style={{ opacity: 0.5, marginBottom: '15px' }} />
                <h3>Chapters Coming Soon</h3>
                <p>We are currently compiling the official NCERT syllabus for {className} {subjectName}. Check back later!</p>
             </div>
          )
        )}
      </div>
    </div>
  );
};

export default SubjectContentView;
