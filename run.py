from agent import agent, AgentState
from langchain_core.messages import HumanMessage

state = AgentState(messages=[HumanMessage(content="Show me all papers in the database")], next="agent")
result = agent.invoke(state)
print("Final response:", result["messages"][-1].content)