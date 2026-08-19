"""PostgreSQL connection manager and query helpers."""
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from supabase import create_client, Client
from dotenv import load_dotenv

from psycopg2.pool import SimpleConnectionPool
import atexit

load_dotenv()

# Initialize Supabase client
supabase_url = os.environ.get("SUPABASE_URL", "")
supabase_key = os.environ.get("SUPABASE_KEY", "")
supabase: Client = create_client(supabase_url, supabase_key) if supabase_url else None

# Supabase Postgres URL
DB_URL = os.environ.get("SUPABASE_DB_URL", "")

# Initialize Connection Pool
pool = None
if DB_URL:
    pool = SimpleConnectionPool(1, 20, DB_URL, cursor_factory=RealDictCursor)
    atexit.register(pool.closeall)

def get_connection():
    """Get a Postgres connection from the pool."""
    if not pool:
        raise ValueError("SUPABASE_DB_URL is not set or pool failed to initialize.")
    return pool.getconn()

def release_connection(conn):
    if pool and conn:
        pool.putconn(conn)

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
        release_connection(conn)

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
        release_connection(conn)

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
        release_connection(conn)

def db_exists() -> bool:
    """Check if the database connection works."""
    try:
        conn = get_connection()
        release_connection(conn)
        return True
    except:
        return False
