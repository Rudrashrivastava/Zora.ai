import api from "../../../lib/axios.js";

export async function register({ email, username, password }) {
    const response = await api.post("/api/auth/register", { email, username, password });
    return response.data;
}

export async function login({ email, password }) {
    const response = await api.post("/api/auth/login", { email, password });
    return response.data;
}

export async function logout() {
    const response = await api.post("/api/auth/logout");
    return response.data;
}

export async function getMe() {
    const response = await api.get("/api/auth/get-me");
    return response.data;
}

export async function verifyEmail(token) {
    const response = await api.get(`/api/auth/verify-email?token=${token}`);
    return response.data;
}

export async function refreshToken() {
    // Direct call — bypass the shared interceptor to avoid infinite loop
    const response = await api.post("/api/auth/refresh");
    return response.data;
}