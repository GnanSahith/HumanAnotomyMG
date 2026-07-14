import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';

const SelectionTooltip = ({ onAskChatbot }) => {
  const [selectionParams, setSelectionParams] = useState(null);

  useEffect(() => {
    const handleMouseUp = (e) => {
      // Small timeout to let the browser update the selection
      setTimeout(() => {
        const selection = window.getSelection();
        const text = selection.toString().trim();
        
        if (text.length > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          
          // Don't show if clicking inside the chatbot or the tooltip itself
          if (e.target.closest('.ai-selection-tooltip') || e.target.closest('.ai-chatbot')) {
            return;
          }

          setSelectionParams({
            text,
            x: rect.left + rect.width / 2,
            y: rect.top + window.scrollY - 10, // Slightly above the selection
          });
        } else {
          // If clicking on nothing, hide tooltip unless we're clicking inside the tooltip/chatbot
          if (!e.target.closest('.ai-selection-tooltip') && !e.target.closest('.ai-chatbot')) {
            setSelectionParams(null);
          }
        }
      }, 50);
    };

    const handleMouseDown = (e) => {
      if (!e.target.closest('.ai-selection-tooltip') && !e.target.closest('.ai-chatbot')) {
        setSelectionParams(null);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  if (!selectionParams) return null;

  return (
    <div 
      className="ai-selection-tooltip"
      style={{
        position: 'absolute',
        left: `${selectionParams.x}px`,
        top: `${selectionParams.y}px`,
        transform: 'translate(-50%, -100%)',
        zIndex: 9999,
        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
        padding: '6px 12px',
        borderRadius: '24px',
        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        color: '#fff',
        fontWeight: 'bold',
        fontSize: '13px',
        animation: 'fadeInUp 0.2s ease-out'
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onAskChatbot(selectionParams.text);
        setSelectionParams(null);
        window.getSelection().removeAllRanges();
      }}
    >
      <MessageCircle size={16} color="#fff" />
      Ask ChatBot
    </div>
  );
};

export default SelectionTooltip;
