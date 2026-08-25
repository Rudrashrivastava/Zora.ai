/**
 * Shared Axios instance with automatic silent token refresh.
 *
 * Flow:
 * 1. Request goes out with accessToken cookie (set by browser automatically)
 * 2. If 401 with code TOKEN_EXPIRED → call /api/auth/refresh
 * 3. On success → backend sets new cookies → retry original request once
 * 4. On refresh failure → dispatch logout and redirect to /login
 */

import axios from "axios";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || (() => {
    if (typeof window === "undefined") return "http://localhost:8000";
    const { hostname, protocol } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1" || /^192\.168\./.test(hostname) || /^10\./.test(hostname) || /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) {
        return `${protocol}//${hostname}:8000`;
    }
    return window.location.origin;
})();

// Main API instance
const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true, // Always send httpOnly cookies
});

// Separate instance for refresh calls (no interceptors — avoids infinite loop)
const refreshApi = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
});

let isRefreshing = false;
let failedQueue = []; // Queue of requests waiting for token refresh

function processQueue(error) {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve();
        }
    });
    failedQueue = [];
}

// =====================================================
// RESPONSE INTERCEPTOR — Silent Token Refresh
// =====================================================
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Only intercept 401 errors (unauthorized)
        if (!error.response || error.response.status !== 401) {
            return Promise.reject(error);
        }

        // Prevent infinite refresh loop
        if (originalRequest._retried) {
            return Promise.reject(error);
        }

        if (isRefreshing) {
            // Queue this request while refresh is in-progress
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            })
                .then(() => {
                    originalRequest._retried = true;
                    return api(originalRequest);
                })
                .catch((err) => Promise.reject(err));
        }

        originalRequest._retried = true;
        isRefreshing = true;

        try {
            // Silent refresh — backend rotates tokens and sets new cookies
            await refreshApi.post("/api/auth/refresh");

            processQueue(null);

            // Retry the original failed request with the new accessToken cookie
            return api(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError);

            // Refresh token is invalid/expired → force logout
            window.dispatchEvent(new CustomEvent("auth:logout-required"));

            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default api;
