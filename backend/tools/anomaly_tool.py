"""Anomaly detection and supplier performance tools for the AI agent."""
from database.db import query


def detect_anomalies(metric: str = "sales", period: str = "30d") -> dict:
    """Detect unusual patterns in business metrics using statistical analysis.

    Args:
        metric: Which metric to analyze - 'sales', 'revenue', or 'orders'. Defaults to 'sales'.
        period: Time period to analyze - '7d', '30d', '90d'. Defaults to '30d'.

    Returns:
        Dictionary with detected anomalies and their details.
    """
    days = {"7d": 7, "30d": 30, "90d": 90}.get(period, 30)

    # Get per-product performance
    current = query(
        """SELECT p.name, p.category,
            SUM(s.quantity) as units, SUM(s.total_amount) as revenue, COUNT(*) as transactions
        FROM sales s
        JOIN products p ON s.product_id = p.id
        WHERE s.sale_date >= CURRENT_DATE + ?::interval
        GROUP BY p.id
        ORDER BY revenue DESC""",
        (f"-{days} days",),
    )

    previous = query(
        """SELECT p.name,
            SUM(s.quantity) as units, SUM(s.total_amount) as revenue
        FROM sales s
        JOIN products p ON s.product_id = p.id
        WHERE s.sale_date >= CURRENT_DATE + ?::interval AND s.sale_date < CURRENT_DATE + ?::interval
        GROUP BY p.id""",
        (f"-{days * 2} days", f"-{days} days"),
    )

    prev_map = {r["name"]: r for r in previous}
    anomalies = []

    for prod in current:
        prev = prev_map.get(prod["name"], {})
        prev_rev = prev.get("revenue", 0) or 0
        curr_rev = prod.get("revenue", 0) or 0

        if prev_rev > 0:
            change = (curr_rev - prev_rev) / prev_rev * 100
            if abs(change) > 15:  # >15% change is flagged
                anomalies.append({
                    "product": prod["name"],
                    "category": prod["category"],
                    "metric": metric,
                    "current_value": round(curr_rev, 2),
                    "previous_value": round(prev_rev, 2),
                    "change_pct": round(change, 1),
                    "direction": "decline" if change < 0 else "increase",
                    "severity": "critical" if abs(change) > 30 else "warning",
                })

    # Regional anomalies
    regional = query(
        """SELECT region,
            SUM(CASE WHEN sale_date >= CURRENT_DATE + ?::interval THEN total_amount ELSE 0 END) as current_rev,
            SUM(CASE WHEN sale_date >= CURRENT_DATE + ?::interval AND sale_date < CURRENT_DATE + ?::interval THEN total_amount ELSE 0 END) as prev_rev
        FROM sales
        WHERE sale_date >= CURRENT_DATE + ?::interval
        GROUP BY region""",
        (f"-{days} days", f"-{days * 2} days", f"-{days} days", f"-{days * 2} days"),
    )

    for r in regional:
        if r["prev_rev"] and r["prev_rev"] > 0:
            change = (r["current_rev"] - r["prev_rev"]) / r["prev_rev"] * 100
            if abs(change) > 20:
                anomalies.append({
                    "region": r["region"],
                    "metric": "regional_revenue",
                    "current_value": round(r["current_rev"], 2),
                    "previous_value": round(r["prev_rev"], 2),
                    "change_pct": round(change, 1),
                    "direction": "decline" if change < 0 else "increase",
                    "severity": "warning",
                })

    anomalies.sort(key=lambda x: abs(x.get("change_pct", 0)), reverse=True)
    return {
        "period": period,
        "anomalies_detected": len(anomalies),
        "anomalies": anomalies,
    }


def get_supplier_performance() -> dict:
    """Analyze supplier performance including delivery times and reliability.

    Returns:
        Dictionary with supplier performance data and risk assessments.
    """
    suppliers = query(
        """SELECT
            s.id, s.name, s.country,
            s.avg_delivery_days, s.reliability_score,
            COUNT(DISTINCT i.product_id) as products_supplied,
            STRING_AGG(DISTINCT p.name, ',') as product_names
        FROM suppliers s
        LEFT JOIN inventory i ON s.id = i.supplier_id
        LEFT JOIN products p ON i.product_id = p.id
        GROUP BY s.id
        ORDER BY s.reliability_score ASC"""
    )

    # Enrich with risk assessment
    enriched = []
    for sup in suppliers:
        risk = "low"
        issues = []

        if sup["avg_delivery_days"] > 12:
            risk = "high"
            issues.append(f"Long delivery time ({sup['avg_delivery_days']} days)")
        if sup["reliability_score"] < 0.94:
            risk = "high"
            issues.append(f"Low reliability ({sup['reliability_score']})")
        elif sup["reliability_score"] < 0.97:
            if risk != "high":
                risk = "medium"
            issues.append(f"Below-target reliability ({sup['reliability_score']})")

        enriched.append({
            **dict(sup),
            "risk_level": risk,
            "issues": issues,
        })

    return {"suppliers": enriched, "high_risk_count": sum(1 for s in enriched if s["risk_level"] == "high")}
