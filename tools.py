import sqlite3
import math
import os
from tavily import TavilyClient

# Web search tool
def web_search(query: str) -> str:
    """Search the web using Tavily."""
    client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))
    response = client.search(query, max_results=3)
    results = response.get("results", [])
    if not results:
        return "No results found."
    return "\n\n".join([f"{r['title']}: {r['content']}" for r in results])

# Database query tool
def query_papers(sql: str) -> str:
    """Run a SQL query on the papers database."""
    conn = sqlite3.connect("papers.db")
    c = conn.cursor()
    try:
        c.execute(sql)
        rows = c.fetchall()
        conn.close()
        if not rows:
            return "Query returned no results."
        return "\n".join([str(row) for row in rows])
    except Exception as e:
        return f"Error: {e}"

# Calculator tool
def calculate(expression: str) -> str:
    """Evaluate a mathematical expression safely."""
    allowed_names = {"math": math, "abs": abs, "round": round}
    try:
        result = eval(expression, {"__builtins__": {}}, allowed_names)
        return str(result)
    except Exception as e:
        return f"Error: {e}"