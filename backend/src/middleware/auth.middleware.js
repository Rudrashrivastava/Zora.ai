import jwt from "jsonwebtoken";

/**
 * authUser middleware
 * Reads the httpOnly `accessToken` cookie, verifies the JWT,
 * and attaches the decoded payload to req.user.
 * Returns 401 if missing or invalid.
 */
export function authUser(req, res, next) {
    try {
        // Primary: read short-lived accessToken cookie
        const token = req.cookies?.accessToken;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized — please log in",
                code: "NO_TOKEN",
            });
        }

        // Verify the access token
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET);

        // Attach decoded payload to request
        req.user = decoded; // { id, username, role, iat, exp }

        next();
    } catch (error) {
        // Token expired — tell frontend to attempt refresh
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Access token expired",
                code: "TOKEN_EXPIRED",
            });
        }

        console.error("[Auth Middleware] Invalid token:", error.message);

        return res.status(401).json({
            success: false,
            message: "Unauthorized — invalid token",
            code: "INVALID_TOKEN",
        });
    }
}