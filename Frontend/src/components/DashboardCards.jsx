import React from 'react';
import { Users, UserCheck, Calendar, Clock, TrendingUp } from 'lucide-react';

export default function DashboardCards({ leads, appointments, trends }) {
  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter(l => l.service_interest).length;
  const totalAppts = appointments.length;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingAppts = appointments.filter(a => a.appointment_date >= todayStr).length;
  const conversionRate = totalLeads > 0 ? ((totalAppts / totalLeads) * 100).toFixed(1) : "0.0";

  return (
    <div className="kpi-grid">
      {/* KPI Total Leads */}
      <div className="kpi-card">
        <div className="kpi-header">
          <span>Total Prospects</span>
          <div className="kpi-icon-wrapper"><Users size={18} /></div>
        </div>
        <div className="kpi-body">
          <span className="kpi-value">{totalLeads}</span>
          <div className="kpi-trends-row">
            <span className="trend-badge today">+{trends.leads.today} Today</span>
            <span className="trend-badge week">+{trends.leads.week} Wk</span>
            <span className="trend-badge month">+{trends.leads.month} Mo</span>
          </div>
        </div>
      </div>

      {/* KPI Qualified Leads */}
      <div className="kpi-card">
        <div className="kpi-header">
          <span>Qualified Leads</span>
          <div className="kpi-icon-wrapper" style={{ color: 'var(--secondary)', background: 'var(--secondary-glow)' }}><UserCheck size={18} /></div>
        </div>
        <div className="kpi-body">
          <span className="kpi-value">{qualifiedLeads}</span>
          <div className="kpi-trends-row">
            <span className="trend-badge today" style={{ color: '#22d3ee', background: 'rgba(6, 182, 212, 0.15)', borderColor: 'rgba(6, 182, 212, 0.25)' }}>
              {totalLeads > 0 ? ((qualifiedLeads / totalLeads) * 100).toFixed(0) : 0}% Qualified
            </span>
          </div>
        </div>
      </div>

      {/* KPI Total Appointments */}
      <div className="kpi-card">
        <div className="kpi-header">
          <span>Appointments Booked</span>
          <div className="kpi-icon-wrapper" style={{ color: 'var(--accent)', background: 'var(--accent-glow)' }}><Calendar size={18} /></div>
        </div>
        <div className="kpi-body">
          <span className="kpi-value">{totalAppts}</span>
          <div className="kpi-trends-row">
            <span className="trend-badge today">+{trends.appointments.today} Today</span>
            <span className="trend-badge week">+{trends.appointments.week} Wk</span>
            <span className="trend-badge month">+{trends.appointments.month} Mo</span>
          </div>
        </div>
      </div>

      {/* KPI Upcoming Appointments */}
      <div className="kpi-card">
        <div className="kpi-header">
          <span>Upcoming Strategy Calls</span>
          <div className="kpi-icon-wrapper" style={{ color: '#fbbf24', background: 'rgba(245, 158, 11, 0.1)' }}><Clock size={18} /></div>
        </div>
        <div className="kpi-body">
          <span className="kpi-value">{upcomingAppts}</span>
          <div className="kpi-trends-row">
            <span className="trend-badge today" style={{ color: '#fbbf24', background: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.25)' }}>Active Sessions</span>
          </div>
        </div>
      </div>

      {/* KPI Conversion Rate */}
      <div className="kpi-card">
        <div className="kpi-header">
          <span>Conversion Rate</span>
          <div className="kpi-icon-wrapper" style={{ color: '#ec4899', background: 'rgba(236, 72, 153, 0.1)' }}><TrendingUp size={18} /></div>
        </div>
        <div className="kpi-body">
          <span className="kpi-value">{conversionRate}%</span>
          <div className="kpi-trends-row">
            <span className="trend-badge today" style={{ color: '#ec4899', background: 'rgba(236, 72, 153, 0.15)', borderColor: 'rgba(236, 72, 153, 0.25)' }}>Leads to Appt</span>
          </div>
        </div>
      </div>
    </div>
  );
}
