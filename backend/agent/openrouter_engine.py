import os
import json
import asyncio
from typing import AsyncGenerator
from openai import AsyncOpenAI
from agent.engine import TOOL_FUNCTIONS, SYSTEM_PROMPT, _clean_types

# Define OpenAI compatible tools
OPENAI_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_sales_summary",
            "description": "Fetch a high-level summary of total sales, revenue, and top products over a specified period.",
            "parameters": {
                "type": "object",
                "properties": {
                    "period": {
                        "type": "string",
                        "description": "The time period for the summary. Can be 'daily', 'weekly', 'monthly' or 'yearly'."
                    }
                },
                "required": ["period"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_inventory_status",
            "description": "Fetch the current inventory levels for a specific product.",
            "parameters": {
                "type": "object",
                "properties": {
                    "product_name": {
                        "type": "string",
                        "description": "Product name, e.g. 'Product A'"
                    }
                },
                "required": ["product_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "forecast_demand",
            "description": "Forecast future demand for a product using moving average analysis.",
            "parameters": {
                "type": "object",
                "properties": {
                    "product_name": {
                        "type": "string",
                        "description": "Product name, e.g. 'Product A'",
                    },
                    "days": {
                        "type": "integer",
                        "description": "Number of days to forecast (default 30)"
                    }
                },
                "required": ["product_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "predict_stockout",
            "description": "Predict when a product will run out of stock based on current sales trends.",
            "parameters": {
                "type": "object",
                "properties": {
                    "product_name": {
                        "type": "string",
                        "description": "Product name, e.g. 'Product A'"
                    }
                },
                "required": ["product_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "detect_anomalies",
            "description": "Detect unusual patterns in business metrics using statistical analysis.",
            "parameters": {
                "type": "object",
                "properties": {
                    "metric": {
                        "type": "string",
                        "description": "The metric to analyze, e.g., 'sales' or 'inventory'."
                    }
                },
                "required": ["metric"]
            }
        }
    }
]

def _execute_tool(name: str, args: dict) -> str:
    """Execute a tool function by name and return JSON string."""
    fn = TOOL_FUNCTIONS.get(name)
    if not fn:
        return json.dumps({"error": f"Unknown tool: {name}"})
    try:
        result = fn(**args)
        return json.dumps(_clean_types(result))
    except Exception as e:
        return json.dumps({"error": str(e)})

async def openrouter_chat_stream(user_message: str, history: list = None) -> AsyncGenerator[str, None]:
    """Fallback agentic chat loop using OpenRouter (OpenAI SDK)."""
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        yield f"data: {json.dumps({'type': 'error', 'content': 'OpenRouter API Key not configured. Please add OPENROUTER_API_KEY to .env'})}\n\n"
        return

    client = AsyncOpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key,
    )

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    
    if history:
        for msg in history:
            role = "user" if msg.get("role") == "user" else "assistant"
            messages.append({"role": role, "content": msg["content"]})
            
    messages.append({"role": "user", "content": user_message})

    # Fallback list of free OpenRouter models
    FALLBACK_MODELS = [
        "google/gemma-4-26b-a4b-it:free"
    ]
    
    max_iterations = 10
    for iteration in range(max_iterations):
        response = None
        last_exception = None
        
        for model in FALLBACK_MODELS:
            try:
                response = await client.chat.completions.create(
                    model=model,
                    messages=messages,
                    tools=OPENAI_TOOLS,
                    temperature=0.7,
                )
                break # Success, exit model fallback loop
            except Exception as e:
                last_exception = e
                print(f"OpenRouter Model {model} failed: {e}. Trying next...")
                
        if not response:
            yield f"data: {json.dumps({'type': 'error', 'content': f'OpenRouter API error (All fallback models failed): {str(last_exception)}'})}\n\n"
            return
            
        message = response.choices[0].message
        
        # Check if the model wants to call tools
        if not message.tool_calls:
            # Output final text
            full_text = message.content or ""
            
            # Stream the response in chunks to mimic the UI behavior
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
            
        # The model wants to call tools
        messages.append(message) # Append the assistant's tool call message
        
        for tool_call in message.tool_calls:
            tool_name = tool_call.function.name
            try:
                args = json.loads(tool_call.function.arguments)
            except:
                args = {}
                
            yield f"data: {json.dumps({'type': 'tool_call', 'content': f'Calling tool: {tool_name}'})}\n\n"
            
            tool_result = _execute_tool(tool_name, args)
            
            # Append the tool result
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "name": tool_name,
                "content": tool_result
            })
            
    yield f"data: {json.dumps({'type': 'error', 'content': 'OpsPilot Error: Maximum iterations reached without final answer.'})}\n\n"

from google import genai
from google.genai import types

from google import genai
from google.genai import types

async def auto_map_csv(headers: list[str], sample_row: dict) -> dict:
    """Uses Gemini AI directly to determine table type and column mapping."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise Exception("GEMINI_API_KEY not configured.")

    client = genai.Client(api_key=api_key)

    prompt = f"""You are an intelligent data mapping assistant.
I am uploading a CSV file and need to map its columns to one of our two database tables: 'sales' or 'inventory'.

Database schema:
1. sales: transaction_id, sale_date, customer_id, product_id, quantity, unit_price, discount, tax, total_amount, payment_status, payment_method, sales_channel, salesperson_id, region
2. inventory: product_id, current_stock, reorder_point, max_capacity, warehouse, last_restocked

Here are the headers from the uploaded CSV: {headers}
Here is a sample row: {json.dumps(sample_row)}

Determine the target_table ("sales" or "inventory") and provide a complete mapping from the uploaded CSV headers to the target schema headers.
IMPORTANT RULES:
- You MUST map every single required column for the chosen target schema if a corresponding column exists in the CSV.
- Do NOT skip any columns that match the target schema (e.g., if the CSV has 'region', you must map it to 'region').
- Only skip a CSV column if it is completely irrelevant to the chosen target schema.

Return ONLY a valid JSON object in this exact format, with no markdown or backticks:
{{
  "target_table": "sales",
  "mapping": {{
    "UploadedHeader1": "target_schema_header1",
    "UploadedHeader2": "target_schema_header2"
  }}
}}
"""

    try:
        response = await asyncio.to_thread(
            client.models.generate_content,
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
            )
        )
        content = response.text.strip()
        return json.loads(content)
    except Exception as e:
        raise Exception(f"Gemini Mapping API failed: {str(e)}")

