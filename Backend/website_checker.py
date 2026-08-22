import urllib.parse
import requests
from typing import Tuple
from logger import logger
from models import Lead

SOCIAL_DOMAINS = {
    "facebook.com", "fb.com", "instagram.com", "linkedin.com",
    "yelp.com", "twitter.com", "x.com", "tiktok.com",
    "pinterest.com", "youtube.com"
}

DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/115.0.0.0 Safari/537.36"
    )
}

def is_social_media_url(url: str) -> bool:
    """Check if the given URL belongs to a social media domain."""
    if not url:
        return False
    
    parsed = urllib.parse.urlparse(url if url.startswith(("http://", "https://")) else f"http://{url}")
    netloc = parsed.netloc.lower()
    
    # Strip 'www.' prefix if present
    if netloc.startswith("www."):
        netloc = netloc[4:]
        
    return any(domain in netloc for domain in SOCIAL_DOMAINS)

def is_website_broken(url: str, timeout: int = 5) -> bool:
    """
    Ping website using requests.head (falling back to get if 405/403).
    Returns True if unreachable or returning HTTP >= 400, else False.
    """
    if not url:
        return False

    formatted_url = url if url.startswith(("http://", "https://")) else f"http://{url}"

    try:
        response = requests.head(formatted_url, timeout=timeout, allow_redirects=True, headers=DEFAULT_HEADERS)
        # If method not allowed or forbidden for HEAD, fallback to GET (streaming body to save bandwidth)
        if response.status_code in (403, 405):
            response = requests.get(formatted_url, timeout=timeout, allow_redirects=True, stream=True, headers=DEFAULT_HEADERS)
        
        if response.status_code >= 400:
            logger.debug(f"Website '{url}' returned status code {response.status_code}.")
            return True
        return False

    except (requests.RequestException, Exception) as e:
        logger.debug(f"Website '{url}' check failed with error: {e}")
        return True

def analyze_lead_website(lead: Lead, timeout: int = 5) -> Lead:
    """
    Analyzes lead's website to set is_social_only and is_website_broken flags on the Lead model.
    """
    if not lead.website or not lead.website.strip():
        lead.is_social_only = False
        lead.is_website_broken = False
        return lead

    # Check social media
    lead.is_social_only = is_social_media_url(lead.website)

    # Check if website is broken
    lead.is_website_broken = is_website_broken(lead.website, timeout=timeout)

    return lead
