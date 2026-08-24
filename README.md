# Zora.ai 🧠⚡

**Zora.ai** is a full-stack real-time AI search engine and document intelligence platform inspired by Perplexity AI. It combines live web search, RAG-powered document comprehension, and low-latency streaming to deliver cited, actionable answers with real-time feedback.

---

## ✨ Features

- 🔍 **Real-Time Live Web Search**: Fetches up-to-date web results and synthesizes grounded answers with inline citations.
- 📄 **Document Intelligence (RAG)**: Upload PDFs and documents to query, summarize, and extract key insights using Pinecone vector embeddings.
- ⚡ **Real-Time Streaming**: Low-latency token-by-token streaming responses powered by WebSockets / Socket.io.
- 🛡️ **Failover & LLM Resilience**: Automatic failover handling (HTTP 429 rate-limiting / quota guards) across AI models.
- 🔐 **Authentication & Security**: Secure user registration, email verification, JWT auth, and protected API routes.
- 📥 **Export & Notes**: Generate structured engineering study notes and downloadable PDF summaries.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 (Vite)
- **Styling**: Tailwind CSS / Lucide Icons
- **Real-Time**: Socket.io Client

### Backend
- **Runtime**: Node.js & Express 5
- **AI Orchestration**: LangChain & Google Gemini API
- **Vector Database**: Pinecone
- **Primary Database**: MongoDB Atlas (Mongoose)
- **Caching & Queues**: Redis 7
- **Communication**: Socket.io, Resend / Nodemailer (Email Verification)

### DevOps & Infrastructure
- **Containerization**: Docker & Docker Compose
- **Orchestration**: Kubernetes
- **Deployment**: Render

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas cluster
- Redis instance
- Pinecone API Key & Index
- Google Gemini API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/Rudrashrivastava/Zora.ai.git](https://github.com/Rudrashrivastava/Zora.ai.git)
   cd Zora.ai
