import csv
from io import StringIO
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from database.db import get_connection

from agent.openrouter_engine import auto_map_csv
from agent.engine import generate_insights, generate_actions, generate_revenue_leakage

router = APIRouter(prefix="/api/data", tags=["Data Upload"])

import pandas as pd
import numpy as np

@router.post("/upload")
async def upload_data(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    dataType: str = Form(...)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")
        
    content = await file.read()
    
    try:
        # Read CSV with pandas
        text = content.decode('utf-8-sig')
        df = pd.read_csv(StringIO(text))
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="The uploaded file is empty or invalid.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")

    if df.empty:
        raise HTTPException(status_code=400, detail="The uploaded file contains no data rows.")
        
    target_table = dataType
    if target_table not in ["sales", "inventory"]:
        raise HTTPException(status_code=400, detail=f"Invalid target table: {target_table}")

    valid_cols_sales = ["transaction_id", "date", "customer_id", "product_id", "quantity", "unit_price", "discount", "tax", "total_amount", "payment_status", "payment_method", "sales_channel", "salesperson_id", "region"]
    valid_cols_inv = ["product_id", "supplier_id", "current_stock", "reorder_point", "max_capacity", "warehouse", "last_restocked"]

    target_cols = valid_cols_sales if target_table == "sales" else valid_cols_inv

    # 1. Column Validation
    missing_cols = [col for col in target_cols if col not in df.columns]
    if missing_cols:
        raise HTTPException(
            status_code=400, 
            detail=f"Missing required columns for {target_table} data: {', '.join(missing_cols)}"
        )

    # Filter to only required columns to avoid injecting unnecessary data
    df = df[target_cols]

    # 2. Missing Value (NaN) Validation
    # Replace empty strings or pure whitespace with NaN to catch empty cells
    df.replace(r'^\s*$', np.nan, regex=True, inplace=True)
    if df.isnull().values.any():
        null_counts = df.isnull().sum()
        cols_with_nulls = null_counts[null_counts > 0].index.tolist()
        raise HTTPException(
            status_code=400,
            detail=f"Uploaded data contains missing/empty values in columns: {', '.join(cols_with_nulls)}. Please fix the CSV and try again."
        )

    # 3. Foreign Key Validation & 4. Bulk Insert
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # Check product_id
            cursor.execute("SELECT id FROM products")
            existing_products = set(row['id'] for row in cursor.fetchall())
            
            uploaded_products = set(df['product_id'].astype(str).unique())
            missing_products = uploaded_products - existing_products
            
            if missing_products:
                missing_list = list(missing_products)[:5]
                more_text = f" and {len(missing_products) - 5} more" if len(missing_products) > 5 else ""
                raise HTTPException(
                    status_code=400,
                    detail=f"Foreign Key Error: The following product_ids do not exist in the database: {', '.join(missing_list)}{more_text}. Please add these products first."
                )
                
            if target_table == "inventory":
                cursor.execute("SELECT id FROM suppliers")
                existing_suppliers = set(row['id'] for row in cursor.fetchall())
                
                uploaded_suppliers = set(df['supplier_id'].astype(str).unique())
                missing_suppliers = uploaded_suppliers - existing_suppliers
                
                if missing_suppliers:
                    missing_list = list(missing_suppliers)[:5]
                    more_text = f" and {len(missing_suppliers) - 5} more" if len(missing_suppliers) > 5 else ""
                    raise HTTPException(
                        status_code=400,
                        detail=f"Foreign Key Error: The following supplier_ids do not exist in the database: {', '.join(missing_list)}{more_text}. Please add these suppliers first."
                    )

            # Bulk Insert
            from psycopg2.extras import execute_values
            
            if target_table == "sales":
                # Rename 'date' back to 'sale_date' to match the database schema while allowing the CSV to just use 'date'
                df.rename(columns={'date': 'sale_date'}, inplace=True)
                data_tuples = [tuple(x) for x in df.to_numpy()]
                inserted_count = len(df)
                
                insert_query = """
                    INSERT INTO sales (transaction_id, sale_date, customer_id, product_id, quantity, unit_price, discount, tax, total_amount, payment_status, payment_method, sales_channel, salesperson_id, region)
                    VALUES %s
                """
                execute_values(cursor, insert_query, data_tuples)
            elif target_table == "inventory":
                data_tuples = [tuple(x) for x in df.to_numpy()]
                inserted_count = len(df)
                
                # ON CONFLICT DO UPDATE for Postgres
                insert_query = """
                    INSERT INTO inventory (product_id, supplier_id, current_stock, reorder_point, max_capacity, warehouse, last_restocked)
                    VALUES %s
                    ON CONFLICT (product_id) DO UPDATE SET
                        supplier_id = EXCLUDED.supplier_id,
                        current_stock = EXCLUDED.current_stock,
                        reorder_point = EXCLUDED.reorder_point,
                        max_capacity = EXCLUDED.max_capacity,
                        warehouse = EXCLUDED.warehouse,
                        last_restocked = EXCLUDED.last_restocked
                """
                execute_values(cursor, insert_query, data_tuples)
                
            conn.commit()
            
    except HTTPException:
        # Re-raise HTTPExceptions so they get returned to the user cleanly
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database insertion failed: {str(e)}")
    finally:
        conn.close()
        
    background_tasks.add_task(generate_insights)
    background_tasks.add_task(generate_actions)
    background_tasks.add_task(generate_revenue_leakage)
    return {"status": "success", "inserted": inserted_count, "table": target_table, "mapping": {}}

@router.delete("/reset_all")
async def reset_all_data():
    """Delete all user data from the database."""
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # Delete in an order that respects foreign keys (if they exist)
            cursor.execute("DELETE FROM sales")
            cursor.execute("DELETE FROM inventory")
            cursor.execute("DELETE FROM products")
            cursor.execute("DELETE FROM suppliers")
            cursor.execute("DELETE FROM customers")
            cursor.execute("DELETE FROM alerts")
            cursor.execute("DELETE FROM actions")
            cursor.execute("DELETE FROM ai_insights_cache")
            cursor.execute("DELETE FROM revenue_leakage_cache")
        conn.commit()
        return {"status": "success", "message": "All data deleted successfully."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
