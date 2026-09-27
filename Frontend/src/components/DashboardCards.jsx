import React from 'react';
import { Users, UserCheck, Calendar, Clock, TrendingUp } from 'lucide-react';

export default function DashboardCards({ leads, appointments, trends }) {
  const totalLeads = leads?.length || 0;
  const qualifiedLeads = leads?.filter(l => l.service_interest)?.length || 0;
  const totalAppts = appointments?.length || 0;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingAppts = appointments?.filter(a => a.appointment_date >= todayStr)?.length || 0;
  const conversionRate = totalLeads > 0 ? ((totalAppts / totalLeads) * 100).toFixed(1) : "0.0";

  return (
    <div 
      className="kpi-grid" 
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* KPI Total Leads */}
      <div className="kpi-card" style={{ minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
        <div className="kpi-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Total Prospects</span>
          <div className="kpi-icon-wrapper"><Users size={18} /></div>
        </div>
        <div className="kpi-body">
          <span className="kpi-value">{totalLeads}</span>
          <div className="kpi-trends-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            <span className="trend-badge today">+{trends?.leads?.today || 0} Today</span>
            <span className="trend-badge week">+{trends?.leads?.week || 0} Wk</span>
            <span className="trend-badge month">+{trends?.leads?.month || 0} Mo</span>
          </div>
        </div>
      </div>

      {/* KPI Qualified Leads */}
      <div className="kpi-card" style={{ minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
        <div className="kpi-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Qualified Leads</span>
          <div className="kpi-icon-wrapper" style={{ color: 'var(--secondary)', background: 'var(--secondary-glow)' }}>
            <UserCheck size={18} />
          </div>
        </div>
        <div className="kpi-body">
          <span className="kpi-value">{qualifiedLeads}</span>
          <div className="kpi-trends-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            <span className="trend-badge today" style={{ color: '#22d3ee', background: 'rgba(6, 182, 212, 0.15)', borderColor: 'rgba(6, 182, 212, 0.25)' }}>
              {totalLeads > 0 ? ((qualifiedLeads / totalLeads) * 100).toFixed(0) : 0}% Qualified
            </span>
          </div>
        </div>
      </div>

      {/* KPI Total Appointments */}
      <div className="kpi-card" style={{ minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
        <div className="kpi-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Appointments Booked</span>
          <div className="kpi-icon-wrapper" style={{ color: 'var(--accent)', background: 'var(--accent-glow)' }}>
            <Calendar size={18} />
          </div>
        </div>
        <div className="kpi-body">
          <span className="kpi-value">{totalAppts}</span>
          <div className="kpi-trends-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            <span className="trend-badge today">+{trends?.appointments?.today || 0} Today</span>
            <span className="trend-badge week">+{trends?.appointments?.week || 0} Wk</span>
            <span className="trend-badge month">+{trends?.appointments?.month || 0} Mo</span>
          </div>
        </div>
      </div>

      {/* KPI Upcoming Appointments */}
      <div className="kpi-card" style={{ minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
        <div className="kpi-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Upcoming Strategy Calls</span>
          <div className="kpi-icon-wrapper" style={{ color: '#fbbf24', background: 'rgba(245, 158, 11, 0.1)' }}>
            <Clock size={18} />
          </div>
        </div>
        <div className="kpi-body">
          <span className="kpi-value">{upcomingAppts}</span>
          <div className="kpi-trends-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            <span className="trend-badge today" style={{ color: '#fbbf24', background: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.25)' }}>
              Active Sessions
            </span>
          </div>
        </div>
      </div>

      {/* KPI Conversion Rate */}
      <div className="kpi-card" style={{ minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
        <div className="kpi-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Conversion Rate</span>
          <div className="kpi-icon-wrapper" style={{ color: '#ec4899', background: 'rgba(236, 72, 153, 0.1)' }}>
            <TrendingUp size={18} />
          </div>
        </div>
        <div className="kpi-body">
          <span className="kpi-value">{conversionRate}%</span>
          <div className="kpi-trends-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            <span className="trend-badge today" style={{ color: '#ec4899', background: 'rgba(236, 72, 153, 0.15)', borderColor: 'rgba(236, 72, 153, 0.25)' }}>
              Leads to Appt
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}