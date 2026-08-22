import React, { useState } from 'react';
import { Search, ArrowUpDown, Download, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import LeadScoreBadge from './LeadScoreBadge';

export default function LeadsTable({ leads, onSelectLead, onViewConversations }) {
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const leadsPerPage = 8;

  // 1. Search and status filters
  const filtered = leads.filter(lead => {
    const term = search.toLowerCase();
    const matchesSearch = 
      (lead.name && lead.name.toLowerCase().includes(term)) ||
      (lead.business_name && lead.business_name.toLowerCase().includes(term)) ||
      (lead.email && lead.email.toLowerCase().includes(term)) ||
      (lead.phone && lead.phone.toLowerCase().includes(term)) ||
      (lead.industry && lead.industry.toLowerCase().includes(term)) ||
      (lead.service_interest && lead.service_interest.toLowerCase().includes(term));
      
    const matchesStatus = filterStatus === 'all' || (lead.lead_status && lead.lead_status.toLowerCase() === filterStatus.toLowerCase());
    return matchesSearch && matchesStatus;
  });

  // 2. Sort column entries
  const sorted = [...filtered].sort((a, b) => {
    let valA = a[sortCol] || '';
    let valB = b[sortCol] || '';
    if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // 3. Paginate rows
  const totalPages = Math.ceil(sorted.length / leadsPerPage);
  const paginated = sorted.slice((page - 1) * leadsPerPage, page * leadsPerPage);

  const toggleSort = (col) => {
    if (sortCol === col) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortOrder('asc');
    }
    setPage(1);
  };

  // CSV Export utility
  const handleExportCSV = () => {
    if (sorted.length === 0) {
      alert("No data available to export.");
      return;
    }
    const headers = ["Name", "Phone", "Email", "Business Name", "Industry", "Service Interest", "Budget", "Timeline", "Score", "Status", "Language", "Source", "Date Created"];
    const csvRows = [headers.join(",")];

    sorted.forEach(lead => {
      const row = [
        `"${(lead.name || '').replace(/"/g, '""')}"`,
        `"${(lead.phone || '').replace(/"/g, '""')}"`,
        `"${(lead.email || '').replace(/"/g, '""')}"`,
        `"${(lead.business_name || '').replace(/"/g, '""')}"`,
        `"${(lead.industry || '').replace(/"/g, '""')}"`,
        `"${(lead.service_interest || '').replace(/"/g, '""')}"`,
        `"${(lead.budget || '').replace(/"/g, '""')}"`,
        `"${(lead.timeline || '').replace(/"/g, '""')}"`,
        lead.lead_score || 0,
        `"${lead.lead_status || 'Cold'}"`,
        `"${lead.preferred_language || 'en'}"`,
        `"${lead.lead_source || 'website'}"`,
        `"${new Date(lead.created_at).toLocaleString()}"`
      ];
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-card table-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="table-controls">
        <div style={{ display: 'flex', gap: '12px', flex: 1, flexWrap: 'wrap' }}>
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search prospects..."
              className="form-input"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select 
            className="sort-select" 
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          >
            <option value="all">Filter: All Statuses</option>
            <option value="hot">🔥 Hot Leads</option>
            <option value="warm">🟡 Warm Leads</option>
            <option value="cold">⚪ Cold Leads</option>
          </select>
        </div>

        <button className="btn btn-secondary" onClick={handleExportCSV}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="crm-table-container">
        {paginated.length === 0 ? (
          <div className="empty-state">
            <p>No prospects matching criteria.</p>
          </div>
        ) : (
          <table className="crm-table">
            <thead>
              <tr>
                <th className="crm-th" onClick={() => toggleSort('name')}>Name <ArrowUpDown size={12} /></th>
                <th className="crm-th">Business Name</th>
                <th className="crm-th">Industry</th>
                <th className="crm-th">Service</th>
                <th className="crm-th">Budget</th>
                <th className="crm-th">Timeline</th>
                <th className="crm-th" onClick={() => toggleSort('lead_score')}>Score <ArrowUpDown size={12} /></th>
                <th className="crm-th">Status</th>
                <th className="crm-th">Language</th>
                <th className="crm-th">Source</th>
                <th className="crm-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(lead => (
                <tr key={lead.id} className="crm-tr clickable" onClick={() => onSelectLead(lead)}>
                  <td className="crm-td" style={{ fontWeight: '600', color: '#fff' }}>{lead.name}</td>
                  <td className="crm-td">{lead.business_name || '-'}</td>
                  <td className="crm-td">{lead.industry || '-'}</td>
                  <td className="crm-td">{lead.service_interest || '-'}</td>
                  <td className="crm-td">{lead.budget || '-'}</td>
                  <td className="crm-td">{lead.timeline || '-'}</td>
                  <td className="crm-td" style={{ fontWeight: 'bold' }}>{lead.lead_score || 0}</td>
                  <td className="crm-td"><LeadScoreBadge status={lead.lead_status} /></td>
                  <td className="crm-td muted">{lead.preferred_language?.toUpperCase() || 'EN'}</td>
                  <td className="crm-td muted">{lead.lead_source || 'website'}</td>
                  <td className="crm-td" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                      onClick={() => onViewConversations(lead)}
                    >
                      <MessageSquare size={12} /> Chat
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination-row">
          <span>Showing page {page} of {totalPages}</span>
          <div className="pagination-controls">
            <button className="pagination-btn" onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}>
              <ChevronLeft size={16} />
            </button>
            <button className="pagination-btn" onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
