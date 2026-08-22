import React from 'react';
import { X, Clock, MessageSquare } from 'lucide-react';

export default function ConversationViewer({ isOpen, leadName, logs, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="crm-modal-backdrop" onClick={onClose}>
      <div className="crm-modal" style={{ maxWidth: '600px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
        <div className="crm-modal-header">
          <span className="crm-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={18} color="var(--primary)" />
            Dialogue History: {leadName}
          </span>
          <button className="crm-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="crm-modal-body" style={{ maxHeight: '450px', overflowY: 'auto' }}>
          {logs.length === 0 ? (
            <div className="empty-state">
              <MessageSquare className="empty-state-icon" />
              <p>No conversation activity logs recorded for this lead.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {logs.map((log) => {
                const isUser = log.sender === 'user' || (!log.sender && log.user_message);
                const text = log.message || log.user_message || log.agent_response;
                
                return (
                  <div 
                    key={log.id} 
                    className={`chat-bubble ${isUser ? 'user' : 'agent'}`}
                    style={{ maxWidth: '85%' }}
                  >
                    <span style={{ fontSize: '0.65rem', display: 'block', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {isUser ? "USER" : "AI VOICE AGENT"}
                    </span>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>{text}</p>
                    <div className="chat-bubble-meta">
                      <Clock size={10} />
                      <span>{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="crm-modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close Viewer</button>
        </div>
      </div>
    </div>
  );
}
