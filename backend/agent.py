import os
import asyncio
import json
import aiohttp
import httpx
from typing import List, Literal, Dict
from bs4 import BeautifulSoup
from duckduckgo_search import DDGS
from tavily import AsyncTavilyClient
import chromadb
from chromadb.utils import embedding_functions
from openai import OpenAI
from pydantic import BaseModel, Field, model_validator
from database import SessionLocal, UserPreference, SearchHistory

# --- Shared Pydantic Schemas ---
class SearchPath(BaseModel):
    source: str = Field(description="Must be: Fast_Search_API, Fallback_Search, Deep_Search_Metasearch, Google_Search_API, Knowledge_Base")
    search_queries: List[str] = Field(...)
    
class ExecutionPlan(BaseModel):
    query_intent: str = Field(...)
    search_paths: List[SearchPath] = Field(...)

    @model_validator(mode='before')
    @classmethod
    def normalize_llm_output(cls, data):
        if isinstance(data, str):
            try: data = json.loads(data)
            except: pass
        if isinstance(data, dict):
            if "search_paths" not in data:
                data["search_paths"] = [{"source": "Fallback_Search", "search_queries": [str(data.get("query_intent", "research"))]}]
        return data

# --- The Agent Engine ---
class AutonomousAgentEngine:
    def __init__(self):
        self.embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
        self.chroma_client = chromadb.Client()
        self.collection = self.chroma_client.get_or_create_collection(
            name="live_session_memory",
            embedding_function=self.embedding_fn
        )
        self.llm_client = OpenAI(base_url="https://router.huggingface.co/v1", api_key=os.getenv("HF_TOKEN"))

    # Phase 1: Planning
    def plan(self, user_id: int, query: str) -> ExecutionPlan:
        db = SessionLocal()
        # Fetch last 3 searches from the database
        history = db.query(SearchHistory).filter(SearchHistory.user_id == user_id).order_by(SearchHistory.id.desc()).limit(3).all()
        db.close()
        
        history_context = "\n".join([f"Previous Search: {h.query}" for h in history])
        
        system_prompt = f"You are the Planner Node. Review the user's history and current query.\n{history_context}\nOutput raw JSON: {{'query_intent': '...', 'search_paths': [{{'source': 'Google_Search_API', 'search_queries': ['q1']}}]}}"
        
        response = self.llm_client.chat.completions.create(
            model="meta-llama/Llama-3.3-70B-Instruct",
            messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": query}],
            response_format={"type": "json_object"},
            temperature=0.1
        )
        return ExecutionPlan.model_validate_json(response.choices[0].message.content)

    # Phase 2A: Gather Search Results
    async def execute_searches(self, plan: ExecutionPlan) -> List[Dict]:
        results = []
        for path in plan.search_paths:
            for q in path.search_queries:
                if path.source == "Fast_Search_API":
                    try:
                        client = AsyncTavilyClient(api_key=os.getenv("TAVILY_API_KEY"))
                        res = await client.search(query=q)
                        results.extend([{"url": r['url'], "content": r['content']} for r in res['results']])
                    except Exception as e:
                        print(f"⚠️ Quota Exhausted on Fast Search. Triggering dynamic fallback: {e}")
                        results.extend(await self._execute_ddg(q))
                elif path.source == "Deep_Search_Metasearch":
                    results.extend(await self._execute_searxng(q))
                elif path.source == "Google_Search_API":
                    results.extend(await self._execute_google_search(q))
                elif path.source == "Knowledge_Base":
                    results.extend(await self._execute_knowledge_base(q))
                else:
                    results.extend(await self._execute_ddg(q))
        return results

    async def _execute_ddg(self, q: str):
        try:
            ddgs = DDGS()
            search_results = await asyncio.to_thread(ddgs.text, q, max_results=3)
            return [{"url": r.get('href'), "content": r.get('body')} for r in search_results] if search_results else []
        except: return []

    async def _execute_searxng(self, q: str):
        url = os.getenv("SEARXNG_URL", "http://localhost:8080/search")
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params={"q": q, "format": "json"}, timeout=10) as res:
                    if res.status == 200:
                        data = await res.json()
                        return [{"url": r.get("url"), "content": r.get("content")} for r in data.get("results", [])[:3]]
        except: pass
        return []

    async def _execute_google_search(self, q: str):
        api_key = os.getenv("GOOGLE_API_KEY")
        cx = os.getenv("GOOGLE_CX_ID")
        if not api_key or not cx: return []
        
        # Use HTTPX async client to avoid thread blocking
        url = f"https://www.googleapis.com/customsearch/v1?key={api_key}&cx={cx}&q={q}"
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    return [{"url": item['link'], "content": item.get('snippet', '')} for item in data.get('items', [])[:3]]
        except Exception as e:
            print(f"Google Search Error: {e}")
        return []

    async def _execute_knowledge_base(self, q: str):
        # Queries your persistent ChromaDB collection instead of the live web
        try:
            kb_collection = self.chroma_client.get_or_create_collection("internal_knowledge")
            results = kb_collection.query(query_texts=[q], n_results=3)
            return [{"url": meta['source'], "content": doc} for meta, doc in zip(results['metadatas'][0], results['documents'][0])]
        except:
            return []

    # Phase 2B: Deep HTML Web Scraper Node
    async def _scrape_url(self, session: aiohttp.ClientSession, url: str) -> str:
        """Individually scrapes a URL and strips HTML boilerplate."""
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        try:
            async with session.get(url, headers=headers, timeout=10) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, "html.parser")
                    # Destroy layout elements to isolate core article text
                    for script in soup(["script", "style", "nav", "footer", "header", "aside"]):
                        script.decompose()
                    return soup.get_text(separator=' ', strip=True)
        except Exception as e:
            print(f"Scrape failed for {url}: {e}")
        return ""

    async def deeply_scrape_results(self, raw_data: List[Dict]) -> List[Dict]:
        """Concurrently maps the scraper across all gathered URLs."""
        print(f"Executing Deep Scrape on {len(raw_data)} URLs...")
        async with aiohttp.ClientSession() as session:
            tasks = [self._scrape_url(session, item['url']) for item in raw_data]
            scraped_texts = await asyncio.gather(*tasks)

        enriched_data = []
        for item, scraped_text in zip(raw_data, scraped_texts):
            # If the scrape succeeded and returned actual article text, overwrite the search snippet
            if scraped_text and len(scraped_text) > 200:
                item['content'] = scraped_text
            enriched_data.append(item)
        return enriched_data

    # Helper: Text Chunker
    def _chunk_text(self, text: str, chunk_size: int = 1000, overlap: int = 100) -> list[str]:
        chunks, start = [], 0
        while start < len(text):
            end = start + chunk_size
            chunks.append(text[start:end])
            start = end - overlap
        return chunks

    # Phase 3: ML Ranked Extraction
    def rank_and_extract(self, user_id: int, intent: str, raw_data: List[Dict]) -> str:
        if not raw_data: return "No data retrieved."
        
        import hashlib
        
        documents, metadatas, ids = [], [], []
        doc_counter = 0
        
        # Fetch existing IDs from the current ChromaDB collection to prevent duplicates
        existing_data = self.collection.get(include=["metadatas"])
        existing_hashes = {meta.get("content_hash") for meta in existing_data.get("metadatas", [])} if existing_data else set()
        
        for item in raw_data:
            content = str(item.get("content", ""))
            if len(content) > 10:
                chunks = self._chunk_text(content)
                for chunk in chunks:
                    chunk_hash = hashlib.sha256(chunk.encode('utf-8')).hexdigest()
                    
                    # DE-DUPLICATION CHECK
                    if chunk_hash not in existing_hashes:
                        documents.append(chunk)
                        metadatas.append({"url": item.get("url", ""), "content_hash": chunk_hash})
                        ids.append(f"doc_{user_id}_{doc_counter}_{chunk_hash[:8]}")
                        existing_hashes.add(chunk_hash)
                        doc_counter += 1
        
        if documents:
            self.collection.add(documents=documents, metadatas=metadatas, ids=ids)
        
        results = self.collection.query(query_texts=[intent], n_results=10, include=["documents", "metadatas", "distances"])
        
        db = SessionLocal()
        user_prefs = db.query(UserPreference).filter(UserPreference.user_id == user_id).all()
        pref_dict = {p.preferred_source.lower(): p.weight for p in user_prefs}
        db.close()

        final_context = "--- RANKED CONTEXT ---\n"
        ranked_docs = []
        
        for i in range(len(results['documents'][0])):
            doc, meta, distance = results['documents'][0][i], results['metadatas'][0][i], results['distances'][0][i]
            score = 1.0 / (1.0 + distance) 
            
            for source, weight in pref_dict.items():
                if source in meta['url'].lower(): score *= weight 
                    
            ranked_docs.append({"score": score, "doc": doc, "url": meta['url']})
            
        ranked_docs.sort(key=lambda x: x['score'], reverse=True)
        for item in ranked_docs[:5]:
            final_context += f"Source: {item['url']} | ML-Score: {item['score']:.2f}\nData: {item['doc']}\n\n"
            
        return final_context

    # Phase 4 & 5: Synthesis and Fact Verification
    def synthesize_and_verify(self, query: str, context: str) -> str:
        synth_prompt = (
            "You are an Elite Academic Analysis Engine. Your task is to generate an exhaustive, highly detailed, "
            "and meticulously structured research report (minimum 2500-3000 words) based STRICTLY on the provided context.\n\n"
            "MANDATORY STRUCTURE:\n"
            "1. Executive Summary: A comprehensive high-level overview.\n"
            "2. Introduction & Background: Deep context and foundational concepts surrounding the query.\n"
            "3. Comprehensive Analysis (Deep Dive): Break this into at least 3-4 extensive sub-sections exploring mechanics, core data, and granular nuances.\n"
            "4. Technical & Strategic Breakdown: Detailed exploration of the methodologies, constraints, or strategies involved.\n"
            "5. Case Studies & Real-World Applications: Concrete, expanded examples drawn exclusively from the context.\n"
            "6. Future Outlook & Limitations: Challenges, bottlenecks, and upcoming trends.\n"
            "7. Conclusion: Final, exhaustive synthesis.\n\n"
            "RULES: Do not summarize briefly. Expand aggressively on every single data point provided. Write in a formal, professional, and dense tone. "
            "You must ensure the output spans at least 3 to 4 pages of highly valuable information. If you do not have enough context to reach 3000 words, you must deeply extrapolate on the implications of the existing context."
        )
        
        synth_res = self.llm_client.chat.completions.create(
            model="meta-llama/Llama-3.3-70B-Instruct",
            messages=[
                {"role": "system", "content": synth_prompt}, 
                {"role": "user", "content": f"Query: {query}\n\nContext Data:\n{context}"}
            ],
            temperature=0.3, # Slightly increased to encourage generative expansion
            max_tokens=6000  # Mandatory: Allows the LLM to output ~4500 words before truncating
        )
        draft = synth_res.choices[0].message.content

        verify_prompt = (
            "You are the Fact Verification Node. Analyze the drafted report against the source context. "
            "If the report hallucinates ANY claims not explicitly found in the context, flag them. "
            "Output your audit as a brief, bulleted 'Verification Audit' section."
        )
        
        audit_res = self.llm_client.chat.completions.create(
            model="meta-llama/Llama-3.3-70B-Instruct",
            messages=[
                {"role": "system", "content": verify_prompt}, 
                {"role": "user", "content": f"Context:\n{context}\n\nDrafted Report:\n{draft}"}
            ],
            temperature=0.1,
            max_tokens=1000
        )
        
        return f"{draft}\n\n---\n## Fact Verification Audit\n{audit_res.choices[0].message.content}"

    def update_ranking_preferences(self, user_id: int, successful_url: str):
        """Feedback loop: Increases the weight of a source if the user validates the output."""
        from urllib.parse import urlparse
        db = SessionLocal()
        
        try:
            domain = urlparse(successful_url).netloc.replace('www.', '')
            pref = db.query(UserPreference).filter_by(user_id=user_id, preferred_source=domain).first()
            
            if pref:
                # Exponential moving average style update
                pref.weight = min(2.0, pref.weight * 1.1) 
            else:
                new_pref = UserPreference(user_id=user_id, preferred_source=domain, weight=1.2)
                db.add(new_pref)
            db.commit()
        finally:
            db.close()