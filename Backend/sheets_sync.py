import os
from typing import List
import gspread
from config import GOOGLE_SHEET_ID, GOOGLE_SHEETS_CREDENTIALS
from logger import logger
from models import Lead

def sync_leads_to_sheets(leads: List[Lead], sheet_id: str = GOOGLE_SHEET_ID, creds = GOOGLE_SHEETS_CREDENTIALS) -> bool:
    """
    Pushes lead records (name, phone, website, score, tier, status) to a Google Sheet using gspread.
    Handles empty/missing credentials gracefully with log warnings.
    """
    if not leads:
        logger.info("No leads provided to sync to Google Sheets.")
        return True

    if not sheet_id or not creds:
        logger.warning("Google Sheets sync skipped: GOOGLE_SHEET_ID or GOOGLE_SHEETS_CREDENTIALS is not set.")
        return False

    try:
        if isinstance(creds, dict):
            gc = gspread.service_account_from_dict(creds)
        elif isinstance(creds, str) and os.path.exists(creds):
            gc = gspread.service_account(filename=creds)
        else:
            logger.warning("Google Sheets sync failed: Invalid credentials format or file path.")
            return False

        spreadsheet = gc.open_by_key(sheet_id)
        worksheet = spreadsheet.sheet1

        # Check if header row exists, if not initialize it
        existing_values = worksheet.get_all_values()
        headers = ["Name", "Phone", "Website", "Score", "Tier", "Status"]

        if not existing_values:
            worksheet.append_row(headers)

        rows_to_append = []
        for lead in leads:
            rows_to_append.append([
                lead.name or "",
                lead.phone or "",
                lead.website or "",
                lead.score if lead.score is not None else 0.0,
                lead.tier or "",
                lead.status or "NEW"
            ])

        worksheet.append_rows(rows_to_append)
        logger.info(f"Successfully synced {len(leads)} leads to Google Sheets (Sheet ID: {sheet_id}).")
        return True

    except Exception as e:
        logger.error(f"Error syncing leads to Google Sheets: {e}")
        return False
