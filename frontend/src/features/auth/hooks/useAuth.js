import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import { register, login, logout, getMe } from "../service/auth.api";
import { setUser, setLoading, setError, clearUser } from "../auth.slice";

// =====================================================
// useAuth — must be used INSIDE a Router context
// (i.e., inside RouterProvider — NOT in App.jsx directly)
// =====================================================
export function useAuth() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Listen for forced logout event (fired by axios interceptor when refresh fails)
    useEffect(() => {
        const handleForcedLogout = () => {
            dispatch(clearUser());
            navigate("/login", { replace: true });
        };

        window.addEventListener("auth:logout-required", handleForcedLogout);
        return () => window.removeEventListener("auth:logout-required", handleForcedLogout);
    }, [dispatch, navigate]);

    // ==========================================
    // REGISTER
    // ==========================================
    async function handleRegister({ email, username, password }) {
        try {
            dispatch(setLoading(true));
            dispatch(setError(null));

            const data = await register({
                email: email?.trim(),
                username: username?.trim(),
                password,
            });

            return data;
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.response?.data?.errors?.[0]?.msg ||
                error.message ||
                "Registration failed";

            dispatch(setError(message));
            throw new Error(message);
        } finally {
            dispatch(setLoading(false));
        }
    }

    // ==========================================
    // LOGIN
    // ==========================================
    async function handleLogin({ email, password }) {
        try {
            dispatch(setLoading(true));
            dispatch(setError(null));

            const data = await login({ email: email?.trim(), password });

            dispatch(setUser(data.user));

            return data;
        } catch (error) {
            console.error("LOGIN FAILED:", error);

            const status = error.response?.status;
            let message;

            if (status === 404) {
                message = "No account found with this email. Please register first.";
            } else if (status === 429) {
                message = "Too many login attempts. Please wait 15 minutes and try again.";
            } else {
                message =
                    error.response?.data?.message ||
                    error.response?.data?.errors?.[0]?.msg ||
                    "Invalid email or password";
            }

            dispatch(setError(message));
            throw new Error(message);
        } finally {
            dispatch(setLoading(false));
        }
    }

    // ==========================================
    // LOGOUT
    // ==========================================
    async function handleLogout() {
        try {
            dispatch(setLoading(true));
            await logout();
        } catch (error) {
            console.warn("[Logout] API call failed:", error.message);
        } finally {
            dispatch(clearUser());
            dispatch(setLoading(false));
            navigate("/login", { replace: true });
        }
    }

    // ==========================================
    // GET ME (called on app load to restore session)
    // ==========================================
    async function handleGetMe() {
        try {
            dispatch(setLoading(true));
            const data = await getMe();
            dispatch(setUser(data.user));
            return data;
        } catch (error) {
            dispatch(clearUser());
            return null;
        } finally {
            dispatch(setLoading(false));
        }
    }

    return {
        handleRegister,
        handleLogin,
        handleLogout,
        handleGetMe,
    };
}

// =====================================================
// useAuthInit — Safe version for App.jsx (no useNavigate)
// Only calls getMe to restore session on app load.
// =====================================================
export function useAuthInit() {
    const dispatch = useDispatch();

    async function init() {
        try {
            dispatch(setLoading(true));
            const data = await getMe();
            dispatch(setUser(data.user));
        } catch {
            dispatch(clearUser());
        } finally {
            dispatch(setLoading(false));
        }
    }

    return { init };
}