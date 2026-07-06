# ARIA: Autonomous Research & Intelligence Agent

ARIA is an advanced, multi-stage autonomous AI agent designed to generate highly structured, 3000+ word institutional-grade research reports. It dynamically plans execution paths, scrapes the live web using bot-resistant metasearch engines, ranks extracted data via local vector embeddings, and streams the synthesized analysis back to a highly responsive React frontend.

It is specifically engineered to run efficiently in memory-constrained environments (e.g., 4GB VRAM) by offloading cognitive heavy-lifting to `Llama-3.3-70B-Instruct` while strictly managing vector duplication and data sanitization locally.

## 🚀 Core Architecture

* **Planner Node:** Analyzes user intent and generates dynamic JSON routing arrays (Google API, Fallback Search, or Deep Web Scrape) with conversational memory injected from an SQLite database.
* **Deep Search & Metasearch:** Integrates with a localized Dockerized SearXNG instance to bypass commercial API rate limits and scrape raw HTML, automatically stripping boilerplate.
* **Vector Ranking Engine:** Chunks raw data and cryptographically hashes it (SHA-256) to prevent local ChromaDB bloating, filtering context based on user-preference weights driven by an ML feedback loop.
* **Synthesis & Export Engine:** Streams real-time Server-Sent Events (SSE) back to the UI, synthesizing multi-page reports with a strict fact-checking audit. Exports directly to `.PDF`, `.DOCX`, or `.TXT`.

## 🛠️ Technology Stack

* **Frontend:** React, Vite, Framer Motion, Tailwind CSS
* **Backend:** FastAPI, Python, Server-Sent Events (SSE)
* **Agent Engine:** `Llama-3.3-70B-Versatile` (via HF)
* **Vector Database:** ChromaDB (Local)
* **Web Scraping:** SearXNG (Docker), BeautifulSoup4
* **Package Management:** `uv` (Strictly enforced for fast backend dependency resolution)

---

## ⚙️ Automated Installation & Setup

**Prerequisites:** You must have `uv`, `Node.js`, and **Docker Desktop** installed. 
> ⚠️ **IMPORTANT:** Docker Desktop MUST be actively running in the background before you execute the setup script.

### For Windows Users
We have bundled an automated setup script that verifies your Docker status, generates a secure `.env` template, and boots both the frontend and backend servers.

Simply double-click `start.bat` in the project root, or run it from your terminal:
\`\`\`cmd
.\start.bat
\`\`\`
*Note: On your first run, the script will generate a `backend/.env` file and pause. Open that file, add your API keys (HuggingFace/OpenRouter, Tavily, Google), and then run the script again.*

### For Mac/Linux Users
Execute the bash script from your terminal to automate the entire stack rollout:
\`\`\`bash
chmod +x start.sh
./start.sh
\`\`\`

---

## 🔐 Security Warning
This repository is configured with a strict `.gitignore`. **Never** commit your `.env` file, `uv.lock`, or your local `aria_agent.db` SQLite/ChromaDB instances to version control, as they contain highly sensitive API keys and session memory.

## 📝 Usage
1. Authenticate via the UI (Top Right Account Button) to establish a secure session token.
2. Enter a complex research query in the dashboard.
3. Monitor the visual pipeline as ARIA plans, deeply scrapes the DOM, embeds vectors, and streams the final synthesis.
4. Export the final validated audit via the interactive dropdown menu to `.TXT`, `.PDF`, or `.DOCX`.
