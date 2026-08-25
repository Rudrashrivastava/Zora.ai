# 🌟 Zora.ai — Complete End-User Services & Product Features

This guide details all the **User-Facing Services, Features, and Value Offerings** provided by Zora.ai to the end-user.

---

## 1. 🌐 Real-Time AI Web Search & Synthesis Engine
* **What the User Gets:** Perplexity-style live web research. Users can ask about current 2026 events, latest AI breakthroughs, sports scores, live weather, or global news.
* **Under the Hood:**
  - Integrates **Tavily REST API** for live web search.
  - Generates comprehensive, multi-paragraph Markdown responses with bold headings and bullet points.
  - Automatically attaches clickable source cards (`sources` array) with titles, URLs, and page snippets.

---

## 2. 📄 Personal Document Intelligence (RAG Engine)
* **What the User Gets:** A private Knowledge Base where users can upload PDFs, CVs, resumes, research papers, or text files and ask questions directly to their documents.
* **Under the Hood:**
  - Files are processed via in-memory `Multer` storage.
  - Segments text into 500-character chunks and converts them to 768-dimensional dense vectors via **Google Embeddings**.
  - Stores vectors in **Pinecone DB** and chunks in **MongoDB**.
  - Executes **Cosine Similarity Search** ($\text{cutoff} > 0.2$) to fetch strict, zero-hallucination answers grounded only in the user's PDF.

---

## 3. 🕒 Ground Truth Live Clock & Anti-Sycophancy Anchor
* **What the User Gets:** 100% accurate time and date information in Indian Standard Time (`Asia/Kolkata` IST).
* **Under the Hood:**
  - Backend computes UTC + 5.5 hours deterministically via `getISTDateAndFormat()`.
  - System prompt enforces **Anti-Sycophancy Rules**: If a user attempts to gaslight or trick the AI into agreeing with a false date/time, Zora confidently corrects the user using the live system clock.

---

## 4. ⚡ Zero Downtime Multi-Provider AI (3-Tier Engine)
* **What the User Gets:** Uninterrupted, lightning-fast AI responses without annoying "Quota Exceeded" or "429 Rate Limit" crashes.
* **Under the Hood:**
  - **Tier 1:** `Gemini 1.5 Flash` (Primary high-speed model).
  - **Tier 2:** `Gemini 1.5 Pro` (Secondary model).
  - **Tier 3:** `Mistral AI` (`mistral-small-latest`).
  - Automatically fails over in milliseconds if any single AI provider experiences rate limits.

---

## 5. 🎯 Instant Suggested Discovery Queries
* **What the User Gets:** One-click pre-defined suggestion cards on the home screen (*"What are the latest breakthroughs in AI this year?"*) that immediately execute full research reports.
* **Under the Hood:** Single-pass pre-retrieval guarantees full, multi-paragraph Markdown answers on the first click without 1-line tool preambles.

---

## 6. 🔒 Secure Account & Authentication Services
* **What the User Gets:** Safe user accounts, password security, email verification, and persistent chat history across devices.
* **Under the Hood:**
  - 6-digit OTP verification via **Nodemailer IPv4 (Port 465)** and **Brevo HTTPS REST API (Port 443 Fallback)**.
  - Dual JWT tokens (Short-lived Access Token + HttpOnly Refresh Cookie).
  - **Silent Token Refresh Interceptor:** Automatically refreshes expired tokens in the background without forcing the user to log in again.

---

## 7. 🧹 Clean, Citation-Backed Output Filtering
* **What the User Gets:** A crisp, distraction-free reading UI.
* **Under the Hood:** `cleanResponseText()` sanitizer automatically strips internal Gemini pipe tokens (`<|tool_calls_section_begin|>`), pseudo-XML tags (`<getCurrentTime>`), and raw JSON tool payloads.
