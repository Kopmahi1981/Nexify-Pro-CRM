import React, { useState } from 'react';
import { Calendar, Clock, Edit3, CheckCircle2, XSquare } from 'lucide-react';

export default function AppointmentsTable({ appointments, onUpdateStatus }) {
  const [activeFilter, setActiveFilter] = useState('upcoming'); // upcoming | today | completed | cancelled | all
  const [editingId, setEditingId] = useState(null);
  const [noteText, setNoteText] = useState('');

  // 1. filter rules
  const todayStr = new Date().toISOString().split('T')[0];

  const filteredAppts = appointments.filter(appt => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'today') return appt.appointment_date === todayStr;
    if (activeFilter === 'upcoming') return appt.appointment_date >= todayStr && appt.status === 'upcoming';
    return appt.status === activeFilter;
  });

  return (
    <div 
      className="glass-card table-card" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '20px',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      {/* Responsive Filter Tabs */}
      <div 
        className="nav-tabs" 
        style={{ 
          background: 'rgba(0,0,0,0.15)', 
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          padding: '4px',
          borderRadius: '8px'
        }}
      >
        {['upcoming', 'today', 'completed', 'cancelled', 'all'].map(tab => (
          <button 
            key={tab} 
            className={`nav-tab ${activeFilter === tab ? 'active' : ''}`}
            onClick={() => setActiveFilter(tab)}
            style={{
              flex: '1 1 auto',
              minWidth: '70px',
              textAlign: 'center',
              padding: '6px 10px',
              fontSize: '0.75rem'
            }}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Responsive Horizontal Scroll Wrapper */}
      <div 
        className="crm-table-container"
        style={{
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          boxSizing: 'border-box'
        }}
      >
        {filteredAppts.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px', textAlign: 'center' }}>
            <p>No strategy sessions found.</p>
          </div>
        ) : (
          <table className="crm-table" style={{ width: '100%', minWidth: '550px', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th className="crm-th">Prospect Name</th>
                <th className="crm-th">Date</th>
                <th className="crm-th">Time</th>
                <th className="crm-th">Status</th>
                <th className="crm-th">Notes</th>
                <th className="crm-th">Update Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppts.map(appt => (
                <tr key={appt.id} className="crm-tr">
                  <td className="crm-td" style={{ fontWeight: '600', color: '#fff', whiteSpace: 'nowrap' }}>
                    {appt.leadName || 'Anonymous'}
                  </td>
                  <td className="crm-td" style={{ whiteSpace: 'nowrap' }}>
                    <span className="crm-badge secondary"><Calendar size={12} /> {appt.appointment_date}</span>
                  </td>
                  <td className="crm-td" style={{ fontWeight: 'bold', color: 'var(--secondary)', whiteSpace: 'nowrap' }}>
                    <Clock size={12} style={{ marginRight: '4px' }} /> {appt.appointment_time || appt.appointment || '-'}
                  </td>
                  <td className="crm-td" style={{ whiteSpace: 'nowrap' }}>
                    <span className={`crm-badge ${
                      appt.status === 'completed' ? 'accent' : appt.status === 'cancelled' ? 'warning' : 'secondary'
                    }`}>
                      {appt.status?.toUpperCase() || 'UPCOMING'}
                    </span>
                  </td>
                  <td className="crm-td" style={{ minWidth: '180px', maxWidth: '240px' }}>
                    {editingId === appt.id ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={noteText} 
                          onChange={(e) => setNoteText(e.target.value)}
                          style={{ padding: '6px 10px', fontSize: '0.8rem', width: '100%' }}
                        />
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '6px 10px' }}
                          onClick={() => {
                            onUpdateStatus(appt.id, appt.status, noteText);
                            setEditingId(null);
                          }}
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem' }}>{appt.notes || <span style={{ color: 'var(--text-muted)' }}>No notes</span>}</span>
                        <button 
                          onClick={() => { setEditingId(appt.id); setNoteText(appt.notes || ''); }}
                          style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                        >
                          <Edit3 size={12} />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="crm-td" style={{ whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '6px', color: 'var(--accent)' }}
                        onClick={() => onUpdateStatus(appt.id, 'completed', appt.notes)}
                        title="Mark Completed"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '6px', color: 'var(--danger)' }}
                        onClick={() => onUpdateStatus(appt.id, 'cancelled', appt.notes)}
                        title="Cancel Session"
                      >
                        <XSquare size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}