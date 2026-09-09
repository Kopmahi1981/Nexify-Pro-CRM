import React, { useState, useEffect } from "react";
import { leadHunterService } from "../services/leadHunterService";
import { supabaseService } from '../services/supabaseService';

export default function LeadHunterGateway({ onLeadApproved }) {
  const [metrics, setMetrics] = useState({ total: 0, hot: 0, pending: 0, dispatched: 0 });
  const [pendingLeads, setPendingLeads] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [followUpStats, setFollowUpStats] = useState({});
  const [category, setCategory] = useState("Dentists");
  const [city, setCity] = useState("Hyderabad");
  const [area, setArea] = useState("");
  const [loading, setLoading] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [pitchData, setPitchData] = useState(null);
  const [dryRun, setDryRun] = useState(true);

  const loadData = async () => {
    try {
      const [m, leads, fuStatus] = await Promise.all([
        leadHunterService.getMetrics(),
        leadHunterService.getLeads("PENDING_REVIEW"),
        leadHunterService.getFollowUpStatus().catch(() => ({ follow_up_pipeline: {} })),
      ]);
      setMetrics(m);
      setPendingLeads(leads);
      setFollowUpStats(fuStatus.follow_up_pipeline || {});
      setSelectedIds([]);
    } catch (err) {
      console.error("Backend connection error:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDiscover = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await leadHunterService.discoverLeads(category, city, area);
      await loadData();
    } catch (err) {
      alert("Discovery failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRunFollowUps = async () => {
    setFollowUpLoading(true);
    try {
      const res = await leadHunterService.triggerFollowUps(dryRun);
      alert(`Follow-up cycle completed! Processed: ${res.processed_count} emails.`);
      await loadData();
    } catch (err) {
      alert("Follow-up execution failed: " + err.message);
    } finally {
      setFollowUpLoading(false);
    }
  };

  const toggleSelectLead = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === pendingLeads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingLeads.map((lead) => lead.id));
    }
  };

  const handleBatchDispatch = async () => {
    if (selectedIds.length === 0) return;
    setBatchLoading(true);
    try {
      const res = await leadHunterService.batchDispatchLeads(selectedIds, dryRun);

      const leadsToSync = leads.filter((l) => selectedIds.includes(l.id));
      await Promise.all(
        leadsToSync.map((item) =>
          supabaseService.createLead({
            name: item.name,
            phone: item.phone || null,
            email: item.email || null,
            business_name: item.name,
            industry: item.category || item.industry || "General",
            lead_status: dryRun ? "Simulated Sent" : "Contacted",
            lead_score: item.score || 70,
            lead_source: "lead_hunter"
          })
        )
      );

      alert(`Batch completed: Dispatched ${res.dispatched_count} leads.`);
      setSelectedIds([]);
      await loadData();
      if (onLeadApproved) onLeadApproved();
    } catch (err) {
      console.error("Batch dispatch error:", err);
      alert("Batch dispatch error: " + err.message);
    } finally {
      setBatchLoading(false);
    }
  };

  const handleOpenReview = async (lead) => {
    setSelectedLead(lead);
    try {
      const data = await leadHunterService.getPitch(lead.id);
      setPitchData(data);
    } catch (err) {
      alert("Failed loading pitch: " + err.message);
    }
  };

  const handleApprove = async () => {
    if (!selectedLead || !pitchData) return;
    try {
      await leadHunterService.dispatchLead(
        selectedLead.id,
        selectedLead.email || "demo@example.com",
        pitchData.pitch.email_subject,
        pitchData.pitch.email_body,
        dryRun
      );

      await supabaseService.createLead({
        name: selectedLead.name,
        phone: selectedLead.phone || null,
        email: selectedLead.email || null,
        business_name: selectedLead.name,
        industry: selectedLead.category || selectedLead.industry || "General",
        lead_status: dryRun ? "Simulated Sent" : "Contacted",
        lead_score: selectedLead.score || 70,
        lead_source: "lead_hunter"
      });

      setSelectedLead(null);
      setPitchData(null);
      await loadData();
      if (onLeadApproved) onLeadApproved();
    } catch (err) {
      console.error("Dispatch error:", err);
      alert("Dispatch error: " + err.message);
    }
  };

  const handleReject = async (leadId) => {
    try {
      await leadHunterService.rejectLead(leadId);
      if (selectedLead?.id === leadId) {
        setSelectedLead(null);
        setPitchData(null);
      }
      await loadData();
    } catch (err) {
      alert("Reject error: " + err.message);
    }
  };

  return (
    <div style={{ padding: "24px", color: "#fff" }}>
      {/* Header Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: "700", margin: "0 0 4px 0" }}>AI Lead Hunter & Discovery</h2>
          <p style={{ margin: 0, color: "#9ca3af", fontSize: "13px" }}>
            Automated Prospect Scraping, Vulnerability Scoring & Drip Sequences
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#9ca3af", marginRight: "10px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
            />
            Dry Run Mode
          </label>
          <button
            onClick={handleRunFollowUps}
            disabled={followUpLoading}
            style={{
              background: "#6366f1",
              color: "#fff",
              border: "none",
              padding: "9px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: followUpLoading ? "not-allowed" : "pointer",
            }}
          >
            {followUpLoading ? "Checking Drips..." : "⚡ Run Follow-Up Cycle"}
          </button>
        </div>
      </div>

      {/* Discovery Form */}
      <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: "12px", padding: "20px", marginBottom: "24px" }}>
        <h4 style={{ margin: "0 0 14px 0", fontSize: "13px", color: "#9ca3af", fontWeight: "600" }}>
          SCRAPE GOOGLE MAPS LEADS
        </h4>
        <form onSubmit={handleDiscover} style={{ display: "flex", gap: "12px" }}>
      
          <input
            type="text"
            placeholder="Niche (e.g. Dentists)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-[#1e293b] border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 flex-1"
          />
          <input
            type="text"
            placeholder="City (e.g. Hyderabad)"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="bg-[#1e293b] border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 flex-1"
          />
          <input
            type="text"
            placeholder="Area / Pincode (e.g. Gachibowli / 500032)"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="bg-[#1e293b] border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 flex-1"
          />

          <button
            type="submit"
            disabled={loading}
            style={{ background: "#3b82f6", color: "#fff", border: "none", padding: "10px 24px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
          >
            {loading ? "Discovering..." : "Discover & Score"}
          </button>
        </form>
      </div>

      {/* Main Review Section */}
      <div style={{ display: "grid", gridTemplateColumns: selectedLead ? "1fr 1fr" : "1fr", gap: "24px", alignItems: "start" }}>
        <div>
          {/* List Controls & Batch Dispatch Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input
                type="checkbox"
                checked={pendingLeads.length > 0 && selectedIds.length === pendingLeads.length}
                onChange={toggleSelectAll}
                id="select-all"
                style={{ width: "16px", height: "16px", cursor: "pointer" }}
              />
              <label htmlFor="select-all" style={{ fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
                Pending Gateway Approvals ({pendingLeads.length})
              </label>
            </div>

            {selectedIds.length > 0 && (
              <button
                onClick={handleBatchDispatch}
                disabled={batchLoading}
                style={{
                  background: "#10b981",
                  color: "#fff",
                  border: "none",
                  padding: "7px 14px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                {batchLoading ? "Dispatching..." : `🚀 Dispatch Selected (${selectedIds.length})`}
              </button>
            )}
          </div>

          {pendingLeads.length === 0 ? (
            <div style={{ padding: "30px", textAlign: "center", background: "#111827", borderRadius: "12px", border: "1px solid #1f2937", color: "#6b7280" }}>
              No hot leads pending review.
            </div>
          ) : (
            pendingLeads.map((lead) => (
              <div
                key={lead.id}
                style={{
                  background: "#111827",
                  border: selectedIds.includes(lead.id) ? "1px solid #10b981" : selectedLead?.id === lead.id ? "1px solid #3b82f6" : "1px solid #1f2937",
                  borderRadius: "10px",
                  padding: "16px",
                  marginBottom: "12px",
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start"
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(lead.id)}
                  onChange={() => toggleSelectLead(lead.id)}
                  style={{ marginTop: "4px", width: "16px", height: "16px", cursor: "pointer" }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong>{lead.name}</strong>
                    <span style={{ color: "#ef4444", fontSize: "12px", background: "rgba(239,68,68,0.1)", padding: "2px 8px", borderRadius: "12px" }}>
                      Score: {lead.score} | {lead.tier}
                    </span>
                  </div>
                  <div style={{ fontSize: "13px", color: "#9ca3af", margin: "8px 0" }}>
                    📞 {lead.phone || "N/A"} &nbsp;|&nbsp; 🌐 {lead.website || "No Website"} &nbsp;|&nbsp; <span style={{ color: lead.email ? "#10b981" : "#6b7280" }}>✉️ {lead.email || "No Email"}</span>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => handleOpenReview(lead)}
                      style={{ background: "#2563eb", border: "none", color: "#fff", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}
                    >
                      Review Pitch & Demo
                    </button>
                    <button
                      onClick={() => handleReject(lead.id)}
                      style={{ background: "#374151", border: "none", color: "#d1d5db", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Outreach Review & Dispatch Form */}
        {selectedLead && pitchData && (
          <div style={{ background: "#111827", border: "1px solid #3b82f6", borderRadius: "12px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "18px", color: "#f8fafc" }}>
              Review Outreach: {selectedLead.name}
            </h3>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "#94a3b8", display: "block", marginBottom: "6px" }}>
              TARGET EMAIL
            </label>
            <input
              type="email"
              value={selectedLead.email || ""}
              onChange={(e) => setSelectedLead({ ...selectedLead, email: e.target.value })}
              placeholder="No email detected (will fallback to demo@example.com)"
              style={{ width: "100%", background: "#1f2937", border: "1px solid #374151", color: selectedLead.email ? "#10b981" : "#9ca3af", padding: "10px 12px", borderRadius: "8px", outline: "none" }}
            />
          </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#94a3b8", display: "block", marginBottom: "6px" }}>
                SUBJECT LINE
              </label>
              <input
                type="text"
                value={pitchData.pitch?.email_subject || ""}
                onChange={(e) => setPitchData({ ...pitchData, pitch: { ...pitchData.pitch, email_subject: e.target.value } })}
                style={{ width: "100%", background: "#1f2937", border: "1px solid #374151", color: "#fff", padding: "10px 12px", borderRadius: "8px", fontSize: "14px" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#94a3b8", display: "block", marginBottom: "6px" }}>
                EMAIL PITCH BODY
              </label>
              <textarea
                rows={9}
                value={pitchData.pitch?.email_body || ""}
                onChange={(e) => setPitchData({ ...pitchData, pitch: { ...pitchData.pitch, email_body: e.target.value } })}
                style={{ width: "100%", background: "#1f2937", border: "1px solid #374151", color: "#fff", padding: "12px", borderRadius: "8px", fontSize: "14px", lineHeight: "1.5" }}
              />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#94a3b8" }}>
                  LANDING PAGE CONCEPT PREVIEW
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const win = window.open("", "_blank");
                    win.document.write(pitchData.demo_html);
                    win.document.close();
                  }}
                  style={{ background: "transparent", border: "1px solid #3b82f6", color: "#60a5fa", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}
                >
                  ↗ Open Full Page in New Tab
                </button>
              </div>
              <iframe
                srcDoc={pitchData.demo_html}
                title="Landing Page Preview"
                style={{ width: "100%", height: "360px", border: "1px solid #374151", borderRadius: "8px", background: "#ffffff" }}
              />
            </div>

            <button
              onClick={handleApprove}
              style={{ width: "100%", background: "#10b981", color: "#fff", border: "none", padding: "14px", borderRadius: "8px", fontWeight: "bold", fontSize: "15px", cursor: "pointer" }}
            >
              Approve & Dispatch Outreach
            </button>
          </div>
        )}
      </div>
    </div>
  );
}