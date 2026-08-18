import csv
import random
from datetime import datetime, timedelta
from pathlib import Path

OUT_DIR = Path("realistic_csvs")
OUT_DIR.mkdir(exist_ok=True)

# Generate Products
products = []
for i in range(1, 21):
    products.append({
        "id": f"PRD-{i:03d}",
        "name": f"Smart Gadget {i}",
        "category": random.choice(["Electronics", "Accessories", "Home", "Office"]),
        "price": round(random.uniform(50, 500), 2),
        "cost": round(random.uniform(20, 200), 2)
    })

with open(OUT_DIR / "products.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["id", "name", "category", "price", "cost"])
    writer.writeheader()
    writer.writerows(products)

# Generate Customers
customers = []
for i in range(1, 51):
    customers.append({
        "id": f"CUST-{i:03d}",
        "name": f"Customer {i}",
        "segment": random.choice(["Enterprise", "SMB", "Consumer"]),
        "region": random.choice(["North America", "Europe", "Asia", "South America"]),
        "total_orders": random.randint(1, 50),
        "total_spent": round(random.uniform(100, 5000), 2),
        "joined_date": (datetime.now() - timedelta(days=random.randint(100, 1000))).strftime("%Y-%m-%d")
    })

# Generate Sales with EXTREME LEAKAGES
sales = []
start_date = datetime.now() - timedelta(days=90)

for i in range(1, 1001):
    p = random.choice(products)
    c = random.choice(customers)
    qty = random.randint(1, 10)
    unit_price = p["price"]
    
    discount = 0
    tax = round(qty * unit_price * 0.05, 2)
    
    payment_status = "Paid"
    
    # 15% chance to introduce very obvious leakage
    if random.random() < 0.15:
        leakage_type = random.choice(["wrong_pricing", "unusual_discount", "failed_payment", "missing_tax", "massive_refund"])
        
        if leakage_type == "wrong_pricing":
            # Unit price is 10x lower than normal!
            unit_price = round(p["price"] * 0.1, 2)
            
        elif leakage_type == "unusual_discount":
            # 95% discount applied!
            discount = round(qty * unit_price * 0.95, 2)
            
        elif leakage_type == "failed_payment":
            # Payment failed but product was shipped (status Failed)
            payment_status = "Failed"
            
        elif leakage_type == "missing_tax":
            # Tax was 0 but should be 5%
            tax = 0.0
            
        elif leakage_type == "massive_refund":
            # Refunded the full amount but kept the product
            payment_status = "Refunded"
            
    else:
        # Normal sales
        payment_status = random.choice(["Paid", "Paid", "Paid", "Paid", "Pending"])
        if random.random() < 0.1:
            discount = round(qty * unit_price * 0.05, 2) # 5% normal discount
        
    total_amount = round((qty * unit_price) - discount + tax, 2)

    sales.append({
        "transaction_id": f"TXN-{i:05d}",
        "date": (start_date + timedelta(days=random.randint(0, 90))).strftime("%Y-%m-%d"),
        "customer_id": c["id"],
        "product_id": p["id"],
        "quantity": qty,
        "unit_price": unit_price,
        "discount": discount,
        "tax": tax,
        "total_amount": total_amount,
        "payment_status": payment_status,
        "payment_method": random.choice(["Card", "Bank", "Cash", "Mobile"]),
        "sales_channel": random.choice(["Online", "Store", "Marketplace"]),
        "salesperson_id": f"SP-{random.randint(1,5):02d}",
        "region": c["region"]
    })

with open(OUT_DIR / "sales.csv", "w", newline="", encoding="utf-8") as f:
    fieldnames = ["transaction_id", "date", "customer_id", "product_id", "quantity", "unit_price", "discount", "tax", "total_amount", "payment_status", "payment_method", "sales_channel", "salesperson_id", "region"]
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(sales)

print("Realistic data with OBVIOUS EXTREME leakages generated in 'realistic_csvs' folder.")
