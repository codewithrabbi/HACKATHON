"""PostgreSQL connection manager and query helpers."""
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Initialize Supabase client
supabase_url = os.environ.get("SUPABASE_URL", "")
supabase_key = os.environ.get("SUPABASE_KEY", "")
supabase: Client = create_client(supabase_url, supabase_key) if supabase_url else None

# Supabase Postgres URL
DB_URL = os.environ.get("SUPABASE_DB_URL", "")

def get_connection():
    """Get a Postgres connection with RealDictCursor enabled."""
    if not DB_URL:
        raise ValueError("SUPABASE_DB_URL is not set in the environment variables.")
    return psycopg2.connect(DB_URL, cursor_factory=RealDictCursor)

def query(sql: str, params: tuple = ()) -> list[dict]:
    """Execute a read query and return list of dicts."""
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # Replace SQLite '?' placeholders with Postgres '%s' placeholders
            sql = sql.replace('?', '%s')
            cursor.execute(sql, params)
            return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()

def execute(sql: str, params: tuple = ()) -> int:
    """Execute a write query and return rows affected."""
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            sql = sql.replace('?', '%s')
            cursor.execute(sql, params)
            conn.commit()
            return cursor.rowcount
    finally:
        conn.close()

def execute_many(sql: str, data: list[tuple]) -> int:
    """Execute a batch insert."""
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            sql = sql.replace('?', '%s')
            cursor.executemany(sql, data)
            conn.commit()
            return cursor.rowcount
    finally:
        conn.close()

def db_exists() -> bool:
    """Check if the database connection works."""
    try:
        conn = get_connection()
        conn.close()
        return True
    except:
        return False
