# 🛠️ Zora.ai — Complete 100% Backend Architecture Blueprint

This document provides a complete, line-by-line technical breakdown of the entire **Zora.ai Backend Architecture**.

---

## 📐 1. High-Level Folder Structure & Core Responsibilities

```
backend/
├── src/
│   ├── config/             # DB & Environment Configuration
│   │   └── db.js           # MongoDB Connection Setup
│   ├── controllers/        # Request Handlers & Business Controllers
│   │   ├── auth.controller.js   # User Auth, Registration, JWT Tokens, Verification
│   │   ├── chat.controller.js   # Chat Management, Message Sending, ObjectId Sanitization
│   │   └── rag.controller.js    # PDF/Document Ingestion, Chunking & Retrieval APIs
│   ├── middlewares/        # Express Middlewares
│   │   ├── auth.middleware.js   # Protect Routes via Bearer JWT
│   │   └── upload.middleware.js # Multer In-Memory Storage for File Uploads
│   ├── models/             # Mongoose Schemas & Database Entities
│   │   ├── user.model.js        # User Schema, Bcrypt Hashing, Verification Tokens
│   │   ├── chat.model.js        # Chat & Message Schema (with Sources/Citations)
│   │   └── document.model.js    # Document & Vector Chunk Schemas
│   ├── services/           # External API & AI Core Engines
│   │   ├── ai.service.js        # Single-Pass LLM Engine + 3-Tier Model Failover
│   │   ├── mail.service.js      # Nodemailer IPv4 + Brevo REST API Fallback (Port 443)
│   │   └── rag/                 # RAG Vector Pipeline
│   │       ├── chunking.service.js   # Text Segmenting & Overlap Splitting
│   │       ├── embedding.service.js  # Google Generative AI Embeddings
│   │       ├── pinecone.service.js   # Pinecone Index Management
│   │       └── retrieval.service.js  # Vector Similarity Search + MongoDB Fallback
│   ├── app.js              # Express App Setup, CORS, Body Parsers, Routes
│   └── server.js           # HTTP + Socket.IO Server Initialization
```

---

## 🔐 2. Authentication & Email Subsystem

### A. Auth Flow (`auth.controller.js` & `user.model.js`)
* **Registration & Password Hashing:** Passwords are hashed using `bcryptjs` with salt factor `10`.
* **JWT Access & Refresh Tokens:**
  * **Access Token:** Short-lived JWT (15-60 mins) passed via `Authorization: Bearer <token>`.
  * **Refresh Token:** Stored in HttpOnly cookie / DB for silent token refresh via `/api/auth/refresh`.
* **Verification Code (OTP):** Generated via `crypto.randomInt(100000, 999999)` with expiry timestamps.

### B. Email Service Pipeline (`mail.service.js`)
Deployed cloud environments like **Render** block outbound SMTP ports (25, 465, 587) and IPv6 sockets (`ENETUNREACH`). The email pipeline handles this via a 2-stage fallback:
1. **Primary Stage (Nodemailer IPv4 Forced):**
   - Configured with `host: "smtp.gmail.com"`, `port: 465`, `secure: true`, and `family: 4` (`dns.setDefaultResultOrder("ipv4first")`).
   - Uses `EMAIL_PASS` or `GMAIL_APP_PASSWORD`.
2. **Secondary Stage (Brevo HTTPS REST API on Port 443):**
   - If SMTP is blocked by cloud firewalls, it automatically switches to Brevo HTTPS API (`https://api.brevo.com/v3/smtp/email`) over standard HTTPS Port 443 without custom domain lockouts.

---

## 🤖 3. AI & Single-Pass LLM Engine (`ai.service.js`)

### A. Deterministic Single-Pass Architecture
Older multi-turn agent loops with LangChain caused 1-line tool preambles (*"I'll search..."*, *"retrieveDocuments"*).
Zora.ai uses a **Deterministic Single-Pass Context Pre-Retrieval Engine**:

```
[ User Prompt ]
       │
       ├──► 1. Pre-retrieve RAG Document Chunks (if User has uploaded PDFs)
       ├──► 2. Pre-retrieve Tavily Live Web Search Results (if Query needs live facts)
       │
       ▼
[ Formatted Unified System Prompt with Ground Truth IST Clock & Context ]
       │
       ▼
[ 3-Tier Multi-Provider LLM Invocation Pipeline ]
       │
       ▼
[ Direct Clean Markdown Response with Citations ]
```

### B. 3-Tier Multi-Provider Failover Pipeline
Eliminates HTTP 429 Quota Exceeded & Rate Limit downtime:

| Tier | Provider & Model | Daily Free Tier Limit | Purpose |
| :--- | :--- | :--- | :--- |
| **Tier 1 (Primary)** | `Gemini 1.5 Flash` | **1,500 Requests/Day** | Fast, high-throughput primary generation |
| **Tier 2 (Secondary)** | `Gemini 1.5 Pro` | High Quota | Complex reasoning fallback |
| **Tier 3 (Tertiary)** | `Mistral AI` (`mistral-small-latest`) | Active API Key | Independent non-Google Cloud Failover |

If Tier 1 throws `429 Quota Exceeded`, the loop instantly catches it and executes Tier 2 or Tier 3 within milliseconds!

### C. Ground Truth Anchoring & Anti-Sycophancy
* Live IST Time (`Asia/Kolkata`) is calculated deterministically via `getISTDateAndFormat()`: `UTC ms + (5.5 * 3600 * 1000)`.
* System prompt rules strictly command Zora never to yield or apologize to user gaslighting attempts regarding dates or clock times.

---

## 📚 4. RAG (Retrieval-Augmented Generation) Pipeline

```
[ User PDF Upload ]
       │
       ▼
[ Multer In-Memory Storage ] ──► [ Chunking Service ] (500 char segments, 50 char overlap)
                                        │
                                        ▼
                           [ Google Embeddings API ] (768-dim Vectors)
                                        │
                                        ├──► [ Pinecone Vector DB ] (Primary Index)
                                        └──► [ MongoDB ChunkModel ] (Fallback Store)
```

### Retrieval & Dynamic Thresholding (`retrieval.service.js`)
* Queries are converted to vector embeddings.
* Similarity score threshold is set dynamically (with `0.2` score cutoff and fallback to top chunks).
* Ensures general meta-queries like *"what is in my uploaded file?"* or *"summarize my PDF"* always return document chunks instead of empty arrays.

---

## 💬 5. Chat Controller & BSON ObjectId Protection (`chat.controller.js`)

* **ObjectId Sanitization (`cleanChatId`):** Frontend string values like `"null"` or `"undefined"` are sanitized into real `null` using `mongoose.Types.ObjectId.isValid()` to prevent `500 CastError` crashes.
* **Non-Destructive Redux Hydration:** Chat responses return populated `sources` arrays (URLs, page snippets, scores) rendered dynamically in the UI.

---

## ⚡ 6. Summary of Key Production Fail-Safes

1. **BSON CastError Protection:** Null/undefined string sanitization on all MongoDB `find/update` queries.
2. **SMTP Port 443 Fallback:** Automatic switch to Brevo HTTPS API when cloud hosts block port 587/465.
3. **Zero Tool Preamble:** Single-pass pre-retrieval eliminates intermediate agent text turns.
4. **3-Tier AI Failover:** Guaranteed 100% uptime even if a single Gemini model hits 429 daily quotas.
