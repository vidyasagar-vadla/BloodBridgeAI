import React, { useState, useRef, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { FaRobot, FaTimes, FaPaperPlane, FaSpinner } from 'react-icons/fa';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hello! I\'m your Thalassemia Care Assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const messagesEndRef = useRef(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages, loadingStep]);

  const simulateLoadingSteps = async (steps) => {
    for (const step of steps) {
      setLoadingStep(step);
      await new Promise(r => setTimeout(r, 1000));
    }
    setLoadingStep('');
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const response = await api.post('/api/chatbot/chat', { message: userMessage });
      const { loading_steps, response: botResponse } = response.data;
      
      await simulateLoadingSteps(loading_steps.map(s => s.step));
      setMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: 'I apologize, but I\'m having trouble connecting. Please try again.' }]);
    }
    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="chatbot-btn"
        style={{
          position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white', border: 'none', borderRadius: '50%',
          width: '60px', height: '60px', cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '24px', transition: 'all 0.3s ease',
        }}
      >
        {isOpen ? <FaTimes /> : <FaRobot />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: '90px', right: '20px', zIndex: 1000,
          width: '350px', height: '500px',
          background: 'white', borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: 'slideIn 0.3s ease',
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white', padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <FaRobot size={20} />
            <div>
              <div style={{ fontWeight: '600', fontSize: '14px' }}>AI Care Assistant</div>
              <div style={{ fontSize: '11px', opacity: 0.8 }}>Powered by Mock AI</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, padding: '16px', overflowY: 'auto',
            background: '#f8f9fa',
          }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '12px',
              }}>
                <div style={{
                  maxWidth: '80%', padding: '10px 14px', borderRadius: '12px',
                  fontSize: '13px', lineHeight: '1.5',
                  background: msg.role === 'user' ? '#667eea' : 'white',
                  color: msg.role === 'user' ? 'white' : '#333',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                  borderBottomRightRadius: msg.role === 'user' ? '4px' : '12px',
                  borderBottomLeftRadius: msg.role === 'bot' ? '4px' : '12px',
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loadingStep && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '12px', marginBottom: '8px' }}>
                <FaSpinner className="spin" />
                {loadingStep}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px', borderTop: '1px solid #eee', display: 'flex', gap: '8px' }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              style={{
                flex: 1, padding: '10px 14px', border: '1px solid #ddd', borderRadius: '24px',
                outline: 'none', fontSize: '13px',
              }}
              disabled={loading}
            />
            <button onClick={handleSend} disabled={loading || !input.trim()} style={{
              background: '#667eea', color: 'white', border: 'none', borderRadius: '50%',
              width: '40px', height: '40px', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', opacity: loading ? 0.5 : 1,
            }}>
              <FaPaperPlane size={14} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </>
  );
};

export default Chatbot;