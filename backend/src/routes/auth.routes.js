import express from "express";
import rateLimit from "express-rate-limit";

import {
    register,
    login,
    refreshTokens,
    logout,
    getMe,
    verifyEmail,
} from "../controllers/auth.controller.js";

import {
    registerValidator,
    loginValidator,
} from "../validators/auth.validator.js";

import { authUser } from "../middleware/auth.middleware.js";

const router = express.Router();

// =====================================================
// RATE LIMITERS
// =====================================================

// Strict: 10 login attempts per 15 min per IP
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many login attempts. Try again in 15 minutes." },
});

// Register: 5 per hour per IP
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many registration attempts. Try again in 1 hour." },
});

// Refresh: 30 per 15 min per IP (allows normal app usage)
const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many refresh attempts. Please log in again." },
});

// =====================================================
// ROUTES
// =====================================================

// REGISTER — Public
router.post("/register", registerLimiter, registerValidator, register);

// LOGIN — Public
router.post("/login", loginLimiter, loginValidator, login);

// SILENT TOKEN REFRESH — Public (uses httpOnly refreshToken cookie)
router.post("/refresh", refreshLimiter, refreshTokens);

// GET CURRENT USER — Private
router.get("/get-me", authUser, getMe);

// VERIFY EMAIL — Public
router.get("/verify-email", verifyEmail);

// LOGOUT — Private (also reads refreshToken cookie to revoke from DB)
router.post("/logout", authUser, logout);

export default router;