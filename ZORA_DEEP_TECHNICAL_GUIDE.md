# 🧠 ZORA.AI — DEEP TECHNICAL KNOWLEDGE GUIDE
### *Har Technology Ko Simple Language Mein Samajhna — Interview Ready*


---

> **Yeh Guide Kiske Liye Hai?**  
> Jo log sab kuch code mein likhna jaante hain lekin interview mein puchha jaye ki *"Yeh `app.set('trust proxy', 1)` kyun likha?"* toh answer nahi milta. Yeh guide usi gap ko bharne ke liye hai.  
> Har cheez: **kya hai → real life example → project mein kyun use kiya → actual code**.

---


## 📌 INDEX

1. [Node.js & Express.js — Server Ki Neev](#1-nodejs--expressjs)
2. [Middleware — Request ka Security Guard](#2-middleware)
3. [`app.set("trust proxy", 1)` — Proxy ka Sachcha IP](#3-trust-proxy)
4. [CORS — Browser ka Visa System](#4-cors)
5. [morgan — Request ka CCTV Logger](#5-morgan)
6. [cookieParser — Cookie ka Interpreter](#6-cookieparser)
7. [JWT (JSON Web Token) — Digital ID Card](#7-jwt-json-web-token)
8. [bcryptjs — Password ka Safe Locker](#8-bcryptjs)
9. [HttpOnly Cookies — Invisible Secure Pouch](#9-httponly-cookies)
10. [Refresh Token Rotation — Token ki Chabi Badalna](#10-refresh-token-rotation)
11. [SHA-256 Hashing — Token ka Fingerprint](#11-sha-256-hashing)
12. [MongoDB Atlas & Mongoose — Database System](#12-mongodb--mongoose)
13. [B-Tree Index — Database ki Fast Search Book](#13-b-tree-index)
14. [Multer — File Upload ka Postman](#14-multer)
15. [PDF Parsing with pdf2json — PDF ka Text Reader](#15-pdf-parsing)
16. [Text Chunking — Document ko Todna](#16-text-chunking)
17. [Vector Embeddings — Text ko Numbers Mein Banana](#17-vector-embeddings)
18. [Cosine Similarity — Kitna Similar Hai?](#18-cosine-similarity)
19. [Pinecone Vector DB — Vector ka Special Search Engine](#19-pinecone-vector-db)
20. [RAG (Retrieval Augmented Generation) — AI ka Real Source](#20-rag-retrieval-augmented-generation)
21. [LangChain — AI ka Remote Control](#21-langchain)
22. [Tavily Search API — AI ka Google](#22-tavily-search-api)
23. [3-Tier AI Failover — AI ka Backup System](#23-3-tier-ai-failover)
24. [Socket.IO — Real-Time Connection](#24-socketio)
25. [PDFKit — AI ka PDF Writer](#25-pdfkit)
26. [Nodemailer & Email Failover Pipeline](#26-email-pipeline)
27. [Docker & Docker Compose — App ka Dabba](#27-docker)
28. [Kubernetes Probes — App ka Health Check](#28-kubernetes-probes)
29. [Axios Interceptors — Frontend ka Silent Token Refresher](#29-axios-interceptors)
30. [Redux Toolkit — Frontend ka Global Memory](#30-redux-toolkit)

---

## 1. Node.js & Express.js

### Node.js kya hai?
**Real Life Analogy:** Ek restaurant ka kitchen jisme ek hi chef hai, lekin woh bohot fast hai. Ek time mein ek kaam karta hai, lekin itna fast ki lagta hai sab kaam ek saath ho rahe hain.

Node.js ek JavaScript runtime hai jo **browser se bahar** (server pe) chalata hai. JavaScript browser mein chalta tha — Node ne use server pe bhi chalane diya.

**Key Concept — Non-Blocking / Async:**  
Normal (blocking) server: Request 1 ayi → wait karo finish hone ka → phir Request 2 lo.  
Node.js (non-blocking): Request 1 ayi → process shuru karo → Response aane se pehle Request 2 bhi lo → jab bhi result milta hai deliver karo.

```javascript
// Node.js Event Loop - ek saath multiple users handle kar sakta hai
// bina multiple threads ke - isliye memory efficient hai
```

---

### Express.js kya hai?
**Real Life Analogy:** Ek traffic police officer jo different roads pe alag-alag gadiyon ko direct karta hai ki kaun kis route pe jayega.

Express ek web framework hai jo Node.js ke upar bana hai. Yeh handle karta hai:
- **Routing:** `/api/auth/login` → is route pe jo request aaye woh login function ko dedo
- **Middleware Pipeline:** Request aane ke baad ek ke baad ek processes se guzre
- **Response:** JSON data wापas bhejo

```javascript
import express from "express";
const app = express();

// Jab koi /api/auth/login pe POST request kare
app.post("/api/auth/login", loginFunction);
```

---

## 2. Middleware

### Middleware kya hota hai?
**Real Life Analogy:** Airport security lanes. Aap plane pe seedha nahi baith sakte — pehle boarding pass check, phir security scan, phir customs, tab gate. Har step ek **middleware** hai.

Express mein har request ek **middleware chain** se guzarti hai. Middleware ek function hai jo:
1. Request dekhe
2. Kuch kare (check karo, modify karo, log karo)
3. Ya `next()` call kare (agle middleware pe bhejo)
4. Ya response bhej de (chain rok de)

```javascript
// Example: Auth Middleware
export function authUser(req, res, next) {
    const token = req.cookies?.accessToken;  // Step 1: Cookie nikalo
    
    if (!token) {
        return res.status(401).json({ message: "Login karo pehle" }); // Chain rok do
    }
    
    const decoded = jwt.verify(token, SECRET);  // Step 2: Token check karo
    req.user = decoded;   // Step 3: User info request mein daal do
    next();               // Step 4: Aage bhejo (controller tak)
}
```

**Zora.ai mein middleware chain:**
```
HTTP Request → express.json() → cookieParser() → morgan() → CORS → authUser → Controller
```

---

## 3. Trust Proxy

### `app.set("trust proxy", 1)` — Yeh Line Kyun?

**Problem samjho:**  
Render / Nginx / Kubernetes mein aapka Express server seedha internet se connected nahi hota. Beech mein ek **Reverse Proxy** (Nginx ya Render ka load balancer) hota hai.

**Real Life Analogy:** Aap doctor ke paas gaye, lekin pehle receptionist se mili jisne apna naam likha. Doctor ki diary mein "receptionist ayi" show karega, na ki "aap". 

Bina `trust proxy` ke Express ko lagta hai ki request **Nginx/Render ke server** se aayi — actual user ka IP 127.0.0.1 (localhost) dikh raha hota hai. Rate limiting, IP-based security sab galat kaam karta hai.

```javascript
app.set("trust proxy", 1);
// "1" matlab: ek proxy ke peeche ho tum
// Ab Express X-Forwarded-For header se real user IP padh sakta hai
```

```

User IP: 103.21.58.40
    ↓
[Nginx/Render Load Balancer]  ← yeh proxy hai
    ↓
[Express Server] ← bina trust proxy: req.ip = 127.0.0.1 (galat!)
                  ← trust proxy ke saath: req.ip = 103.21.58.40 (sahi!)
```


**Kahan use hota hai:**
- `req.ip` → actual user ka IP milta hai
- `auth.controller.js` mein: `req.ip || req.headers["x-forwarded-for"]` → refresh token mein IP log hota hai

---

## 4. CORS

### CORS kya hai aur kyun zaroori hai?

**Real Life Analogy:** Aap India mein ho aur America ke bank mein account chahiye. American bank bolega "Nahi, sirf American address wale log." Yeh CORS jaisi restriction hai. Browser ka ek safety rule.

**CORS = Cross-Origin Resource Sharing**

Browser ek security rule follow karta hai: **Same-Origin Policy** — ek website dusri website ka data nahi le sakti bina permission ke.

```
Frontend: http://localhost:5173   (Origin A)
Backend:  http://localhost:8000   (Origin B)
↑ Ye dono alag origins hain → Browser block karega request!
```


Express mein CORS middleware bataata hai browser ko ki "haan, inhe permission hai mujhse data lene ki":

```javascript
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true); // Allow karo
        }
        return callback(null, true); // Dev mein sabko allow (prod mein strict hoga)
    },
    credentials: true,  // ← BOHOT IMPORTANT: cookies allow karne ke liye
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
}));
```

**`credentials: true` kyun?**  
Bina is line ke browser cookies cross-origin nahi bhejta. Zora.ai mein auth cookies hain — yeh line nahi hoti toh har request unauthorized fail hoti.

---

## 5. morgan

### morgan Logger kya karta hai?

**Real Life Analogy:** Hotel ka log register jisme likha hota hai: "Room 201 ne room service order ki, 8:32 PM, 200 rupees."

`morgan` ek HTTP request logger hai. Console mein print karta hai:
```
GET /api/auth/get-me 200 45ms
POST /api/chats/message 201 1243ms
DELETE /api/chats/abc123 404 12ms
```

Format: `Method Route StatusCode ResponseTime`

```javascript
app.use(morgan("dev")); // "dev" = colored, readable format for development
```

**Kaam ka kyun hai?** Debugging mein — pata chalta hai ki kaunsa API slow hai, kaunsa fail ho raha hai, bina code mein `console.log` daalein.

---

## 6. cookieParser

### cookieParser kya karta hai?

Browser cookies bhejta hai HTTP headers mein plain text mein:
```
Cookie: accessToken=eyJhbGc...; refreshToken=eyJhbGc...
```

Yeh ek string hai. `cookieParser` is string ko parse karke JavaScript object banata hai:
```javascript
// Without cookieParser: req.cookies = undefined
// With cookieParser:
req.cookies.accessToken    // → "eyJhbGc..."
req.cookies.refreshToken   // → "eyJhbGc..."
```

```javascript
app.use(cookieParser());
// Ab req.cookies.accessToken direct access hota hai
// auth.middleware.js mein: const token = req.cookies?.accessToken;
```

---

## 7. JWT (JSON Web Token)

### JWT kya hota hai?

**Real Life Analogy:** Government ID card. Card mein likha hai: "Rudra Shrivastava, DOB: 2000, Citizen: India." Card pe government ka stamp hai (signature). Koi bhi stamp dekh ke verify kar sakta hai ki yeh real card hai — bina government se dobara pooche.

JWT ek **self-contained digital token** hai jisme encoded information hoti hai + ek cryptographic signature.

**JWT ki Structure (3 parts, dot se alag):**
```
eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IjEyMyIsInVzZXJuYW1lIjoicnVkcmEifQ.X4dJ8s...
     ↑ HEADER              ↑ PAYLOAD (actual data)                  ↑ SIGNATURE
```

**Header:** Algorithm batata hai (HS256 = HMAC-SHA256)  
**Payload:** Actual data — base64 decoded karo toh milta hai:
```json
{ "id": "64a1f...", "username": "rudra", "role": "user", "iat": 1724573400, "exp": 1724574300 }
```
**Signature:** SECRET_KEY se banaya gaya — tamper-proof

**Zora.ai mein:**
```javascript
// Access Token generate karna:
jwt.sign(
    { id: user._id, username: user.username, role: user.role }, // payload
    ACCESS_TOKEN_SECRET,  // secret key (sirf server ko pata hai)
    { expiresIn: "15m" }  // 15 minute baad expire
)

// Verify karna:
const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
// Agar token tamper hua ya expire hua → throws error
```

**Kyun 15 min ka Access Token?**  
Agar koi access token chura bhi le, toh 15 minute mein expire ho jayega. Short window = low risk.

**Kyun 7 din ka Refresh Token?**  
User baar baar login na kare. Refresh token se naya access token milta hai silently.

---

## 8. bcryptjs

### bcryptjs kya karta hai?

**Real Life Analogy:** Tumhara password ek key hai. bcrypt us key ko ek special machine mein daalta hai jo ek **aisa lock banata hai jisme se original key KABHI nahi nikali ja sakti** — lekin lock mein key dalo toh bata sakta hai ki yeh sahi key hai ya nahi.

Passwords kabhi database mein plain text mein store nahi karte. Kyun? Agar database hack ho toh sab passwords leak ho jayenge.

**bcrypt kya karta hai:**
1. Password leta hai: `"mySecret123"`
2. Random **salt** generate karta hai: `"$2b$10$randomsalt..."`
3. Hash banata hai: `"$2b$10$randomsalt...hashvalue..."` — yeh irreversible hai!
4. Yahi hash database mein store hota hai

**Login pe verification:**
```javascript
// "10" = work factor (kitni baar calculate karo) - jyada = slow = harder to crack
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;  // Sirf naya password ho toh hash karo
    this.password = await bcrypt.hash(this.password, 10);
});

// Login mein compare:
const isMatch = await bcrypt.compare("mySecret123", "$2b$10$randomsalt...hashvalue...");
// true agar match kare, false agar nahi
```

**Kyun sirf hash dono se same nahi calculate kar lete?**  
bcrypt har baar alag **random salt** use karta hai. Same password ka hash bhi har baar alag hoga. Yeh **Rainbow Table Attacks** (precomputed hash databases) ko useless banata hai.

---

## 9. HttpOnly Cookies

### HttpOnly Cookie kya hai aur kyun?

**Real Life Analogy:** Bank locker jisme sirf bank ka employee (server) hi daal ya nikal sakta hai — aap (JavaScript) isko touch nahi kar sakte.

Tokens store karne ke do tarike hain:
1. **LocalStorage** (galat tarika): JavaScript se accessible → **XSS attack** mein attacker ka JavaScript token chura sakta hai
2. **HttpOnly Cookie** (sahi tarika): Browser automatically bhejta hai har request mein, lekin JavaScript is cookie ko read NAHI kar sakta

```javascript
res.cookie("accessToken", accessToken, {
    httpOnly: true,    // ← JavaScript (document.cookie) se invisible
    secure: true,      // ← Sirf HTTPS pe bheja jayega (plain HTTP pe nahi)
    sameSite: "none",  // ← Cross-site requests mein bhi bhejo (frontend alag domain pe hai)
    maxAge: 15 * 60 * 1000  // 15 minute mein expire
});
```

**XSS Attack kya hota hai?**  
Malicious JavaScript website pe inject hota hai aur `localStorage.getItem("token")` kar leta hai. HttpOnly cookie ke saath yeh possible NAHI hai kyunki JS cookie access hi nahi kar sakta.

**`sameSite: "none"` kyun?**  
Frontend (`localhost:5173`) aur Backend (`localhost:8000`) alag origins hain. `sameSite: "none"` ensure karta hai cookie cross-origin requests mein bhi automatically attach ho.

---

## 10. Refresh Token Rotation

### Token Rotation kyun karte hain?

**Real Life Analogy:** ATM PIN. Jab aap PIN enter karte ho toh ek OTP aata hai. Aap OTP use karo toh woh expire ho jaata hai aur naya aata hai. Purana OTP kisi ke paas ho toh bhi kaam nahi aayega.

**Rotation ka flow:**
```
Login hota hai:
   Access Token  (15 min) → cookies mein
   Refresh Token (7 days) → cookies mein, hash database mein

15 min baad access token expire:
   Frontend sends → POST /api/auth/refresh (old refresh token cookie ke saath)
   Server: 
     1. Old token verify karo
     2. OLD hash database se delete karo
     3. NEW Access Token + NEW Refresh Token generate karo
     4. NEW hash store karo
     5. Naye tokens cookies mein set karo
```

**Reuse Detection (Sabse Advanced Security Feature):**
```javascript
// Scenario: Attacker purana refresh token chura leta hai
// Victim ne already ek baar use kar liya (rotated ho gaya)
// Ab attacker woh purana token use karne ki koshish karta hai

const storedToken = user.refreshTokens.find(t => t.tokenHash === refreshTokenHash);

if (!storedToken) {
    // Valid JWT signature hai (token real hai) lekin DB mein hash nahi hai
    // = Token pehle use ho chuka hai = REPLAY ATTACK!
    
    user.refreshTokens = [];  // Saare sessions band karo
    await user.save();
    // Security Alert log karo
    return res.status(401).json({ code: "TOKEN_REUSE_DETECTED" });
}
```

---

## 11. SHA-256 Hashing

### SHA-256 kya hai?

**Real Life Analogy:** Kisi bhi document ka unique fingerprint nikaalo. Document badla → fingerprint ekdum alag. Same document → hamesha same fingerprint.

SHA-256 ek **cryptographic hash function** hai. Koi bhi string lo → 64-character fixed-length hex string milti hai.

```javascript
crypto.createHash("sha256").update("myRefreshToken123").digest("hex")
// → "a3f8b2d1e4c5..." (hamesha same 64-char string)
```

**Database mein raw token kyun nahi store karte?**  
Agar database breach ho aur refresh tokens plain text mein hon, attacker unhe directly use kar sakta hai. Hash store karo — attacker ko hash milega, original token nahi. Hash se original token nahi nikala ja sakta.

**Login flow:**
1. Raw refresh token generate karo: `"eyJhbGc..."`
2. Hash compute karo: `sha256("eyJhbGc...") = "a3f8b2d..."`  
3. **Cookie mein:** raw token (browser ne use karna hai)
4. **Database mein:** hash (server ne verify karna hai)

Verification: Incoming raw token ka hash compute karo → DB mein dhundho.

---

## 12. MongoDB & Mongoose

### MongoDB kya hai?

**Real Life Analogy:** Traditional database (SQL) = Excel spreadsheet — fixed columns, fixed rows. MongoDB = Notebook jisme aap kuch bhi likh sako, har page alag format mein.

MongoDB ek **NoSQL Document Database** hai. Data JSON-like documents mein store hota hai:
```json
{
  "_id": "64a1f...",
  "username": "rudra",
  "email": "rudra@gmail.com",
  "refreshTokens": [
    { "tokenHash": "a3f8b2...", "userAgent": "Chrome/127" }
  ]
}
```

**MongoDB Atlas:** Cloud-hosted MongoDB — aapka data Amazon/Google servers pe safely stored hai.

---

### Mongoose kya hai?

**Real Life Analogy:** MongoDB ek blank notebook hai. Mongoose ek template hai jo bolta hai "sirf yahi likho, yahi format mein."

Mongoose **ODM (Object Document Mapper)** hai. Features:
1. **Schema:** Define karo ki document mein kya hoga
2. **Validation:** `required: true`, `minlength: 6` etc.
3. **Hooks:** `pre('save', ...)` — save se pehle kuch run karo
4. **Methods:** Model pe custom functions define karo

```javascript
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,    // Empty email → save fail
        unique: true,      // Duplicate email → save fail
        lowercase: true,   // Automatically lowercase karo
    },
    verified: {
        type: Boolean,
        default: false     // Naye user verified nahi hote
    }
});

// Pre-save hook: password hash karo automatically
userSchema.pre('save', async function() {
    if (!this.isModified('password')) return;  // Sirf tab karo jab password badla ho
    this.password = await bcrypt.hash(this.password, 10);
});
```

---

## 13. B-Tree Index

### Database Index kya hota hai?

**Real Life Analogy:** Library mein 1 lakh kitaabein hain. "Recursion" wali book dhundni hai. Bina index ke: har shelf check karo (1 lakh books scan). Index (catalogue) ke saath: catalogue pe jaao → "R" section → "Recursion" → Shelf 42, Position 7 (2 seconds).

**B-Tree** ek tree data structure hai jo sorted data rakhta hai. Database index ek separate data structure banata hai jo fast lookup enable karta hai.

```javascript
// Zora.ai ke indexes:
chatSchema.index({ user: 1, pinned: -1, updatedAt: -1 });
```

**Iska matlab:**  
Jab sidebar mein user ke chats load ho: `Chat.find({ user: userId }).sort({ pinned: -1, updatedAt: -1 })`

**Bina index:** MongoDB `Chat` collection ki EVERY document check karega → O(N) time → 1 lakh chats pe bohot slow

**Index ke saath:** B-Tree se seedha us user ki chats milti hain, pinned first, phir recent → O(log N) → instant

```javascript
messageSchema.index({ chat: 1, createdAt: 1 });
// Thread load karte waqt: messages in chronological order
// ↑ compound index: chat ID ke andar createdAt se sort
```

---

## 14. Multer

### Multer kya karta hai?

**Real Life Analogy:** Post office ka parcel receiving counter. Parcel aaya → weigh kiya → temporary room mein rakha → tumhe notice diya.

HTTP mein file upload `multipart/form-data` format mein aata hai — binary data. Express normal `json()` parser yeh nahi padh sakta.

Multer is binary data ko handle karta hai:
1. File receive karta hai
2. Disk pe temp location pe save karta hai (`/tmp/upload123.pdf`)
3. `req.file` object provide karta hai: `{ originalname, mimetype, size, path }`

```javascript
// upload.middleware.js
import multer from "multer";

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "/tmp"),  // Temp folder
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

export const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }  // Max 10 MB
});
```

**Route pe:**
```javascript
router.post("/upload", authUser, upload.single("file"), uploadDocument);
// upload.single("file") → sirf ek file, "file" naam ke field se
```

**After processing:**
```javascript
// rag.controller.js mein temp file delete karo:
fs.unlinkSync(req.file.path);  // Storage waste nahi ho
```

---

## 15. PDF Parsing

### pdf2json se PDF ka text kaise nikala?

**Real Life Analogy:** PDF ek printed book ki photocopy hai. PDF mein har word ka exact position (x,y coordinate) store hota hai, paragraph ya sentence structure nahi.

PDF mein text "words" ke roop mein scattered hota hai — har word ka `x` (left-right position) aur `y` (top-bottom position) stored hota hai.

**Problem:** Different fonts, multi-column layouts mein words ki order mix ho jaati hai.

**Zora.ai ka solution — Y-Coordinate Line Grouping:**
```javascript
// Sab words ko unki Y position ke basis pe group karo
const lineMap = new Map();

for (const textObj of page.Texts) {
    const y = Math.round(textObj.y * 10) / 10; // Y round karo (floating point precision fix)
    if (!lineMap.has(y)) lineMap.set(y, []);
    lineMap.get(y).push(safeDecode(r.T)); // Us Y position pe word add karo
}

// Y positions ko sort karo (top se bottom = reading order)
const sortedYs = Array.from(lineMap.keys()).sort((a, b) => a - b);

// Har line ke words join karo
for (const y of sortedYs) {
    const lineStr = lineMap.get(y).join(" ").trim();
    fullText += lineStr + "\n";
}
```

**`safeDecode` kyun?** PDF mein text URL-encoded hota hai: `%20` = space, `%2C` = comma. `decodeURIComponent()` se human-readable text milta hai.

**`cleanExtractedText()` kyun?** PDF extraction artefacts fix karta hai:
```
"MachineLearning" → "Machine Learning"  (camelCase split)
"2026AI"          → "2026 AI"          (number-letter fix)
```

---

## 16. Text Chunking

### Text ko Chunks mein kyun todte hain?

**Real Life Analogy:** Ek 500 page book ka question — "Chapter 3 mein kya tha?" — agar aap poori book ek saath AI ko denge toh:
1. AI context window overflow ho jaayegi (LLMs ki limit hoti hai ~128k tokens)
2. Irrelevant 490 pages ka noise accurate answer ko dilute karega

**Solution:** Book ko chapters/pages mein todo → sirf relevant chapter dho AI ko.

```javascript
const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,    // Har chunk max 500 characters
    chunkOverlap: 80,  // Consecutive chunks mein 80 char overlap
});

const chunks = await splitter.splitText(extractedText);
// ["Artificial Intelligence is...(500 chars)", "Intelligence is a branch of...(500 chars)", ...]
//                                      ↑ yeh 80 char wahan bhi hain (overlap)
```

**`chunkOverlap: 80` kyun?**  
Ek important sentence chunk boundary pe split ho sakta hai. Overlap ensure karta hai ki boundary par ka content dono chunks mein ho → retrieval mein kuch miss na ho.

---

## 17. Vector Embeddings

### Embedding kya hoti hai?

**Real Life Analogy:** Imagine karo ek magical machine mein koi bhi text daalo aur woh ek unique GPS coordinate nikale. "Delhi" → [28.6, 77.2]. "Mumbai" → [19.0, 72.8]. "Paris" → [48.8, 2.3]. Geographically similar cities ke coordinates similar honge.

**Embedding:** Text ka **numerical representation** — ek array of numbers (vector) jisme text ka "meaning" encoded hota hai.

```
"Machine Learning" → [0.234, -0.109, 0.442, 0.891, -0.33, ...]  (768 or 1024 numbers)
"Deep Learning"    → [0.228, -0.115, 0.451, 0.876, -0.31, ...]  (similar numbers kyunki similar concept)
"Pizza Recipe"     → [0.891, 0.234, -0.443, 0.120, 0.773, ...]  (very different numbers)
```

**Kyun useful hai?** Vector space mein similar meaning wale texts **physically kareeb** hote hain. Math se similarity calculate ki ja sakti hai.

```javascript
// embedding.service.js mein:
export const embeddings = {
    async embedQuery(text) {
        // Mistral AI ka "mistral-embed" model
        // → 1024-dimensional vector return karta hai
        return await mistralEmbeddings.embedQuery(text);
    }
};

// Use hota hai:
const vector = await embeddings.embedQuery("What is machine learning?");
// vector = [0.234, -0.109, ..., 0.331] ← 1024 floating point numbers
```

---

## 18. Cosine Similarity

### Cosine Similarity kya hai?

**Real Life Analogy:** Do arrows ek point se nikle. Agar dono ek hi direction mein hain → similarity = 1 (maximum). Agar 90° angle → 0. Opposite direction → -1.

Vector similarity measure karne ka formula. **Direction** compare karta hai magnitude nahi.

```
Similarity = (A · B) / (|A| × |B|)
```

- `A · B` = Dot product (corresponding numbers multiply karo, sab add karo)
- `|A|` = Vector A ki magnitude (length)
- Result: -1 se +1 ke beech (1 = identical meaning, 0 = unrelated)

```javascript
// retrieval.service.js mein exact implementation:
function cosineSimilarity(A, B) {
    const dot   = A.reduce((sum, a, i) => sum + a * B[i], 0);  // A·B
    const normA = Math.sqrt(A.reduce((sum, a) => sum + a * a, 0));  // |A|
    const normB = Math.sqrt(B.reduce((sum, b) => sum + b * b, 0));  // |B|
    return dot / (normA * normB);  // Final similarity score
}

// Score filter:
const results = chunks
    .map(chunk => ({ ...chunk, score: cosineSimilarity(queryVector, chunk.embedding) }))
    .filter(c => c.score > 0.2)  // 0.2 se neeche = irrelevant
    .sort((a, b) => b.score - a.score)  // Most similar first
    .slice(0, 5);  // Top 5 chunks
```

**Score > 0.2 kyun?** 0.2 se neeche ke chunks user ke query se practically unrelated hain. Isliye filter karo — noise se AI ka response kharab na ho.

---

## 19. Pinecone Vector DB

### Pinecone kya hai aur normal MongoDB se alag kyun?

**Real Life Analogy:** 1 crore phone numbers mein se "iske jaisi phone number dhundho" bologe toh normal database fail. Pinecone specially isi kaam ke liye bana hai.

MongoDB normal queries ke liye best hai (find by ID, name). But vector similarity search (nearest neighbor search) ke liye yeh slow hai.

**Pinecone** ek **purpose-built Vector Database** hai:
- Specially ANN (Approximate Nearest Neighbor) search ke liye optimized
- Milliseconds mein 1 crore vectors mein search kar sakta hai
- `filter` support: `{ userId: "xyz" }` → sirf is user ke chunks mein search karo

```javascript
// Pinecone mein chunk store karna:
await pineconeIndex.upsert({
    records: [{
        id: `doc-${docId}-${chunkIndex}`,  // Unique ID
        values: [0.234, -0.109, ...],       // 1024-dim embedding vector
        metadata: { userId, documentId, text, title }
    }]
});

// Query karna:
const result = await pineconeIndex.query({
    vector: queryEmbedding,   // User query ka vector
    topK: 4,                  // Top 4 most similar
    filter: { userId: String(userId) }  // Sirf is user ke docs
});
```

**Zora.ai mein optional kyun hai Pinecone?**  
Agar `PINECONE_API_KEY` set nahi hai, MongoDB cosine similarity fallback use hota hai. Pinecone hoga toh faster, nahi hoga toh MongoDB se kaam chalega.

---

## 20. RAG (Retrieval Augmented Generation)

### RAG kya hai?

**Real Life Analogy:** Exam ke din open book allowed. Student (AI) book (document) dekhke answer likhta hai — guess nahi karta, actual source se likhta hai.

**Problem bina RAG ke:**
- LLM sirf apni training data jaanta hai (knowledge cutoff)
- Aapki uploaded PDF ke baare mein kuch nahi jaanta
- Hallucination: confident tone mein galat facts bolta hai

**RAG ka solution:**
```
User Query: "Chapter 3 mein kya define kiya gaya hai?"
    ↓
1. Query ko vector mein convert karo
    ↓
2. User ke uploaded docs ke vectors se compare karo (cosine similarity)
    ↓
3. Top 5 most relevant chunks nikalo
    ↓
4. Chunks ko AI ke System Prompt mein inject karo:
   "DOCUMENT KNOWLEDGE:
    [Chunk 1]: Chapter 3 mein Data Structures define ki gayi hain...
    [Chunk 2]: Data Structure ek way hai data store karne ka..."
    ↓
5. AI sirf in chunks ko dekh ke answer deta hai
    ↓
"Chapter 3 mein Data Structures define ki gayi hain — Arrays, Linked Lists..."
```

**Zero Hallucination guarantee:** System prompt mein likha hota hai: *"Sirf DOCUMENT KNOWLEDGE se answer do. Agar wahan nahi hai toh bol do."*

---

## 21. LangChain

### LangChain kya hai?

**Real Life Analogy:** Universal TV Remote. Har TV brand ka alag remote hota tha. Universal remote se sab control hota hai. LangChain alag-alag AI providers (Google, Mistral, OpenAI) ko ek standard interface se use karne deta hai.

LangChain ek **AI orchestration framework** hai. Features:
- **Unified API:** Gemini, Mistral, OpenAI sab same `.invoke()` method se call hote hain
- **Embeddings:** `GoogleGenerativeAIEmbeddings`, `MistralAIEmbeddings` — same interface
- **Text Splitters:** `RecursiveCharacterTextSplitter` built-in
- **Message Types:** `HumanMessage`, `SystemMessage`, `AIMessage` — structured chat history

```javascript
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatMistralAI } from "@langchain/mistralai";

// Dono ka same interface:
const gemini  = new ChatGoogleGenerativeAI({ model: "gemini-1.5-flash", apiKey: "..." });
const mistral = new ChatMistralAI({ model: "mistral-small-latest", apiKey: "..." });

// Dono pe same method:
const response1 = await gemini.invoke(messages);
const response2 = await mistral.invoke(messages);
// ↑ Provider badle, code nahi badla
```

---

## 22. Tavily Search API

### Tavily kya hai?

**Real Life Analogy:** Ek professional research assistant jisko bol do "Yeh dhundho" — woh internet pe jaata hai, relevant pages padhta hai, clean text format mein results laata hai.

`@tavily/core` ek Search API hai jo:
1. Query leta hai
2. Internet search karta hai (Bing/Google ki tarah)
3. Top results ke actual content (not just links) return karta hai
4. AI-ready clean text format mein

```javascript
// internet.service.js
const results = await tavily.search(query, {
    searchDepth: "basic",  // "advanced" = deeper scraping, slower
    maxResults: 4,         // Sirf top 4 results — zyada = noise
    includeAnswer: false,  // Raw search results chahiye, AI-generated answer nahi
});

// results mein milta hai:
// [{
//   url: "https://...",
//   title: "What is Machine Learning",
//   content: "Machine learning is a branch of AI...(full article text)"
// }, ...]
```

**AI ke system prompt mein inject:**
```
=== LIVE WEB SEARCH RESULTS ===
[WEB SOURCE 1 - What is ML (https://...)]:
Machine learning is a branch of AI that enables systems to learn from data...

[WEB SOURCE 2 - ML Applications (https://...)]:
Applications include image recognition, NLP, recommendation systems...
```

**Kyun Google Search direct nahi?** Google ka search API commercial hai, rate limited. Tavily AI ke liye specifically designed hai — structured, clean output deta hai.

---

## 23. 3-Tier AI Failover

### Failover Pipeline kyun zaroori hai?

**Real Life Analogy:** Power backup system. Main electricity gayi → UPS chalu, UPS bhi gayi → Generator chalu. Ek bhi fail ho, dusra ready.

Google Gemini API free tier pe:
- 1,500 requests/day limit
- Peak hours mein 429 "Quota Exceeded" errors

**Purana (broken) approach:** LangChain's `agent.invoke()` internally retry queue use karta tha. 429 error LangChain ke andar atak jaata tha, outer try/catch tak nahi pahuncha. User ko "500 Internal Server Error" milta tha.

**Naya (working) approach:**
```javascript
// ai.service.js — ACTUAL CODE
const providers = [
    {
        name: "Gemini 1.5 Flash",
        fn: () => new ChatGoogleGenerativeAI({
            model: "gemini-1.5-flash",
            apiKey: process.env.GEMINI_API_KEY
        }).invoke(chatHistory)
    },
    {
        name: "Gemini 1.5 Pro",
        fn: () => new ChatGoogleGenerativeAI({
            model: "gemini-1.5-pro",
            apiKey: process.env.GEMINI_API_KEY
        }).invoke(chatHistory)
    },
    {
        name: "Mistral AI",
        fn: () => new ChatMistralAI({
            model: "mistral-small-latest",
            apiKey: process.env.MISTRAL_API_KEY
        }).invoke(chatHistory)
    },
];

for (const provider of providers) {
    try {
        rawAnswer = await provider.fn(); // Try karo
        if (rawAnswer?.trim()) break;   // Kaam kiya → loop exit
    } catch (err) {
        // 429 / 503 / network error → next provider try karo
        console.warn(`${provider.name} failed: ${err.message}`);
        continue;
    }
}
```

**Key:** Har provider ka alag isolated `try/catch`. Koi bhi error outer catch tak nahi pahunchta — next provider silently try hota hai. User ko kuch nahi pata.

---

## 24. Socket.IO

### Socket.IO kya hota hai?

**Real Life Analogy:** Ek permanent phone call. Normal HTTP = SMS (aap bhejo, jawab aaye, done). Socket.IO = Live phone call (dono taraf se kabhi bhi baat ho sakti hai, connection bana rahta hai).

**HTTP (Normal API):**
```
Browser → "Give me messages" → Server
Server  → "Here are messages" → Browser
[Connection close]
```

**WebSocket (Socket.IO):**
```
Browser ←→ Server [PERMANENT CONNECTION]
Server anytime bata sakta hai: "Naya message aaya!"
Browser anytime bata sakta hai: "User typing kar raha hai"
```

**Zora.ai mein use:**
- Real-time features jaise typing indicators
- Live message delivery notifications
- Future: streaming AI responses character by character

```javascript
// app.js → server/index.js mein:
import { Server } from "socket.io";
const io = new Server(server, {
    cors: { origin: process.env.FRONTEND_URL, credentials: true }
});

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    socket.on("disconnect", () => console.log("User disconnected"));
});
```

---

## 25. PDFKit

### PDFKit kya karta hai?

**Real Life Analogy:** Ek typewriter jo directly PDF file type karta hai — aap code mein batao ki kahan kya likhna hai, kaunsa font, kaunsa color.

PDFKit ek **PDF generation library** hai. Server-side PDF files programmatically create karta hai.

```javascript
// pdf.service.js — generateNotesPDF()
const doc = new PDFDocument({ size: "A4", margins: { top: 50 } });

// Header banner:
doc.rect(0, 0, 595.28, 80).fill("#111827");  // Dark banner
doc.fillColor("#38bdf8").fontSize(20).text("Zora.ai - Study Notes", 50, 20);

// Content line by line:
for (const line of lines) {
    if (line.startsWith("#")) {
        // Heading style
        doc.font("Helvetica-Bold").fontSize(15).text(line);
    } else {
        // Normal text
        doc.font("Helvetica").fontSize(10.5).text(line, { align: "justify" });
    }
}

doc.end(); // PDF complete karo
```

**`sanitizePDFText()` kyun?** PDFKit sirf standard ASCII/Latin characters support karta hai. Emojis 🎉, Unicode special characters → PDF corrupt ho sakta hai. `sanitizePDFText()` inhe remove/replace karta hai.

---

## 26. Email Pipeline

### 3-Stage Email Failover kyun bana?

**Cloud Deployment Problem:**
- **Render.com** (aur most PaaS) **SMTP ports block** karta hai (25, 465, 587)
- Why? Spam prevention — mass emailers yahi ports abuse karte hain
- Result: `nodemailer.sendMail()` → `connect ENETUNREACH` error

**IPv6 Problem:**
- Modern cloud hosts IPv6 by default use karte hain
- SMTP servers usually IPv4 only support karte hain
- Result: `connect ENETUNREACH: network unreachable`

```javascript
// Fix 1: DNS level pe IPv4 prefer karo
dns.setDefaultResultOrder("ipv4first");

// Fix 2: Nodemailer transport mein IPv4 force karo
nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    family: 4,  // ← TCP socket IPv4 use karega, IPv6 nahi
})
```

**3-Stage Waterfall:**
```
Stage 1: Resend.com API → HTTPS Port 443 (never blocked)
    fetch("https://api.resend.com/emails", { method: "POST", ... })

Stage 2: Brevo.com API → HTTPS Port 443 (never blocked)
    fetch("https://api.brevo.com/v3/smtp/email", { method: "POST", ... })

Stage 3: Nodemailer SMTP → smtp.gmail.com:465 (IPv4 forced)
    transporter.sendMail(mailOptions)
```

**Resend & Brevo kyun port 443 pe?** Ye REST API calls hain — normal HTTPS jaise Google pe search karna. Koi bhi firewall port 443 block nahi karta (website access hona band ho jaayega).

---

## 27. Docker

### Docker kya hota hai?

**Real Life Analogy:** Tiffin dabba. Ghar ka khana jo bhi ho, tiffin mein band karo — office mein kholo, wahi khana milega. Docker = tiffin, Application = khana. Kisi bhi machine pe same environment.

**Problem bina Docker ke:**
```
Developer: "Mere laptop pe chal raha tha!" (Windows, Node 18, MongoDB 6)
Server:    500 Error (Ubuntu, Node 16, MongoDB 5)
```

**Docker ke saath:**
```dockerfile
FROM node:18-alpine          # Node 18 guaranteed
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV NODE_ENV=production
CMD ["node", "server.js"]    # Always same environment
```

**Docker Compose:** Multiple services ek saath manage karo:
```yaml
# docker-compose.yml
services:
  backend:
    build: ./backend
    ports: ["8000:8000"]
    env_file: ./backend/.env
  frontend:
    build: ./frontend
    ports: ["80:80"]
    depends_on: [backend]
```

Command: `docker-compose up -d` → dono containers start ho jaate hain.

---

## 28. Kubernetes Probes

### `/healthz` aur `/readyz` kya hote hain?

**Real Life Analogy:** Hospital mein nurse regularly patient ka check karne aati hai — "Alive hai? Response de raha hai?" Kubernetes ye check karta hai automatically.

Kubernetes (container orchestration) containers ki health continuously monitor karta hai.

**Liveness Probe (`/healthz`):**  
*"Kya process zinda hai?"*
```javascript
app.get("/healthz", (req, res) => {
    res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});
```
Agar 200 nahi milta → container restart kar do. (Process crash hua hoga)

**Readiness Probe (`/readyz`):**  
*"Kya container traffic handle karne ke liye ready hai?"*
```javascript
app.get("/readyz", (req, res) => {
    const isDbConnected = mongoose.connection.readyState === 1;
    if (isDbConnected) {
        return res.status(200).json({ status: "ready", database: "connected" });
    }
    return res.status(503).json({ status: "not_ready", database: "disconnected" });
});
```
MongoDB connected nahi → 503 return karo → Kubernetes naya traffic mat bhejo is container pe. (DB connect hone do pehle)

**Why does it matter?**  
Deployment update ke waqt naya container start hone mein 5-10 seconds lagte hain. Readiness probe ensure karta hai ki tab tak puraane container se traffic serve ho — zero downtime.

---

## 29. Axios Interceptors

### Silent Token Refresh kaise kaam karta hai?

**Real Life Analogy:** Aapka driver (Axios) road pe ja raha hai. Highway par toll booth ne bola "purana pass expired." Driver khud jaata hai toll office se naya pass banata hai — aapko neend se nahi jagaata. Phir wahi route complete karta hai.

**Problem:** Access token 15 min mein expire hota hai. User kuch kar raha hota hai → suddenly 401 error → "Please login again" = BAD UX.

**Solution — Axios Response Interceptor:**
```javascript
// Frontend: api/axios.js
axios.interceptors.response.use(
    (response) => response,  // Success → sidha bhejo
    async (error) => {
        const originalRequest = error.config;

        // 401 error + ye pehla retry attempt hai
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;  // Infinite loop prevention

            // Silent refresh attempt:
            await axios.post("/api/auth/refresh");  // Naye tokens set ho jaate hain cookies mein

            // Original request dobara try karo (naye token ke saath)
            return axios(originalRequest);
        }

        return Promise.reject(error);  // Aur errors seedhe throw karo
    }
);
```

**User ko kya dikhta hai:** Kuch nahi. Seamless. Background mein token refresh hota hai, original request retry hoti hai, response aata hai.

---

## 30. Redux Toolkit

### Redux kya hota hai aur kyun?

**Real Life Analogy:** Ek company ka central HR database. Kisi bhi department ko employee info chahiye → HR se lo. Employee data sirf HR ke paas update hota hai. Baaki department copies nahi rakhte.

React mein har component ka apna `state` hota hai. Problem: 10 components ko same user info chahiye. Ek component mein login hota hai → baaki sab kaise jaanein?

**Redux = Global State Store:**
```
[Redux Store] ← Central database sab components ke liye

Components:
  Navbar      → user.name read karta hai
  Sidebar     → user.chats read karta hai
  Dashboard   → user.id read karta hai
  ChatInput   → messages dispatch karta hai

Koi bhi action dispatch karo → sab components automatically update
```

**Redux Toolkit (Modern Redux):**
```javascript
// authSlice.js
const authSlice = createSlice({
    name: "auth",
    initialState: { user: null, isAuthenticated: false },
    reducers: {
        setUser: (state, action) => {
            state.user = action.payload;
            state.isAuthenticated = true;
        },
        logout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
        }
    }
});

// Kisi bhi component mein:
const user = useSelector(state => state.auth.user);
dispatch(setUser({ id: "123", name: "Rudra" }));
```

---

## 🎯 QUICK REFERENCE — Interview Mein Instant Answer

| Concept | Ek Line Mein |
|:---|:---|
| `trust proxy` | Nginx/Render ke peeche real user IP correctly extract karne ke liye |
| CORS + `credentials: true` | Cross-origin cookies allow karne ke liye (frontend ↔ backend) |
| JWT | Stateless digital ID card — server session DB nahi chahiye |
| `bcrypt(password, 10)` | Password ka irreversible hash — DB breach mein raw password nahi milega |
| HttpOnly Cookie | XSS se token protect karna — JavaScript read nahi kar sakta |
| Refresh Token Rotation | Har refresh pe naya token — replay attack impossible |
| SHA-256 hash | Raw token DB mein store nahi karte — sirf fingerprint store karte hain |
| B-Tree Index | Sidebar query O(N) se O(log N) — fast load |
| Multer | Binary file upload handle karna — normal JSON parser nahi kar sakta |
| Y-coord grouping | PDF text reading order correct rakhna |
| Chunking (500/80) | LLM context limit fit karna + boundary overlap for completeness |
| Embeddings | Text ka numerical meaning — similar text = similar numbers |
| Cosine Similarity | Vector space mein semantic closeness measure karna |
| Pinecone | Million vectors mein millisecond nearest neighbor search |
| RAG | LLM ko real document ka context dena — hallucination eliminate |
| LangChain | Multiple AI providers ek interface se — provider swap easy |
| Tavily | AI-ready web search — clean structured output |
| 3-Tier Failover | `for...of` loop + isolated try/catch = guaranteed response despite quota |
| `family: 4` | IPv4 TCP socket force — IPv6 ENETUNREACH fix on cloud |
| `/healthz` | Kubernetes: container alive hai? |
| `/readyz` | Kubernetes: MongoDB connected? Traffic bhejo? |
| Axios Interceptor | 401 pe silent token refresh — user ko nahi pata |
| Redux Toolkit | Global frontend state — har component same data dekhe |
| Socket.IO | Persistent bidirectional connection — real-time events |
| PDFKit | Server-side PDF generation — structured notes download |

---

*Zora.ai Technical Knowledge Guide — Rudra Shrivastava*
