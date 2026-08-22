import os
import json
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

SERP_API_KEY = os.getenv("SERP_API_KEY", "")
GOOGLE_SHEET_ID = os.getenv("GOOGLE_SHEET_ID", "")

# Parse GOOGLE_SHEETS_CREDENTIALS if available as JSON string or file path
raw_creds = os.getenv("GOOGLE_SHEETS_CREDENTIALS", "")
GOOGLE_SHEETS_CREDENTIALS = None

if raw_creds:
    try:
        GOOGLE_SHEETS_CREDENTIALS = json.loads(raw_creds)
    except json.JSONDecodeError:
        if os.path.exists(raw_creds):
            try:
                with open(raw_creds, "r", encoding="utf-8") as f:
                    GOOGLE_SHEETS_CREDENTIALS = json.load(f)
            except Exception:
                GOOGLE_SHEETS_CREDENTIALS = raw_creds
        else:
            GOOGLE_SHEETS_CREDENTIALS = raw_creds

SENDER_EMAIL = os.getenv("SENDER_EMAIL", "")
SENDER_NAME = os.getenv("SENDER_NAME", "")
GMAIL_SMTP_APP_PASSWORD = os.getenv("GMAIL_SMTP_APP_PASSWORD", "")
WHATSAPP_TOKEN = os.getenv("WHATSAPP_TOKEN", "")

DB_PATH = os.getenv("DB_PATH", "leads.db")
