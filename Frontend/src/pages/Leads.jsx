import React, { useState } from 'react';
import { X, Calendar } from 'lucide-react';
import LeadsTable from '../components/LeadsTable';
import ConversationViewer from '../components/ConversationViewer';

export default function Leads({ leads, appointments, logs, onRefresh }) {
  const [selectedLead, setSelectedLead] = useState(null);
  const [activeViewerLead, setActiveViewerLead] = useState(null);

  const matchedLogs = activeViewerLead 
    ? logs.filter(log => log.lead_id === activeViewerLead.id).sort((a,b) => new Date(a.created_at) - new Date(b.created_at))
    : [];

  const matchedAppts = selectedLead
    ? appointments.filter(a => a.lead_id === selectedLead.id)
    : [];

  return (
    <div className="crm-page-container">
      <LeadsTable 
        leads={leads} 
        onSelectLead={setSelectedLead}
        onViewConversations={setActiveViewerLead}
      />

      {/* HubSpot style slide over Drawer */}
      {selectedLead && (
        <div className="drawer-backdrop" onClick={() => setSelectedLead(null)}>
          <div className="detail-drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <span className="drawer-title">{selectedLead.name}</span>
              <button className="drawer-close" onClick={() => setSelectedLead(null)}><X size={16} /></button>
            </div>
            <div className="drawer-content">
              <div className="drawer-section">
                <span className="drawer-section-title">Details</span>
                <div className="drawer-info-grid">
                  <div className="drawer-info-item">
                    <span className="drawer-info-label">Email</span>
                    <span className="drawer-info-value">{selectedLead.email || 'None'}</span>
                  </div>
                  <div className="drawer-info-item">
                    <span className="drawer-info-label">Phone</span>
                    <span className="drawer-info-value">{selectedLead.phone || '-'}</span>
                  </div>
                  <div className="drawer-info-item">
                    <span className="drawer-info-label">Industry</span>
                    <span className="drawer-info-value">{selectedLead.industry || '-'}</span>
                  </div>
                  <div className="drawer-info-item">
                    <span className="drawer-info-label">Source</span>
                    <span className="drawer-info-value">{selectedLead.lead_source || 'website'}</span>
                  </div>
                </div>
              </div>

              <div className="drawer-section">
                <span className="drawer-section-title">Strategy Sessions</span>
                {matchedAppts.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No sessions scheduled.</p>
                ) : (
                  matchedAppts.map(appt => (
                    <div className="drawer-appt-item" key={appt.id}>
                      <Calendar size={12} style={{ marginRight: '6px' }} />
                      {appt.appointment_date} at {appt.appointment_time || appt.appointment}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conversations log Modal */}
      <ConversationViewer 
        isOpen={activeViewerLead !== null} 
        leadName={activeViewerLead?.name || ''} 
        logs={matchedLogs} 
        onClose={() => setActiveViewerLead(null)}
      />
    </div>
  );
}
