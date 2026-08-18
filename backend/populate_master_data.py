import os
import csv
import psycopg2
from dotenv import load_dotenv
from pathlib import Path
from psycopg2.extras import execute_values

load_dotenv()
DB_URL = os.environ.get("SUPABASE_DB_URL")

def populate():
    if not DB_URL:
        print("No SUPABASE_DB_URL")
        return
        
    conn = psycopg2.connect(DB_URL)
    
    # 1. Load Products
    products_file = Path("../realistic_csvs/products.csv")
    if products_file.exists():
        with open(products_file, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            product_tuples = []
            for row in reader:
                product_tuples.append((
                    row["id"], row["name"], row["category"], 
                    float(row["price"]), float(row["cost"])
                ))
                
        with conn.cursor() as cur:
            cur.execute("DELETE FROM products;") # Clear old ones if any
            execute_values(
                cur,
                "INSERT INTO products (id, name, category, price, cost) VALUES %s",
                product_tuples
            )
        print(f"Inserted {len(product_tuples)} products.")

    # 2. We also should generate and insert the Customers so the dashboard API doesn't fail
    # We will just run the customer generation logic here and insert to db
    import random
    from datetime import datetime, timedelta
    
    customers = []
    for i in range(1, 51):
        customers.append((
            f"CUST-{i:03d}",
            f"Customer {i}",
            random.choice(["Enterprise", "SMB", "Consumer"]),
            random.choice(["North America", "Europe", "Asia", "South America"]),
            random.randint(1, 50),
            round(random.uniform(100, 5000), 2),
            (datetime.now() - timedelta(days=random.randint(100, 1000))).strftime("%Y-%m-%d")
        ))
        
    with conn.cursor() as cur:
        cur.execute("DELETE FROM customers;") # Clear old ones if any
        execute_values(
            cur,
            "INSERT INTO customers (id, name, segment, region, total_orders, total_spent, joined_date) VALUES %s",
            customers
        )
    print(f"Inserted {len(customers)} customers.")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    populate()
