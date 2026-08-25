# ⚙️ PRODUCTION-READY ENGINEERING STANDARDS & RULES

> **Workspace Rules for Zora.ai & Future Enterprise AI Applications**

---

## 1. AI & RAG PIPELINE RULES

### 1.1 3-Tier Multi-Provider Failover
- NEVER rely on a single LLM provider or single API key.
- ALWAYS implement an explicit `for...of` provider failover loop with isolated `try/catch` per provider.
- ALWAYS set `maxRetries: 0` on individual SDK instances so internal retry queues (e.g. LangChain `p-retry`) do NOT trap 429 / 404 / quota errors.
- **Provider Cascade Order:**
  1. `Gemini 1.5 Flash` (Primary — fast, high quota)
  2. `Gemini 1.5 Pro` (Secondary — higher quality fallback)
  3. `Mistral AI` (`mistral-small-latest`) (Independent cloud LLM — guaranteed failover when Google API is down/throttled)

### 1.2 Deterministic Single-Pass Context Pre-Retrieval
- NEVER use multi-turn agent loops (`agent.invoke()`) for RAG or search tasks — they cause 3x latency and leak intermediate tool preambles (`"I'll search for..."`).
- ALWAYS pre-retrieve vector RAG document chunks and Tavily web search results **before** invoking the LLM.
- Inject collected context directly into the System Prompt.
- Call `llm.invoke(chatHistory)` in ONE single pass for clean, instant, multi-paragraph Markdown responses with clickable citations.

---

## 2. DATABASE & PERFORMANCE RULES

### 2.1 Mongoose B-Tree Compound Indexing
- EVERY collection query must be backed by a compound B-tree index.
- `chatSchema.index({ user: 1, pinned: -1, updatedAt: -1 });` — reduces sidebar lookup from $O(N)$ full collection scan to $O(\log N)$.
- `messageSchema.index({ chat: 1, createdAt: 1 });` — chronological message thread lookup in $O(\log N)$.

### 2.2 Input Sanitization & BSON Guards
- ALWAYS sanitize input IDs before querying MongoDB.
- `cleanChatId(rawId)`: convert string `"null"`, `"undefined"`, `""`, or invalid ObjectIds to actual `null`.
- Prevents BSON 500 `CastError` crashes when frontend sends uninitialized state values.

---

## 3. AUTHENTICATION & SECURITY RULES

### 3.1 Dual JWT & HttpOnly Cookies
- Access Tokens: Short-lived (`15m`), HttpOnly cookie.
- Refresh Tokens: Long-lived (`7d`), HttpOnly cookie with restricted path `path: "/api/auth"`.
- `secure: true` in production, `sameSite: "none"` for cross-origin frontend-backend communication.

### 3.2 Token Hashing & Refresh Token Rotation
- NEVER store raw refresh tokens in the database.
- Compute SHA-256 hash `crypto.createHash("sha256").update(rawToken).digest("hex")` and store ONLY the hash in `user.refreshTokens`.
- **Reuse Detection:** If a valid JWT's hash is missing from DB (token was already rotated), immediately wipe ALL user sessions (`user.refreshTokens = []`) to protect against stolen token replay attacks.
- Multi-device aware: Logout MUST `$pull` only the current device's token hash.

---

## 4. NETWORKING & CLOUD INFRASTRUCTURE RULES

### 4.1 Reverse Proxy Trust
- `app.set("trust proxy", 1);` MUST be configured on Express app to extract true client IP behind Render / Nginx / Kubernetes ingress proxies.

### 4.2 Cloud Firewall Email Delivery Waterfall
- NEVER rely solely on Nodemailer SMTP for cloud hosts (Render/AWS block outbound SMTP ports 25/465/587).
- **Waterfall Pipeline:**
  1. Resend HTTPS REST API (Port 443 — unblockable)
  2. Brevo HTTPS REST API (Port 443 — unblockable)
  3. Nodemailer SMTP (Port 465) with `family: 4` (IPv4-forced socket) and `dns.setDefaultResultOrder("ipv4first")` to fix IPv6 `ENETUNREACH`.

### 4.3 Production Probes & Single Server Fallback
- `/healthz` (Process liveness probe) & `/readyz` (Database readiness probe) endpoints required for zero-downtime rolling deployments.
- Serves production React build from `frontend/dist` or `public` with SPA catch-all fallback `res.sendFile(index.html)` for non-API routes.
