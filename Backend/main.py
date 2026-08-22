import streamlit as st
import streamlit.components.v1 as components

import database
import scraping
import website_checker
import scoring
import sheets_sync
import personalization
import landing_page
import dispatcher
import follow_up
from models import Lead
from logger import logger

# -------------------------------------------------------------------
# 1. Page Layout & Initialization
# -------------------------------------------------------------------
st.set_page_config(
    page_title="AI Lead Hunter Orchestrator",
    page_icon="🎯",
    layout="wide"
)

# Initialize database schema
database.init_db()

st.title("🎯 AI Lead Hunter Orchestrator")
st.caption("Master Orchestrator and Human-in-the-Loop Gateway for Autonomous Lead Discovery & Outreach")

# Sidebar Metrics
st.sidebar.header("📊 Global Pipeline Metrics")
metrics = database.get_lead_metrics()

st.sidebar.metric("Scraped Leads", metrics["total"])
st.sidebar.metric("Hot Leads (🔥)", metrics["hot"])
st.sidebar.metric("Pending Approvals (⏳)", metrics["pending"])
st.sidebar.metric("Dispatched Leads (🚀)", metrics["dispatched"])

st.sidebar.markdown("---")
st.sidebar.header("⚙️ Campaign & Outreach Controls")

dry_run_mode = st.sidebar.checkbox(
    "Dry Run Mode (Simulate Email)",
    value=True,
    help="When enabled, email dispatch logs actions without opening SMTP connections."
)

if st.sidebar.button("▶ Run Follow-Up Campaign", use_container_width=True):
    with st.spinner("Processing follow-up queue..."):
        count = follow_up.process_follow_ups(dry_run=dry_run_mode)
        st.sidebar.success(f"Follow-up scan completed: {count} leads processed!")
        st.rerun()

# -------------------------------------------------------------------
# Main Tabs Navigation
# -------------------------------------------------------------------
tab_discovery, tab_gateway, tab_database = st.tabs([
    "🔍 1. Discovery & Qualification",
    "✋ 2. Human-in-the-Loop Gateway",
    "📊 3. Lead Repository & Database"
])

# -------------------------------------------------------------------
# 2. Lead Discovery Section (Steps 2 - 5)
# -------------------------------------------------------------------
with tab_discovery:
    st.header("Search & Qualification Pipeline")
    st.markdown("Query Google Maps for local business listings, check website health, score leads, and identify high-opportunity targets.")

    col1, col2 = st.columns(2)
    category_input = col1.text_input("Business Category / Niche", value="Plumber", help="e.g. Plumber, Dentist, Roofing, HVAC")
    city_input = col2.text_input("City & State / Region", value="Austin, TX", help="e.g. Austin, TX or Miami, FL")

    if st.button("🚀 Run Discovery & Qualification Pipeline", type="primary", use_container_width=True):
        if not category_input or not city_input:
            st.error("Please specify both a category and a city.")
        else:
            with st.spinner(f"Scraping listings for '{category_input}' in '{city_input}'..."):
                raw_leads = scraping.scrape_leads(category_input, city_input)

            if not raw_leads:
                st.warning("No listings were retrieved. Check your SerpApi key or search terms.")
            else:
                st.info(f"Retrieved {len(raw_leads)} raw listings. Running website checks and scoring...")

                processed_leads = []
                progress_bar = st.progress(0)

                for idx, lead in enumerate(raw_leads):
                    # Step 3: Website validity & social checks
                    lead = website_checker.analyze_lead_website(lead)
                    
                    # Step 4: Calculate score & tier
                    score, tier = scoring.calculate_lead_score(lead)
                    
                    # Step 5: Route HOT leads to PENDING_REVIEW, WARM/LOW to NEW
                    if tier == "HOT":
                        lead.status = "PENDING_REVIEW"
                    else:
                        lead.status = "NEW"

                    # Save lead to SQLite
                    database.insert_lead(lead)
                    processed_leads.append(lead)

                    progress_bar.progress((idx + 1) / len(raw_leads))

                # Step 5: Sync to Google Sheets
                sheets_sync.sync_leads_to_sheets(processed_leads)

                st.success(f"Pipeline completed! Saved and synced {len(processed_leads)} leads.")
                st.rerun()

# -------------------------------------------------------------------
# 3. Human-in-the-Loop Gateway Section (Step 9)
# -------------------------------------------------------------------
with tab_gateway:
    st.header("Human-in-the-Loop Review & Dispatch Gateway")
    st.markdown("Review high-scoring (**HOT**) leads flagged for outreach. Customize copy, preview custom landing pages, and approve or reject outreach.")

    pending_leads = database.get_leads_by_status("PENDING_REVIEW")

    if not pending_leads:
        st.info("🎉 No leads currently pending review! Run the discovery pipeline to find new HOT leads.")
    else:
        st.write(f"Displaying **{len(pending_leads)}** leads awaiting approval:")

        for lead in pending_leads:
            expander_title = f"🔥 {lead.name} | Score: {lead.score} ({lead.tier}) | {lead.address or 'No Address'}"
            
            with st.expander(expander_title, expanded=True):
                info_col1, info_col2, info_col3 = st.columns([2, 2, 2])

                with info_col1:
                    st.markdown(f"**Phone:** {lead.phone or 'N/A'}")
                    st.markdown(f"**Website:** [{lead.website}]({lead.website})" if lead.website else "**Website:** *None (Missing)*")
                    recipient_email = st.text_input(
                        "Recipient Email",
                        value=lead.email or "",
                        key=f"email_input_{lead.id}",
                        placeholder="e.g. contact@business.com"
                    )

                with info_col2:
                    st.markdown(f"**Rating:** {lead.rating or 'N/A'} ⭐ ({lead.reviews_count or 0} reviews)")
                    st.markdown(f"**Social Only:** {'YES 📱' if lead.is_social_only else 'No'}")
                    st.markdown(f"**Website Broken:** {'YES ⚠️' if lead.is_website_broken else 'No'}")

                with info_col3:
                    st.markdown(f"**Lead ID:** `{lead.id}`")
                    st.markdown(f"**Status:** `{lead.status}`")
                    st.markdown(f"**Tier:** `{lead.tier}`")

                st.markdown("---")
                st.subheader("Personalized Outreach Copy")

                # Generate personalized pitch recommendations
                pitch = personalization.generate_pitch(lead)

                email_subject = st.text_input(
                    "Email Subject",
                    value=pitch["email_subject"],
                    key=f"subj_{lead.id}"
                )
                
                email_body = st.text_area(
                    "Email Body",
                    value=pitch["email_body"],
                    height=180,
                    key=f"body_{lead.id}"
                )

                whatsapp_body = st.text_area(
                    "WhatsApp Message Copy",
                    value=pitch["whatsapp_body"],
                    height=80,
                    key=f"wa_{lead.id}"
                )

                # Landing Page Demo Preview
                st.markdown("---")
                if st.checkbox("🌐 Preview Custom Landing Page Prototype", key=f"preview_chk_{lead.id}"):
                    st.caption("Live responsive demo preview generated for this prospect:")
                    demo_html = landing_page.generate_demo_html(lead.name, lead.phone or "")
                    components.html(demo_html, height=350, scrolling=True)

                # Action Buttons
                st.markdown("---")
                btn_col1, btn_col2 = st.columns([1, 1])

                with btn_col1:
                    if st.button("✅ Approve & Dispatch Outreach", key=f"approve_btn_{lead.id}", type="primary", use_container_width=True):
                        # Save updated email if user provided one
                        if recipient_email != lead.email:
                            database.update_lead_email(lead.id, recipient_email)

                        # Dispatch email
                        target_email = recipient_email.strip() or "client@example.com"
                        dispatch_success = dispatcher.send_cold_email(
                            to_email=target_email,
                            subject=email_subject,
                            body=email_body,
                            dry_run=dry_run_mode
                        )

                        if dispatch_success:
                            database.update_lead_status(lead.id, "CONTACTED")
                            st.success(f"Outreach dispatched for '{lead.name}'! Status updated to CONTACTED.")
                            st.rerun()
                        else:
                            st.error("Failed to dispatch email. Check logs or SMTP settings.")

                with btn_col2:
                    if st.button("❌ Reject Lead", key=f"reject_btn_{lead.id}", use_container_width=True):
                        database.update_lead_status(lead.id, "REJECTED")
                        st.warning(f"Lead '{lead.name}' rejected.")
                        st.rerun()

# -------------------------------------------------------------------
# 4. Lead Repository & Database View Section
# -------------------------------------------------------------------
with tab_database:
    st.header("Lead Database & Repository")
    
    all_leads = database.get_all_leads()

    if not all_leads:
        st.info("No leads currently in database.")
    else:
        filter_col1, filter_col2 = st.columns(2)
        status_filter = filter_col1.selectbox("Filter by Status", ["ALL"] + list(set(l.status for l in all_leads)))
        tier_filter = filter_col2.selectbox("Filter by Tier", ["ALL", "HOT", "WARM", "LOW"])

        filtered_leads = all_leads
        if status_filter != "ALL":
            filtered_leads = [l for l in filtered_leads if l.status == status_filter]
        if tier_filter != "ALL":
            filtered_leads = [l for l in filtered_leads if l.tier == tier_filter]

        st.write(f"Showing **{len(filtered_leads)}** / **{len(all_leads)}** total records:")

        table_data = []
        for l in filtered_leads:
            table_data.append({
                "ID": l.id,
                "Name": l.name,
                "Phone": l.phone or "",
                "Website": l.website or "",
                "Email": l.email or "",
                "Score": l.score,
                "Tier": l.tier,
                "Status": l.status,
                "Social Only": "Yes" if l.is_social_only else "No",
                "Broken Site": "Yes" if l.is_website_broken else "No",
                "Rating": l.rating or "",
                "Reviews": l.reviews_count or 0,
            })

        st.dataframe(table_data, use_container_width=True)
