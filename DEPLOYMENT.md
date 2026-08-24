# Zora.ai Production Deployment & Scaling Guide

This guide provides step-by-step instructions to deploy Zora.ai in a production environment using **Docker Compose** (for single-server/staging) or **Kubernetes** (for horizontally scaled production).

---

## 🔒 Production Authentication & Security Features Built-In

1. **Short-Lived Access Tokens (15m)** stored in secure `httpOnly` cookies.
2. **Refresh Token Rotation (7d)** stored in hashed form in MongoDB; detects token reuse & revokes compromised sessions.
3. **Rate Limiting**:
   - `/api/auth/login`: 10 attempts / 15 mins
   - `/api/auth/register`: 5 attempts / hour
   - `/api/auth/refresh`: 30 attempts / 15 mins
4. **Reverse Proxy IP Trust**: `app.set('trust proxy', 1)` enables accurate client IP identification behind Nginx / Ingress.
5. **Nginx Security Headers**: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and Gzip compression.
6. **Zero-Downtime Rolling Updates**: Graceful shutdown listeners (`SIGTERM`, `SIGINT`) close HTTP connections and MongoDB connections cleanly.

---

## 🐳 Option 1: Deploying with Docker Compose (Single Host / Staging)

### Step 1: Environment Configuration
Create or update `backend/.env` with production secrets:
```env
PORT=8000
NODE_ENV=production
MONGO_URI=mongodb://mongodb:27017/zora
REDIS_URL=redis://redis:6379
JWT_SECRET=your_production_jwt_secret_min_32_chars
JWT_ACCESS_SECRET=your_production_access_secret
JWT_REFRESH_SECRET=your_production_refresh_secret
CORS_ORIGIN=http://localhost:5173,http://localhost:80,https://zora.ai
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
GEMINI_API_KEY=your_gemini_api_key
```

### Step 2: Build & Start Containers
Run from the root directory (`d:\perplexity`):
```bash
# Build and launch containers in detached mode
docker compose up --build -d

# View container status and health
docker compose ps

# Tail logs across all services
docker compose logs -f
```

---

## ☸️ Option 2: Deploying to Kubernetes (Scalable Enterprise Production)

### Architecture Overview
- **Namespace**: `zora-production`
- **Stateful DB Services**: MongoDB (`StatefulSet` + PVC) & Redis (`Deployment`)
- **Backend API Service**: 2–10 Pods managed by `HorizontalPodAutoscaler` (HPA)
- **Frontend Web Service**: 2 Pods running Nginx Alpine serving Vite static assets
- **Ingress Controller**: Nginx Ingress Controller with SSL/TLS Cert-Manager integration

---

### Step 1: Build & Push Container Images to a Container Registry
Tag and push your docker images to Docker Hub, GitHub Container Registry (GHCR), AWS ECR, or GCP Artifact Registry:

```bash
# 1. Login to your container registry
docker login ghcr.io

# 2. Build and tag Backend image
docker build -t ghcr.io/your-org/zora-backend:v1.0.0 ./backend
docker push ghcr.io/your-org/zora-backend:v1.0.0

# 3. Build and tag Frontend image
docker build -t ghcr.io/your-org/zora-frontend:v1.0.0 ./frontend
docker push ghcr.io/your-org/zora-frontend:v1.0.0
```

*Note: Update the image reference in `k8s/05-backend-deployment.yaml` and `k8s/07-frontend-deployment.yaml` with your image paths (`ghcr.io/your-org/zora-backend:v1.0.0`).*

---

### Step 2: Apply Kubernetes Secrets & Configurations

1. **Update `k8s/02-secret.yaml`** with base64/plain secrets or create directly via `kubectl`:
```bash
kubectl create namespace zora-production

kubectl create secret generic zora-secrets \
  --namespace=zora-production \
  --from-literal=JWT_SECRET="your-32-byte-secret" \
  --from-literal=JWT_ACCESS_SECRET="your-access-secret" \
  --from-literal=JWT_REFRESH_SECRET="your-refresh-secret" \
  --from-literal=MAIL_USER="your-email@gmail.com" \
  --from-literal=MAIL_PASS="your-app-password" \
  --from-literal=GEMINI_API_KEY="your-gemini-api-key"
```

2. **Apply Kubernetes Manifests**:
```bash
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-configmap.yaml
kubectl apply -f k8s/03-mongodb.yaml
kubectl apply -f k8s/04-redis.yaml
kubectl apply -f k8s/05-backend-deployment.yaml
kubectl apply -f k8s/06-backend-hpa.yaml
kubectl apply -f k8s/07-frontend-deployment.yaml
kubectl apply -f k8s/08-ingress.yaml
```

---

### Step 3: Monitor Rollout & Verify Deployment

```bash
# Check status of all resources in the zora-production namespace
kubectl get all -n zora-production

# Verify HorizontalPodAutoscaler (HPA) status
kubectl get hpa -n zora-production

# Check backend health probes & logs
kubectl logs -l app=zora-backend -n zora-production --tail=50 -f

# Verify Ingress routing & TLS certificate status
kubectl get ingress -n zora-production
```

---

### Step 4: Scale Application Manually or Test HPA

```bash
# Manually scale backend pods if needed
kubectl scale deployment/zora-backend --replicas=5 -n zora-production

# Monitor auto-scaling activity
kubectl describe hpa zora-backend-hpa -n zora-production
```
