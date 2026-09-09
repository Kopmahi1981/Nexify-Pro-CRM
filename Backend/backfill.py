import sqlite3
from scraping import extract_email_from_website

conn = sqlite3.connect("leads.db")
cur = conn.cursor()

cur.execute("""
    SELECT id, website 
    FROM leads 
    WHERE website IS NOT NULL 
      AND (email IS NULL OR email = '')
""")
rows = cur.fetchall()
print(f"Scanning {len(rows)} leads for contact emails...")

updated = 0
for lead_id, website in rows:
    try:
        email = extract_email_from_website(website)
        if email:
            cur.execute("UPDATE leads SET email = ? WHERE id = ?", (email, lead_id))
            conn.commit()
            updated += 1
            print(f"[{updated}] Found {email} -> Lead #{lead_id}")
    except Exception as e:
        print(f"Error checking lead #{lead_id} ({website}): {e}")

print(f"\nBackfill finished. Successfully attached {updated} emails.")
conn.close()