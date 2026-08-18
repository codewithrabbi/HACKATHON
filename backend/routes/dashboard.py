"""Dashboard API routes."""
from fastapi import APIRouter
from database.db import query
from tools.sales_tool import get_sales_summary
from tools.inventory_tool import get_inventory_status
from agent.engine import get_cached_insights

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/kpis")
async def get_kpis():
    """Get dashboard KPI cards data."""
    sales = get_sales_summary("30d")
    inv = get_inventory_status()

    # Calculate profit
    profit_data = query(
        """SELECT
            ROUND(SUM(s.total_amount) - SUM(s.quantity * p.cost), 2) as profit,
            ROUND((SUM(s.total_amount) - SUM(s.quantity * p.cost)) / COALESCE(NULLIF(SUM(s.total_amount), 0), 1) * 100, 1) as margin
        FROM sales s
        JOIN products p ON s.product_id = p.id
        WHERE s.sale_date >= CURRENT_DATE - INTERVAL '30 days'"""
    )

    prev_profit = query(
        """SELECT ROUND(SUM(s.total_amount) - SUM(s.quantity * p.cost), 2) as profit
        FROM sales s
        JOIN products p ON s.product_id = p.id
        WHERE s.sale_date >= CURRENT_DATE - INTERVAL '60 days' AND s.sale_date < CURRENT_DATE - INTERVAL '30 days'"""
    )

    profit = profit_data[0] if profit_data else {}
    prev_p = prev_profit[0]["profit"] if prev_profit and prev_profit[0]["profit"] else 0
    curr_p = profit.get("profit", 0) or 0
    profit_change = ((curr_p - prev_p) / prev_p * 100) if prev_p else 0

    return {
        "kpis": [
            {
                "title": "Revenue",
                "value": sales["revenue"],
                "change": sales["revenue_change_pct"],
                "format": "currency",
                "icon": "dollar-sign",
            },
            {
                "title": "Orders",
                "value": sales["order_count"],
                "change": round(
                    (sales["order_count"] - (sales.get("previous_orders", sales["order_count"])))
                    / max(sales["order_count"], 1)
                    * 100,
                    1,
                ),
                "format": "number",
                "icon": "shopping-cart",
            },
            {
                "title": "Profit",
                "value": curr_p,
                "change": round(profit_change, 1),
                "format": "currency",
                "icon": "trending-up",
            },
            {
                "title": "Inventory Health",
                "value": inv["summary"]["health_score"],
                "change": 0,
                "format": "percent",
                "icon": "package",
                "extra": f"{inv['summary']['critical']} critical, {inv['summary']['low']} low",
            },
        ]
    }


@router.get("/alerts")
async def get_alerts():
    """Get active business alerts."""
    rows = query(
        "SELECT * FROM alerts WHERE is_read = 0 ORDER BY CASE severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END, created_at DESC"
    )
    return {"alerts": rows}


@router.get("/insights")
async def get_insights():
    """Get AI-generated intelligence items."""
    insights = await get_cached_insights()
    return {"insights": insights}
