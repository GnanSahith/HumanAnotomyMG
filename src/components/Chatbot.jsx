import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, User, Minimize2, Maximize2, Volume2, Pause, Play, Square } from 'lucide-react';
import { streamChatbot } from '../services/aiService';

const Chatbot = ({ initialQuery, isOpen, setIsOpen, onClose }) => {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'ai', text: "Hi! I'm your AI study assistant. Highlight any text on the screen, and I'll help explain it." }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState(null);
  const [isSpeechPaused, setIsSpeechPaused] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isOpen, isMinimized]);

  const startSpeaking = (msgId, text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setPlayingMessageId(msgId);
    setIsSpeechPaused(false);

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google US English')) 
                        || voices.find(v => v.name.includes('Samantha'))
                        || voices.find(v => v.lang === 'en-US' && v.name.includes('Female'))
                        || voices.find(v => v.lang === 'en-US')
                        || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    utterance.onend = () => {
      setPlayingMessageId(null);
      setIsSpeechPaused(false);
    };
    utterance.onerror = () => {
      setPlayingMessageId(null);
      setIsSpeechPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const pauseSpeaking = () => {
    window.speechSynthesis.pause();
    setIsSpeechPaused(true);
  };

  const resumeSpeaking = () => {
    window.speechSynthesis.resume();
    setIsSpeechPaused(false);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setPlayingMessageId(null);
    setIsSpeechPaused(false);
  };

  // Handle incoming query from text selection
  useEffect(() => {
    if (initialQuery && isOpen) {
      handleSend(`Explain this text: "${initialQuery}"`);
    }
  }, [initialQuery]);

  const handleSend = async (messageText = input) => {
    if (!messageText.trim()) return;

    const userMessage = { id: Date.now(), sender: 'user', text: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    
    if (isMinimized) setIsMinimized(false);

    try {
      const aiMessageId = Date.now() + 1;
      setMessages(prev => [...prev, { id: aiMessageId, sender: 'ai', text: "" }]);
      
      await streamChatbot(messageText, (chunk) => {
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId ? { ...msg, text: chunk } : msg
        ));
      });
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: "Sorry, I'm having trouble connecting to the server right now." }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) {
    return (
      <div
        className="ai-chatbot-fab"
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #4f46e5, #9333ea)',
          boxShadow: '0 4px 16px rgba(79, 70, 229, 0.4)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          zIndex: 9998,
          transition: 'transform 0.2s ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Bot size={28} color="white" />
      </div>
    );
  }

  return (
    <div 
      className="ai-chatbot"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '350px',
        height: isMinimized ? '60px' : '500px',
        maxHeight: '80vh',
        backgroundColor: '#1e1e2d',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)',
        zIndex: 9998,
        transition: 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '16px',
        background: 'linear-gradient(135deg, #4f46e5, #9333ea)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: 'white',
        cursor: 'pointer'
      }} onClick={() => setIsMinimized(!isMinimized)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bot size={20} />
          <span style={{ fontWeight: '600', fontSize: '15px' }}>AI Study Assistant</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0 }}
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0 }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      {!isMinimized && (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          backgroundColor: '#151521'
        }}>
          {messages.map((msg) => {
            const isHovered = hoveredMessageId === msg.id;
            const isOtherHovered = hoveredMessageId !== null && hoveredMessageId !== msg.id;
            return (
            <div 
              key={msg.id}
              onMouseEnter={() => setHoveredMessageId(msg.id)}
              onMouseLeave={() => setHoveredMessageId(null)}
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row',
                opacity: isOtherHovered ? 0.3 : 1,
                filter: isOtherHovered ? 'blur(2px)' : 'blur(0px)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isHovered ? 'scale(1.01)' : 'scale(1)',
                transformOrigin: msg.sender === 'user' ? 'right center' : 'left center',
                zIndex: isHovered ? 10 : 1
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: msg.sender === 'user' ? '#3b82f6' : '#8b5cf6',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexShrink: 0
              }}>
                {msg.sender === 'user' ? <User size={18} color="white" /> : <Bot size={18} color="white" />}
              </div>
              <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  backgroundColor: msg.sender === 'user' ? '#2563eb' : '#2a2a40',
                  color: 'white',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  borderTopRightRadius: msg.sender === 'user' ? '4px' : '16px',
                  borderTopLeftRadius: msg.sender === 'ai' ? '4px' : '16px',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  {msg.text}
                </div>
                {msg.sender === 'ai' && msg.text && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    {playingMessageId !== msg.id ? (
                      <button 
                        onClick={() => startSpeaking(msg.id, msg.text)}
                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '4px 8px', borderRadius: '12px', transition: 'all 0.2s ease' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'white'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <Volume2 size={12} /> Read aloud
                      </button>
                    ) : (
                      <>
                        {!isSpeechPaused ? (
                          <button 
                            onClick={pauseSpeaking}
                            style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '4px 8px', borderRadius: '12px', transition: 'all 0.2s ease' }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#818cf8'; e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = '#6366f1'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                          >
                            <Pause size={12} /> Pause
                          </button>
                        ) : (
                          <button 
                            onClick={resumeSpeaking}
                            style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '4px 8px', borderRadius: '12px', transition: 'all 0.2s ease' }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#34d399'; e.currentTarget.style.backgroundColor = 'rgba(16,185,129,0.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = '#10b981'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                          >
                            <Play size={12} /> Resume
                          </button>
                        )}
                        <button 
                          onClick={stopSpeaking}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '4px 8px', borderRadius: '12px', transition: 'all 0.2s ease' }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          <Square size={12} /> Stop
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )})}
          {isTyping && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#8b5cf6', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Bot size={18} color="white" />
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontStyle: 'italic' }}>
                AI is typing...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input Area */}
      {!isMinimized && (
        <div style={{
          padding: '16px',
          backgroundColor: '#1e1e2d',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          gap: '12px'
        }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question..."
            style={{
              flex: 1,
              backgroundColor: '#2a2a40',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '24px',
              padding: '10px 16px',
              color: 'white',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: input.trim() && !isTyping ? '#6366f1' : '#374151',
              border: 'none',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: input.trim() && !isTyping ? 'pointer' : 'default',
              transition: 'background-color 0.2s'
            }}
          >
            <Send size={18} color="white" style={{ transform: 'translateX(-1px)' }} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
