from typing import Tuple, Dict, Any, Union
from models import Lead
from logger import logger

def calculate_lead_score(lead_data: Union[Lead, Dict[str, Any]]) -> Tuple[float, str]:
    """
    Calculate lead score and tier strictly following the rules:
    - +20 for phone, website, address (each present)
    - +15 for email, reviews_count >= 10 (each)
    - +10 for rating present
    - Opportunity triggers: +40 if no website, +35 if broken website, +30 if social media only
    - Tiers: score >= 70 is 'HOT', 45-69 is 'WARM', <45 is 'LOW'.
    
    Updates the score and tier attributes if lead_data is a Lead instance or dictionary.
    Returns tuple: (score, tier)
    """
    if isinstance(lead_data, Lead):
        data = lead_data.model_dump()
    elif isinstance(lead_data, dict):
        data = lead_data
    else:
        logger.error(f"Invalid lead_data type for scoring: {type(lead_data)}")
        return 0.0, "LOW"

    score = 0.0

    # Data Completeness Points
    phone = data.get("phone")
    if phone and str(phone).strip():
        score += 20.0

    website = data.get("website")
    has_website = bool(website and str(website).strip())
    if has_website:
        score += 20.0

    address = data.get("address")
    if address and str(address).strip():
        score += 20.0

    email = data.get("email")
    if email and str(email).strip():
        score += 15.0

    reviews_count = data.get("reviews_count") or 0
    if isinstance(reviews_count, (int, float)) and reviews_count >= 10:
        score += 15.0

    rating = data.get("rating")
    if rating is not None and float(rating) > 0:
        score += 10.0

    # Opportunity Triggers
    if not has_website:
        score += 40.0

    if data.get("is_website_broken"):
        score += 35.0

    if data.get("is_social_only"):
        score += 30.0

    # Tier Classification
    if score >= 70.0:
        tier = "HOT"
    elif score >= 45.0:
        tier = "WARM"
    else:
        tier = "LOW"

    # Update input object if applicable
    if isinstance(lead_data, Lead):
        lead_data.score = score
        lead_data.tier = tier
    elif isinstance(lead_data, dict):
        lead_data["score"] = score
        lead_data["tier"] = tier

    return score, tier
