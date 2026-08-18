"""Customer API routes."""
from fastapi import APIRouter
from database.db import query

router = APIRouter(prefix="/api/customers", tags=["customers"])


@router.get("/segments")
async def customer_segments():
    """Get customer segment breakdown."""
    rows = query(
        """SELECT segment,
            COUNT(*) as count,
            SUM(total_orders) as total_orders,
            ROUND(SUM(total_spent), 2) as total_spent,
            ROUND(AVG(total_spent), 2) as avg_spent,
            ROUND(AVG(total_orders), 1) as avg_orders
        FROM customers
        GROUP BY segment
        ORDER BY total_spent DESC"""
    )
    return {"data": rows}


@router.get("/overview")
async def customer_overview():
    """Get customer overview metrics."""
    total = query("SELECT COUNT(*) as total, SUM(total_orders) as orders, ROUND(SUM(total_spent), 2) as revenue FROM customers")
    regional = query(
        """SELECT region,
            COUNT(*) as count,
            ROUND(SUM(total_spent), 2) as total_spent
        FROM customers
        GROUP BY region
        ORDER BY total_spent DESC"""
    )
    top = query(
        """SELECT name, segment, region, total_orders, ROUND(total_spent, 2) as total_spent
        FROM customers
        ORDER BY total_spent DESC
        LIMIT 10"""
    )
    growth = query(
        """SELECT TO_CHAR(joined_date, 'YYYY-MM') as month, COUNT(*) as new_customers
        FROM customers
        GROUP BY month
        ORDER BY month"""
    )

    return {
        "summary": total[0] if total else {},
        "regional": regional,
        "top_customers": top,
        "growth": growth,
    }
