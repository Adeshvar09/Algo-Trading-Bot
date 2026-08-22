import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles } from 'lucide-react';
import { sendChatMessage } from '../../services/api';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello! I am your Algo Trading Assistant. Ask me about stock prices, algorithmic signals, or your paper portfolio!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg = {
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const data = await sendChatMessage(query);
      const botMsg = {
        sender: 'bot',
        text: data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: 'Sorry, I failed to process your question. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'What is TCS price?',
    'What is TCS signal?',
    'Why is TCS BUY?',
    'What is my portfolio value?'
  ];

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 999 }}>
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          style={{ 
            background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', 
            color: '#FFFFFF', 
            padding: '14px 20px', 
            borderRadius: '30px', 
            fontWeight: 800, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            boxShadow: '0 8px 30px rgba(59, 130, 246, 0.45)',
            border: '1px solid rgba(255,255,255,0.15)',
            transition: 'transform 200ms ease, boxShadow 200ms ease'
          }}
          aria-label="Open Trading Assistant Chatbot"
        >
          <Bot size={22} />
          <span style={{ fontSize: '0.92rem' }}>Trading Assistant</span>
          <Sparkles size={16} />
        </button>
      ) : (
        <div 
          style={{ 
            width: '380px', 
            height: '520px', 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '18px', 
            display: 'flex', 
            flexDirection: 'column', 
            boxShadow: '0 16px 50px rgba(0, 0, 0, 0.7)', 
            overflow: 'hidden',
            animation: 'modalScaleIn 200ms ease-out forwards'
          }}
        >
          {/* Header */}
          <div style={{ background: 'var(--bg-surface)', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'var(--accent-blue-bg)', padding: '8px', borderRadius: '10px', color: 'var(--accent-blue)', border: '1px solid var(--border-blue)' }}>
                <Bot size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>Algo Chatbot</h4>
                <p style={{ fontSize: '0.72rem', color: 'var(--color-positive)', fontWeight: 600 }}>● Online | Synthetic Engine</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '4px', borderRadius: '6px' }}
              aria-label="Close Chatbot"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Stream */}
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                style={{ 
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%'
                }}
              >
                <div 
                  style={{ 
                    background: msg.sender === 'user' ? 'var(--accent-blue)' : 'var(--bg-surface)', 
                    color: '#FFFFFF', 
                    padding: '10px 14px', 
                    borderRadius: msg.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    fontSize: '0.88rem',
                    lineHeight: '1.45',
                    whiteSpace: 'pre-line',
                    border: msg.sender === 'user' ? 'none' : '1px solid var(--border-color)'
                  }}
                >
                  {msg.text}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '4px', textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                  {msg.timestamp}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', background: 'var(--bg-surface)', color: 'var(--text-secondary)', padding: '8px 14px', borderRadius: '12px', fontSize: '0.82rem', border: '1px solid var(--border-color)' }}>
                Bot is analyzing synthetic data...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div style={{ padding: '8px 12px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '6px', overflowX: 'auto' }}>
            {quickPrompts.map((prompt, i) => (
              <button 
                key={i} 
                onClick={() => handleSend(prompt)}
                style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', fontSize: '0.75rem', padding: '5px 10px', borderRadius: '14px', whiteSpace: 'nowrap', border: '1px solid var(--border-color)', fontWeight: 600 }}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div style={{ padding: '12px', background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              placeholder="Ask a stock question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              style={{ flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '10px', fontSize: '0.85rem' }}
            />
            <button 
              onClick={() => handleSend()}
              style={{ background: 'var(--accent-blue)', color: '#fff', padding: '10px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              aria-label="Send Message"
            >
              <Send size={16} />
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
