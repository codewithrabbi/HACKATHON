"""Setup script for actions table."""
import sys
from pathlib import Path
import os
from dotenv import load_dotenv

# Add backend directory to sys.path
backend_dir = Path(__file__).parent.parent
sys.path.append(str(backend_dir))

from database.db import get_connection

load_dotenv(backend_dir / ".env")

def setup_actions_table():
    """Create the actions table and seed data."""
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            print("Creating actions table...")
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS actions (
                    id SERIAL PRIMARY KEY,
                    title TEXT NOT NULL,
                    description TEXT NOT NULL,
                    priority TEXT NOT NULL CHECK(priority IN ('high', 'medium', 'low')),
                    category TEXT NOT NULL,
                    is_completed INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)

            # Check if empty
            cursor.execute("SELECT COUNT(*) as count FROM actions")
            count = cursor.fetchone()['count']

            if count == 0:
                print("Seeding dummy actions...")
                dummy_actions = [
                    (
                        "Review API pricing anomalies",
                        "The leakage detector found a significant drop in API revenue. Review pricing tiers and recent billing changes.",
                        "high",
                        "Revenue Leakage"
                    ),
                    (
                        "Restock Enterprise Servers",
                        "Inventory for Product J is below the reorder point. Approve the pending purchase order to avoid stockouts.",
                        "high",
                        "Inventory"
                    ),
                    (
                        "Launch Q3 Retention Campaign",
                        "Customer churn risk is increasing for SMB segment. Approve the automated email campaign drafts in Copilot.",
                        "medium",
                        "Customers"
                    ),
                    (
                        "Optimize Cloud Server Costs",
                        "Cloud usage expenses spiked by 15% this week. Review the auto-scaling configurations.",
                        "low",
                        "Cost Optimization"
                    )
                ]
                
                cursor.executemany("""
                    INSERT INTO actions (title, description, priority, category)
                    VALUES (%s, %s, %s, %s)
                """, dummy_actions)
                print(f"Inserted {len(dummy_actions)} actions.")
            else:
                print(f"Table already contains {count} actions. Skipping seed.")

        conn.commit()
        print("Done!")
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    setup_actions_table()
