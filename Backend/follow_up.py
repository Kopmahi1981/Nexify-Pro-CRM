import time
from datetime import datetime, timedelta
from typing import List, Dict, Any
from config import DB_PATH
from logger import logger
from database import get_connection, update_lead_status
from models import Lead
from dispatcher import send_cold_email
from personalization import generate_pitch

FOLLOW_UP_SCHEDULE = {
    3: {"next_status": "FOLLOW_UP_DAY_3", "subject_prefix": "Re: "},
    7: {"next_status": "FOLLOW_UP_DAY_7", "subject_prefix": "Following up: "},
    10: {"next_status": "FOLLOW_UP_DAY_10", "subject_prefix": "Final check-in: "}
}

def get_follow_up_copy(lead_name: str, day: int) -> Dict[str, str]:
    """Generates sequential follow-up copy tailored for Day 3, Day 7, and Day 10."""
    biz = lead_name or "there"

    if day == 3:
        return {
            "subject": f"Re: Quick question regarding {biz}",
            "body": (
                f"Hi {biz} Team,\n\n"
                f"I wanted to follow up on my email from a few days ago regarding your web presence. "
                f"Did you get a chance to review the website preview idea?\n\n"
                f"Happy to answer any questions or share a quick live demo.\n\n"
                f"Best regards,\nOur Team"
            )
        }
    elif day == 7:
        return {
            "subject": f"Following up: Website prototype for {biz}",
            "body": (
                f"Hi {biz} Team,\n\n"
                f"Checking in once more to see if improving your local search visibility and online conversions is currently on your radar for this quarter.\n\n"
                f"We can quickly customize a responsive design for {biz} with zero friction.\n\n"
                f"Let me know if you'd like more details!\n\n"
                f"Best regards,\nOur Team"
            )
        }
    else:  # Day 10
        return {
            "subject": f"Final check-in regarding {biz}",
            "body": (
                f"Hi {biz} Team,\n\n"
                f"I haven't heard back, so I'll assume upgrading your website or digital lead capture isn't a priority right now.\n\n"
                f"If things change in the future, feel free to reach out anytime. Wish you and {biz} continued success!\n\n"
                f"Best regards,\nOur Team"
            )
        }

def process_follow_ups(db_path: str = DB_PATH, dry_run: bool = True) -> int:
    """
    Checks the database for leads in 'CONTACTED', 'FOLLOW_UP_DAY_3', or 'FOLLOW_UP_DAY_7' status.
    Calculates elapsed days and dispatches sequential follow-up emails for Day 3, 7, and 10.
    Returns the count of follow-ups processed.
    """
    logger.info(f"Scanning database '{db_path}' for follow-up candidates (dry_run={dry_run})...")
    processed_count = 0

    with get_connection(db_path) as conn:
        cursor = conn.cursor()
        # Query leads that have been contacted but not completed or unsubscribed
        cursor.execute("""
            SELECT * FROM leads 
            WHERE status IN ('CONTACTED', 'OUTREACH_SENT', 'FOLLOW_UP_DAY_3', 'FOLLOW_UP_DAY_7')
        """)
        rows = cursor.fetchall()

    now = datetime.now()

    for row in rows:
        lead_dict = dict(row)
        lead_id = lead_dict["id"]
        lead_name = lead_dict["name"]
        email = lead_dict.get("email")
        status = lead_dict.get("status")
        updated_at_str = lead_dict.get("updated_at")

        if not updated_at_str:
            continue

        try:
            # Parse timestamp (SQLite format: YYYY-MM-DD HH:MM:SS)
            last_updated = datetime.strptime(updated_at_str.split(".")[0], "%Y-%m-%d %H:%M:%S")
        except ValueError:
            continue

        days_elapsed = (now - last_updated).days

        target_day = None
        if status in ("CONTACTED", "OUTREACH_SENT") and days_elapsed >= 3:
            target_day = 3
        elif status == "FOLLOW_UP_DAY_3" and days_elapsed >= 4:  # 3 + 4 = 7 days total
            target_day = 7
        elif status == "FOLLOW_UP_DAY_7" and days_elapsed >= 3:  # 7 + 3 = 10 days total
            target_day = 10

        if target_day:
            follow_up_info = FOLLOW_UP_SCHEDULE[target_day]
            copy = get_follow_up_copy(lead_name, target_day)
            
            if email:
                sent = send_cold_email(
                    to_email=email,
                    subject=copy["subject"],
                    body=copy["body"],
                    dry_run=dry_run
                )
            else:
                logger.info(f"[DRY RUN / NO EMAIL] Follow-up Day {target_day} logged for lead '{lead_name}' (No email address).")
                sent = True

            if sent:
                next_status = follow_up_info["next_status"]
                update_lead_status(lead_id, next_status, db_path)
                processed_count += 1
                logger.info(f"Lead ID {lead_id} ('{lead_name}') updated to status '{next_status}'.")

    logger.info(f"Follow-up scan completed. Processed {processed_count} follow-ups.")
    return processed_count

def run_follow_up_daemon(interval_seconds: int = 86400, db_path: str = DB_PATH, dry_run: bool = True):
    """
    Daemon loop that runs sequential follow-up checks periodically.
    Default interval is 24 hours (86400 seconds).
    """
    logger.info(f"Starting follow-up daemon with {interval_seconds}s interval (dry_run={dry_run})...")
    while True:
        try:
            process_follow_ups(db_path=db_path, dry_run=dry_run)
        except Exception as e:
            logger.error(f"Error in follow-up daemon: {e}")
        time.sleep(interval_seconds)
