"""Gemini AI Agent Engine with function calling and SSE streaming."""
import os
import json
import asyncio
from typing import AsyncGenerator
from google import genai
from google.genai import types
from decimal import Decimal
import datetime

from tools.sales_tool import get_sales_summary, get_product_sales, compare_sales_periods
from tools.inventory_tool import get_inventory_status, get_stockout_risk, get_inventory_by_product
from tools.forecast_tool import forecast_demand, predict_stockout
from tools.anomaly_tool import detect_anomalies, get_supplier_performance
from tools.data_tool import run_query
from database.db import query, execute, execute_many

# ── System prompt ────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are OpsPilot AI, an intelligent business operations copilot.

CRITICAL COMMUNICATION RULES:
1. ZERO FLUFF: NEVER use conversational filler like "Here is the data", "Based on my analysis", or "I have found the following". Start your answer immediately with the core facts.
2. EXTREMELY CONCISE: Do not write long paragraphs. Keep sentences short and direct.
3. HIGH SCANNABILITY: Always use bullet points, bold text for metrics, and clean formatting so data is readable at a single glance.
4. ACTION-FIRST: Only mention what matters. If a product is low on stock, state it and give the exact reorder quantity.

Example of a GOOD response:
**Top Selling Products (This Month):**
- **Wireless Earbuds:** 450 units ($12,500)
- **Smart Watch:** 320 units ($9,200)

**Alerts:**
- Wireless Earbuds stock is low (12 units left).
- **Action:** Reorder 500 units immediately.

5. CHARTS: If the user explicitly asks for a graph, chart, trend, or visualization, you MUST draw a chart by outputting a JSON code block with the language `chart`.
Example:
```chart
{
  "type": "bar",
  "data": [{"name": "Jan", "sales": 400}, {"name": "Feb", "sales": 500}],
  "xKey": "name",
  "yKey": "sales"
}
```
Supported types: "bar", "line". DO NOT output markdown tables if you output a chart.

You have access to tools for: sales analysis, inventory management, demand forecasting, anomaly detection, supplier performance, and SQL queries. Use them to fetch real data before answering."""

# ── Tool definitions for Gemini ──────────────────────────────────────────────
TOOL_FUNCTIONS = {
    "get_sales_summary": get_sales_summary,
    "get_product_sales": get_product_sales,
    "compare_sales_periods": compare_sales_periods,
    "get_inventory_status": get_inventory_status,
    "get_stockout_risk": get_stockout_risk,
    "get_inventory_by_product": get_inventory_by_product,
    "forecast_demand": forecast_demand,
    "predict_stockout": predict_stockout,
    "detect_anomalies": detect_anomalies,
    "get_supplier_performance": get_supplier_performance,
    "run_query": run_query,
}

TOOLS = [
    types.Tool(function_declarations=[
        types.FunctionDeclaration(
            name="get_sales_summary",
            description="Get sales summary including total revenue, order count, and trends for a given period.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "period": types.Schema(type=types.Type.STRING, description="Time period: '7d', '30d', '90d', or '180d'"),
                },
            ),
        ),
        types.FunctionDeclaration(
            name="get_product_sales",
            description="Get detailed sales data for a specific product including daily breakdown.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "product_name": types.Schema(type=types.Type.STRING, description="Product name, e.g. 'Product A'"),
                    "period": types.Schema(type=types.Type.STRING, description="Time period: '7d', '30d', '90d', or '180d'"),
                },
                required=["product_name"],
            ),
        ),
        types.FunctionDeclaration(
            name="compare_sales_periods",
            description="Compare sales metrics between two time periods to identify trends.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "period1": types.Schema(type=types.Type.STRING, description="First period: 'current_month', 'last_30d', 'last_7d'"),
                    "period2": types.Schema(type=types.Type.STRING, description="Second period: 'previous_month', 'prev_30d', 'prev_7d'"),
                },
            ),
        ),
        types.FunctionDeclaration(
            name="get_inventory_status",
            description="Get complete inventory status for all products with stock levels and health scores.",
            parameters=types.Schema(type=types.Type.OBJECT, properties={}),
        ),
        types.FunctionDeclaration(
            name="get_stockout_risk",
            description="Get products at risk of running out of stock with urgency ratings.",
            parameters=types.Schema(type=types.Type.OBJECT, properties={}),
        ),
        types.FunctionDeclaration(
            name="get_inventory_by_product",
            description="Get inventory details for a specific product.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "product_name": types.Schema(type=types.Type.STRING, description="Product name, e.g. 'Product A'"),
                },
                required=["product_name"],
            ),
        ),
        types.FunctionDeclaration(
            name="forecast_demand",
            description="Forecast future demand for a product using moving average analysis.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "product_name": types.Schema(type=types.Type.STRING, description="Product name, e.g. 'Product A'"),
                    "days": types.Schema(type=types.Type.INTEGER, description="Number of days to forecast (default 30)"),
                },
                required=["product_name"],
            ),
        ),
        types.FunctionDeclaration(
            name="predict_stockout",
            description="Predict when a product will run out of stock based on current sales trends.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "product_name": types.Schema(type=types.Type.STRING, description="Product name, e.g. 'Product A'"),
                },
                required=["product_name"],
            ),
        ),
        types.FunctionDeclaration(
            name="detect_anomalies",
            description="Detect unusual patterns in business metrics using statistical analysis.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "metric": types.Schema(type=types.Type.STRING, description="Metric to analyze: 'sales', 'revenue', 'orders'"),
                    "period": types.Schema(type=types.Type.STRING, description="Time period: '7d', '30d', '90d'"),
                },
            ),
        ),
        types.FunctionDeclaration(
            name="get_supplier_performance",
            description="Analyze supplier performance including delivery times and reliability scores.",
            parameters=types.Schema(type=types.Type.OBJECT, properties={}),
        ),
        types.FunctionDeclaration(
            name="run_query",
            description="Execute a business data query. Provide a description like 'top products by revenue', 'revenue by region', 'monthly trends', 'customer segments', 'profitability'.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "sql_description": types.Schema(type=types.Type.STRING, description="Description of the data needed"),
                },
                required=["sql_description"],
            ),
        ),
    ])
]


def _get_client():
    """Get Gemini client. Raises if no API key."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not set")
    return genai.Client(api_key=api_key)

def _clean_types(obj):
    """Recursively clean unsupported types like Decimal or date for JSON serialization."""
    if isinstance(obj, dict):
        return {k: _clean_types(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_clean_types(v) for v in obj]
    elif isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, (datetime.date, datetime.datetime)):
        return obj.isoformat()
    return obj


def _execute_tool(name: str, args: dict) -> dict:
    """Execute a tool function by name."""
    fn = TOOL_FUNCTIONS.get(name)
    if not fn:
        return {"error": f"Unknown tool: {name}"}
    try:
        result = fn(**args)
        return _clean_types(result)
    except Exception as e:
        return {"error": str(e)}

# Use primary stable model and fallback
FALLBACK_MODELS = [
    "gemini-3.6-flash",
    "gemini-3.5-flash",
]

async def _generate_content_with_retry(client, contents, config):
    """Attempt to generate content iterating through fallback models, handling rate limits."""
    last_exception = None
    
    for model in FALLBACK_MODELS:
        for attempt in range(2): # Try each model 2 times
            try:
                return await asyncio.to_thread(
                    client.models.generate_content,
                    model=model,
                    contents=contents,
                    config=config,
                )
            except Exception as e:
                last_exception = e
                err_str = str(e)
                print(f"Model {model} (Attempt {attempt+1}) failed: {err_str}")
                
                if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                    if "limit: 0" in err_str:
                        break # User has no access to this model, skip immediately
                    print("Rate limit hit. Waiting 5 seconds before retry...")
                    await asyncio.sleep(5)
                elif "503" in err_str or "UNAVAILABLE" in err_str:
                    await asyncio.sleep(2)
                else:
                    break # Break out of attempts and go to next model
                    
    # If all fail, return a friendly JSON error instead of crashing the backend
    error_msg = str(last_exception)
    if "429" in error_msg:
        error_msg = "Please wait a few seconds before asking the next question (Google API Free Tier Rate Limit)."
    
    return {"error": error_msg}


async def chat_stream(user_message: str, history: list = None) -> AsyncGenerator[str, None]:
    """Run the agentic chat loop with streaming output.

    Yields SSE-formatted strings: 'data: {...}\n\n'
    """
    try:
        client = _get_client()
    except ValueError as e:
        yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"
        return

    messages = []
    if history:
        for msg in history:
            role = "user" if msg.get("role") == "user" else "model"
            messages.append(types.Content(role=role, parts=[types.Part.from_text(text=msg["content"])]))

    messages.append(types.Content(role="user", parts=[types.Part.from_text(text=user_message)]))

    config = types.GenerateContentConfig(
        system_instruction=SYSTEM_PROMPT,
        tools=TOOLS,
        temperature=0.7,
        max_output_tokens=4096,
    )

    # Agentic loop — keep going until the model stops calling tools
    max_iterations = 10
    for iteration in range(max_iterations):
        try:
            response = await _generate_content_with_retry(
                client=client,
                contents=messages,
                config=config,
            )
            
            if isinstance(response, dict) and "error" in response:
                error_content = response.get("error", "Unknown error")
                
                # Check for OpenRouter fallback
                from agent.openrouter_engine import openrouter_chat_stream
                import os
                if "Rate Limit" in error_content and os.getenv("OPENROUTER_API_KEY"):
                    yield f"data: {json.dumps({'type': 'tool_call', 'content': 'Google API limit reached. Falling back to OpenRouter...'})}\n\n"
                    async for chunk in openrouter_chat_stream(user_message, history):
                        yield chunk
                    return
                
                yield f"data: {json.dumps({'type': 'error', 'content': f'OpsPilot Error: {error_content}'})}\n\n"
                return
                
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'content': f'Gemini API error: {str(e)}'})}\n\n"
            return

        if not response.candidates:
            yield f"data: {json.dumps({'type': 'error', 'content': 'No response from Gemini'})}\n\n"
            return

        candidate = response.candidates[0]
        parts = candidate.content.parts if candidate.content else []

        # Check for function calls
        function_calls = [p for p in parts if p.function_call]

        if not function_calls:
            # No more tool calls — extract text response
            text_parts = [p.text for p in parts if p.text]
            full_text = "\n".join(text_parts)

            # Stream the response in chunks
            words = full_text.split(" ")
            chunk = ""
            for i, word in enumerate(words):
                chunk += word + " "
                if len(chunk) > 40 or i == len(words) - 1:
                    yield f"data: {json.dumps({'type': 'content', 'content': chunk.strip()})}\n\n"
                    chunk = ""
                    await asyncio.sleep(0.02)

            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            return

        # Execute tool calls
        messages.append(candidate.content)
        tool_response_parts = []

        for part in function_calls:
            fc = part.function_call
            tool_name = fc.name
            tool_args = dict(fc.args) if fc.args else {}

            yield f"data: {json.dumps({'type': 'tool_call', 'tool': tool_name, 'args': tool_args})}\n\n"

            result = _execute_tool(tool_name, tool_args)

            yield f"data: {json.dumps({'type': 'tool_result', 'tool': tool_name, 'success': 'error' not in result})}\n\n"

            tool_response_parts.append(
                types.Part.from_function_response(
                    name=tool_name,
                    response=result,
                )
            )

        messages.append(types.Content(role="user", parts=tool_response_parts))

    yield f"data: {json.dumps({'type': 'error', 'content': 'Max iterations reached'})}\n\n"


async def generate_insights() -> list[dict]:
    """Generate AI-powered business insights for the dashboard."""
    try:
        client = _get_client()
    except ValueError:
        return _fallback_insights()

    # Gather data for insights
    sales = get_sales_summary("30d")
    anomalies = detect_anomalies("sales", "30d")
    risks = get_stockout_risk()

    def decimal_default(obj):
        if isinstance(obj, Decimal):
            return float(obj)
        raise TypeError

    context = f"""Based on this data, generate 3-4 brief, actionable intelligence items:
    Sales Summary: {json.dumps(sales, default=decimal_default)}
    Anomalies: {json.dumps(anomalies, default=decimal_default)}
    Stock Risks: {json.dumps(risks, default=decimal_default)}

    Format each insight as a JSON object with: title, description (1-2 sentences), severity (critical/warning/info), category.
    Return ONLY a JSON array, no other text."""

    try:
        response = await _generate_content_with_retry(
            client=client,
            contents=context,
            config=types.GenerateContentConfig(temperature=0.3),
        )
        text = response.text.strip()
        # Clean markdown code fences if present
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
            
        insights_data = json.loads(text)
        
        # Format explicitly as fallback format if list parsing works
        if isinstance(insights_data, list):
            _cache_insights(insights_data)
            return insights_data
            
        return _fallback_insights()
    except Exception:
        return _fallback_insights()


def _cache_insights(insights: list[dict]):
    """Store generated insights in the database cache."""
    execute("DELETE FROM ai_insights_cache")
    
    rows = []
    for insight in insights:
        rows.append((
            insight.get("title", "Insight"),
            insight.get("description", ""),
            insight.get("severity", "info"),
            insight.get("category", "general")
        ))
        
    if rows:
        execute_many(
            "INSERT INTO ai_insights_cache (title, description, severity, category) VALUES (%s, %s, %s, %s)",
            rows
        )


async def get_cached_insights() -> list[dict]:
    """Get insights from cache or trigger generation if cache is empty."""
    try:
        cached = query("SELECT title, description, severity, category FROM ai_insights_cache ORDER BY id ASC")
        if cached and len(cached) > 0:
            return cached
    except Exception as e:
        print(f"Cache error: {e}")
        pass
        
    # If cache is empty or fails, just return a default message instead of generating
    return [{
        "title": "No Insights Available",
        "description": "Please upload a CSV file to generate AI insights.",
        "severity": "info",
        "category": "general"
    }]


def _fallback_insights() -> list[dict]:
    """Return static insights when AI is unavailable."""
    sales = get_sales_summary("30d")
    anomalies = detect_anomalies("sales", "30d")
    risks = get_stockout_risk()

    insights = []

    if sales.get("revenue_change_pct", 0) < -10:
        insights.append({
            "title": "Revenue Declining",
            "description": f"Revenue is down {abs(sales['revenue_change_pct'])}% compared to the previous period. Investigate product-level trends.",
            "severity": "critical",
            "category": "revenue",
        })

    for a in anomalies.get("anomalies", [])[:2]:
        insights.append({
            "title": f"{a.get('product', a.get('region', 'Metric'))} {a['direction'].title()}",
            "description": f"{a.get('product', a.get('region', ''))} changed by {a['change_pct']}% vs previous period.",
            "severity": a.get("severity", "warning"),
            "category": "anomaly",
        })

    if risks.get("total_at_risk", 0) > 0:
        products = [p["name"] for p in risks["at_risk_products"][:3]]
        insights.append({
            "title": f"{risks['total_at_risk']} Products at Stock-Out Risk",
            "description": f"Products at risk: {', '.join(products)}. Review reorder schedules.",
            "severity": "warning",
            "category": "inventory",
        })

    return insights[:4]

async def generate_actions() -> list[dict]:
    """Generate recommended actions based on current data state."""
    client = _get_client()
    if not client:
        return []

    # Gather context
    sales = get_sales_summary("30d")
    anomalies = detect_anomalies("sales", "30d")
    risks = get_stockout_risk()

    context = f"""
    Analyze the following business metrics and generate 3 to 5 actionable recommendations for the operations team.
    
    Sales Data (Last 30 Days):
    {json.dumps(sales, indent=2)}
    
    Detected Anomalies:
    {json.dumps(anomalies, indent=2)}
    
    Inventory Risks:
    {json.dumps(risks, indent=2)}
    
    Output exactly a JSON array of objects.
    Format each action as a JSON object with: 
    - title (short, actionable)
    - description (1-2 sentences)
    - priority ('high', 'medium', or 'low')
    - category (e.g. 'inventory', 'sales', 'supplier')
    
    Return ONLY a JSON array, no other text.
    """

    try:
        response = await _generate_content_with_retry(
            client=client,
            contents=context,
            config=types.GenerateContentConfig(temperature=0.4),
        )
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
            
        actions_data = json.loads(text)
        
        if isinstance(actions_data, list):
            _cache_actions(actions_data)
            return actions_data
            
        return []
    except Exception as e:
        print(f"Error generating actions: {e}")
        return []

def _cache_actions(actions: list[dict]):
    """Store generated actions in the database."""
    execute("DELETE FROM actions")
    
    rows = []
    for action in actions:
        rows.append((
            action.get("title", "Action Item"),
            action.get("description", ""),
            action.get("priority", "medium").lower(),
            action.get("category", "general")
        ))
        
    if rows:
        execute_many(
            "INSERT INTO actions (title, description, priority, category) VALUES (%s, %s, %s, %s)",
            rows
        )

async def generate_revenue_leakage() -> list[dict]:
    """Analyze database for revenue leakage and anomalies."""
    client = _get_client()
    if not client:
        return []

    sales = get_sales_summary("30d")
    anomalies = detect_anomalies("sales", "30d")
    risks = get_stockout_risk()
    
    # Fetch actual suspicious transactions for the AI to analyze
    suspicious_sales = query("""
        SELECT transaction_id, product_id, quantity, unit_price, discount, tax, total_amount, payment_status
        FROM sales 
        WHERE payment_status IN ('Pending', 'Failed', 'Refunded') 
        OR discount > (quantity * unit_price * 0.2)
        LIMIT 20
    """)

    context = f"""
    You are an elite AI Revenue Leakage Detector.
    Analyze the following business metrics and raw suspicious transactions to find hidden revenue leakages.
    Look for specific issues like: Wrong pricing, Unusual discounts, Refund anomalies, Missing transactions, Billing errors, Inventory shrinkage, Supplier overcharging, Excess operational expenses, Suspicious transactions.
    
    Data:
    Sales Summary: {json.dumps(_clean_types(sales), indent=2)}
    Anomalies: {json.dumps(_clean_types(anomalies), indent=2)}
    Inventory Risks: {json.dumps(_clean_types(risks), indent=2)}
    Suspicious Transactions Sample: {json.dumps(_clean_types(suspicious_sales), indent=2)}
    
    Format the output exactly as a JSON array of objects.
    Each object MUST have:
    - problem (Short title, e.g. "Unusual Discount Applied")
    - evidence (Data proof, 1 sentence)
    - financial_impact (Estimated amount in USD, e.g. "$1,200 loss")
    - recommended_action (What to do to fix it, 1 sentence)
    
    Output ONLY a JSON array.
    """

    try:
        response = await _generate_content_with_retry(
            client=client,
            contents=context,
            config=types.GenerateContentConfig(temperature=0.4),
        )
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
            
        leakage_data = json.loads(text)
        
        if isinstance(leakage_data, list):
            _cache_leakages(leakage_data)
            return leakage_data
            
        return []
    except Exception as e:
        print(f"Error generating leakage data: {e}")
        return []

def _cache_leakages(leakages: list[dict]):
    """Store generated leakages in the database."""
    execute("DELETE FROM revenue_leakage_cache")
    
    rows = []
    for l in leakages:
        rows.append((
            l.get("problem", "Unknown Issue"),
            l.get("evidence", "No evidence provided"),
            l.get("financial_impact", "$0"),
            l.get("recommended_action", "Investigate further")
        ))
        
    if rows:
        execute_many(
            "INSERT INTO revenue_leakage_cache (problem, evidence, financial_impact, recommended_action) VALUES (%s, %s, %s, %s)",
            rows
        )
