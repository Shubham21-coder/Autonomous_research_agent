# ARIA: Autonomous Research & Intelligence Agent

ARIA is an advanced, multi-stage autonomous AI agent designed to generate highly structured, 3000+ word institutional-grade research reports. It dynamically plans execution paths, scrapes the live web using bot-resistant metasearch engines, ranks extracted data via local vector embeddings, and streams the synthesized analysis back to a highly responsive React frontend.

It is specifically engineered to run efficiently in memory-constrained environments (e.g., 4GB VRAM) by offloading cognitive heavy-lifting to `Llama-3.3-70B-Versatile` while strictly managing vector duplication and data sanitization locally.

## 🚀 Core Architecture

* **Planner Node:** Analyzes user intent and generates dynamic JSON routing arrays to direct web scraping.
* **Deep Search & Metasearch:** Integrates with a localized Dockerized SearXNG instance to bypass commercial API rate limits and scrape raw HTML, automatically stripping boilerplate.
* **Vector Ranking Engine:** Chunks raw data and cryptographically hashes it (SHA-256) to prevent local ChromaDB bloating, filtering context based on user-preference weights.
* **Synthesis & Verification Engine:** Streams real-time Server-Sent Events (SSE) back to the UI, synthesizing multi-page reports and executing a strict fact-checking audit against the localized context.

## 🛠️ Technology Stack

* **Frontend:** React, Vite, Framer Motion, Tailwind CSS
* **Backend:** FastAPI, Python, Server-Sent Events (SSE)
* **Agent Engine:** `Llama-3.3-70B-Versatile` (via OpenRouter/HF)
* **Vector Database:** ChromaDB (Local)
* **Web Scraping:** SearXNG (Docker), BeautifulSoup4
* **Package Management:** `uv` (Strictly enforced for blazing-fast backend dependency resolution)
* **Export Generation:** `pdfkit`, `python-docx`

## ⚙️ Installation & Setup

### 1. Local Metasearch Engine (SearXNG)
You must spin up the local SearXNG instance to enable deep web scraping without API limits.
```bash
# Ensure Docker is running
docker-compose up -d