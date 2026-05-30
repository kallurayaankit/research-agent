import os, re
from dotenv import load_dotenv
from typing import TypedDict, List, Union
from langgraph.graph import StateGraph, END
from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage, SystemMessage
from langchain_core.tools import tool
from tools import web_search, query_papers, calculate
from memory import get_preference, save_preference
from guardrails import moderate_tool_call

load_dotenv()

# ---- Tools ----
@tool
def search_tool(query: str) -> str:
    """Search the web for current information."""
    return web_search(query)

@tool
def db_tool(query: str) -> str:
    """Query the local database of papers. Use SQL."""
    return query_papers(query)

@tool
def calc_tool(expression: str) -> str:
    """Evaluate a math expression."""
    return calculate(expression)

@tool
def remember_tool(key: str, value: str) -> str:
    """Store a key-value pair in long-term memory."""
    save_preference(key, value)
    return f"Remembered {key} = {value}"

tools = [search_tool, db_tool, calc_tool, remember_tool]
tool_map = {t.name: t for t in tools}

# ---- State ----
class AgentState(TypedDict):
    messages: List[Union[SystemMessage, HumanMessage, AIMessage, ToolMessage]]
    next: str

# ---- Local LLM (Ollama) ----
llm = ChatOllama(model="mistral", temperature=0, timeout=60, num_predict=256)
llm_with_tools = llm.bind_tools(tools)

# ---- System prompt ----
user_name = get_preference("user_name") or "User"
system_prompt = (
    f"You are a helpful research assistant. The user's name is {user_name}. "
    "If asked a math question, you MUST use the calc_tool. Always prefer tools over guessing."
)

# ---- Fallback: detect math questions and force calc_tool ----
def maybe_force_calc(state: AgentState) -> AgentState:
    """If the user message contains a math expression and the LLM hasn't already
    called a tool, automatically invoke calc_tool."""
    last_msg = state["messages"][-1]
    if isinstance(last_msg, HumanMessage):
        content = last_msg.content
        # Match simple arithmetic expressions like 123+456, 10/3, 5-2, 6*7
        match = re.search(r'(\d+)\s*([\*\+\-\/])\s*(\d+)', content)
        if match:
            expr = f"{match.group(1)} {match.group(2)} {match.group(3)}"
            result = calculate(expr)
            tool_msg = ToolMessage(content=result, tool_call_id="fallback-calc")
            state["messages"].append(tool_msg)
            return state
    return state

# ---- Nodes ----
def agent_node(state: AgentState) -> AgentState:
    messages = state["messages"]
    if not messages or not isinstance(messages[0], SystemMessage):
        messages = [SystemMessage(content=system_prompt)] + messages
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}

def tool_node(state: AgentState) -> AgentState:
    last_message = state["messages"][-1]
    tool_calls = last_message.tool_calls
    results = []
    for tc in tool_calls:
        tool_name = tc["name"]
        tool_args = tc["args"]
        if not moderate_tool_call(tool_name, tool_args):
            results.append(ToolMessage(content="Action blocked by safety filter.", tool_call_id=tc["id"]))
            continue
        tool_func = tool_map[tool_name]
        output = tool_func.invoke(tool_args)
        results.append(ToolMessage(content=output, tool_call_id=tc["id"]))
    return {"messages": results}

def should_continue(state: AgentState) -> str:
    last_message = state["messages"][-1]
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    return END

# ---- Build graph with pre-processing fallback ----
workflow = StateGraph(AgentState)
workflow.add_node("agent", agent_node)
workflow.add_node("tools", tool_node)
workflow.add_node("fallback", maybe_force_calc)   # <-- new fallback node
workflow.set_entry_point("fallback")               # <-- start here
workflow.add_edge("fallback", "agent")             # fallback → agent
workflow.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
workflow.add_edge("tools", "agent")

agent = workflow.compile()