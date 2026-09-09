from typing import Dict
from models import Lead
from config import SENDER_NAME
from logger import logger

DEMO_SHOWCASE_URL = "https://blueviolet-quail-799220.hostingersite.com/"
SENDER_PHONE = "9032917731"
SENDER_EMAIL = "support@nexifypro.in"
SENDER_ADDRESS = "Plot no 295 TNGO'S Colony, Kattedan, Rajendera Nagar (M)"

SIGNATURE = (
    f"Best regards,\n"
    f"{SENDER_NAME or 'Nexify Pro Team'}\n"
    f"📞 Phone: {SENDER_PHONE}\n"
    f"✉️ Email: {SENDER_EMAIL}\n"
    f"🏢 Address: {SENDER_ADDRESS}"
)

def generate_pitch(lead: Lead) -> Dict[str, str]:
    """
    Crafts targeted cold outreach copy (Email & WhatsApp) tailored to the lead's specific gap:
    - Missing website
    - Broken website
    - Social-only presence
    - General optimization
    """
    biz_name = lead.name or "your business"
    region = " across Hyderabad" if (lead.address and "Hyderabad" in lead.address) else ""

    # Determine primary gap
    if not lead.website or not lead.website.strip():
        gap_type = "missing_website"
    elif lead.is_website_broken:
        gap_type = "broken_website"
    elif lead.is_social_only:
        gap_type = "social_only"
    else:
        gap_type = "general"

    if gap_type == "missing_website":
        subject = f"Growth & Automated Patient Booking System for {biz_name}"
        email_body = (
            f"Hi {biz_name} Team,\n\n"
            f"I was researching local businesses{region} and noticed {biz_name} doesn't currently have an active website.\n\n"
            f"We specialize in complete digital acquisition systems for practices—including high-converting web portals, "
            f"24/7 automated appointment booking, targeted lead generation, and smart AI voice calling agents to confirm patient schedules and capture every inquiry.\n\n"
            f"We put together a live showcase illustrating how this automated client capture system functions:\n"
            f"👉 Live Demo Showcase: {DEMO_SHOWCASE_URL}\n\n"
            f"Would you be open to a quick 5-minute conversation this week to see how we could set this up for {biz_name}?\n\n"
            f"{SIGNATURE}"
        )
        whatsapp_body = (
            f"Hi {biz_name}! 👋 I noticed you don't have an active web portal yet.\n\n"
            f"We build automated growth systems—featuring 24/7 appointment booking, local lead generation, and AI voice calling agents to handle inquiries.\n\n"
            f"Check out our interactive demo: {DEMO_SHOWCASE_URL}\n"
            f"Would you like us to customize a concept like this for {biz_name}?\n\n"
            f"— {SENDER_NAME or 'Nexify Pro Team'} ({SENDER_PHONE})"
        )

    elif gap_type == "broken_website":
        subject = f"Quick heads-up regarding {biz_name}'s website"
        email_body = (
            f"Hi {biz_name} Team,\n\n"
            f"While reviewing businesses{region}, I tried visiting {lead.website} and noticed it appears offline or unreachable.\n\n"
            f"A broken site causes potential clients to turn directly to competitors. Beyond restoring your web presence, "
            f"we integrate modern lead generation funnels, instant appointment booking, and automated AI voice calling agents so you never miss an incoming patient inquiry.\n\n"
            f"You can explore our modern responsive system in action here:\n"
            f"👉 Live Demo Showcase: {DEMO_SHOWCASE_URL}\n\n"
            f"Would you be open to a brief chat to get {biz_name}'s digital presence fixed and automated?\n\n"
            f"{SIGNATURE}"
        )
        whatsapp_body = (
            f"Hi {biz_name}! ⚠️ Quick heads-up: your website ({lead.website}) seems down or unreachable.\n\n"
            f"We can restore it with automated appointment booking, lead capture, and AI voice agent support. "
            f"Preview our system demo here: {DEMO_SHOWCASE_URL}\n\n"
            f"— {SENDER_NAME or 'Nexify Pro Team'} ({SENDER_PHONE})"
        )

    elif gap_type == "social_only":
        subject = f"Upgrading {biz_name}'s patient funnel beyond social media"
        email_body = (
            f"Hi {biz_name} Team,\n\n"
            f"I came across {biz_name}'s profile and loved your work! However, relying solely on social media means missing high-intent searches on Google and manual scheduling bottlenecks.\n\n"
            f"We help businesses establish dedicated high-converting portals equipped with automated appointment booking, "
            f"inbound lead generation, and AI voice calling agents that follow up with leads and confirm bookings automatically.\n\n"
            f"Here is a live demo showing this system in action:\n"
            f"👉 Live Demo Showcase: {DEMO_SHOWCASE_URL}\n\n"
            f"Interested in seeing how we can tailor this for {biz_name}?\n\n"
            f"{SIGNATURE}"
        )
        whatsapp_body = (
            f"Hi {biz_name}! Loved your social profile! 🚀 Have you considered a dedicated conversion setup?\n\n"
            f"We set up automated lead generation, 24/7 appointment scheduling, and AI voice calling agents. "
            f"Check out our live showcase: {DEMO_SHOWCASE_URL}\n\n"
            f"— {SENDER_NAME or 'Nexify Pro Team'} ({SENDER_PHONE})"
        )

    else:  # general optimization
        subject = f"Growth & Automation opportunity for {biz_name}"
        email_body = (
            f"Hi {biz_name} Team,\n\n"
            f"I reviewed {biz_name}'s online presence and identified a few opportunities to significantly increase your monthly inquiry volume.\n\n"
            f"We specialize in automated lead generation, 24/7 online appointment booking systems, and AI voice calling agents that qualify prospects and confirm visits for businesses{region}.\n\n"
            f"Take a look at our live interactive showcase to see the conversion system in action:\n"
            f"👉 Live Demo Showcase: {DEMO_SHOWCASE_URL}\n\n"
            f"Would you be open to a brief 5-minute conversation this week to explore these ideas for {biz_name}?\n\n"
            f"{SIGNATURE}"
        )
        whatsapp_body = (
            f"Hi {biz_name}! 👋 We specialize in helping practices scale inbound inquiries using automated lead generation, 24/7 appointment booking, and AI voice calling agents.\n\n"
            f"Explore our interactive showcase here: {DEMO_SHOWCASE_URL}\n"
            f"Would you be open to a quick chat to discuss how this applies to {biz_name}?\n\n"
            f"— {SENDER_NAME or 'Nexify Pro Team'} ({SENDER_PHONE})"
        )

    logger.debug(f"Generated {gap_type} pitch for '{biz_name}'.")
    return {
        "email_subject": subject,
        "email_body": email_body,
        "whatsapp_body": whatsapp_body
    }