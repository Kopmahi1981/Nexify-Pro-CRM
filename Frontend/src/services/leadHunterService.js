const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "/api";

export const leadHunterService = {
  async getMetrics() {
    const res = await fetch(`${API_BASE}/metrics`);
    if (!res.ok) throw new Error("Failed to fetch metrics");
    return res.json();
  },

  async getLeads(status = "") {
    const url = status ? `${API_BASE}/leads?status=${status}` : `${API_BASE}/leads`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch leads");
    return res.json();
  },

  async discoverLeads(category, city, area = "") {
    const res = await fetch(`${API_BASE}/discover`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, city, area }),
    });
    if (!res.ok) throw new Error("Lead discovery failed");
    return res.json();
  },

  async getPitch(leadId) {
    const res = await fetch(`${API_BASE}/leads/${leadId}/pitch`);
    if (!res.ok) throw new Error("Failed to load pitch details");
    return res.json();
  },

  async dispatchLead(leadId, toEmail, subject, body, dryRun = true) {
    const res = await fetch(`${API_BASE}/leads/dispatch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lead_id: leadId,
        to_email: toEmail,
        subject,
        body,
        dry_run: dryRun,
      }),
    });
    if (!res.ok) throw new Error("Dispatch failed");
    return res.json();
  },

  async batchDispatchLeads(leadIds, dryRun = true) {
    const res = await fetch(`${API_BASE}/leads/batch-dispatch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lead_ids: leadIds,
        dry_run: dryRun,
      }),
    });
    if (!res.ok) throw new Error("Batch dispatch failed");
    return res.json();
  },

  async rejectLead(leadId) {
    const res = await fetch(`${API_BASE}/leads/${leadId}/reject`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Rejection failed");
    return res.json();
  },

  async triggerFollowUps(dryRun = true) {
    const res = await fetch(`${API_BASE}/followups/process?dry_run=${dryRun}`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to process follow-ups");
    return res.json();
  },

  async getFollowUpStatus() {
    const res = await fetch(`${API_BASE}/followups/status`);
    if (!res.ok) throw new Error("Failed to fetch follow-up status");
    return res.json();
  }
}; 