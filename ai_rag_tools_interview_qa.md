# 🧠 AI, LLM, RAG & Tools — Technical Interview Q&A Guide

This guide details the **Top AI-Specific Technical Questions & Answers** explaining how LLMs, RAG, and AI Tools work together in **Zora.ai**.

---

## ❓ Q1: LLM Response Generation Kaise Kaam Karta Hai?
* **Question:** *"Zora.ai me Large Language Model (LLM) user query par response kaise generate karta hai?"*
* **Deep Technical Answer:**
  > *"LLM (Large Language Model) ek statistical Next-Token Predictor hai jo Transformer Architecture (Self-Attention Mechanism) par chalta hai.*
  > 
  > *Hum LLM ko khali query nahi bhejte. Hum ek **Unified System Prompt** assemble karte hain jisme:*
  > 1. **System Persona & Rules:** Zora.ai ke strict output formatting constraints.
  > 2. **Ground Truth Live IST Clock:** Server se computed `Asia/Kolkata` timezone timestamp.
  > 3. **Retrieved Context Block:** RAG PDF Chunks + Tavily Live Web Search Results.
  > 
  > *LLM is poore context ko attention weights ke zariye process karta hai aur zero hallucination ke saath factual, multi-paragraph Markdown response synthesize karta hai."*

---

## ❓ Q2: RAG (Retrieval-Augmented Generation) & Embeddings Math Kaise Kaam Karta Hai?
* **Question:** *"RAG Vector Search step-by-step kaise execute hota hai?"*
* **Deep Technical Answer:**
  > *"RAG Pipeline 4 core steps me execute hota hai:*
  > 
  > 1. **Text Chunking:** Uploaded PDF ko 500-character segments me 50-character overlap ke saath divide karte hain.
  > 2. **Dense Vector Embeddings:** Har text chunk ko **Google Generative AI Embeddings** model se **768-Dimensional Floating-Point Vector Array** me convert karte hain.
  > 3. **Vector Indexing:** Vectors ko **Pinecone Vector Database** me store karte hain.
  > 4. **Cosine Similarity Retrieval:**
  >    - User Query $\mathbf{Q}$ ko vector embedding me convert karte hain.
  >    - Pinecone DB me Query Vector $\mathbf{Q}$ aur Stored Document Vectors $\mathbf{V}$ ke beech **Cosine Similarity Score** calculate hota hai:
  >      $$\text{Similarity}(Q, V) = \frac{\mathbf{Q} \cdot \mathbf{V}}{\|\mathbf{Q}\| \|\mathbf{V}\|}$$
  >    - Score $> 0.2$ wale top matching PDF chunks fetch hoke Prompt Context me inject ho jaate hain."*

---

## ❓ Q3: Real-Time AI Tools (Web Search / Weather) Kaise Integrate Hue Hain?
* **Question:** *"AI Tools aur External APIs (Tavily Search, Weather) kaise execute hote hain?"*
* **Deep Technical Answer:**
  > *"Multi-turn LLM Function Calling me high latency aur 1-line text preambles (*'I'll search for...'* ) ki problem aati hai.*
  > 
  > *Iska solution humne **Deterministic Pre-Retrieval Architecture** se nikala:*
  > - Query aate hi backend pehle hi millisecond me **Tavily REST API** (`searchInternet`) run karke live 2026 web results fetch kar leta hai.
  > - Search results ko `LIVE WEB SEARCH CONTEXT RESULTS` block banakar LLM System Prompt me inject kar diya jata hai.
  > - LLM 1 single pass me complete Markdown response generates kar deta hai without tool preambles."*

---

## ❓ Q4: LLM Rate Limits & 429 Quota Errors Kaise Handle Kiye Hain?
* **Question:** *"Google Gemini 429 Quota Exceeded error ko production me kaise handle kiya?"*
* **Deep Technical Answer:**
  > *"Maine backend me **3-Tier Multi-Provider Failover Pipeline** build kiya:*
  > - **Tier 1 (Primary):** `Gemini 1.5 Flash` (1,500 requests/day limit).
  > - **Tier 2 (Secondary):** `Gemini 1.5 Pro` (Complex fallback).
  > - **Tier 3 (Tertiary):** `Mistral AI` (`mistral-small-latest` via Mistral API Key).
  > 
  > *Backend me ek explicit try/catch loop chalta hai. Agar Tier 1 par HTTP 429 Quota Exceeded error aata hai, toh backend bina user request fail kiye turant milliseconds me Tier 2 ya Tier 3 (Mistral AI) par failover karke answer generate karta hai."*

---

## ❓ Q5: Hallucination & Anti-Sycophancy Ko Kaise Roka?
* **Question:** *"AI ko wrong answers ya date gaslighting se kaise bachaaya?"*
* **Deep Technical Answer:**
  > *"2 Techniques use ki hain:*
  > 1. **Strict Context Grounding:** RAG queries ke liye System Prompt me strict rule hai ki agar answer retrieved PDF chunks me nahi hai, toh LLM external knowledge invent nahi karega.
  > 2. **Anti-Sycophancy System Anchor:** Live IST (`Asia/Kolkata`) system clock prompt me inject ki jaati hai. Agar user AI ko bolta hai ki *'aaj Aug 26 hai'*, toh Zora user se agree karne ke bajaye live system clock se confidentially user ko correct karti hai."*
