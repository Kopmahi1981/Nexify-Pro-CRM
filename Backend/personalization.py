from typing import Dict
from models import Lead
from config import SENDER_NAME
from logger import logger

def generate_pitch(lead: Lead) -> Dict[str, str]:
    """
    Crafts targeted cold outreach copy (Email & WhatsApp) tailored to the lead's specific gap:
    - Missing website
    - Broken website
    - Social-only presence
    - General optimization
    
    Returns dict with keys: 'email_subject', 'email_body', 'whatsapp_body'
    """
    sender_name = SENDER_NAME or "Our Team"
    biz_name = lead.name or "your business"
    city_addr = f" in {lead.address}" if lead.address else ""

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
        subject = f"Website concept for {biz_name}"
        email_body = (
            f"Hi {biz_name} Team,\n\n"
            f"I was searching for local businesses{city_addr} and noticed {biz_name} doesn't currently have an active website. "
            f"In today's market, over 70% of local customers check a company's website before calling or visiting.\n\n"
            f"We put together a custom, high-converting website prototype specifically designed for {biz_name} to help capture more local leads.\n\n"
            f"Would you be open to taking a quick 2-minute look at the preview?\n\n"
            f"Best regards,\n{sender_name}"
        )
        whatsapp_body = (
            f"Hi {biz_name}! 👋 I noticed you don't have an active website yet. "
            f"We built a free custom website demo for {biz_name} to show how you can capture more local leads. "
            f"Would you like me to send over the preview link?"
        )

    elif gap_type == "broken_website":
        subject = f"Quick heads-up regarding {biz_name}'s website"
        email_body = (
            f"Hi {biz_name} Team,\n\n"
            f"While researching businesses{city_addr}, I tried visiting {lead.website} and noticed it appears to be offline or returning an error.\n\n"
            f"A broken website causes potential clients to bounce directly to competitors. "
            f"We can help quickly fix or modernize your web presence so you never lose a potential lead.\n\n"
            f"Would you like us to send a quick video break-down or a updated responsive template for {biz_name}?\n\n"
            f"Best regards,\n{sender_name}"
        )
        whatsapp_body = (
            f"Hi {biz_name}! ⚠️ Quick heads-up: your website ({lead.website}) seems to be down or unreachable. "
            f"We can help get it restored or upgraded quickly. Let me know if you'd like us to take a look!"
        )

    elif gap_type == "social_only":
        subject = f"Upgrading {biz_name}'s online presence beyond social media"
        email_body = (
            f"Hi {biz_name} Team,\n\n"
            f"I came across {biz_name}'s social profile and loved your work! However, relying solely on social media means missing out on customers searching directly on Google.\n\n"
            f"A dedicated website gives {biz_name} full ownership of your customer funnel and boosts your Google Maps search ranking.\n\n"
            f"We created a custom website draft tailored for {biz_name}. Interested in seeing a quick preview?\n\n"
            f"Best regards,\n{sender_name}"
        )
        whatsapp_body = (
            f"Hi {biz_name}! Loved your social profile! 🚀 Have you considered adding a dedicated website to capture Google searches? "
            f"We created a quick demo for {biz_name}. Mind if I share the preview link?"
        )

    else: # general optimization
        subject = f"Growth opportunity for {biz_name}"
        email_body = (
            f"Hi {biz_name} Team,\n\n"
            f"I reviewed {biz_name}'s online setup and identified a few quick optimization opportunities that could increase your inbound lead volume.\n\n"
            f"We specialize in automated lead capture and high-converting landing pages for businesses{city_addr}.\n\n"
            f"Would you be open to a brief conversation this week to explore these ideas?\n\n"
            f"Best regards,\n{sender_name}"
        )
        whatsapp_body = (
            f"Hi {biz_name}! 👋 We specialize in helping local businesses increase inbound inquiries. "
            f"We have a few ideas to boost lead conversion for {biz_name}. Would you be open to a quick chat?"
        )

    logger.debug(f"Generated {gap_type} pitch for '{biz_name}'.")
    return {
        "email_subject": subject,
        "email_body": email_body,
        "whatsapp_body": whatsapp_body
    }
