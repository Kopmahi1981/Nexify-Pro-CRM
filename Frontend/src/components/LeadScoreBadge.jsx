import React from 'react';

export default function LeadScoreBadge({ status }) {
  const normStatus = status ? status.toLowerCase() : 'cold';

  if (normStatus === 'hot') {
    return (
      <span className="crm-badge" style={{
        background: 'rgba(239, 68, 68, 0.15)',
        color: '#f87171',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        🔥 Hot
      </span>
    );
  }

  if (normStatus === 'warm') {
    return (
      <span className="crm-badge" style={{
        background: 'rgba(245, 158, 11, 0.15)',
        color: '#fbbf24',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        🟡 Warm
      </span>
    );
  }

  return (
    <span className="crm-badge" style={{
      background: 'rgba(156, 163, 175, 0.15)',
      color: '#d1d5db',
      border: '1px solid rgba(156, 163, 175, 0.3)',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px'
    }}>
      ⚪ Cold
    </span>
  );
}
