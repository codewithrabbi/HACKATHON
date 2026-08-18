import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
DB_URL = os.environ.get("SUPABASE_DB_URL")

sql = """
DROP TABLE IF EXISTS sales;

CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    transaction_id TEXT NOT NULL,
    date DATE NOT NULL,
    customer_id TEXT NOT NULL,
    product_id TEXT NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price NUMERIC NOT NULL,
    discount NUMERIC NOT NULL DEFAULT 0,
    tax NUMERIC NOT NULL DEFAULT 0,
    total_amount NUMERIC NOT NULL,
    payment_status TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    sales_channel TEXT NOT NULL,
    salesperson_id TEXT NOT NULL,
    region TEXT NOT NULL
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
    print("Sales table dropped and recreated with new schema successfully.")

if __name__ == "__main__":
    setup()
