import React from 'react';
import { Bell, RefreshCw, Clock, PlusCircle, UserPlus, Download, X } from 'lucide-react';
import DashboardCards from '../components/DashboardCards';

export default function Dashboard({ leads, appointments, logs, onRefresh, alerts, onDismissAlert, onQuickLead, onQuickAppt, onExportCSV }) {
  
  // 1. Calculate Activity Feed
  const crmActivity = [];
  leads.forEach(l => {
    if (l && l.created_at) {
      crmActivity.push({ type: 'lead', title: `Lead captured: ${l.name}`, time: new Date(l.created_at) });
    }
  });
  appointments.forEach(a => {
    if (a && a.created_at) {
      crmActivity.push({ type: 'appt', title: `Appointment booked`, time: new Date(a.created_at) });
    }
  });
  logs.filter(log => log && log.user_message).slice(0, 10).forEach(log => {
    if (log && log.created_at) {
      crmActivity.push({ type: 'log', title: `Message received`, time: new Date(log.created_at) });
    }
  });
  
  const sortedActivity = crmActivity.sort((a,b) => b.time - a.time).slice(0, 20);

  // 2. Leads trend calculation today
  const todayStr = new Date().toDateString();
  const leadsToday = leads.filter(l => l && l.created_at && new Date(l.created_at).toDateString() === todayStr).length;

  return (
    <div className="crm-page-container" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Alert Notifications Center */}
      {alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {alerts.map(alert => (
            <div className="form-error-alert" key={alert.id} style={{ background: 'rgba(139, 92, 246, 0.08)', borderColor: 'var(--primary)', color: '#fff', justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Bell size={16} color="var(--primary)" />
                <span><strong>New Alert:</strong> {alert.text}</span>
              </div>
              <button onClick={() => onDismissAlert(alert.id)} style={{ color: 'var(--text-secondary)' }}><X size={14} /></button>
            </div>
          ))}
        </div>
      )}

      {/* KPI Overview Cards */}
      <DashboardCards leads={leads} appointments={appointments} trends={{
        leads: { today: leadsToday, week: leads.length, month: leads.length },
        appointments: { today: appointments.length, week: appointments.length, month: appointments.length }
      }} />

      {/* Quick Actions and Activity Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        
        {/* Quick Actions Panel */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.1rem' }}>SaaS Operations Panel</h3>
          <div className="quick-actions-grid">
            <button className="quick-action-btn" onClick={onQuickLead}>
              <UserPlus size={18} />
              <span>Create Lead</span>
            </button>
            <button className="quick-action-btn" onClick={onQuickAppt}>
              <PlusCircle size={18} />
              <span>Schedule Session</span>
            </button>
            <button className="quick-action-btn" onClick={onExportCSV}>
              <Download size={18} />
              <span>Export Database</span>
            </button>
          </div>
        </div>

        {/* Real-time Activity Feed */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.1rem' }}>Live Activity Feed</h3>
          <div className="activity-feed-list">
            {sortedActivity.length === 0 ? (
              <div className="empty-state">
                <p>No activity records logged yet.</p>
              </div>
            ) : (
              sortedActivity.map((act, i) => (
                <div className="activity-feed-item" key={i}>
                  <div className={`activity-feed-icon-wrapper ${act.type}`}>
                    <Clock size={14} />
                  </div>
                  <div className="activity-feed-content">
                    <span className="activity-feed-title">{act.title}</span>
                    <span className="activity-feed-time">{act.time.toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
