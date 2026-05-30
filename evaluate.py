from agent import agent, AgentState
from langchain_core.messages import HumanMessage

tasks = [
    "What is 123 + 456?",
    "Find the author of the most cited paper on Graph Neural Nets.",
    "List all papers from 2020.",
]

for task in tasks:
    state = AgentState(messages=[HumanMessage(content=task)], next="agent")
    result = agent.invoke(state)
    print(f"Task: {task}")
    print(f"Response: {result['messages'][-1].content}\n")