"""Analytics API routes."""
from fastapi import APIRouter
from database.db import query

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/revenue")
async def get_revenue_timeseries(days: int = 180):
    """Get revenue over time for charting."""
    rows = query(
        """SELECT sale_date as date,
            SUM(total_amount) as revenue,
            SUM(quantity) as units,
            COUNT(*) as orders
        FROM sales
        WHERE sale_date >= CURRENT_DATE - CAST(? AS INTEGER)
        GROUP BY sale_date
        ORDER BY sale_date""",
        (days,)
    )
    for r in rows:
        r["revenue"] = float(r["revenue"])
    return {"data": rows}


@router.get("/products")
async def get_product_performance(days: int = 30):
    """Get product performance breakdown."""
    rows = query(
        """SELECT p.name, p.category,
            SUM(s.total_amount) as revenue,
            SUM(s.quantity) as units_sold,
            ROUND(SUM(s.total_amount) - SUM(s.quantity * p.cost), 2) as profit,
            ROUND((SUM(s.total_amount) - SUM(s.quantity * p.cost)) / COALESCE(NULLIF(SUM(s.total_amount), 0), 1) * 100, 1) as margin_pct,
            COUNT(*) as transactions
        FROM sales s
        JOIN products p ON s.product_id = p.id
        WHERE s.sale_date >= CURRENT_DATE - CAST(? AS INTEGER)
        GROUP BY p.id
        ORDER BY revenue DESC""",
        (days,)
    )
    for r in rows:
        r["revenue"] = float(r["revenue"])
        r["profit"] = float(r["profit"] or 0)
        r["margin_pct"] = float(r["margin_pct"] or 0)
    return {"data": rows}


@router.get("/regions")
async def get_regional_performance(days: int = 30):
    """Get performance by region."""
    rows = query(
        """SELECT region,
            SUM(total_amount) as revenue,
            SUM(quantity) as units,
            COUNT(*) as orders,
            ROUND(AVG(total_amount), 2) as avg_order
        FROM sales
        WHERE sale_date >= CURRENT_DATE - CAST(? AS INTEGER)
        GROUP BY region
        ORDER BY revenue DESC""",
        (days,)
    )

    total_rev = float(sum(r["revenue"] for r in rows) or 1)
    for r in rows:
        r["revenue"] = float(r["revenue"])
        r["avg_order"] = float(r["avg_order"] or 0)
        r["percentage"] = float(round(r["revenue"] / total_rev * 100, 1))

    return {"data": rows}


@router.get("/categories")
async def get_category_performance(days: int = 30):
    """Get performance by product category."""
    rows = query(
        """SELECT p.category,
            SUM(s.total_amount) as revenue,
            SUM(s.quantity) as units,
            COUNT(DISTINCT p.id) as product_count
        FROM sales s
        JOIN products p ON s.product_id = p.id
        WHERE s.sale_date >= CURRENT_DATE - CAST(? AS INTEGER)
        GROUP BY p.category
        ORDER BY revenue DESC""",
        (days,)
    )
    for r in rows:
        r["revenue"] = float(r["revenue"])
    return {"data": rows}
