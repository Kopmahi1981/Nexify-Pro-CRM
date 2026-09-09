import re
from typing import Any, Dict, List, Optional
from urllib.parse import urljoin, urlparse

import requests
from serpapi import GoogleSearch
import urllib3

from config import SERP_API_KEY
from logger import logger
from models import Lead

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def extract_email_from_website(website_url: str, timeout: int = 5) -> Optional[str]:
    """Fetches the homepage and /contact page to extract an email address via regex."""
    if not website_url or not isinstance(website_url, str):
        return None

    if not website_url.startswith(("http://", "https://")):
        website_url = "https://" + website_url

    # Stricter pattern: TLD must be letters only (2-12 chars), no digits
    email_pattern = re.compile(
        r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,12}\b"
    )
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
    }

    # Common CDN/asset artifacts to reject
    ignored_keywords = [
        "bootstrap", "fontawesome", "jquery", "jsdelivr", "unpkg", 
        "wixpress", "sentry", "example.com", "schema.org", "@1.", "@2.", "@3."
    ]

    urls_to_try = [website_url]
    parsed = urlparse(website_url)
    base_domain = f"{parsed.scheme}://{parsed.netloc}"
    urls_to_try.append(urljoin(base_domain, "/contact"))
    urls_to_try.append(urljoin(base_domain, "/contact-us"))

    for url in urls_to_try:
        try:
            resp = requests.get(url, headers=headers, timeout=timeout, verify=False)
            if resp.status_code == 200:
                matches = email_pattern.findall(resp.text)
                for candidate in matches:
                    candidate_lower = candidate.lower()

                    # Filter out file extensions mistakenly captured
                    ext = candidate_lower.split(".")[-1]
                    if ext in ["png", "jpg", "jpeg", "webp", "gif", "svg", "css", "js", "woff", "ttf"]:
                        continue

                    # Filter out CDN / framework version tags
                    if any(kw in candidate_lower for kw in ignored_keywords):
                        continue

                    return candidate
        except Exception:
            continue

    return None

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
                email=extract_email_from_website(website),
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

