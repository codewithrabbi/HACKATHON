"""Forecast API routes."""
from fastapi import APIRouter
from tools.forecast_tool import forecast_demand, predict_stockout
from database.db import query

router = APIRouter(prefix="/api/forecasts", tags=["forecasts"])


@router.get("/demand")
async def demand_forecasts():
    """Get demand forecasts for all products."""
    products = query("SELECT name FROM products ORDER BY name")
    forecasts = []
    for p in products:
        fc = forecast_demand(p["name"], 30)
        if "error" not in fc:
            forecasts.append(fc)
    return {"data": forecasts}


@router.get("/demand/{product_name}")
async def product_demand(product_name: str):
    """Get demand forecast for a specific product."""
    return forecast_demand(product_name, 30)


@router.get("/stockout")
async def stockout_predictions():
    """Get stockout predictions for all products."""
    products = query("SELECT name FROM products ORDER BY name")
    predictions = []
    for p in products:
        pred = predict_stockout(p["name"])
        if "error" not in pred:
            predictions.append(pred)
    return {"data": predictions}


@router.get("/revenue")
async def revenue_projection():
    """Get revenue projection based on current trends."""
    monthly = query(
        """SELECT TO_CHAR(sale_date, 'YYYY-MM') as month,
            SUM(total_amount) as revenue
        FROM sales
        GROUP BY month
        ORDER BY month"""
    )

    if len(monthly) >= 2:
        recent = [float(m["revenue"]) for m in monthly[-3:]]
        avg_growth = sum(
            (recent[i + 1] - recent[i]) / recent[i] * 100 if recent[i] else 0
            for i in range(len(recent) - 1)
        ) / max(len(recent) - 1, 1)
    else:
        avg_growth = 0

    last_rev = float(monthly[-1]["revenue"]) if monthly else 0
    projection = []
    for i in range(1, 4):
        projected = round(last_rev * (1 + avg_growth / 100) ** i, 2)
        projection.append({
            "month": f"Month +{i}",
            "projected_revenue": projected,
            "lower_bound": round(projected * 0.85, 2),
            "upper_bound": round(projected * 1.15, 2),
        })

    for m in monthly:
        m["revenue"] = float(m["revenue"])

    return {
        "historical": monthly,
        "projection": projection,
        "avg_growth_pct": round(avg_growth, 1),
    }
