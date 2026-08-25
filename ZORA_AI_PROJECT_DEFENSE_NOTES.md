# 🎤 Zora.ai — Project Defense & Technical Interview Notes

---

## 1. 30-Second Elevator Pitch (Project Introduction)

> **"Sir/Ma'am, I built Zora.ai, which is a Full-Stack Real-Time AI Search and Retrieval-Augmented Generation (RAG) Engine inspired by Perplexity.ai.**
> 
> **Standard LLMs often suffer from outdated information and hallucinations. Zora.ai solves this problem by combining Live Web Search, Custom Vector RAG for document querying, and Dual-AI Failover Architecture to deliver real-time, cited, and accurate answers."**

---

## 2. Technical Architecture & Tech Stack

> **"For the Tech Stack, I selected a production-grade architecture:**
> 
> - **Frontend**: Built with **React and Vite** for fast performance, **Redux Toolkit** for predictable state management, **Tailwind CSS** for modern UI, and **React-Markdown with Remark-GFM** to render code blocks, markdown tables, and rich text.
> - **Backend**: Built with **Node.js, Express.js, and Socket.io** for real-time streaming. I used **LangChain** to orchestrate AI models (`@langchain/google-genai` and `@langchain/mistralai`).
> - **Database**: **MongoDB Atlas** with Mongoose. I optimized it using compound B-tree indexes and connection pooling.
> - **DevOps & Infrastructure**: Containerized using **Docker & Docker Compose**, version controlled via **Git/GitHub**, and deployed via automated **CI/CD Pipeline to Render**."**

---

## 3. High-Impact Technical Features

1. **Dual-AI Provider Failover**: Primary Gemini AI (`gemini-1.5-flash`); automatic failover to Mistral AI (`mistral-small-latest`) on rate limits or API downtime.
2. **Live Internet Search & Citation Cards**: Integrates Tavily Web Search API to render interactive Source Citation Cards containing web links, snippets, and source numbers.
3. **Custom Knowledge Base (Vector RAG)**: Users upload custom PDF/text files. Backend chunks and embeds documents for semantic Q&A.
4. **Public Sharing System & Dynamic URL Sanitizer**: Shared conversations (`/shared/chat/:id` and `/shared/message/:id`) accessible publicly. Client-side URL Sanitizer dynamically rewrites `localhost` links to active production origins (`https://zora-ai-jew7.onrender.com`).
5. **High Concurrency Database Scaling (1,000+ Users)**: Mongoose Connection Pooling (`maxPoolSize: 50`) and Compound B-Tree Indexing (`{ user: 1, pinned: -1, updatedAt: -1 }`).

---

## 4. Key Scenario Interview Questions & Answers

- **Q1: How did you handle LLM rate limits or API failures?**
  - *Answer*: Implemented Dual-AI Failover. Primary Gemini AI errors trigger an automated async failover to Mistral AI without failing the user request.
- **Q2: How does the public share link work without exposing localhost in production?**
  - *Answer*: Backend inspects request headers (`origin`/`referer`). Frontend `openShareModal` sanitizes any URL containing `localhost` and prepends `window.location.origin`.
- **Q3: How did you optimize MongoDB for 1,000+ concurrent users?**
  - *Answer*: Added connection pooling (`maxPoolSize: 50`) in Mongoose to reuse TCP sockets, and added compound indexes on `user`/`pinned`/`updatedAt` and `chat`/`createdAt`.
- **Q4: How does JWT authentication with silent token refresh work?**
  - *Answer*: Access tokens (15 mins) and Refresh tokens (7 days) stored in HTTP-only cookies. Axios interceptor catches 401 `TOKEN_EXPIRED`, rotates tokens silently via `/api/auth/refresh`, and retries the original request.
