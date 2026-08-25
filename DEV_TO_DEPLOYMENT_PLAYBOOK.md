# 📚 Dev-to-Deployment Master Playbook & Problem-Solving Guide

---

## 🗺️ Part 1: How Frontend & Backend Are Mapped in Zora.ai

```
[User Interface] ➔ [Redux & Custom Hooks] ➔ [Axios HTTP API] ➔ [Express Controller] ➔ [LangChain AI / DB]
 (Dashboard.jsx)       (useChat.js)         (chat.api.js)      (chat.controller.js)    (ai.service.js)
```

### User Message Submission Flow
1. User types in `<textarea>` in `Dashboard.jsx` and clicks Send / presses Enter.
2. `handleSubmitMessage` adds an **optimistic message** to local UI state (`setOptimisticMsgs`) so the prompt appears **instantly**.
3. Calls `handleSendMessage({ message, chatId })` in `useChat.js`.
4. `useChat` calls `sendMessage()` in `chat.api.js` sending a POST request via `api` (Axios instance).
5. **Express Server** receives request in `chat.controller.js` (`sendMessage`), creates Chat if `!chatId` with AI-generated title (`generateChatTitle`), stores user message in `messageModel`, and passes context to `ai.service.js`.
6. **AI Service (`ai.service.js`)** executes Tavily Search / RAG document chunks, then calls Gemini AI (Primary) or Mistral AI (Failover).
7. Server returns AI response + cited sources.
8. `useChat` dispatches `addMessages` and `createNewChat`/`renameChatLocal` to Redux store (`chat.slice.js`).

---

## 🛠️ Part 2: Real Problems Encountered & How We Solved Them

### ❌ Problem 1: Share Link Giving `http://localhost:5173` on Render Production
- **Fix**:
  1. Backend inspects `req.headers.origin` & `req.headers.referer` first.
  2. Frontend Sanitizer in `Dashboard.jsx` rewrites any `localhost` URL to `window.location.origin`.

### ❌ Problem 2: Chat Title Always Defaulting to `"New Chat"`
- **Fix**:
  1. Safe text extraction for strings/arrays/objects returned by `@langchain/google-genai`.
  2. Prompt excerpt fallback extracting 3–5 key capitalized words.
  3. MongoDB auto-repair on `getChats` converting old `"New Chat"` database records to meaningful titles.

### ❌ Problem 3: Share UI Using Native Browser `alert()`
- **Fix**: Interactive **Share Modal** in `Dashboard.jsx` with read-only URL input, `"Copy Link"` button, hyperlinked text, and Web Share API (`navigator.share`).

### ❌ Problem 4: Sidebar Options Hidden Behind `opacity-0`
- **Fix**: Made sidebar 3-dots visible by default (`opacity-80`) and added direct **Rename (Pencil)** and **Delete (Trash)** buttons to top header.

### ❌ Problem 5: High Load Performance & Scaling (1,000+ Users)
- **Fix**: Connection pooling (`maxPoolSize: 50`) in `database.js` + B-Tree compound indexes on `user`/`pinned`/`updatedAt` and `chat`/`createdAt`.

---

## 🚦 Part 3: Deployment Decision Framework

- **Docker**: Containerize dependencies to solve "works on my computer" issues.
- **Git & GitHub CI/CD**: Automate builds and continuous deployment pipelines.
- **Render / PaaS**: Startups, portfolio projects, MVPs up to 50,000+ users.
- **AWS EC2 / ECS**: Dedicated hardware control and reserved instances.
- **Kubernetes (AWS EKS)**: Enterprise scale with 20+ microservices and multi-region traffic.
