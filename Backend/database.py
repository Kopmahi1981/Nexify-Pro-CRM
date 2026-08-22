import sqlite3
from contextlib import contextmanager
from typing import List, Optional
from config import DB_PATH
from logger import logger
from models import Lead

@contextmanager
def get_connection(db_path: str = DB_PATH):
    """Context manager for SQLite database connection."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"Database transaction error: {e}")
        raise e
    finally:
        conn.close()

def init_db(db_path: str = DB_PATH) -> None:
    """Initialize SQLite database schema with a leads table unique on (name, address)."""
    with get_connection(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS leads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT,
                website TEXT,
                address TEXT,
                email TEXT,
                rating REAL,
                reviews_count INTEGER DEFAULT 0,
                is_website_broken BOOLEAN DEFAULT 0,
                is_social_only BOOLEAN DEFAULT 0,
                score REAL DEFAULT 0.0,
                tier TEXT,
                status TEXT DEFAULT 'NEW',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(name, address)
            );
        """)
        logger.info(f"Database initialized at '{db_path}'.")

def insert_lead(lead: Lead, db_path: str = DB_PATH) -> Optional[int]:
    """
    Inserts a Lead model into the database.
    If a lead with the same (name, address) exists, ignores insertion and returns the existing lead ID.
    Returns the lead ID.
    """
    with get_connection(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR IGNORE INTO leads (
                name, phone, website, address, email,
                rating, reviews_count, is_website_broken,
                is_social_only, score, tier, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            lead.name,
            lead.phone,
            lead.website,
            lead.address,
            lead.email,
            lead.rating,
            lead.reviews_count,
            1 if lead.is_website_broken else 0,
            1 if lead.is_social_only else 0,
            lead.score,
            lead.tier,
            lead.status
        ))
        
        lead_id = cursor.lastrowid
        if lead_id is None or lead_id == 0:
            # If IGNORE triggered, retrieve the existing lead ID
            cursor.execute("SELECT id FROM leads WHERE name = ? AND address IS ?", (lead.name, lead.address))
            row = cursor.fetchone()
            if row:
                lead_id = row["id"]
        
        logger.debug(f"Inserted/Retrieved lead ID {lead_id} for '{lead.name}'.")
        return lead_id

def get_leads_by_status(status: str, db_path: str = DB_PATH) -> List[Lead]:
    """Retrieve all leads matching a given status as a list of Lead objects."""
    with get_connection(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM leads WHERE status = ?", (status,))
        rows = cursor.fetchall()
        leads = []
        for row in rows:
            lead_dict = dict(row)
            # Convert boolean integer fields back to bool
            lead_dict["is_website_broken"] = bool(lead_dict.get("is_website_broken"))
            lead_dict["is_social_only"] = bool(lead_dict.get("is_social_only"))
            leads.append(Lead(**lead_dict))
        return leads

def update_lead_status(lead_id: int, status: str, db_path: str = DB_PATH) -> bool:
    """Update the status of a lead by ID. Returns True if updated successfully."""
    with get_connection(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE leads
            SET status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (status, lead_id))
        updated = cursor.rowcount > 0
        if updated:
            logger.info(f"Updated lead ID {lead_id} status to '{status}'.")
        else:
            logger.warning(f"Failed to update lead ID {lead_id}: lead not found.")
        return updated

def get_all_leads(db_path: str = DB_PATH) -> List[Lead]:
    """Retrieve all leads from the database."""
    with get_connection(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM leads ORDER BY score DESC, id DESC")
        rows = cursor.fetchall()
        leads = []
        for row in rows:
            lead_dict = dict(row)
            lead_dict["is_website_broken"] = bool(lead_dict.get("is_website_broken"))
            lead_dict["is_social_only"] = bool(lead_dict.get("is_social_only"))
            leads.append(Lead(**lead_dict))
        return leads

def get_lead_metrics(db_path: str = DB_PATH) -> dict:
    """Returns counts for total leads, hot leads, pending reviews, and dispatched leads."""
    with get_connection(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM leads")
        total = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM leads WHERE tier = 'HOT'")
        hot = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM leads WHERE status = 'PENDING_REVIEW'")
        pending = cursor.fetchone()[0]

        cursor.execute("""
            SELECT COUNT(*) FROM leads 
            WHERE status IN ('APPROVED', 'CONTACTED', 'FOLLOW_UP_DAY_3', 'FOLLOW_UP_DAY_7', 'FOLLOW_UP_DAY_10')
        """)
        dispatched = cursor.fetchone()[0]

        return {
            "total": total,
            "hot": hot,
            "pending": pending,
            "dispatched": dispatched
        }

def update_lead_email(lead_id: int, email: str, db_path: str = DB_PATH) -> bool:
    """Update email address for a lead."""
    with get_connection(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE leads SET email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (email, lead_id))
        return cursor.rowcount > 0

