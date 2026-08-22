import LeadHunterGateway from "./components/LeadHunterGateway";
import React, { useState, useEffect, useRef } from 'react';
import logoAsset from './assets/logo/nexify-pro-logo-dark.png';
import { 
  Play, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Settings, 
  RotateCcw, 
  Send, 
  FileText, 
  HelpCircle, 
  CheckCircle, 
  AlertCircle, 
  Award, 
  DollarSign, 
  BookOpen, 
  PhoneCall,
  Info,
  ChevronRight,
  TrendingUp,
  Sliders,
  LayoutDashboard,
  Users,
  Calendar,
  MessageSquare,
  BarChart3,
  X,
  Search,
  ArrowUpDown,
  RefreshCw,
  Clock,
  UserCheck,
  TrendingDown,
  UserPlus,
  PlusCircle,
  Download
} from 'lucide-react';

// Import services and sub-views
import { defaultSystemPrompt, presetClients, objectionCards } from './promptConfig';
import { supabaseService } from './services/supabaseService';
import { calculateLeadScore } from './services/leadScoring';
import LanguageSelector from './components/LanguageSelector';
import LeadQualificationChat from './components/LeadQualificationChat';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Appointments from './pages/Appointments';

// Helper for PostgreSQL-compatible time conversion
const parseTo24HourTime = (timeStr) => {
  const clean = timeStr.trim().toUpperCase();
  const regex = /^(\d{1,2})(?:[:.](\d{2}))?\s*(AM|PM)?$/;
  const match = clean.match(regex);
  if (!match) return null;
  
  let hours = parseInt(match[1], 10);
  let minutes = match[2] ? parseInt(match[2], 10) : 0;
  const ampm = match[3];
  
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  
  if (ampm) {
    if (hours > 12) return null;
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
  }
  
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  return `${hh}:${mm}:00`;
};

export default function App() {
  // Navigation & Sub-routing Tab
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | leads | appointments | conversations | simulator | settings
  const [simulatorSubTab, setSimulatorSubTab] = useState('simulator'); // simulator | prompt | trainer | calculator
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Multilingual flow hooks
  const [language, setLanguage] = useState('en');
  const [languageChosen, setLanguageChosen] = useState(false);

  // CRM State Data hooks
  const [leads, setLeads] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Notifications alerts state (Enhancement 5)
  const [alerts, setAlerts] = useState([]);

  // Modals overlays state
  const [newLeadModalOpen, setNewLeadModalOpen] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    name: '',
    phone: '',
    email: '',
    business_name: '',
    industry: '',
    service_interest: ''
  });
  const [newLeadError, setNewLeadError] = useState('');

  const [newApptModalOpen, setNewApptModalOpen] = useState(false);
  const [newApptForm, setNewApptForm] = useState({
    lead_id: '',
    appointment_date: '',
    appointment_time: ''
  });
  const [newApptError, setNewApptError] = useState('');

  // Voice configurations
  const [voiceActive, setVoiceActive] = useState(true);
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [voicePitch, setVoicePitch] = useState(1.0);

  // Synchronize database records
  const loadCRMRecords = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    setError(null);
    try {
      const allLeads = await supabaseService.getLeads();
      const allAppts = await supabaseService.getAppointments();
      const allLogs = await supabaseService.getConversationLogs();

      // Extend appointments with lead names client-side for safety
      const mappedAppts = allAppts.map(appt => {
        const matched = allLeads.find(l => l.id === appt.lead_id);
        return {
          ...appt,
          leadName: matched ? matched.name : 'Anonymous',
          leadBusiness: matched ? matched.business_name : '-'
        };
      });

      setLeads(allLeads);
      setAppointments(mappedAppts);
      setLogs(allLogs);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to query CRM records from database.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadCRMRecords();
  }, []);

  const triggerAlert = (text) => {
    const id = Date.now();
    setAlerts(prev => [...prev, { id, text }]);
  };

  const dismissAlert = (id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  // Manual lead creation validation (Enhancement 1 + Validations)
  const handleCreateLead = async (e) => {
    e.preventDefault();
    setNewLeadError('');

    if (!newLeadForm.name.trim()) {
      setNewLeadError("Prospect Name is required.");
      return;
    }
    const cleanDigits = newLeadForm.phone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setNewLeadError("Phone Number must contain at least 10 digits.");
      return;
    }
    if (newLeadForm.email.trim() && newLeadForm.email.toLowerCase() !== 'skip') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newLeadForm.email)) {
        setNewLeadError("Please provide a valid email format.");
        return;
      }
    }

    try {
      const scoring = calculateLeadScore(
        newLeadForm.budget || '',
        newLeadForm.timeline || '',
        newLeadForm.service_interest || '',
        false
      );

      const lead = await supabaseService.createLead({
        name: newLeadForm.name.trim(),
        phone: newLeadForm.phone.trim(),
        email: newLeadForm.email.trim() || null,
        business_name: newLeadForm.business_name.trim(),
        industry: newLeadForm.industry,
        service_interest: newLeadForm.service_interest,
        lead_score: scoring.score,
        lead_status: scoring.status,
        lead_source: 'website'
      });

      if (lead) {
        triggerAlert(`New Prospect "${lead.name}" captured successfully.`);
        setNewLeadModalOpen(false);
        setNewLeadForm({ name: '', phone: '', email: '', business_name: '', industry: '', service_interest: '' });
        loadCRMRecords();
      }
    } catch (err) {
      setNewLeadError(err.message || "Failed to save prospect to database.");
    }
  };

  // Manual appointment creation validation (Enhancement 1 + Validations)
  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    setNewApptError('');

    if (!newApptForm.lead_id) {
      setNewApptError("Please select a prospect.");
      return;
    }
    if (!newApptForm.appointment_date) {
      setNewApptError("Date is required.");
      return;
    }
    if (!newApptForm.appointment_time) {
      setNewApptError("Time is required.");
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (newApptForm.appointment_date < todayStr) {
      setNewApptError("Appointment Date cannot be in the past.");
      return;
    }

    const formattedTime = parseTo24HourTime(newApptForm.appointment_time);
    if (!formattedTime) {
      setNewApptError("Please specify a valid time (e.g. 11:30 AM or 3:00 PM).");
      return;
    }

    try {
      const appt = await supabaseService.createAppointment({
        lead_id: newApptForm.lead_id,
        appointment_date: newApptForm.appointment_date,
        appointment_time: formattedTime,
        status: 'upcoming'
      });

      if (appt) {
        // Retrieve matched lead for notifications
        const matched = leads.find(l => l.id === newApptForm.lead_id);
        const name = matched ? matched.name : 'Prospect';
        
        // Dynamic Lead Score update (booked appt adds +30 points)
        if (matched) {
          const scoring = calculateLeadScore(
            matched.budget,
            matched.timeline,
            matched.service_interest,
            true
          );
          await supabaseService.updateLead(matched.id, {
            lead_score: scoring.score,
            lead_status: scoring.status,
            last_contacted_at: new Date().toISOString()
          });
        }

        triggerAlert(`Strategy session confirmed for ${name} on ${appt.appointment_date}.`);
        setNewApptModalOpen(false);
        setNewApptForm({ lead_id: '', appointment_date: '', appointment_time: '' });
        loadCRMRecords();
      }
    } catch (err) {
      setNewApptError(err.message || "Failed to schedule appointment.");
    }
  };

  // Change Appointment Status Notes
  const handleUpdateApptStatus = async (id, status, notes) => {
    try {
      await supabaseService.updateAppointment(id, { status, notes });
      triggerAlert(`Appointment status modified to ${status.toUpperCase()}.`);
      loadCRMRecords();
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    }
  };

  // CSV Exporter (Recommended)
  const handleDownloadCSV = () => {
    if (leads.length === 0) {
      alert("No leads data in CRM to export.");
      return;
    }
    const headers = ["Name", "Phone", "Email", "Business Name", "Industry", "Service Interest", "Budget", "Timeline", "Score", "Status", "Language", "Source", "Date Created"];
    const csvRows = [headers.join(",")];

    leads.forEach(lead => {
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
    link.setAttribute("download", `leads_total_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="crm-layout">
      {/* Left Sidebar */}
      <aside className={`crm-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <img
            src={logoAsset}
            alt="NEXIFY PRO Logo"
            style={{ width: '100%', maxWidth: '200px', height: 'auto', objectFit: 'contain' }}
          />
        </div>

        <nav className="sidebar-nav">
          <div className={`sidebar-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </div>
          <div className={`sidebar-link ${activeTab === 'leads' ? 'active' : ''}`} onClick={() => { setActiveTab('leads'); setSidebarOpen(false); }}>
            <Users size={18} />
            <span>Leads Directory</span>
          </div>
          <div className={`sidebar-link ${activeTab === 'lead-hunter' ? 'active' : ''}`} onClick={() => { setActiveTab('lead-hunter'); setSidebarOpen(false); }}>
          <span style={{ fontSize: '16px' }}>🎯</span>
          <span>AI Lead Hunter</span>
        </div>
          <div className={`sidebar-link ${activeTab === 'appointments' ? 'active' : ''}`} onClick={() => { setActiveTab('appointments'); setSidebarOpen(false); }}>
            <Calendar size={18} />
            <span>Appointments</span>
          </div>
          <div className={`sidebar-link ${activeTab === 'simulator' ? 'active' : ''}`} onClick={() => { setActiveTab('simulator'); setSidebarOpen(false); }}>
            <PhoneCall size={18} />
            <span>Voice Simulator</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div>NEXIFY PRO Lab v1.5</div>
          <div style={{ fontSize: '0.7rem' }}>Last updated: Jun 14, 2026</div>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="crm-main-content">
        <header className="crm-top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Sliders size={20} />
            </button>
            <h1 className="top-bar-title">
              {activeTab === 'dashboard' && "Executive CRM Overview"}
              {activeTab === 'leads' && "Leads Management"}
              {activeTab === 'appointments' && "Scheduled Strategy Sessions"}
              {activeTab === 'simulator' && "AI Voice Agent Playground"}
              {activeTab === 'lead-hunter' && "AI Lead Hunter"}
            </h1>
          </div>

          <div className="top-bar-actions">
            {activeTab === 'simulator' && languageChosen && (
              <button 
                className="btn btn-secondary" 
                onClick={() => { setLanguageChosen(false); window.speechSynthesis?.cancel(); }}
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              >
                Change Language
              </button>
            )}

            <button className="btn btn-secondary" onClick={() => loadCRMRecords(true)} disabled={isRefreshing} style={{ display: 'flex', gap: '8px', padding: '8px 14px', fontSize: '0.85rem' }}>
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              {isRefreshing ? "Syncing..." : "Refresh"}
            </button>
          </div>
        </header>

        {/* Dynamic Pages Routing */}
        <div className="crm-page-container">
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="kpi-grid">
                {[...Array(5)].map((_, i) => <div key={i} className="skeleton-pulse skeleton-card" />)}
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="error-state">
              <AlertCircle size={36} />
              <h3>Database Connection Failure</h3>
              <p>{error}</p>
              <button className="btn btn-primary" onClick={() => loadCRMRecords(true)}>Retry Sync</button>
            </div>
          )}

          {!loading && !error && (
            <>
              {activeTab === 'dashboard' && (
                <Dashboard 
                  leads={leads}
                  appointments={appointments}
                  logs={logs}
                  onRefresh={() => loadCRMRecords(true)}
                  alerts={alerts}
                  onDismissAlert={dismissAlert}
                  onQuickLead={() => setNewLeadModalOpen(true)}
                  onQuickAppt={() => setNewApptModalOpen(true)}
                  onExportCSV={handleDownloadCSV}
                />
              )}

              {activeTab === 'leads' && (
                <Leads 
                  leads={leads}
                  appointments={appointments}
                  logs={logs}
                  onRefresh={() => loadCRMRecords(true)}
                />
              )}
              {activeTab === 'lead-hunter' && (
                <LeadHunterGateway onLeadApproved={() => loadCRMRecords(true)} />
              )}
              {activeTab === 'appointments' && (
                <Appointments 
                  appointments={appointments}
                  onUpdateStatus={handleUpdateApptStatus}
                />
              )}

              {activeTab === 'simulator' && (
                <>
                  {!languageChosen ? (
                    <LanguageSelector onSelectLanguage={(lang) => { setLanguage(lang); setLanguageChosen(true); }} />
                  ) : (
                    <LeadQualificationChat 
                      language={language}
                      onFinishQualification={() => {
                        setLanguageChosen(false);
                        loadCRMRecords();
                        setActiveTab('dashboard');
                      }}
                      voiceConfig={{ speed: voiceSpeed, pitch: voicePitch }}
                    />
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>

      {/* MODAL overlay: New Lead manual creation */}
      {newLeadModalOpen && (
        <div className="crm-modal-backdrop" onClick={() => setNewLeadModalOpen(false)}>
          <form className="crm-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleCreateLead}>
            <div className="crm-modal-header">
              <span className="crm-modal-title">Create Manual Lead Profile</span>
              <button type="button" className="crm-modal-close" onClick={() => setNewLeadModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            
            <div className="crm-modal-body">
              {newLeadError && (
                <div className="form-error-alert">
                  <AlertCircle size={16} />
                  <span>{newLeadError}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Prospect Name *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. John Doe"
                  value={newLeadForm.name}
                  onChange={(e) => setNewLeadForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input 
                  type="tel" 
                  className="form-input" 
                  placeholder="e.g. 9876543210"
                  value={newLeadForm.phone}
                  onChange={(e) => setNewLeadForm(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address (Optional)</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="e.g. john@example.com"
                  value={newLeadForm.email}
                  onChange={(e) => setNewLeadForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Business / Organization Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Acme Corporation"
                  value={newLeadForm.business_name}
                  onChange={(e) => setNewLeadForm(prev => ({ ...prev, business_name: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Industry</label>
                <select 
                  className="form-select"
                  value={newLeadForm.industry}
                  onChange={(e) => setNewLeadForm(prev => ({ ...prev, industry: e.target.value }))}
                >
                  <option value="">Select Industry...</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Garments">Garments</option>
                  <option value="Education">Education</option>
                  <option value="Finance">Finance</option>
                  <option value="Technology">Technology</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Service Interest</label>
                <select 
                  className="form-select"
                  value={newLeadForm.service_interest}
                  onChange={(e) => setNewLeadForm(prev => ({ ...prev, service_interest: e.target.value }))}
                >
                  <option value="">Select Service Area...</option>
                  <option value="AI Voice Agent">AI Voice Agent</option>
                  <option value="CRM Development">CRM Development</option>
                  <option value="Website Development">Website Development</option>
                  <option value="Marketing Automation">Marketing Automation</option>
                  <option value="Lead Generation">Lead Generation</option>
                  <option value="Custom Software">Custom Software</option>
                </select>
              </div>
            </div>

            <div className="crm-modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setNewLeadModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create Profile</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL overlay: Schedule Appointment */}
      {newApptModalOpen && (
        <div className="crm-modal-backdrop" onClick={() => setNewApptModalOpen(false)}>
          <form className="crm-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleCreateAppointment}>
            <div className="crm-modal-header">
              <span className="crm-modal-title">Book Strategy Session</span>
              <button type="button" className="crm-modal-close" onClick={() => setNewApptModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            
            <div className="crm-modal-body">
              {newApptError && (
                <div className="form-error-alert">
                  <AlertCircle size={16} />
                  <span>{newApptError}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Select Prospect *</label>
                <select 
                  className="form-select"
                  value={newApptForm.lead_id}
                  onChange={(e) => setNewApptForm(prev => ({ ...prev, lead_id: e.target.value }))}
                >
                  <option value="">Choose a lead...</option>
                  {leads.map(lead => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name} {lead.business_name ? `(${lead.business_name})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Preferred Date *</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={newApptForm.appointment_date}
                  onChange={(e) => setNewApptForm(prev => ({ ...prev, appointment_date: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Preferred Time *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. 11:30 AM or 3:00 PM"
                  value={newApptForm.appointment_time}
                  onChange={(e) => setNewApptForm(prev => ({ ...prev, appointment_time: e.target.value }))}
                />
              </div>
            </div>

            <div className="crm-modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setNewApptModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Schedule Session</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
