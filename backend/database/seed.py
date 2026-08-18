"""Generate realistic synthetic business data for Synaptix AI."""
import sqlite3
import random
import math
from datetime import datetime, timedelta
from pathlib import Path

DB_PATH = Path(__file__).parent / "Synaptix.db"

random.seed(42)

# ── Product catalog ──────────────────────────────────────────────────────────
PRODUCTS = [
    ("PRD-001", "Product A", "Electronics", 299.99, 180.00),
    ("PRD-002", "Product B", "Electronics", 149.99, 85.00),
    ("PRD-003", "Product C", "Accessories", 49.99, 22.00),
    ("PRD-004", "Product D", "Software", 599.99, 120.00),
    ("PRD-005", "Product E", "Accessories", 79.99, 35.00),
    ("PRD-006", "Product F", "Hardware", 899.99, 520.00),
    ("PRD-007", "Product G", "Services", 199.99, 60.00),
    ("PRD-008", "Product H", "Electronics", 399.99, 230.00),
    ("PRD-009", "Product I", "Software", 99.99, 30.00),
    ("PRD-010", "Product J", "Hardware", 1299.99, 780.00),
]

SUPPLIERS = [
    ("SUP-001", "Supplier X", "China", 14, 0.92, "supplier_x@example.com"),
    ("SUP-002", "Supplier Y", "USA", 5, 0.98, "supplier_y@example.com"),
    ("SUP-003", "Supplier Z", "Germany", 8, 0.95, "supplier_z@example.com"),
    ("SUP-004", "Supplier W", "Japan", 10, 0.96, "supplier_w@example.com"),
]

REGIONS = ["North America", "Europe", "Asia Pacific", "Latin America", "Middle East"]

CUSTOMER_SEGMENTS = ["Enterprise", "SMB", "Startup", "Government", "Education"]


def create_tables(conn: sqlite3.Connection):
    """Create all database tables."""
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            price REAL NOT NULL,
            cost REAL NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            unit_price REAL NOT NULL,
            total_amount REAL NOT NULL,
            region TEXT NOT NULL,
            customer_segment TEXT NOT NULL,
            sale_date TEXT NOT NULL,
            FOREIGN KEY (product_id) REFERENCES products(id)
        );

        CREATE TABLE IF NOT EXISTS inventory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id TEXT NOT NULL UNIQUE,
            current_stock INTEGER NOT NULL,
            reorder_point INTEGER NOT NULL,
            max_capacity INTEGER NOT NULL,
            warehouse TEXT NOT NULL,
            supplier_id TEXT NOT NULL,
            last_restocked TEXT,
            FOREIGN KEY (product_id) REFERENCES products(id),
            FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
        );

        CREATE TABLE IF NOT EXISTS suppliers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            country TEXT NOT NULL,
            avg_delivery_days INTEGER NOT NULL,
            reliability_score REAL NOT NULL,
            contact_email TEXT
        );

        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            segment TEXT NOT NULL,
            region TEXT NOT NULL,
            total_orders INTEGER DEFAULT 0,
            total_spent REAL DEFAULT 0,
            joined_date TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            severity TEXT NOT NULL CHECK(severity IN ('critical', 'warning', 'info')),
            category TEXT NOT NULL,
            is_read INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS actions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            priority TEXT NOT NULL CHECK(priority IN ('high', 'medium', 'low')),
            category TEXT NOT NULL,
            is_completed INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
    """)


def seed_products(conn: sqlite3.Connection):
    conn.executemany(
        "INSERT OR REPLACE INTO products (id, name, category, price, cost) VALUES (?, ?, ?, ?, ?)",
        PRODUCTS,
    )


def seed_suppliers(conn: sqlite3.Connection):
    conn.executemany(
        "INSERT OR REPLACE INTO suppliers (id, name, country, avg_delivery_days, reliability_score, contact_email) VALUES (?, ?, ?, ?, ?, ?)",
        SUPPLIERS,
    )


def seed_sales(conn: sqlite3.Connection):
    """Generate 6 months of daily sales with realistic patterns.

    Product A has a deliberate decline in the last 30 days to trigger anomaly detection.
    """
    today = datetime.now()
    start_date = today - timedelta(days=180)
    rows = []

    for day_offset in range(181):
        date = start_date + timedelta(days=day_offset)
        date_str = date.strftime("%Y-%m-%d")
        day_of_week = date.weekday()

        # Weekend factor
        weekend_factor = 0.6 if day_of_week >= 5 else 1.0

        # Seasonal wave (higher in middle months)
        seasonal = 1.0 + 0.15 * math.sin(2 * math.pi * day_offset / 180)

        for product_id, name, category, price, cost in PRODUCTS:
            # Base daily orders vary by product
            base_orders = {
                "PRD-001": 12, "PRD-002": 18, "PRD-003": 30, "PRD-004": 5,
                "PRD-005": 22, "PRD-006": 3, "PRD-007": 8, "PRD-008": 7,
                "PRD-009": 15, "PRD-010": 2,
            }
            base = base_orders.get(product_id, 10)

            # Product A decline in last 30 days
            decline_factor = 1.0
            if product_id == "PRD-001" and day_offset > 150:
                decline_factor = max(0.3, 1.0 - (day_offset - 150) * 0.023)

            qty = max(
                0,
                int(
                    base
                    * weekend_factor
                    * seasonal
                    * decline_factor
                    * random.uniform(0.7, 1.3)
                ),
            )

            if qty > 0:
                region = random.choice(REGIONS)
                segment = random.choice(CUSTOMER_SEGMENTS)
                unit_price = round(price * random.uniform(0.95, 1.05), 2)
                total = round(unit_price * qty, 2)
                rows.append((product_id, qty, unit_price, total, region, segment, date_str))

    conn.executemany(
        "INSERT INTO sales (product_id, quantity, unit_price, total_amount, region, customer_segment, sale_date) VALUES (?, ?, ?, ?, ?, ?, ?)",
        rows,
    )


def seed_inventory(conn: sqlite3.Connection):
    """Generate inventory with some products near stock-out."""
    warehouses = ["Warehouse Alpha", "Warehouse Beta", "Warehouse Gamma"]
    supplier_map = {
        "PRD-001": "SUP-001", "PRD-002": "SUP-001", "PRD-003": "SUP-002",
        "PRD-004": "SUP-002", "PRD-005": "SUP-003", "PRD-006": "SUP-003",
        "PRD-007": "SUP-004", "PRD-008": "SUP-004", "PRD-009": "SUP-002",
        "PRD-010": "SUP-003",
    }
    # Some products critically low
    stock_levels = {
        "PRD-001": 45,   # Low — near reorder
        "PRD-002": 230,
        "PRD-003": 520,
        "PRD-004": 18,   # Critical
        "PRD-005": 310,
        "PRD-006": 8,    # Critical
        "PRD-007": 150,
        "PRD-008": 95,
        "PRD-009": 410,
        "PRD-010": 5,    # Critical
    }
    reorder_points = {
        "PRD-001": 50, "PRD-002": 100, "PRD-003": 200, "PRD-004": 20,
        "PRD-005": 150, "PRD-006": 15, "PRD-007": 60, "PRD-008": 50,
        "PRD-009": 100, "PRD-010": 10,
    }

    for product_id, _, _, _, _ in PRODUCTS:
        conn.execute(
            "INSERT OR REPLACE INTO inventory (product_id, current_stock, reorder_point, max_capacity, warehouse, supplier_id, last_restocked) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (
                product_id,
                stock_levels[product_id],
                reorder_points[product_id],
                reorder_points[product_id] * 10,
                random.choice(warehouses),
                supplier_map[product_id],
                (datetime.now() - timedelta(days=random.randint(1, 30))).strftime("%Y-%m-%d"),
            ),
        )


def seed_customers(conn: sqlite3.Connection):
    """Generate 50 customers across segments and regions."""
    first_names = ["Acme", "GlobalTech", "DataVision", "CloudNine", "NetSphere",
                   "BrightPath", "CoreLogic", "PeakWave", "SilverLine", "NovaTech"]
    suffixes = ["Corp", "Inc", "LLC", "Ltd", "Solutions", "Group", "Partners", "Systems", "Labs", "Co"]

    for i in range(50):
        name = f"{random.choice(first_names)} {random.choice(suffixes)}"
        segment = random.choice(CUSTOMER_SEGMENTS)
        region = random.choice(REGIONS)
        orders = random.randint(5, 200)
        spent = round(orders * random.uniform(100, 5000), 2)
        joined = (datetime.now() - timedelta(days=random.randint(30, 730))).strftime("%Y-%m-%d")
        conn.execute(
            "INSERT INTO customers (name, segment, region, total_orders, total_spent, joined_date) VALUES (?, ?, ?, ?, ?, ?)",
            (name, segment, region, orders, spent, joined),
        )


def seed_alerts(conn: sqlite3.Connection):
    """Pre-generate business alerts."""
    alerts = [
        ("Product A Sales Declining", "Product A sales have dropped 35% over the last 30 days compared to the previous period. Immediate investigation recommended.", "critical", "sales"),
        ("Supplier X Delivery Delays", "Supplier X average delivery time has increased from 14 to 21 days. This affects Product A and Product B inventory.", "critical", "supply_chain"),
        ("Product J Stock Critical", "Product J has only 5 units remaining — well below reorder point of 10. At current sell rate, stockout in ~3 days.", "critical", "inventory"),
        ("Product F Low Inventory", "Product F stock at 8 units (reorder point: 15). Consider emergency reorder.", "warning", "inventory"),
        ("Revenue Target At Risk", "Current month revenue is tracking 12% below forecast. Primary driver: Product A decline.", "warning", "revenue"),
        ("New Customer Segment Growth", "Enterprise segment showing 22% growth in acquisition rate over last quarter.", "info", "customers"),
        ("Product D Stock Warning", "Product D at 18 units, approaching reorder point of 20.", "warning", "inventory"),
        ("Weekend Sales Optimization", "Weekend sales consistently 40% lower than weekdays. Consider weekend promotions.", "info", "sales"),
    ]
    conn.executemany(
        "INSERT INTO alerts (title, description, severity, category) VALUES (?, ?, ?, ?)",
        alerts,
    )


def seed_actions(conn: sqlite3.Connection):
    """Pre-generate AI-recommended actions."""
    actions = [
        ("Investigate Product A Decline", "Sales for Product A have dropped 35%. Analyze marketing spend, competitor pricing, and customer feedback to identify the root cause.", "high", "investigation"),
        ("Emergency Reorder Product J", "Product J stock is critically low (5 units). Place emergency order with Supplier Z immediately to prevent stockout.", "high", "procurement"),
        ("Renegotiate Supplier X Contract", "Supplier X delivery times have increased significantly. Schedule meeting to discuss SLA compliance or evaluate alternative suppliers.", "high", "supply_chain"),
        ("Reorder Product F", "Product F below reorder point. Place standard order with Supplier Z.", "medium", "procurement"),
        ("Launch Weekend Promotions", "Implement targeted weekend promotional campaigns to address the 40% sales gap between weekdays and weekends.", "medium", "marketing"),
        ("Review Product D Stock", "Product D approaching reorder point. Monitor sales velocity and prepare purchase order.", "low", "procurement"),
        ("Expand Enterprise Segment", "Enterprise segment growing 22%. Allocate additional sales resources to capitalize on this trend.", "medium", "sales"),
        ("Optimize APAC Distribution", "Asia Pacific region showing strong growth. Consider adding regional warehouse to reduce delivery times.", "low", "logistics"),
    ]
    conn.executemany(
        "INSERT INTO actions (title, description, priority, category) VALUES (?, ?, ?, ?)",
        actions,
    )


def seed_database():
    """Run full database seeding."""
    # Remove existing db
    if DB_PATH.exists():
        DB_PATH.unlink()

    conn = sqlite3.connect(str(DB_PATH))
    try:
        create_tables(conn)
        seed_products(conn)
        seed_suppliers(conn)
        seed_sales(conn)
        seed_inventory(conn)
        seed_customers(conn)
        seed_alerts(conn)
        seed_actions(conn)
        conn.commit()
        print(f"Database seeded at {DB_PATH}")
        # Print stats
        for table in ["products", "sales", "inventory", "suppliers", "customers", "alerts", "actions"]:
            count = conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
            print(f"   {table}: {count} rows")
    finally:
        conn.close()


if __name__ == "__main__":
    seed_database()
