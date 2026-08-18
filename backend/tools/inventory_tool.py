"""Inventory management tools for the AI agent."""
from database.db import query


def get_inventory_status() -> dict:
    """Get complete inventory status for all products.

    Returns:
        Dictionary with all product stock levels, reorder points, and health scores.
    """
    rows = query(
        """SELECT
            i.product_id, p.name, p.category,
            i.current_stock, i.reorder_point, i.max_capacity,
            i.warehouse, i.last_restocked,
            s.name as supplier_name,
            CASE
                WHEN i.current_stock <= i.reorder_point * 0.5 THEN 'critical'
                WHEN i.current_stock <= i.reorder_point THEN 'low'
                WHEN i.current_stock <= i.reorder_point * 2 THEN 'normal'
                ELSE 'overstocked'
            END as stock_status,
            ROUND(CAST(i.current_stock AS NUMERIC) / COALESCE(NULLIF(i.max_capacity, 0), 1) * 100, 1) as capacity_pct
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        JOIN suppliers s ON i.supplier_id = s.id
        ORDER BY i.current_stock * 1.0 / COALESCE(NULLIF(i.reorder_point, 0), 1) ASC"""
    )

    critical = sum(1 for r in rows if r["stock_status"] == "critical")
    low = sum(1 for r in rows if r["stock_status"] == "low")
    healthy = sum(1 for r in rows if r["stock_status"] in ("normal", "overstocked"))

    return {
        "items": rows,
        "summary": {
            "total_products": len(rows),
            "critical": critical,
            "low": low,
            "healthy": healthy,
            "health_score": round(healthy / len(rows) * 100, 1) if rows else 0,
        },
    }


def get_stockout_risk() -> dict:
    """Get products at risk of running out of stock.

    Returns:
        Dictionary with products sorted by urgency of restock need.
    """
    rows = query(
        """SELECT
            p.name, p.category,
            i.current_stock, i.reorder_point,
            s.name as supplier_name, s.avg_delivery_days,
            i.warehouse,
            ROUND(CAST(i.current_stock AS NUMERIC) / COALESCE(NULLIF(i.reorder_point, 0), 1), 2) as stock_ratio
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        JOIN suppliers s ON i.supplier_id = s.id
        WHERE i.current_stock <= i.reorder_point * 1.5
        ORDER BY stock_ratio ASC"""
    )

    # Estimate days until stockout using recent daily sales rate
    enriched = []
    for row in rows:
        avg_daily = query(
            """SELECT COALESCE(AVG(daily_qty), 0) as avg_daily FROM (
                SELECT SUM(quantity) as daily_qty FROM sales s
                JOIN products p ON s.product_id = p.id
                WHERE p.name = ? AND s.sale_date >= CURRENT_DATE - INTERVAL '14 days'
                GROUP BY s.sale_date
            )""",
            (row["name"],),
        )
        daily_rate = avg_daily[0]["avg_daily"] if avg_daily else 0
        days_until = round(row["current_stock"] / daily_rate, 1) if daily_rate > 0 else 999

        enriched.append({
            **dict(row),
            "avg_daily_sales": round(daily_rate, 1),
            "estimated_days_until_stockout": days_until,
            "urgency": "critical" if days_until < row.get("avg_delivery_days", 7) else "warning",
        })

    return {"at_risk_products": enriched, "total_at_risk": len(enriched)}


def get_inventory_by_product(product_name: str) -> dict:
    """Get inventory details for a specific product.

    Args:
        product_name: Name of the product (e.g. 'Product A').

    Returns:
        Dictionary with the product's inventory details.
    """
    rows = query(
        """SELECT
            p.name, p.category, p.price,
            i.current_stock, i.reorder_point, i.max_capacity,
            i.warehouse, i.last_restocked,
            s.name as supplier_name, s.avg_delivery_days, s.reliability_score
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        JOIN suppliers s ON i.supplier_id = s.id
        WHERE p.name LIKE ?""",
        (f"%{product_name}%",),
    )
    return rows[0] if rows else {"error": f"Product '{product_name}' not found"}
