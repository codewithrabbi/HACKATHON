from fastapi import APIRouter, HTTPException
from database.db import get_connection

router = APIRouter(prefix="/api/leakage", tags=["Revenue Leakage"])

@router.get("/")
def get_revenue_leakage():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, problem, evidence, financial_impact, recommended_action, created_at FROM revenue_leakage_cache ORDER BY created_at DESC")
            rows = cursor.fetchall()
            return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
