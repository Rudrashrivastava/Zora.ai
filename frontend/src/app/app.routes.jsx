import { createBrowserRouter, Navigate } from "react-router";

import Login from "../features/auth/pages/Login";
import Register from "../features/auth/pages/Register";
import EmailVerified from "../features/auth/pages/EmailVerified";
import EmailVerificationFailed from "../features/auth/pages/EmailVerificationFailed";
import VerifyEmail from "../features/auth/pages/VerifyEmail";
import Dashboard from "../features/chat/pages/Dashboard";
import ShareChat from "../features/chat/pages/ShareChat";
import Protected from "../features/auth/components/Protected";

export const router = createBrowserRouter([
    // =====================================================
    // AUTH
    // =====================================================

    {
        path: "/login",
        element: <Login />,
    },

    {
        path: "/register",
        element: <Register />,
    },

    {
        path: "/email-verified",
        element: <EmailVerified />,
    },

    {
        path: "/email-verification-failed",
        element: <EmailVerificationFailed />,
    },

    {
        path: "/verify-email",
        element: <VerifyEmail />,
    },


    // =====================================================
    // PROTECTED DASHBOARD
    // =====================================================

    {
        path: "/",
        element: (
            <Protected>
                <Dashboard />
            </Protected>
        ),
    },

    {
        path: "/dashboard",
        element: <Navigate to="/" replace />,
    },


    // =====================================================
    // PUBLIC SHARED CHAT
    // =====================================================

    {
        path: "/shared/chat/:chatId",
        element: <ShareChat />,
    },

    {
        path: "/shared/message/:messageId",
        element: <ShareChat />,
    },
]);