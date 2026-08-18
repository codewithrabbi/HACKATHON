"""Demand forecasting tools for the AI agent."""
from database.db import query


def forecast_demand(product_name: str, days: int = 30) -> dict:
    """Forecast future demand for a product using moving average analysis.

    Args:
        product_name: Name of the product (e.g. 'Product A').
        days: Number of days to forecast ahead. Defaults to 30.

    Returns:
        Dictionary with forecast data including daily predictions and confidence.
    """
    # Get last 60 days of actual sales
    historical = query(
        """SELECT s.sale_date as date, SUM(s.quantity) as units, SUM(s.total_amount) as revenue
        FROM sales s
        JOIN products p ON s.product_id = p.id
        WHERE p.name LIKE ? AND s.sale_date >= CURRENT_DATE - INTERVAL '60 days'
        GROUP BY s.sale_date
        ORDER BY s.sale_date""",
        (f"%{product_name}%",),
    )

    if not historical:
        return {"error": f"No sales data found for '{product_name}'"}

    units = [h["units"] for h in historical]

    # 7-day moving average
    window = 7
    if len(units) >= window:
        ma = sum(units[-window:]) / window
    else:
        ma = sum(units) / len(units)

    # Detect trend (last 14d vs previous 14d)
    if len(units) >= 28:
        recent = sum(units[-14:]) / 14
        prior = sum(units[-28:-14]) / 14
        trend_pct = ((recent - prior) / prior * 100) if prior else 0
    else:
        trend_pct = 0

    # Generate forecast
    forecast = []
    for d in range(1, days + 1):
        # Apply trend decay
        trend_factor = 1 + (trend_pct / 100) * (0.95 ** d)
        predicted = round(ma * trend_factor, 1)
        forecast.append({
            "day": d,
            "predicted_units": max(0, predicted),
            "lower_bound": max(0, round(predicted * 0.8, 1)),
            "upper_bound": round(predicted * 1.2, 1),
        })

    return {
        "product": product_name,
        "forecast_days": days,
        "moving_average": round(ma, 1),
        "trend_pct": round(trend_pct, 1),
        "trend_direction": "declining" if trend_pct < -5 else "growing" if trend_pct > 5 else "stable",
        "forecast": forecast,
        "historical_days": len(historical),
    }


def predict_stockout(product_name: str) -> dict:
    """Predict when a product will run out of stock based on current trends.

    Args:
        product_name: Name of the product (e.g. 'Product A').

    Returns:
        Dictionary with stockout prediction details.
    """
    # Get current inventory
    inv = query(
        """SELECT i.current_stock, i.reorder_point,
            s.name as supplier, s.avg_delivery_days
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        JOIN suppliers s ON i.supplier_id = s.id
        WHERE p.name LIKE ?""",
        (f"%{product_name}%",),
    )

    if not inv:
        return {"error": f"Product '{product_name}' not found"}

    inv = inv[0]

    # Get average daily sales
    daily = query(
        """SELECT COALESCE(AVG(daily_qty), 0) as avg FROM (
            SELECT SUM(quantity) as daily_qty FROM sales s
            JOIN products p ON s.product_id = p.id
            WHERE p.name LIKE ? AND s.sale_date >= CURRENT_DATE - INTERVAL '14 days'
            GROUP BY s.sale_date
        )""",
        (f"%{product_name}%",),
    )

    avg_daily = daily[0]["avg"] if daily else 0

    if avg_daily <= 0:
        return {
            "product": product_name,
            "status": "no_recent_sales",
            "current_stock": inv["current_stock"],
        }

    days_to_stockout = round(inv["current_stock"] / avg_daily, 1)
    days_to_reorder = round(inv["reorder_point"] / avg_daily, 1)

    return {
        "product": product_name,
        "current_stock": inv["current_stock"],
        "reorder_point": inv["reorder_point"],
        "avg_daily_sales": round(avg_daily, 1),
        "days_until_stockout": days_to_stockout,
        "days_until_reorder_point": round(max(0, (inv["current_stock"] - inv["reorder_point"]) / avg_daily), 1),
        "supplier": inv["supplier"],
        "supplier_delivery_days": inv["avg_delivery_days"],
        "risk_level": "critical" if days_to_stockout < inv["avg_delivery_days"] else "warning" if days_to_stockout < inv["avg_delivery_days"] * 2 else "safe",
    }
