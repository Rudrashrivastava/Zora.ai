# 🚀 ZORA.AI — COMPLETE SYSTEM ARCHITECTURE MASTER GUIDE
### *The Only Document You Need to Understand, Explain, or Sell Zora.ai*

---

## 📌 TABLE OF CONTENTS
1. [What is Zora.ai?](#1-what-is-zoraai)
2. [Full Technology Stack](#2-full-technology-stack)
3. [Database Layer — Every MongoDB Schema Explained](#3-database-layer)
4. [Authentication System — Registration to Logout](#4-authentication-system)
5. [Email Delivery Pipeline — 3-Stage Failover](#5-email-delivery-pipeline)
6. [RAG Pipeline — PDF Upload to Vector Search](#6-rag-pipeline)
7. [AI Engine — Single-Pass & 3-Tier Failover](#7-ai-engine)
8. [Chat System — Message Lifecycle](#8-chat-system)
9. [API Route Map](#9-api-route-map)
10. [Production Safeguards](#10-production-safeguards)
11. [Interview Q&A Master Sheet](#11-interview-qa)

---

## 1. What is Zora.ai?

**Zora.ai** is a full-stack, production-deployed **AI-powered Search & Knowledge Engine**, built as a direct Perplexity.ai alternative.

> Standard LLMs have outdated knowledge cutoffs and hallucinate facts. Zora.ai solves this with 3 real-time data pipes:
> 1. **Live Tavily Web Search** — Real-time internet results injected into AI context before answering.
> 2. **RAG Document Intelligence** — User-uploaded PDFs converted to vectors and semantically searched for zero-hallucination, document-grounded answers.
> 3. **3-Tier AI Failover** — Gemini 1.5 Flash → Gemini 1.5 Pro → Mistral AI. Zero downtime even during Google API quota exhaustion.

**Deployed At:** `https://zora-ai-jew7.onrender.com`

---

## 2. Full Technology Stack

| Layer | Technology | Purpose |
|:---|:---|:---|
| **Frontend** | React 18, Vite, Redux Toolkit, React Router v6 | SPA with global state management |
| **Styling** | Tailwind CSS | Utility-first responsive design |
| **Markdown Rendering** | `react-markdown` + `remark-gfm` | Render AI responses as GitHub-flavored Markdown |
| **HTTP Client** | Axios (with interceptors) | API calls + silent token refresh on 401 |
| **Realtime** | Socket.IO | WebSocket for live features |
| **Backend** | Node.js v18 + Express.js | Async event-loop server |
| **ORM** | Mongoose ODM | MongoDB schema modeling, validation, B-Tree indexing |
| **Database** | MongoDB Atlas | Primary persistent data store |
| **AI Orchestration** | LangChain (`@langchain/google-genai`, `@langchain/mistralai`) | LLM invocation & embedding generation |
| **Primary LLM** | Google Gemini 1.5 Flash / 1.5 Pro | Fast text generation (1,500 req/day free tier) |
| **Fallback LLM** | Mistral AI `mistral-small-latest` | Independent cloud LLM for quota failover |
| **Embeddings Primary** | Mistral AI `mistral-embed` | Dense vector generation for RAG |
| **Embeddings Fallback** | Google `text-embedding-004` (768-dim) | Embedding fallback if Mistral unavailable |
| **Live Web Search** | Tavily REST API `@tavily/core` | Real-time internet search (max 4 results/query) |
| **Vector DB** | Pinecone DB | High-speed dense vector similarity search |
| **PDF Parsing** | `pdf2json` + Y-coordinate line grouping | Extract clean text from PDF files |
| **Text Chunking** | LangChain `RecursiveCharacterTextSplitter` | 500-char chunks, 80-char overlap |
| **File Uploads** | Multer (disk storage) | Handle multipart/form-data uploads |
| **Authentication** | JWT `jsonwebtoken` + `bcryptjs` | Token-based auth + password hashing |
| **Token Security** | SHA-256 hash + Refresh Token Rotation | Multi-device sessions with reuse detection |
| **Email** | Resend API → Brevo API → Nodemailer SMTP | 3-stage email delivery failover |
| **PDF Generation** | `pdfkit` | Download answers as formatted PDF |
| **CI/CD** | GitHub → Render Auto-Deploy | Every push to `main` auto-deploys |
| **Containerization** | Docker + Docker Compose | Local and production environment parity |
| **Orchestration** | Kubernetes configs (`k8s/`) | Enterprise-grade horizontal scaling readiness |

---

## 3. Database Layer

### 3.1 User Model (`user.model.js`)
```javascript
userSchema = {
  username:      String (unique, required, trim),
  email:         String (unique, lowercase, required),
  password:      String (bcrypt-hashed via pre-save hook),
  verified:      Boolean (default: false),
  role:          Enum["user", "admin"] (default: "user"),
  refreshTokens: [refreshTokenSchema]  // multi-device session array
}

refreshTokenSchema = {
  tokenHash:  String (SHA-256 hash — never stored raw),
  familyId:   String (rotation family ID for compromise detection),
  createdAt:  Date  (TTL index: auto-expires after 7 days),
  userAgent:  String (device fingerprint),
  ipAddress:  String (client IP for security audit)
}
```
**Key Points:**
- Password hashed in Mongoose `pre('save')` hook: `bcrypt.hash(password, 10)`.
- Refresh tokens stored as SHA-256 hash only — DB breach cannot expose raw tokens.
- One user can have multiple active refresh tokens (multi-device login).

---

### 3.2 Chat Model (`chat.model.js`)
```javascript
chatSchema = {
  user:   ObjectId (ref: "User"),
  title:  String (AI-generated 2-4 word title),
  pinned: Boolean (default: false)
}
// B-Tree Compound Index:
chatSchema.index({ user: 1, pinned: -1, updatedAt: -1 });
// → Sidebar query: user's chats, pinned first, most recent first
// → O(log N) instead of O(N) full collection scan
```

---

### 3.3 Message Model (`message.model.js`)
```javascript
messageSchema = {
  chat:    ObjectId (ref: "Chat", index: true),
  content: String (message text OR AI Markdown response),
  role:    Enum["user", "ai"],
  sources: [{
    title:   String,
    url:     String,
    snippet: String (first 250 chars of page content),
    type:    Enum["web", "document"],
    source:  String,
    score:   Number (cosine similarity score for doc chunks)
  }]
}
messageSchema.index({ chat: 1, createdAt: 1 }); // chronological thread retrieval
```
> **Sources Array:** Every AI message stores citations — web URLs or PDF chunk references. Frontend renders these as clickable "Source Cards" below each AI response.

---

### 3.4 Document + Chunk Models (`document.model.js`)
```javascript
// Document = metadata record of uploaded file
documentSchema = {
  user:         ObjectId (ref: "User"),
  title:        String (custom title or filename),
  originalName: String ("report.pdf"),
  mimeType:     String ("application/pdf"),
  size:         Number (bytes),
  chunkCount:   Number (how many vector chunks created),
  status:       Enum["processing", "completed", "failed"]
}

// Chunk = one text segment + its dense vector embedding
chunkSchema = {
  document:   ObjectId (ref: "Document"),
  user:       ObjectId (ref: "User"),
  text:       String (500-char text segment),
  embedding:  [Number] (dense float vector ~1024 floats),
  chunkIndex: Number,
  metadata:   { title, source, page }
}
```

---

## 4. Authentication System

### 4.1 Registration (`POST /api/auth/register`)
1. Check duplicates: `userModel.findOne({ $or: [{ email }, { username }] })`.
2. `userModel.create(...)` → `pre('save')` auto-runs `bcrypt.hash(password, 10)`.
3. Generate Email Verification JWT: `{ id, email, purpose: "email-verification" }` → expires `24h`.
4. Build `verificationUrl = ${frontendUrl}/verify-email?token=<jwt>`.
5. Call `sendEmail()` (3-stage fallover — see Section 5).
6. **Dev Mode Safety:** If email fails in `NODE_ENV=development` → auto-verify user and log link to console.

---

### 4.2 Login (`POST /api/auth/login`)
```javascript
// Access Token: short-lived (15m)
jwt.sign({ id, username, role }, ACCESS_TOKEN_SECRET, { expiresIn: "15m" })

// Refresh Token: long-lived (7d) with familyId for rotation tracking
jwt.sign({ id, familyId: crypto.randomUUID() }, REFRESH_TOKEN_SECRET, { expiresIn: "7d" })

// Hash before storing:
crypto.createHash("sha256").update(rawRefreshToken).digest("hex")
```

**Cookie setup:**
```javascript
// Access Token cookie (15 min):
{ httpOnly: true, secure: true(prod), sameSite: "none"(prod), maxAge: 15*60*1000 }

// Refresh Token cookie (7 days) — path restricted:
{ httpOnly: true, secure: true(prod), sameSite: "none"(prod), path: "/api/auth", maxAge: 7d }
```

---

### 4.3 Refresh Token Rotation with Reuse Detection (`POST /api/auth/refresh`)
This is **enterprise-grade token security**:

1. Extract raw token from HttpOnly cookie.
2. `jwt.verify(token, REFRESH_TOKEN_SECRET)` — validate JWT signature & expiry.
3. Compute `hash = SHA256(rawToken)`.
4. Search user's `refreshTokens` array for matching hash.

**🔐 REUSE DETECTION (Key Security Feature):**
```javascript
if (!storedToken) {
  // Valid JWT signature but hash NOT in DB = token was already rotated
  // = someone is replaying a stolen/old refresh token
  user.refreshTokens = [];  // WIPE ALL sessions for this user
  await user.save();
  clearAuthCookies(res);
  return res.status(401).json({ code: "TOKEN_REUSE_DETECTED" });
}
```
5. **ROTATION:** Remove old hash → generate fresh `accessToken` + `refreshToken` → store new hash.

---

### 4.4 Logout (`POST /api/auth/logout`)
- Removes ONLY the current device's token: `$pull: { refreshTokens: { tokenHash } }`.
- **Multi-device aware** — other devices remain logged in.
- `clearCookie("accessToken")` + `clearCookie("refreshToken", { path: "/api/auth" })`.

---

## 5. Email Delivery Pipeline

`mail.service.js` runs a **3-Stage Priority Waterfall**:

```
Stage 1: Resend HTTPS REST API (api.resend.com) — Port 443
    ↓ if RESEND_API_KEY missing or HTTP error
Stage 2: Brevo HTTPS REST API (api.brevo.com/v3/smtp/email) — Port 443
    ↓ if BREVO_API_KEY missing or HTTP error
Stage 3: Nodemailer SMTP (smtp.gmail.com:465) with IPv4-forced
```

**Why 3 stages exist:**
- Render.com blocks all outbound SMTP ports (25, 465, 587) at firewall level.
- Without Port 443 REST APIs, email on Render is impossible via SMTP.
- Even Nodemailer on IPv6-enabled hosts throws `connect ENETUNREACH` on IPv6 sockets.

**IPv4 Forcing Implementation:**
```javascript
import dns from "dns";
dns.setDefaultResultOrder("ipv4first"); // Force DNS resolution to prefer IPv4 records

nodemailer.createTransport({
  host: "smtp.gmail.com", port: 465, secure: true,
  family: 4,  // TCP socket MUST use IPv4
  auth: smtpAuth
})
```

---

## 6. RAG Pipeline

### Full PDF Upload → Storage → Retrieval Flow:

```
[User clicks "Upload PDF"]
        │
        ▼
[POST /api/rag/upload] → Multer saves to temp disk path
        │
        ▼
[rag.controller.uploadDocument()]
        │ calls ingestDocument()
        ▼
[Step 1: Text Extraction — extractPDFText()]
  pdf2json parses PDF binary
  Y-coordinate line grouping preserves reading order:
    textObj.y → round to 1 decimal → group fragments by row → join → clean
  cleanExtractedText() fixes:
    "AIBreakthroughs" → "AI Breakthroughs" (camelCase fix)
    "2026AI"          → "2026 AI" (number-letter fix)
        │
        ▼
[Step 2: Chunking — RecursiveCharacterTextSplitter]
  chunkSize: 500,   chunkOverlap: 80
  → textChunks = ["chunk0 text...", "chunk1 text...", ...]
        │
        ▼
[Step 3: Embedding — embeddings.embedQuery(chunkText)]
  Primary:  Mistral AI "mistral-embed" → float[] vector
  Fallback: Google "text-embedding-004" → 768-dim float[] vector
        │
        ▼
[Step 4: Storage]
  MongoDB ChunkModel.insertMany([{ text, embedding: float[], chunkIndex, ... }])
  Pinecone pineconeIndex.upsert({ records: [{ id, values: float[], metadata }] })
        │
        ▼
[DocumentModel.status = "completed", chunkCount = N]
        │
        ▼
[Temp file deleted: fs.unlinkSync(tempPath)]
```

---

### Retrieval at Query Time (`retrieval.service.js`):
```javascript
// 1. Embed the user's query
const queryVector = await embeddings.embedQuery(userQuery);

// 2. Try Pinecone first (fast ANN search)
pineconeIndex.query({ vector: queryVector, topK: 4, filter: { userId } })

// 3. MongoDB Cosine Similarity fallback
// Formula: similarity = (A · B) / (|A| × |B|)
function cosineSimilarity(A, B) {
  const dot   = A.reduce((s, a, i) => s + a * B[i], 0);
  const normA = Math.sqrt(A.reduce((s, a) => s + a * a, 0));
  const normB = Math.sqrt(B.reduce((s, b) => s + b * b, 0));
  return dot / (normA * normB); // Range: -1 to 1. Higher = more semantically similar.
}

// Filter: score > 0.2 (with fallback to return top chunks if none pass threshold)
```

---

## 7. AI Engine

### 7.1 Single-Pass Context Pre-Retrieval Architecture
```
[Query arrives at generateResponse(messages, userId)]
        │
        ├── 1. RAG Retrieval: embeddings.embedQuery(query) → Cosine Search → top 5 PDF chunks
        │         ragContextText = "[DOCUMENT CHUNK 1 (title)]:\n{chunk text}\n\n..."
        │
        ├── 2. Web Search (if NOT a document question):
        │         tavily.search(query, { maxResults: 4 }) → top 4 web articles
        │         webContextText = "[WEB SOURCE 1 - title (url)]:\n{article content}\n\n..."
        │
        ├── 3. Build System Prompt:
        │         "You are Zora.ai..."
        │         "LIVE IST TIME: ${currentTimeStr} on ${currentDateStr}"
        │         "=== UPLOADED USER DOCUMENT KNOWLEDGE BASE ===\n${ragContextText}"
        │         "=== LIVE WEB SEARCH CONTEXT RESULTS ===\n${webContextText}"
        │         "DIRECTLY ANSWER. DO NOT output tool preambles."
        │
        └── 4. 3-Tier Provider Loop → single llm.invoke(chatHistory) → clean Markdown answer
```

---

### 7.2 IST Time Computation
```javascript
function getISTDateAndFormat() {
  const istTime = new Date(Date.now() + (5.5 * 60 * 60 * 1000)); // UTC + 330 min
  // Use .getUTC*() methods to read IST components correctly
  // Works on ALL Linux Docker hosts regardless of system timezone
}
```

---

### 7.3 3-Tier Multi-Provider Failover
```javascript
const providers = [
  { name: "Gemini 1.5 Flash", fn: () => new ChatGoogleGenerativeAI({ model: "gemini-1.5-flash" }).invoke(chatHistory) },
  { name: "Gemini 1.5 Pro",   fn: () => new ChatGoogleGenerativeAI({ model: "gemini-1.5-pro"   }).invoke(chatHistory) },
  { name: "Mistral AI",       fn: () => new ChatMistralAI({ model: "mistral-small-latest"      }).invoke(chatHistory) },
];

for (const provider of providers) {
  try {
    rawAnswer = await provider.fn();
    if (rawAnswer?.trim()) { console.log(`✅ ${provider.name} succeeded`); break; }
  } catch (err) {
    console.warn(`⚠️ ${provider.name} failed (${err.message}). Trying next provider...`);
    // 429 Quota / 503 / any error → silently caught → next provider tried immediately
  }
}
```

---

### 7.4 Response Sanitizer
```javascript
cleanResponseText(rawText)
  → strips Gemini pipe tokens:  <|tool_calls_section_begin|>...<|tool_calls_section_end|>
  → strips LangChain artifacts: functions.searchInternet:0
  → strips inline JSON calls:   searchInternet: {"query": "..."}
  → strips pseudo-XML tags:     <getCurrentTime>...</getCurrentTime>
  → strips first-line preamble: "I'll search for..." if response has multiple lines
```

---

## 8. Chat System

### `sendMessage()` Step-by-Step (`chat.controller.js`):
```
1. cleanChatId(rawChatId)
   → converts "null" / "undefined" strings to actual null
   → mongoose.Types.ObjectId.isValid() validation
   → prevents BSON CastError 500 crashes

2. If no chatId → CREATE NEW CHAT
   → generateChatTitle(message) → LLM produces 2-4 word title
   → chatModel.create({ user, title })

3. Verify ownership → chatModel.findOne({ _id, user: req.user.id })

4. Save user message → messageModel.create({ chat, content, role: "user" })

5. Load full chat history → messageModel.find({ chat }).sort({ createdAt: 1 })
   → passed as context to AI (conversation memory)

6. generateResponse(contextMessages, userId) → { answer, sources[] }
   → RAG + Web Search + 3-Tier LLM → clean Markdown

7. Save AI reply → messageModel.create({ chat, content: answer, role: "ai", sources })

8. Update chat timestamp → findByIdAndUpdate({ updatedAt: new Date() }, { returnDocument: "after" })

9. Return { title, chat, messages: allMessages }
```

---

## 9. API Route Map

| Method | Endpoint | Auth | Function |
|:---|:---|:---|:---|
| POST | `/api/auth/register` | Public | `register()` |
| GET | `/api/auth/verify-email?token=` | Public | `verifyEmail()` |
| POST | `/api/auth/login` | Public | `login()` |
| POST | `/api/auth/refresh` | Cookie | `refreshTokens()` |
| POST | `/api/auth/logout` | Private | `logout()` |
| GET | `/api/auth/get-me` | Private | `getMe()` |
| POST | `/api/chats/message` | Private | `sendMessage()` |
| GET | `/api/chats` | Private | `getChats()` |
| GET | `/api/chats/:id/messages` | Private | `getChatMessages()` |
| DELETE | `/api/chats/:id` | Private | `deleteChat()` |
| PATCH | `/api/chats/:id/rename` | Private | `renameChat()` |
| PATCH | `/api/chats/:id/pin` | Private | `pinChat()` |
| POST | `/api/rag/upload` | Private | `uploadDocument()` |
| GET | `/api/rag/documents` | Private | `getDocuments()` |
| DELETE | `/api/rag/documents/:docId` | Private | `deleteDocument()` |
| POST | `/api/rag/query` | Private | `queryKnowledgeBase()` |
| POST | `/api/pdf/generate` | Private | `generatePDF()` |
| GET | `/healthz` | Public | Kubernetes liveness probe |
| GET | `/readyz` | Public | Kubernetes readiness probe (checks MongoDB conn) |

---

## 10. Production Safeguards

| Safeguard | Implementation | Why |
|:---|:---|:---|
| **Reverse Proxy Trust** | `app.set("trust proxy", 1)` | Correct client IP behind Nginx/Render/K8s |
| **BSON ObjectId Guard** | `cleanChatId()` — converts `"null"/"undefined"` strings to `null` | Prevents MongoDB 500 CastError |
| **B-Tree Indexes** | `{ user, pinned, updatedAt }` on Chat, `{ chat, createdAt }` on Message | O(log N) vs O(N) query complexity |
| **Token Reuse Detection** | SHA-256 hash + missing-from-DB check → wipe all sessions | Prevents stolen token replay attacks |
| **IPv4 Forced SMTP** | `family: 4` + `dns.setDefaultResultOrder("ipv4first")` | Fixes IPv6 ENETUNREACH on cloud hosts |
| **Kubernetes Probes** | `/healthz` (process alive), `/readyz` (MongoDB ready) | Zero-downtime rolling deployments |
| **SPA Fallback** | Any non-API route → `index.html` | Enables React Router client-side navigation |
| **Dev Auto-Verify** | `user.verified = true` if email fails in dev mode | Fast local development without email setup |
| **3-Tier AI Failover** | Per-provider isolated try/catch loop | Guarantees response even on 429 quota errors |

---

## 11. Interview Q&A Master Sheet

**Q: Explain your RAG pipeline from PDF upload to user answer.**
> User uploads PDF → Multer saves to disk → `pdf2json` extracts text with Y-coord line grouping → `RecursiveCharacterTextSplitter` (500 chars, 80 overlap) → Mistral `mistral-embed` / Google `text-embedding-004` converts each chunk to dense vector → stored in Pinecone DB + MongoDB `ChunkModel`. At query time: user query → vector → Cosine Similarity vs stored vectors → top 4-5 chunks → injected into LLM System Prompt → grounded, zero-hallucination answer.

**Q: How did you handle 429 Quota Exceeded errors in production?**
> Old LangChain agent loop had `p-retry` queue that let 429 errors bypass inner catch blocks. I replaced it with an explicit `for...of` loop over 3 providers with **isolated try/catch per model**: Gemini 1.5 Flash → Gemini 1.5 Pro → Mistral AI. Each 429 is silently caught and the next model is tried in milliseconds. User sees no error.

**Q: How is authentication secured at production level?**
> Dual JWT (access 15m + refresh 7d) in HttpOnly Secure cookies. Refresh tokens stored as SHA-256 hashes (never raw). Refresh Token Rotation: on every refresh, old hash is deleted, new one generated. **Reuse Detection**: if a valid JWT's hash is missing from DB (already rotated), ALL user sessions are wiped — protecting against stolen token replay attacks.

**Q: Why does Zora.ai compute IST time manually instead of using timezone libraries?**
> On Render's Linux Docker, the IANA timezone database may be incomplete or missing. `Intl.DateTimeFormat` depends on it. `UTC + 5.5 hours` computed via `Date.now() + (5.5 * 60 * 60 * 1000)` is 100% arithmetic — works on any host without any dependency.

**Q: How did you solve email delivery on cloud where SMTP is blocked?**
> 3-stage waterfall: Resend HTTPS REST API → Brevo HTTPS REST API → Nodemailer SMTP. Resend and Brevo both use standard HTTPS Port 443 which is never blocked. Nodemailer is last resort with `family: 4` (IPv4-forced socket) and `dns.setDefaultResultOrder("ipv4first")`.

**Q: Why single-pass AI instead of LangChain agent loops?**
> Agent loops cause multi-turn latency (3x calls) and leak intermediate text ("I'll search for...") into responses. Pre-retrieval collects RAG chunks + Tavily web results deterministically before the LLM call. One `llm.invoke(chatHistory)` synthesizes the full answer with all context already in the prompt.

---

*Zora.ai — Built by Rudra Shrivastava | Production: `https://zora-ai-jew7.onrender.com`*
