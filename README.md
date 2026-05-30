# 🤖 Autonomous Research Agent

[![CI](https://github.com/kallurayaankit/research-agent/actions/workflows/ci.yml/badge.svg)](https://github.com/kallurayaankit/research-agent/actions/workflows/ci.yml)

An autonomous AI agent that uses a local LLM (Mistral via Ollama) to decide when to call tools, answer questions, search the web, query a database of academic papers, perform calculations, and remember facts across sessions.

---

## 📌 Features

- **Agentic orchestration** – LangGraph state machine with conditional tool‑calling
- **Tool integration** – Web search (Tavily), SQL database query, Python calculator, persistent memory
- **Long‑term memory** – ChromaDB stores user preferences and facts across sessions
- **Guardrails** – Input validation and safety filter that blocks dangerous tool usage
- **Evaluation benchmark** – Automated test tasks to measure agent performance
- **Docker support** – Containerized for deployment on any machine

---

## 📁 Project Structure

---

## ⚡ Quick Start (Local)

### 1. Prerequisites
- [Ollama](https://ollama.com) installed and running.
- Python 3.12 and a virtual environment.

### 2. Install dependencies
```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
ollama pull mistral
TAVILY_API_KEY=tvly-your_key_here
python run.py
docker build -t research-agent .

docker run -it research-agent
Final response: 26910
