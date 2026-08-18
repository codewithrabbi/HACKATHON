"""Inventory API routes."""
from fastapi import APIRouter
from tools.inventory_tool import get_inventory_status, get_stockout_risk
from tools.anomaly_tool import get_supplier_performance

router = APIRouter(prefix="/api/inventory", tags=["inventory"])


@router.get("/status")
async def inventory_status():
    """Get full inventory status."""
    return get_inventory_status()


@router.get("/risks")
async def inventory_risks():
    """Get stock-out risk assessment."""
    return get_stockout_risk()


@router.get("/suppliers")
async def suppliers():
    """Get supplier performance analysis."""
    return get_supplier_performance()
