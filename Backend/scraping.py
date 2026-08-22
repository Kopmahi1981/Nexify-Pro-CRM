import re
from typing import List, Dict, Any, Optional
from serpapi import GoogleSearch
from config import SERP_API_KEY
from logger import logger
from models import Lead

def clean_phone_number(phone_raw: Optional[str]) -> Optional[str]:
    """Clean phone number string to keep digits only."""
    if not phone_raw:
        return None
    cleaned = re.sub(r"\D", "", str(phone_raw))
    return cleaned if cleaned else None

def fetch_google_maps_leads(category: str, city: str, api_key: str = SERP_API_KEY, num_results: int = 20) -> List[Lead]:
    """
    Queries Google Maps via SerpApi for a given category and city.
    Extracts name, phone, website, address, rating, and reviews count.
    Returns a list of Lead objects.
    """
    if not api_key:
        logger.error("SerpApi API key is missing. Cannot perform Google Maps search.")
        return []

    query_str = f"{category} in {city}"
    logger.info(f"Searching Google Maps for: '{query_str}'")

    params = {
        "engine": "google_maps",
        "q": query_str,
        "type": "search",
        "api_key": api_key
    }

    leads: List[Lead] = []

    try:
        search = GoogleSearch(params)
        results = search.get_dict()

        if "error" in results:
            logger.error(f"SerpApi returned error: {results['error']}")
            return []

        local_results = results.get("local_results", [])
        logger.info(f"Retrieved {len(local_results)} raw results from Google Maps.")

        for item in local_results:
            name = item.get("title") or item.get("name", "")
            if not name:
                continue

            raw_phone = item.get("phone")
            phone = clean_phone_number(raw_phone)

            website = item.get("website") or item.get("link") or None
            address = item.get("address") or None
            
            rating = item.get("rating")
            if rating is not None:
                try:
                    rating = float(rating)
                except (ValueError, TypeError):
                    rating = None

            reviews_count = item.get("reviews") or item.get("reviews_count") or item.get("user_ratings_total") or 0
            try:
                reviews_count = int(reviews_count)
            except (ValueError, TypeError):
                reviews_count = 0

            lead = Lead(
                name=name,
                phone=phone,
                website=website,
                address=address,
                email=None,
                rating=rating,
                reviews_count=reviews_count,
                status="NEW"
            )
            leads.append(lead)

    except Exception as e:
        logger.error(f"Exception while scraping Google Maps leads: {e}")

    return leads

# Alias for backward/blueprint compatibility
scrape_leads = fetch_google_maps_leads

