"""Sales analysis tools for the AI agent."""
from database.db import query


def get_sales_summary(period: str = "30d") -> dict:
    """Get sales summary including total revenue, order count, and trends.

    Args:
        period: Time period - '7d', '30d', '90d', or '180d'. Defaults to '30d'.

    Returns:
        Dictionary with revenue, orders, average order value, and period comparison.
    """
    days = {"7d": 7, "30d": 30, "90d": 90, "180d": 180}.get(period, 30)

    current = query(
        """SELECT
            COALESCE(SUM(total_amount), 0) as revenue,
            COALESCE(SUM(quantity), 0) as total_units,
            COUNT(*) as order_count,
            COALESCE(AVG(total_amount), 0) as avg_order_value
        FROM sales
        WHERE sale_date >= CURRENT_DATE + ?::interval""",
        (f"-{days} days",),
    )

    previous = query(
        """SELECT
            COALESCE(SUM(total_amount), 0) as revenue,
            COUNT(*) as order_count
        FROM sales
        WHERE sale_date >= CURRENT_DATE + ?::interval AND sale_date < CURRENT_DATE + ?::interval""",
        (f"-{days * 2} days", f"-{days} days"),
    )

    curr = current[0] if current else {}
    prev = previous[0] if previous else {}

    prev_rev = prev.get("revenue", 0) or 0
    curr_rev = curr.get("revenue", 0) or 0
    change = ((curr_rev - prev_rev) / prev_rev * 100) if prev_rev else 0

    return {
        "period": period,
        "revenue": round(curr_rev, 2),
        "total_units": curr.get("total_units", 0),
        "order_count": curr.get("order_count", 0),
        "avg_order_value": round(curr.get("avg_order_value", 0) or 0, 2),
        "revenue_change_pct": round(change, 1),
        "previous_revenue": round(prev_rev, 2),
    }


def get_product_sales(product_name: str, period: str = "30d") -> dict:
    """Get sales data for a specific product.

    Args:
        product_name: Name of the product (e.g. 'Product A').
        period: Time period - '7d', '30d', '90d', or '180d'.

    Returns:
        Dictionary with product sales details and daily breakdown.
    """
    days = {"7d": 7, "30d": 30, "90d": 90, "180d": 180}.get(period, 30)

    summary = query(
        """SELECT
            p.name, p.category, p.price, p.cost,
            COALESCE(SUM(s.total_amount), 0) as revenue,
            COALESCE(SUM(s.quantity), 0) as units_sold,
            COUNT(*) as transactions
        FROM products p
        LEFT JOIN sales s ON p.id = s.product_id AND s.sale_date >= CURRENT_DATE + ?::interval
        WHERE p.name LIKE ?
        GROUP BY p.id""",
        (f"-{days} days", f"%{product_name}%"),
    )

    daily = query(
        """SELECT s.sale_date as date, SUM(s.quantity) as units, SUM(s.total_amount) as revenue
        FROM sales s
        JOIN products p ON s.product_id = p.id
        WHERE p.name LIKE ? AND s.sale_date >= CURRENT_DATE + ?::interval
        GROUP BY s.sale_date
        ORDER BY s.sale_date""",
        (f"%{product_name}%", f"-{days} days"),
    )

    return {
        "product": summary[0] if summary else {},
        "daily_breakdown": daily,
        "period": period,
    }


def compare_sales_periods(period1: str = "current_month", period2: str = "previous_month") -> dict:
    """Compare sales between two periods to identify trends and changes.

    Args:
        period1: First period - 'current_month', 'last_30d', 'last_7d'.
        period2: Second period - 'previous_month', 'prev_30d', 'prev_7d'.

    Returns:
        Dictionary with comparison metrics for both periods.
    """
    period_map = {
        "current_month": ("date_trunc('month', CURRENT_DATE)", "CURRENT_DATE"),
        "previous_month": ("date_trunc('month', CURRENT_DATE) - INTERVAL '1 month'", "date_trunc('month', CURRENT_DATE)"),
        "last_30d": ("CURRENT_DATE - INTERVAL '30 days'", "CURRENT_DATE"),
        "prev_30d": ("CURRENT_DATE - INTERVAL '60 days'", "CURRENT_DATE - INTERVAL '30 days'"),
        "last_7d": ("CURRENT_DATE - INTERVAL '7 days'", "CURRENT_DATE"),
        "prev_7d": ("CURRENT_DATE - INTERVAL '14 days'", "CURRENT_DATE - INTERVAL '7 days'"),
    }

    p1 = period_map.get(period1, period_map["last_30d"])
    p2 = period_map.get(period2, period_map["prev_30d"])

    q = """SELECT
        COALESCE(SUM(total_amount), 0) as revenue,
        COALESCE(SUM(quantity), 0) as units,
        COUNT(*) as transactions,
        COALESCE(AVG(total_amount), 0) as avg_value
    FROM sales WHERE sale_date >= {start} AND sale_date < {end}"""

    r1 = query(q.format(start=p1[0], end=p1[1]))
    r2 = query(q.format(start=p2[0], end=p2[1]))

    d1 = r1[0] if r1 else {}
    d2 = r2[0] if r2 else {}

    rev1 = d1.get("revenue", 0) or 0
    rev2 = d2.get("revenue", 0) or 0
    change = ((rev1 - rev2) / rev2 * 100) if rev2 else 0

    return {
        "period1": {"name": period1, **d1},
        "period2": {"name": period2, **d2},
        "revenue_change_pct": round(change, 1),
        "units_change_pct": round(
            ((d1.get("units", 0) - d2.get("units", 0)) / d2.get("units", 1) * 100) if d2.get("units") else 0, 1
        ),
    }
