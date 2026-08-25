# 👥 Zora.ai — Final Team Collaboration & Git Push Playbook

---

## ⚖️ Complete 50-50 File Division Matrix

| Category | **DEVELOPER 1: Rudra (You)** | **DEVELOPER 2: Teammate** |
| :--- | :--- | :--- |
| **Backend** | `backend/src/services/` (AI Engine, Tavily Search, RAG Pinecone, PDF)<br>`backend/src/config/database.js` (DB Connection Pooling)<br>`backend/src/models/chat.model.js`, `message.model.js`, `document.model.js`<br>`backend/src/sockets/server.socket.js` (Socket Server)<br>`backend/src/app.js`, `server.js` | `backend/src/controllers/` (`chat.controller.js`, `auth.controller.js`, `pdf.controller.js`, `rag.controller.js`)<br>`backend/src/middleware/` (`auth.middleware.js`, `upload.middleware.js`)<br>`backend/src/routes/` (`chat.routes.js`, `auth.routes.js`, `pdf.routes.js`, `rag.routes.js`)<br>`backend/src/models/user.model.js` |
| **Frontend** | `frontend/src/app/App.jsx`, `app.routes.jsx`<br>`frontend/src/app/app.store.js`, `index.css`<br>`frontend/src/features/auth/components/Protected.jsx`<br>`frontend/src/features/auth/hooks/useAuth.js`<br>`frontend/src/features/auth/service/auth.slice.js`, `auth.api.js` | `frontend/src/features/chat/pages/Dashboard.jsx` & `ShareChat.jsx`<br>`frontend/src/features/chat/hooks/useChat.js`<br>`frontend/src/features/chat/chat.slice.js`<br>`frontend/src/features/chat/service/chat.api.js` & `chat.socket.js`<br>`frontend/src/features/auth/pages/` (Login, Register, Verify)<br>`frontend/src/lib/axios.js` |
| **DevOps & Specs** | `docker-compose.yml`, `k8s/`, `README.md`, `MASTER_PROJECT_GUIDE.md`, `DEV_TO_DEPLOYMENT_PLAYBOOK.md`, `auth_audit.md`, `DEPLOYMENT.md` | Config & Boilerplate Setup: `vite.config.js`, `eslint.config.js`, `package.json`, `index.html` |

---

## 🛠️ Step-by-Step Copy-Paste Commands for Teammate

Teammate opens VS Code Terminal in `d:\perplexity` and runs:

### Step 1: Set Teammate Git Identity
```bash
git config user.name "Teammate Ka Naam"
git config user.email "teammate_email@gmail.com"
```

### Step 2: Commit Backend Controllers, Routes & Middleware (50% Backend)
```bash
git add backend/src/controllers/ backend/src/routes/ backend/src/middleware/ backend/src/models/user.model.js
git commit -m "feat(backend): implement Auth & Chat controllers, JWT middleware and express API routes"
```

### Step 3: Commit Frontend Auth Pages, Dashboard UI & Axios Interceptor (50% Frontend)
```bash
git add frontend/src/features/auth/pages/ frontend/src/features/chat/pages/ frontend/src/features/chat/hooks/ frontend/src/features/chat/chat.slice.js frontend/src/lib/axios.js
git commit -m "feat(frontend): build Dashboard UI, Share Modal, Auth pages, Redux chat store and Axios client"
```

### Step 4: Push to GitHub
```bash
git push origin main
```

---

## 🎤 What to Tell the Interviewer About Team Work Allocation

> **"Sir/Ma'am, we divided the full-stack architecture equally based on core responsibilities:**
> 
> - **Rudra (Lead Architect & AI Engineer)**: Built the **LangChain AI Engine** (Gemini primary + Mistral failover), Tavily Internet Search, Vector RAG Document Services, Database Connection Pooling, Socket.io server, Docker containers, and overall Routing Shell.
> - **Teammate (Full-Stack Engineer)**: Built the **Express API Controllers & Routes**, JWT Authentication Middleware, Auth UI Pages, Redux Chat Store Slice, Glassmorphic Dashboard UI, Interactive Share Modal, and Axios Interceptors."**
