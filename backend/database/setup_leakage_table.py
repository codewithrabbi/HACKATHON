import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
DB_URL = os.environ.get("SUPABASE_DB_URL")

sql = """
CREATE TABLE IF NOT EXISTS revenue_leakage_cache (
    id SERIAL PRIMARY KEY,
    problem TEXT NOT NULL,
    evidence TEXT NOT NULL,
    financial_impact TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

def setup():
    if not DB_URL:
        print("No SUPABASE_DB_URL")
        return
    conn = psycopg2.connect(DB_URL)
    with conn.cursor() as cur:
        cur.execute(sql)
    conn.commit()
    conn.close()
    print("Leakage table created successfully.")

if __name__ == "__main__":
    setup()
