from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import sheets_sync
import database
import scraping
import website_checker
import scoring
import personalization
import landing_page
import dispatcher
import follow_up
from typing import List
from models import Lead

app = FastAPI(title="AI Lead Hunter API")

# Allow requests from your React / Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

database.init_db()

class DiscoveryRequest(BaseModel):
    category: str
    city: str

class DispatchRequest(BaseModel):
    lead_id: int
    to_email: str
    subject: str
    body: str
    dry_run: bool = True

@app.get("/api/metrics")
def get_metrics():
    return database.get_lead_metrics()

@app.get("/api/leads")
def get_leads(status: Optional[str] = None):
    if status:
        leads = database.get_leads_by_status(status)
    else:
        with database.get_connection() as conn:
            leads = [Lead(**dict(r)) for r in conn.execute("SELECT * FROM leads ORDER BY id DESC").fetchall()]
    return [l.model_dump() for l in leads]

@app.post("/api/discover")
def run_discovery(req: DiscoveryRequest):
    raw_leads = scraping.scrape_leads(req.category, req.city)
    processed_count = 0
    saved_leads = []
    
    for item in raw_leads:
        lead = item if isinstance(item, Lead) else Lead(**item)
        lead = website_checker.analyze_lead_website(lead)
        score, tier = scoring.calculate_lead_score(lead)
        lead.score = score
        lead.tier = tier
        lead.status = "PENDING_REVIEW" if tier == "HOT" else "NEW"
        if database.insert_lead(lead):
            processed_count += 1
            saved_leads.append(lead)

    # Sync discovered leads to Google Sheets
    if saved_leads:
        sheets_sync.sync_leads_to_sheets(saved_leads)

    return {"status": "success", "added_leads": processed_count}

@app.get("/api/leads/{lead_id}/pitch")
def get_pitch(lead_id: int):
    with database.get_connection() as conn:
        row = conn.execute("SELECT * FROM leads WHERE id = ?", (lead_id,)).fetchone()
        if not row:
            return {"error": "Lead not found"}
        lead = Lead(**dict(row))
        pitch = personalization.generate_pitch(lead)
        demo_html = landing_page.generate_demo_html(lead.name, lead.phone or "")
        return {"pitch": pitch, "demo_html": demo_html, "lead": lead.model_dump()}

@app.post("/api/leads/dispatch")
def dispatch_lead(req: DispatchRequest):
    success = dispatcher.send_cold_email(req.to_email, req.subject, req.body, dry_run=req.dry_run)
    if success:
        status = "SIMULATED_SENT" if req.dry_run else "CONTACTED"
        database.update_lead_status(req.lead_id, status)
        
        # Sync updated status to Google Sheets
        with database.get_connection() as conn:
            row = conn.execute("SELECT * FROM leads WHERE id = ?", (req.lead_id,)).fetchone()
            if row:
                lead = Lead(**dict(row))
                sheets_sync.sync_leads_to_sheets([lead])

        return {"status": "dispatched", "lead_id": req.lead_id, "lead_status": status}
    return {"status": "failed", "lead_id": req.lead_id}

@app.post("/api/leads/{lead_id}/reject")
def reject_lead(lead_id: int):
    database.update_lead_status(lead_id, "REJECTED")
    return {"status": "rejected", "lead_id": lead_id}

@app.post("/api/followups/process")
def trigger_followup_cycle(dry_run: bool = True):
    """Triggers a scan and dispatches Day 3, 7, and 10 follow-ups."""
    count = follow_up.process_follow_ups(dry_run=dry_run)
    return {"status": "success", "processed_count": count}

@app.get("/api/followups/status")
def get_followup_overview():
    """Returns counts of leads currently in follow-up sequences."""
    with database.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT status, COUNT(*) as count 
            FROM leads 
            WHERE status IN ('CONTACTED', 'FOLLOW_UP_DAY_3', 'FOLLOW_UP_DAY_7', 'FOLLOW_UP_DAY_10')
            GROUP BY status
        """)
        counts = {row["status"]: row["count"] for row in cursor.fetchall()}
    return {"follow_up_pipeline": counts}

class BatchDispatchRequest(BaseModel):
    lead_ids: List[int]
    dry_run: bool = True

@app.post("/api/leads/batch-dispatch")
def batch_dispatch_leads(req: BatchDispatchRequest):
    dispatched_count = 0
    synced_leads = []

    for lead_id in req.lead_ids:
        lead = database.get_lead(lead_id)
        if not lead:
            continue

        pitch = personalization.generate_pitch(lead)
        email_to = lead.email or "demo@example.com"
        
        success = dispatcher.send_cold_email(
            to_email=email_to,
            subject=pitch.get("email_subject", f"Outreach for {lead.name}"),
            body=pitch.get("email_body", ""),
            dry_run=req.dry_run
        )

        if success or req.dry_run:
            status = "SIMULATED_SENT" if req.dry_run else "CONTACTED"
            database.update_lead_status(lead_id, status)
            lead.status = status
            synced_leads.append(lead)
            dispatched_count += 1

    if synced_leads:
        sheets_sync.sync_leads_to_sheets(synced_leads)

    return {"status": "success", "dispatched_count": dispatched_count}