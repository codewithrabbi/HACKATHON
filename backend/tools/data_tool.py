"""SQL data query tool for the AI agent."""
from database.db import query


def run_query(sql_description: str) -> dict:
    """Execute a business data query based on a natural language description.

    The AI agent provides a description of what data it needs, and this tool
    generates and executes the appropriate SQL query.

    Args:
        sql_description: A description of the data needed, which maps to predefined queries.

    Returns:
        Dictionary with query results.
    """
    desc = sql_description.lower()

    # Map descriptions to safe, predefined queries
    if "top product" in desc or "best selling" in desc:
        rows = query(
            """SELECT p.name, p.category,
                SUM(s.quantity) as units_sold, SUM(s.total_amount) as revenue,
                ROUND(SUM(s.total_amount - s.quantity * p.cost), 2) as profit
            FROM sales s
            JOIN products p ON s.product_id = p.id
            WHERE s.sale_date >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY p.id ORDER BY revenue DESC LIMIT 10"""
        )
        return {"query": "Top products by revenue (last 30 days)", "results": rows}

    elif "revenue by region" in desc or "regional" in desc:
        rows = query(
            """SELECT region,
                SUM(total_amount) as revenue, SUM(quantity) as units, COUNT(*) as orders
            FROM sales
            WHERE sale_date >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY region ORDER BY revenue DESC"""
        )
        return {"query": "Revenue by region (last 30 days)", "results": rows}

    elif "revenue by category" in desc or "category" in desc:
        rows = query(
            """SELECT p.category,
                SUM(s.total_amount) as revenue, SUM(s.quantity) as units,
                COUNT(DISTINCT p.id) as products
            FROM sales s
            JOIN products p ON s.product_id = p.id
            WHERE s.sale_date >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY p.category ORDER BY revenue DESC"""
        )
        return {"query": "Revenue by category (last 30 days)", "results": rows}

    elif "daily revenue" in desc or "revenue trend" in desc or "revenue over time" in desc:
        rows = query(
            """SELECT sale_date as date, SUM(total_amount) as revenue, SUM(quantity) as units
            FROM sales
            WHERE sale_date >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY sale_date ORDER BY sale_date"""
        )
        return {"query": "Daily revenue trend (last 30 days)", "results": rows}

    elif "customer" in desc and "segment" in desc:
        rows = query(
            """SELECT segment, COUNT(*) as count,
                SUM(total_orders) as total_orders, ROUND(SUM(total_spent), 2) as total_spent,
                ROUND(AVG(total_spent), 2) as avg_spent
            FROM customers GROUP BY segment ORDER BY total_spent DESC"""
        )
        return {"query": "Customer segment breakdown", "results": rows}

    elif "profit" in desc:
        rows = query(
            """SELECT p.name,
                SUM(s.total_amount) as revenue,
                SUM(s.quantity * p.cost) as total_cost,
                ROUND(SUM(s.total_amount) - SUM(s.quantity * p.cost), 2) as profit,
                ROUND((SUM(s.total_amount) - SUM(s.quantity * p.cost)) / SUM(s.total_amount) * 100, 1) as margin_pct
            FROM sales s
            JOIN products p ON s.product_id = p.id
            WHERE s.sale_date >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY p.id ORDER BY profit DESC"""
        )
        return {"query": "Product profitability (last 30 days)", "results": rows}

    elif "monthly" in desc:
        rows = query(
            """SELECT strftime('%Y-%m', sale_date) as month,
                SUM(total_amount) as revenue, SUM(quantity) as units, COUNT(*) as orders
            FROM sales
            GROUP BY month ORDER BY month"""
        )
        return {"query": "Monthly revenue summary", "results": rows}

    else:
        # General summary
        rows = query(
            """SELECT
                (SELECT COUNT(*) FROM products) as total_products,
                (SELECT COUNT(*) FROM sales) as total_sales,
                (SELECT ROUND(SUM(total_amount), 2) FROM sales) as total_revenue,
                (SELECT COUNT(*) FROM customers) as total_customers,
                (SELECT COUNT(*) FROM suppliers) as total_suppliers"""
        )
        return {"query": "General database summary", "results": rows}
