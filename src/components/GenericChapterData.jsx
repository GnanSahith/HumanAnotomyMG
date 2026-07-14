import React, { useEffect, useState } from 'react';
import { ListChecks, Loader } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export const GenericChapterData = ({ chapter, subjectName = 'Physics', className = 'Class 12' }) => {
  const [chapterQuestions, setChapterQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const chapterNumStr = chapter?.id ? chapter.id.replace('c', '') : '1';
  const chapterNum = parseInt(chapterNumStr, 10);
  useEffect(() => {
    const container = document.querySelector('.subject-content-container');
    if (!container) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-reading');
        } else {
          entry.target.classList.remove('is-reading');
        }
      });
    }, {
      root: container,
      rootMargin: '-30% 0px -30% 0px',
      threshold: 0
    });

    const blocks = document.querySelectorAll('.qna-block');
    blocks.forEach(b => observer.observe(b));

    const content = document.querySelector('.rich-chapter-content');
    if (content) content.classList.add('reader-active');

    return () => observer.disconnect();
  }, [chapterNum, subjectName]);
  
  const scrollToQ = (id) => {
    const el = document.getElementById(id);
    const container = document.querySelector('.subject-content-container');
    if (el && container) {
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const relativeTop = elRect.top - containerRect.top;
      
      container.scrollBy({ top: relativeTop - 120, behavior: 'smooth' });
      
      el.style.transition = 'box-shadow 0.3s';
      el.style.boxShadow = '0 0 30px rgba(59, 130, 246, 0.5)';
      setTimeout(() => {
        el.style.boxShadow = '0 10px 40px rgba(0,0,0,0.3)';
      }, 1000);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const clsSlug = className.toLowerCase().replace(/ /g, '_');
        const subSlug = subjectName.toLowerCase().replace(/ /g, '_');
        // We catch the import so it doesn't crash if the file is missing
        const module = await import(`../data/${clsSlug}_${subSlug}.js`).catch(() => ({ default: {} }));
        if (isMounted) {
            setChapterQuestions(module.default[chapterNum] || []);
        }
      } catch (err) {
        if (isMounted) setChapterQuestions([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [className, subjectName, chapterNum]);

  const healText = (text) => {
    if (!text) return text;
    let t = text;
    // 1. Merge line ending in a letter with a line starting with a lowercase letter
    // Needs a loop to handle cascading merges
    let prev = "";
    while (t !== prev) {
      prev = t;
      t = t.replace(/([a-zA-Z])\n\s*([a-z])/g, '$1 $2');
    }
    // 2. Merge orphaned punctuation (e.g., "\n.")
    t = t.replace(/\n\s*([.,;!?])/g, '$1');
    // 3. Merge line ending in a letter with a line starting with an open parenthesis
    t = t.replace(/([a-zA-Z])\n\s*\(/g, '$1 (');
    
    // 4. Break "Ans:" or "Answer:" into a new line and bold it if mashed with previous text
    t = t.replace(/(\S)\s+(Ans\s*:|Answer\s*:)/gi, '$1\n\n**$2**');
    
    // 5. Break options (a)-(e) and Roman numerals (i)-(vi) onto new lines
    t = t.replace(/([^\s(])\s*(\([a-e]\)|\([ivx]{1,4}\))\s/g, '$1\n\n$2 ');
    
    return t;
  };

  const formatToMockup = (text) => {
    let cleaned = healText(text);
    
    // 0. Normalize ALL math to inline `$` so we have a clean slate
    cleaned = cleaned.replace(/\$\$/g, '$');
    
    // 1. Merge awkwardly broken sentences before math
    cleaned = cleaned.replace(/([^.?!])\n\s*(\$.*?\$)/g, '$1 $2');
    
    // 2. Strip KaTeX tags from simple alphabetic units
    cleaned = cleaned.replace(/\$([a-zA-Z]+)\$/g, '$1');
    
    // 3. Promote trailing large equations to block math
    cleaned = cleaned.replace(/(,\s*|:\s*)\$(\s*[A-Za-z_]+\s*=\s*[^$]+)\$/g, (match, p1, p2) => {
        if (p2.includes('\\frac') || p2.includes('\\times') || p2.length > 25) {
            return `${p1}\n\n$$\n${p2}\n$$\n\n`;
        }
        return match;
    });

    const isMathHeavy = subjectName.toLowerCase() === 'physics' || subjectName.toLowerCase() === 'maths';

    if (!isMathHeavy) {
        // For Biology and Chemistry, skip the aggressive "Given/Calc" sectioning
        // and just format equations safely.
        let lines = cleaned.split('\n').map(l => l.trim()).filter(l => l);
        
        // Pass 1: Detect flattened difference tables and reconstruct them into grouped lists
        for (let i = 0; i < lines.length - 4; i++) {
            let intro = lines[i].toLowerCase();
            if (intro.includes('differ') || intro.includes('difference') || intro.includes('distinguish') || intro.includes('comparison')) {
                let col1 = lines[i+1];
                let col2 = lines[i+2];
                // Are these short headers?
                if (col1 && col2 && col1.length < 50 && col2.length < 50 && !/[.!?]$/.test(col1) && !/[.!?]$/.test(col2)) {
                    let col1Facts = [];
                    let col2Facts = [];
                    let leftovers = [];
                    
                    let j = i + 3;
                    while (j < lines.length - 1) {
                        let val1 = lines[j];
                        let val2 = lines[j+1];
                        
                        // Break table if lines are clearly concluding paragraphs
                        if ((val1.toLowerCase().includes(' both ') || val1.toLowerCase().includes(' are ')) && val1.length > 80 && val2.length > 80) {
                            leftovers.push(val1, val2);
                            j += 2;
                            continue;
                        }
                        
                        col1Facts.push(`* ${val1}`);
                        col2Facts.push(`* ${val2}`);
                        j += 2;
                    }
                    if (j === lines.length - 1) {
                        leftovers.push(lines[j]);
                    }
                    
                    let reconstructed = [
                        lines[i],
                        '',
                        `**${col1}**`,
                        ...col1Facts,
                        '',
                        `**${col2}**`,
                        ...col2Facts,
                        '',
                        ...leftovers
                    ];
                    
                    lines.splice(i, lines.length - i, ...reconstructed);
                    break; // Handle one table per question
                }
            }
        }

        // Pass 2: Normal formatting
        let out = [];
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            if (!line) continue;
            
            let mathMatch = line.match(/\$.*?\$/g);
            let textWithoutMath = line.replace(/\$.*?\$/g, '').trim();
            if (mathMatch && textWithoutMath.length < 20 && line.includes('=') && (line.includes('\\frac') || line.includes('\\times'))) {
                line = `$$\n${line.replace(/\$/g, '')}\n$$`;
            }
            
            // Bold standalone short terms (like fallback headers)
            let isShortTerm = textWithoutMath.length > 2 && textWithoutMath.length < 45 && !/[.:;!?]$/.test(textWithoutMath);
            if (isShortTerm && !line.includes('$$') && !line.startsWith('**') && !line.startsWith('*')) {
                line = `**${line}**`;
            }
            out.push(line);
        }
        
        let result = "";
        let currentParaLength = 0;
        for (let i = 0; i < out.length; i++) {
            result += out[i];
            currentParaLength += out[i].length;
            
            if (i < out.length - 1) {
                const isListItem = (str) => /^\d+\./.test(str) || /^[a-zA-Z]\)/.test(str) || /^\([a-zA-Z]\)/.test(str) || /^\([ivxIVX]{1,4}\)/.test(str) || str.startsWith('**Ans');
                if (out[i].startsWith('$$') || out[i+1].startsWith('$$') || 
                    out[i].startsWith('* ') || out[i+1].startsWith('* ') || 
                    out[i].startsWith('#') || out[i+1].startsWith('#') ||
                    isListItem(out[i]) || isListItem(out[i+1])) {
                    result += '\n\n'; // Preserve block separation for tables/math/lists
                    currentParaLength = 0;
                } else if (out[i].startsWith('**') && out[i].endsWith('**')) {
                    result += ' '; // Inline definitions
                } else {
                    // Intelligently break massive walls of text into smaller paragraphs
                    // If the paragraph exceeds 300 chars and ends in punctuation, break it
                    if (currentParaLength > 300 && /[.!?]$/.test(out[i].replace(/\**$/, ''))) {
                        result += '\n\n';
                        currentParaLength = 0;
                    } else {
                        result += ' '; // Keep joining
                    }
                }
            }
        }
        return result;
    }

    // --- Rigid State Machine specifically for Physics & Maths ---
    let lines = cleaned.split('\n');
    let out = [];
    
    let state = 'given';
    out.push('\n### Given Parameters\n');
    
    let inBlockMath = false;
    let hasFormula = false;
    let hasCalc = false;
    let hasConclusion = false;
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;
        
        let mathMatch = line.match(/\$.*?\$/g);
        let textWithoutMath = line.replace(/\$.*?\$/g, '').trim();
        // 4. Promote isolated equations to block math
        if (mathMatch && textWithoutMath.length < 20 && line.includes('=') && (line.includes('\\frac') || line.includes('\\times') || line.includes('\\Rightarrow'))) {
            line = `$$\n${line.replace(/\$/g, '')}\n$$`;
        }
        
        let isBlockMathBorder = line.includes('$$');
        if (isBlockMathBorder) {
            inBlockMath = !inBlockMath;
        }
        
        let lower = line.toLowerCase();
        
        // Transitions
        if (state === 'given' && !hasFormula && (isBlockMathBorder || lower.includes('formula') || lower.includes('law as') || lower.includes('we have') || lower.includes('potential at') || lower.includes('according to'))) {
            state = 'formula';
            hasFormula = true;
            if (!lower.includes('case')) out.push('\n### Explanation & Formula\n');
        }
        
        if (state === 'formula' && !hasCalc && (line.includes('\\Rightarrow') || lower.includes('substituting') || lower.includes('now,') || lower.includes('from (1)'))) {
            state = 'calc';
            hasCalc = true;
            if (!lower.includes('case')) out.push('\n### Step-by-Step Calculation\n');
        }
        
        if (state !== 'conclusion' && !hasConclusion && i >= lines.length - 2 && (line.startsWith('Therefore') || line.startsWith('Hence') || line.startsWith('Thus') || line.startsWith('Clearly'))) {
            state = 'conclusion';
            hasConclusion = true;
            out.push('\n### Conclusion\n');
        }
        
        // Formatting
        if (state === 'given') {
            if (!inBlockMath && !isBlockMathBorder && !line.startsWith('**') && !line.startsWith('*')) {
                let cleanLine = line.replace(/We are given the following information:\s*/i, '')
                                    .replace(/^Given that,?\s*/i, '')
                                    .replace(/^It is provided that,?\s*/i, '')
                                    .replace(/^We are given:\s*/i, '').trim();
                if (cleanLine && cleanLine.length > 2) {
                    out.push(`* ${cleanLine}`);
                }
                continue;
            }
        }
        
        out.push(line);
    }
    return out.join('\n\n');
  };

  if (loading) {
    return (
      <div className="rich-chapter-content">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'rgba(255,255,255,0.7)' }}>
           <Loader className="spin" size={40} style={{ marginBottom: '15px' }} />
           <h3>Loading Solutions...</h3>
           <p>Extracting data for {className} {subjectName}...</p>
        </div>
      </div>
    );
  }

  const validQuestions = (chapterQuestions || []).filter(qaObj => {
    const qLower = qaObj.q.toLowerCase();
    const isSeoHeading = qLower.includes('cbse class') || qLower.includes('ncert solutions') || qLower.includes('important questions');
    const isMissingAnswer = qaObj.a === 'Detailed solution available.' || qaObj.a.trim().length < 10;
    return !isSeoHeading && !isMissingAnswer;
  });

  if (!validQuestions || validQuestions.length === 0) {
    return (
      <div className="rich-chapter-content">
        <div className="no-chapters-box" style={{ marginTop: '20px' }}>
           <h3>Content Being Digitized</h3>
           <p>The solution PDF for this chapter is currently being compiled into our premium interactive format.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reader-layout">
      <div className="rich-chapter-content fade-in-scale">
        {validQuestions.map((qaObj, index) => {
          const num = index + 1;
          return (
            <div key={num} id={`q-${chapterNum}-${num}`} className="qna-block glass-panel">
              <div className="question-text" style={{ display: 'flex', alignItems: 'flex-start', fontSize: '1.15rem', fontWeight: 600, marginBottom: '15px', color: 'var(--text-primary)' }}>
                <span className="q-badge" style={{ textTransform: 'uppercase', flexShrink: 0, marginTop: '2px' }}>Q {chapterNum}.{num}</span> 
                <div style={{ marginLeft: '12px', width: '100%' }}>
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {healText(qaObj.q).replace(/^\d+\.\s*/, '').replace(/\n/g, '\n\n')}
                  </ReactMarkdown>
                </div>
              </div>
              <div className="answer-block">
                <h4 className="answer-heading" style={{ textTransform: 'none', marginBottom: '15px' }}>Answer:</h4>
                <div className="answer-content" style={{ fontWeight: 'normal', fontSize: '1rem', textTransform: 'none', lineHeight: '1.7' }}>
                  {(qaObj.a === 'Detailed solution available.' || qaObj.a.trim().length < 10) ? (
                    <div style={{
                      textAlign: 'center', padding: '30px 20px',
                      background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.08))',
                      borderRadius: '12px', border: '1px dashed rgba(139,92,246,0.3)'
                    }}>
                      <div style={{ fontSize: '2rem', marginBottom: '10px', opacity: 0.6 }}>📐</div>
                      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', margin: 0 }}>
                        This answer requires a diagram or visual explanation.
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: '6px' }}>
                        Refer to your NCERT textbook for the complete solution.
                      </p>
                    </div>
                  ) : (
                  <ReactMarkdown 
                    remarkPlugins={[remarkMath]} 
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      img: ({node, ...props}) => (
                        <div style={{
                          textAlign: 'center', margin: '20px 0', padding: '15px',
                          background: 'rgba(255,255,255,0.04)', borderRadius: '12px',
                          border: '1px solid rgba(255,255,255,0.08)'
                        }}>
                          <img
                            {...props}
                            style={{
                              maxWidth: '100%', maxHeight: '400px', borderRadius: '8px',
                              boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                            }}
                          />
                          {props.alt && props.alt !== 'Diagram' && (
                            <p style={{
                              color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem',
                              marginTop: '10px', fontStyle: 'italic'
                            }}>
                              {props.alt}
                            </p>
                          )}
                        </div>
                      ),
                      ul: ({node, ...props}) => <ul className="data-list" {...props} />,
                      li: ({node, ...props}) => <li {...props} />,
                      strong: ({node, ...props}) => <strong {...props} />,
                      h3: ({node, ...props}) => {
                        let colorClass = 'header-default';
                        let text = '';
                        if (Array.isArray(props.children)) {
                            text = props.children.join(' ');
                        } else if (typeof props.children === 'string') {
                            text = props.children;
                        } else {
                            text = String(props.children);
                        }
                        
                        if (text.includes('Given')) colorClass = 'header-given';
                        else if (text.includes('Formula')) colorClass = 'header-formula';
                        else if (text.includes('Calculation')) colorClass = 'header-calc';
                        else if (text.includes('Conclusion')) colorClass = 'header-conclusion';
                        
                        return <h3 className={`section-header ${colorClass}`} {...props} />;
                      }
                    }}
                  >
                    {formatToMockup(qaObj.a)}
                  </ReactMarkdown>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="quick-nav-sidebar fade-in-scale">
        <h3>Index</h3>
        <div className="nav-grid">
          {validQuestions.map((_, index) => {
            const num = index + 1;
            return (
              <button key={num} onClick={() => scrollToQ(`q-${chapterNum}-${num}`)}>
                {num}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
