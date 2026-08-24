import crypto from "crypto";
import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../services/mail.service.js";

// =====================================================
// TOKEN HELPERS
// =====================================================

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + "_refresh";
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

function generateAccessToken(user) {
    return jwt.sign(
        {
            id: user._id.toString(),
            username: user.username,
            role: user.role || "user",
        },
        ACCESS_TOKEN_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
}

function generateRefreshToken(user, existingFamilyId = null) {
    const familyId = existingFamilyId || crypto.randomUUID();
    const token = jwt.sign(
        {
            id: user._id.toString(),
            familyId,
        },
        REFRESH_TOKEN_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
    );
    return { token, familyId };
}

function hashToken(rawToken) {
    return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function setAuthCookies(res, accessToken, refreshToken) {
    const isProd = process.env.NODE_ENV === "production";

    // Short-lived access token cookie (15 min)
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        maxAge: 15 * 60 * 1000, // 15 minutes
    });

    // Long-lived refresh token cookie (7 days)
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        maxAge: REFRESH_TOKEN_EXPIRY_MS,
        path: "/api/auth", // Only sent to auth endpoints
    });
}

function clearAuthCookies(res) {
    const isProd = process.env.NODE_ENV === "production";
    const opts = {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
    };

    res.clearCookie("accessToken", opts);
    res.clearCookie("refreshToken", { ...opts, path: "/api/auth" });
}

// =====================================================
// REGISTER
// POST /api/auth/register — Public
// =====================================================
export async function register(req, res) {
    try {
        const { username, email, password } = req.body;

        // Check duplicate
        const existingUser = await userModel.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            const message =
                existingUser.email === email
                    ? "Email is already registered"
                    : "Username is already taken";
            return res.status(400).json({ success: false, message });
        }

        // Create user
        const user = await userModel.create({ username, email, password });

        // Email verification token (JWT, 24 hours)
        const emailVerificationToken = jwt.sign(
            { id: user._id.toString(), email: user.email, purpose: "email-verification" },
            ACCESS_TOKEN_SECRET,
            { expiresIn: "24h" }
        );

        const requestOrigin = req.headers.origin || `${req.protocol}://${req.get("host")}`;
        const frontendUrl = (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes("localhost"))
            ? process.env.FRONTEND_URL
            : requestOrigin;
        const verificationUrl = `${frontendUrl}/verify-email?token=${emailVerificationToken}`;

        try {
            await sendEmail({
                to: email,
                subject: "Verify your Zora.ai account",
                html: `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Verify your email</title>
<style>
body { margin: 0; padding: 0; background: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #374151; }
.wrapper { width: 100%; background: #f9fafb; padding: 40px 20px; }
.container { max-width: 520px; margin: 0 auto; }
.card { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 40px; text-align: center; }
h1 { color: #111827; font-size: 24px; margin: 0 0 20px; }
p { color: #4b5563; font-size: 15px; line-height: 24px; margin: 0 0 20px; }
.button { display: inline-block; background: #111827; color: #fff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; margin: 20px 0; }
.footer { text-align: center; padding-top: 24px; }
.footer p { font-size: 13px; color: #6b7280; }
</style>
</head>
<body>
<div class="wrapper">
<div class="container">
<div class="card">
<h1>Verify your email</h1>
<p>Hi <strong>${username}</strong>,</p>
<p>Welcome to Zora.ai. Click the button below to verify your email and complete registration.</p>
<a href="${verificationUrl}" class="button" target="_blank">Verify Email Address</a>
<p>This link expires in <strong>15 minutes</strong>. If you didn't create this account, ignore this email.</p>
<p>Thanks,<br><strong>The Zora.ai Team</strong></p>
</div>
<div class="footer"><p>© 2026 Zora.ai. All rights reserved.</p></div>
</div>
</div>
</body>
</html>`,
            });
        } catch (emailError) {
            console.error("[Register] Email send failed:", emailError.message);
            await userModel.findByIdAndDelete(user._id);
            return res.status(500).json({
                success: false,
                message: "Unable to send verification email to this address. Please try again with a valid email.",
            });
        }

        return res.status(201).json({
            success: true,
            message: "Registration successful. Please check your email to verify your account.",
            user: { id: user._id, username: user.username, email: user.email },
        });
    } catch (error) {
        console.error("[Register] Error:", error);
        return res.status(500).json({
            success: false,
            message: "Registration failed. Please try again.",
        });
    }
}

// =====================================================
// LOGIN
// POST /api/auth/login — Public
// =====================================================
export async function login(req, res) {
    try {
        const { email, password } = req.body;

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "No account found with this email. Please register first.",
            });
        }

        const isPasswordMatch = await user.comparePassword(password);
        if (!isPasswordMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        if (!user.verified && process.env.NODE_ENV !== "development") {
            return res.status(400).json({
                success: false,
                message: "Please verify your email before logging in.",
            });
        }

        // Issue tokens
        const accessToken = generateAccessToken(user);
        const { token: rawRefreshToken, familyId } = generateRefreshToken(user);
        const refreshTokenHash = hashToken(rawRefreshToken);

        // Prune expired refresh tokens and add new one
        const userAgent = req.headers["user-agent"] || "";
        const ipAddress = req.ip || req.headers["x-forwarded-for"] || "";

        user.refreshTokens = user.refreshTokens.filter(
            (t) => new Date(t.createdAt).getTime() + REFRESH_TOKEN_EXPIRY_MS > Date.now()
        );
        user.refreshTokens.push({ tokenHash: refreshTokenHash, familyId, userAgent, ipAddress });
        await user.save();

        // Set cookies
        setAuthCookies(res, accessToken, rawRefreshToken);

        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("[Login] Error:", error);
        return res.status(500).json({ success: false, message: "Login failed. Please try again." });
    }
}

// =====================================================
// REFRESH TOKENS
// POST /api/auth/refresh — Public (uses refreshToken cookie)
// Implements Refresh Token Rotation with Token Reuse Detection
// =====================================================
export async function refreshTokens(req, res) {
    try {
        const rawRefreshToken = req.cookies?.refreshToken;

        if (!rawRefreshToken) {
            return res.status(401).json({
                success: false,
                message: "No refresh token provided",
                code: "NO_REFRESH_TOKEN",
            });
        }

        // 1. Verify JWT signature of the refresh token
        let decoded;
        try {
            decoded = jwt.verify(rawRefreshToken, REFRESH_TOKEN_SECRET);
        } catch (jwtErr) {
            clearAuthCookies(res);
            return res.status(401).json({
                success: false,
                message: "Invalid or expired refresh token",
                code: "REFRESH_TOKEN_EXPIRED",
            });
        }

        // 2. Fetch target user
        const user = await userModel.findById(decoded.id);
        if (!user) {
            clearAuthCookies(res);
            return res.status(401).json({
                success: false,
                message: "User account no longer exists.",
                code: "USER_NOT_FOUND",
            });
        }

        const refreshTokenHash = hashToken(rawRefreshToken);
        const storedToken = user.refreshTokens.find((t) => t.tokenHash === refreshTokenHash);

        // 3. REUSE DETECTION — Valid JWT, but tokenHash is missing from DB!
        // An attacker (or victim) replayed an already-rotated refresh token!
        if (!storedToken) {
            console.warn(`[Security Alert] Refresh token reuse detected for user ${user._id}! Invalidating all user sessions.`);
            // Revoke all tokens for THIS user only to protect account
            user.refreshTokens = [];
            await user.save();
            clearAuthCookies(res);

            return res.status(401).json({
                success: false,
                message: "Security alert: Compromised session detected. Please log in again.",
                code: "TOKEN_REUSE_DETECTED",
            });
        }

        // 4. ROTATION — Remove old token, generate new access + refresh token pair
        user.refreshTokens = user.refreshTokens.filter((t) => t.tokenHash !== refreshTokenHash);

        const newAccessToken = generateAccessToken(user);
        const { token: newRawRefreshToken, familyId } = generateRefreshToken(user, storedToken.familyId || decoded.familyId);
        const newRefreshTokenHash = hashToken(newRawRefreshToken);

        const userAgent = req.headers["user-agent"] || "";
        const ipAddress = req.ip || req.headers["x-forwarded-for"] || "";

        user.refreshTokens.push({
            tokenHash: newRefreshTokenHash,
            familyId,
            userAgent,
            ipAddress,
        });
        await user.save();

        setAuthCookies(res, newAccessToken, newRawRefreshToken);

        return res.status(200).json({
            success: true,
            message: "Tokens refreshed successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("[Refresh] Error:", error);
        clearAuthCookies(res);
        return res.status(500).json({ success: false, message: "Token refresh failed." });
    }
}

// =====================================================
// LOGOUT
// POST /api/auth/logout — Private
// Revokes the current device's refresh token from DB
// =====================================================
export async function logout(req, res) {
    try {
        const rawRefreshToken = req.cookies?.refreshToken;

        if (rawRefreshToken) {
            const refreshTokenHash = hashToken(rawRefreshToken);
            // Remove only this device's refresh token
            await userModel.updateOne(
                { _id: req.user.id },
                { $pull: { refreshTokens: { tokenHash: refreshTokenHash } } }
            );
        }

        clearAuthCookies(res);

        return res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        console.error("[Logout] Error:", error);
        // Clear cookies anyway even if DB update fails
        clearAuthCookies(res);
        return res.status(200).json({ success: true, message: "Logged out" });
    }
}

// =====================================================
// GET ME
// GET /api/auth/get-me — Private
// =====================================================
export async function getMe(req, res) {
    try {
        const user = await userModel.findById(req.user.id).select("-password -refreshTokens");

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({
            success: true,
            message: "User details fetched successfully",
            user,
        });
    } catch (error) {
        console.error("[GetMe] Error:", error);
        return res.status(500).json({ success: false, message: "Unable to fetch user details" });
    }
}

// =====================================================
// VERIFY EMAIL
// GET /api/auth/verify-email?token=... — Public
// =====================================================
export async function verifyEmail(req, res) {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ success: false, message: "Verification token is required" });
    }

    try {
        let decoded;
        try {
            decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
        } catch (jwtErr) {
            // Try fallback secrets in case environment secrets were rotated/updated
            if (process.env.JWT_SECRET) {
                decoded = jwt.verify(token, process.env.JWT_SECRET);
            } else {
                throw jwtErr;
            }
        }

        if (decoded.purpose !== "email-verification") {
            return res.status(400).json({ success: false, message: "Invalid token purpose" });
        }

        const user = await userModel.findById(decoded.id);

        if (!user) {
            return res.status(404).json({ success: false, message: "User account no longer exists." });
        }

        if (user.verified) {
            return res.status(200).json({ success: true, message: "Email already verified", status: "already" });
        }

        user.verified = true;
        await user.save();

        return res.status(200).json({ success: true, message: "Email verified successfully" });
    } catch (error) {
        console.error("[VerifyEmail] Verification Error:", error.message);
        return res.status(400).json({
            success: false,
            message: "Verification link is invalid or has expired.",
        });
    }
}