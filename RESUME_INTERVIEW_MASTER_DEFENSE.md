# Zora.ai — Complete Interview Defense & Q&A Master Guide

> **Tailored Specifically to Your Master Resume Block**

---

## 🎯 Section 1: The 60-Second Interview Elevator Pitch

**Interviewer**: *"Tell me about your Zora.ai project."*

**Your 60-Second Master Answer**:
> *"Zora.ai is a full-stack real-time AI search engine and document intelligence platform, inspired by Perplexity AI. I built it using React 18, Node.js Express 5, Socket.io, LangChain, Pinecone Vector Database, MongoDB Atlas, Redis 7, Docker, and Kubernetes.
> 
> The core innovation is its **Dual-LLM Failover Engine** which dynamically routes queries between Google Gemini 1.5 Flash and Mistral AI, automatically recovering from 401/429 rate limit errors to ensure 99.9% system availability. It integrates Tavily live web search for real-time web facts and a RAG vector pipeline for high-accuracy PDF parsing.
> 
> On the security side, I implemented an enterprise authentication model with **JWT Refresh Token Rotation (RTR)**, **SHA-256 token hashing**, **familyId tracking**, and automated session revocation upon token replay attacks. 
> 
> Finally, I containerized the entire stack using Docker Compose, authored production Kubernetes manifests with HPA autoscaling (2 to 10 pods), and deployed it as a single-service build to Render."*

---

## 🏗️ Section 2: Step-by-Step — "How I Built This Project" (Build Timeline)

### Step 1: Database & Model Architecture Setup
- Configured **MongoDB Atlas** for persistent user schemas (`user.model.js`, `chat.model.js`, `message.model.js`, `document.model.js`).
- Integrated **Redis 7** for Socket.io session state, rate-limiting counters, and dynamic caching.

### Step 2: Enterprise Authentication & Security Layer
- Built signed JWT access tokens (15m) and refresh tokens (7d) stored in `httpOnly`, `sameSite`, `secure` cookies.
- Implemented **SHA-256 Token Hashing** (`crypto.createHash('sha256')`) and **familyId tracking** to store hashed tokens in MongoDB instead of plain JWTs.
- Added **Token Reuse Detection**: If an attacker attempts to replay an already rotated refresh token, all tokens in that `familyId` are wiped immediately, invalidating all sessions for that compromised user.
- Added **Resend HTTPS REST API (Port 443)** for email verification to bypass cloud SMTP port blocking.

### Step 3: Dual-LLM Failover & Real-Time Search Engine
- Integrated **LangChain JS** to orchestrate tools (`searchInternet`, `retrieveDocuments`, `calculateMath`, `fetchWebPageUrl`).
- Configured **Google Gemini 1.5 Flash** as primary LLM and **Mistral AI (`mistral-small-latest`)** as secondary LLM.
- Wrapped LLM invocation in a **Bidirectional Failover Guard**: If Gemini returns HTTP 401 (invalid key/OAuth token) or HTTP 429 (rate limit), the engine dynamically catches the exception and invokes Mistral AI within milliseconds without dropping the user's stream.

### Step 4: RAG (Retrieval-Augmented Generation) Vector Pipeline
- Integrated **Pinecone Vector Database** for storing 768-dimensional vector embeddings.
- Configured **PDF parsing** (`pdf-parse`) and chunking (500-token chunks with 50-token overlap).
- Query flow: User asks a question about their PDF -> Pinecone returns top 4 cosine similarity text chunks filtered by `userId` -> LangChain feeds chunks into system prompt -> LLM answers strictly grounded in document facts with citations.

### Step 5: Multi-Service Containerization & Kubernetes Autoscaling
- Wrote multi-stage **Dockerfiles** for Backend (Node 20 Alpine, non-root user) and Frontend (Vite -> Nginx Alpine with gzip compression).
- Authored **Docker Compose** local stack (`mongo:7.0`, `redis:7-alpine`, `zora_backend`, `zora_frontend`).
- Authored **Kubernetes manifests (`k8s/`)**: ConfigMap, Secret, MongoDB StatefulSet + 10GB PVC, Redis Deployment, Backend Deployment with `/healthz` Liveness and `/readyz` Readiness probes, **HPA Autoscaler (2 to 10 pods on 70% CPU)**, and Nginx Ingress Controller.
- Configured single-service production build for **Render PaaS** using Express static bundle serving.

---

## 🔬 Section 3: Deep-Dive Technical Q&A By Resume Bullet Point

---

### 🟢 Bullet Point 1: Dual-LLM Failover Engine & Real-Time Web Search
> *"Architected High-Availability AI Search System: Designed a resilient Dual-LLM Failover Engine that dynamically routes queries to secondary LLMs (Gemini 1.5 Flash & Mistral AI) upon API rate-limits or 401/429 errors, maintaining 99.9% system availability with Tavily live web search."*

#### Q1: What is the Dual-LLM Failover Engine and how does it handle 401/429 errors?
**Answer**: 
In production AI applications, third-party LLM APIs frequently return HTTP 429 (Rate Limit / Quota Exceeded) or HTTP 401 (Invalid/Expired Credentials). In Zora.ai, `getLLM()` and `generateResponse()` wrap LLM execution in a try-catch failover guard. 
If Google Gemini API returns 401 or 429, the system catches the error silently, logs a warning, initializes the backup **Mistral AI (`mistral-small-latest`)** instance, and re-invokes the prompt with the exact same chat history within 200 milliseconds. The user receives an uninterrupted response instead of an error message.

#### Q2: How does live web search work in Zora.ai?
**Answer**:
We use Tavily API wrapped inside a LangChain `tool`. When a user asks about current events, sports scores, or live facts, the AI agent recognizes that the query requires up-to-date data, triggers `searchInternetTool({ query })`, extracts title, URL, and snippet text from Tavily search results, injects them into the system prompt context, and formats cited markdown sources (`[Source Title](url)`) in the final answer.

---

### 🟢 Bullet Point 2: Secure Token Lifecycle & Token Reuse Detection
> *"Engineered Secure Token Lifecycle & Auth: Developed a secure token lifecycle model utilizing SHA-256 token hashing, familyId tracking, httpOnly cookies, and automated session revocation upon token replay attacks, complemented by Resend HTTPS verification."*

#### Q1: What is Refresh Token Rotation (RTR) and why use SHA-256 Hashing?
**Answer**:
Standard JWT refresh tokens are vulnerable if stolen because an attacker can generate endless access tokens. With **Refresh Token Rotation (RTR)**, every single time `/api/auth/refresh` is called, the old refresh token is destroyed and a brand new refresh token is issued.
Instead of storing raw JWT tokens in MongoDB (which would be catastrophic if the DB is leaked), we run `crypto.createHash('sha256').update(rawToken).digest('hex')` and store only the **SHA-256 hash** in the `refreshTokens` array in MongoDB.

#### Q2: How does Token Replay Attack & Compromise Detection work?
**Answer**:
Every refresh token family shares a unique `familyId`. 
If a legitimate user's refresh token is stolen by an attacker, and the user rotates their token first, the stolen token becomes invalid in MongoDB. 
When the attacker later sends that stolen token to `/api/auth/refresh`, the server verifies the JWT signature (it passes!), but searches MongoDB for the matching `tokenHash`. Since it's missing from the `refreshTokens` array, the server detects a **Token Replay Attack**!
To protect the user, the server immediately wipes the ENTIRE `refreshTokens` array (`user.refreshTokens = []`), destroying all active sessions across all devices and forcing a clean re-login.

#### Q3: Why did you use Resend HTTPS REST API instead of Nodemailer SMTP?
**Answer**:
Cloud PaaS providers like Render, AWS EC2, and DigitalOcean block or throttle outbound SMTP ports (25, 465, 587) to prevent spamming, causing standard Nodemailer SMTP connections to time out (`ETIMEDOUT`). 
We integrated **Resend API**, which sends emails over standard **HTTPS (Port 443) REST POST requests** (`https://api.resend.com/emails`). Because Port 443 is never blocked by cloud firewalls, verification emails land in the user's inbox in under 1 second.

---

### 🟢 Bullet Point 3: RAG Vector Pipeline & Pinecone Vector Database
> *"Developed Production RAG Vector Pipeline: Built an end-to-end document intelligence pipeline using Pinecone vector database and LangChain embeddings for high-accuracy PDF parsing, similarity search, and context-grounded Q&A."*

#### Q1: How does the RAG (Retrieval-Augmented Generation) pipeline work step-by-step?
**Answer**:
1. **Ingestion**: The user uploads a PDF file. `pdf-parse` extracts raw text, and `RecursiveCharacterTextSplitter` splits text into 500-token chunks with 50-token overlap.
2. **Embedding**: Each chunk is sent to an embedding model (or Pinecone inference) to generate a **768-dimensional numerical vector**.
3. **Vector Storage**: Vectors are upserted into **Pinecone Vector DB** tagged with metadata (`userId`, `documentId`, `text_chunk`).
4. **Retrieval**: When the user asks a question about their PDF, the query is converted into a vector, and Pinecone performs a **Cosine Similarity Search** (`topK = 4`) filtered by `userId`.
5. **Generation**: The top 4 matching text chunks are injected into Gemini/Mistral's context prompt, forcing the LLM to generate an answer strictly grounded in the PDF's text.

---

### 🟢 Bullet Point 4: Containerization, Kubernetes & Autoscaling
> *"Containerized & Scaled Infrastructure: Containerized application with Docker Compose, authored production Kubernetes manifests (k8s/) with HPA auto-scaling (2–10 pods), and deployed single-service production build to Render PaaS."*

#### Q1: Why did you use Multi-stage Dockerfiles?
**Answer**:
In multi-stage Docker builds:
- **Build Stage**: Installs full Node.js dependencies, build tools, and compiles React/Node assets.
- **Production Stage**: Copies only the compiled `dist` assets and production node_modules into a minimal **Node 20 Alpine** runtime base image running under a non-root user (`USER node`).
This reduces container image size from 1GB down to ~150MB, eliminates security vulnerabilities, and speeds up deployment.

#### Q2: How does Kubernetes HPA (Horizontal Pod Autoscaler) work in your project?
**Answer**:
Our `k8s/06-backend-hpa.yaml` monitors CPU and RAM metrics across backend pods. 
- **Min Replicas**: 2 pods (for high availability across nodes).
- **Max Replicas**: 10 pods.
- **Autoscale Trigger**: When average CPU utilization exceeds **70%** or RAM exceeds **80%**, the Kubernetes Metrics Server automatically triggers HPA to spin up additional backend pods, balancing traffic dynamically.

---

## ⚡ Section 4: Tough Architectural Defense Questions

| Interviewer Question | Killer Defense Answer |
|---|---|
| **Why Redis over MongoDB for Session/Socket state?** | Redis is an in-memory key-value store operating in sub-millisecond latency (RAM), whereas MongoDB writes to disk. For Socket.io WebSocket connections and rate-limiting counters, Redis avoids disk I/O bottlenecks. |
| **Why Express 5 over Express 4?** | Express 5 natively handles rejected promises in async middleware (`async/await`) without needing `express-async-errors` or wrapper try/catch blocks, improving error handling cleanliness. |
| **How do WebSockets scale across 10 Kubernetes pods?** | By attaching `@socket.io/redis-adapter`. When Pod 1 receives a message for a user connected to Pod 5, Pod 1 publishes the event to Redis Pub/Sub, and Pod 5 broadcasts it to the user's WebSocket seamlessly. |
| **Why Pinecone over MongoDB Vector Search?** | Pinecone is a dedicated cloud vector database built explicitly for ANN (Approximate Nearest Neighbor) vector indexing, handling high-dimensional cosine similarity searches at scale with sub-50ms latency. |
