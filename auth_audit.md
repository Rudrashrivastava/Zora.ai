# Auth System Audit — Zora.ai Backend

## Current Architecture: Single JWT (Access Token Only)

```
User → Login → Single JWT (7 days) in httpOnly Cookie → All API calls
```

---

## ✅ What Is Implemented Correctly

| Feature | Status | Details |
|---|---|---|
| **Password Hashing** | ✅ Correct | `bcryptjs` with salt rounds 10 in `user.model.js` pre-save hook |
| **Secure Cookie** | ✅ Correct | `httpOnly: true` prevents JS access; `secure: true` in production |
| **SameSite** | ✅ Correct | `lax` in dev, `none` in prod (for cross-origin) |
| **Email Verification** | ✅ Correct | JWT-signed token with 15min expiry, `purpose` claim check |
| **Password Compare** | ✅ Correct | `bcrypt.compare` used (timing-safe) |
| **JWT Middleware** | ✅ Correct | `authUser` reads cookie, verifies, attaches `req.user` |
| **Duplicate User Check** | ✅ Correct | Checks both `email` AND `username` with `$or` query |
| **Dev Mode Bypass** | ✅ Intentional | `NODE_ENV=development` skips email verification |

---

## ❌ What Is Missing / Incomplete

### 1. ❌ No Refresh Token System
**Current:** Single JWT with **7-day expiry** stored in one cookie.  
**Problem:** 
- If JWT is stolen (XSS, cookie theft), attacker has **7 full days** of access.
- There is NO way to revoke access without rotating `JWT_SECRET` (which logs out everyone).

**What proper refresh token looks like:**
```
Access Token:  15 minutes  → stored in memory (JS variable) or short httpOnly cookie
Refresh Token: 7-30 days   → stored in httpOnly cookie, hashed in DB
```

### 2. ❌ No Token Revocation / Blacklisting
If a user logs out, the JWT is still **mathematically valid** until expiry.  
A stolen token can be used even after logout.

### 3. ❌ Logout Cookie Not Matching Login Cookie Options
```js
// Login sets:
res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV==="production", sameSite: "..." })

// Logout clears:
res.clearCookie("token", { httpOnly: true, secure: false, sameSite: "lax" })
```
`secure: false` hardcoded in logout — cookie won't be cleared properly in production (different `secure` flag than what was set).

### 4. ❌ No Rate Limiting on Auth Endpoints
Login and register have no rate limiting → brute force attacks possible.

### 5. ❌ Refresh Token Not in User Model
`user.model.js` has no `refreshToken` field — so rotation-based auth cannot be added without a schema change.

### 6. ❌ JWT Payload Minimal (OK but limited)
Only `{ id }` in access token — fine for now, but no roles/permissions support.

---

## 🛠️ Fix Plan — Production-Ready Auth

### Option A: Quick Fix (Recommended for this project stage)
Just reduce JWT expiry to **24h** and add logout blacklisting via Redis/MongoDB.

### Option B: Full Refresh Token Rotation (Industry Standard)
Requires:
1. `UserModel` → add `refreshToken: String` (hashed)  
2. Login → issue `accessToken` (15m) + `refreshToken` (7d)  
3. `/api/auth/refresh` endpoint → validate refresh token, issue new pair  
4. Logout → delete refresh token from DB + clear both cookies

---

## 📋 Priority Fixes

| Priority | Fix | Effort |
|---|---|---|
| 🔴 HIGH | Fix logout `clearCookie` to match login options | 2 min |
| 🔴 HIGH | Add rate limiting on `/api/auth/login` | 5 min |
| 🟡 MEDIUM | Reduce JWT expiry from 7d → 1d | 1 min |
| 🟡 MEDIUM | Add refresh token system | ~30 min |
| 🟢 LOW | Add token blacklist on logout | ~20 min |

