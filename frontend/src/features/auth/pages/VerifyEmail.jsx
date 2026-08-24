import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifyEmail } from "../service/auth.api";

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            navigate("/email-verification-failed", { replace: true });
            return;
        }

        const runVerification = async () => {
            try {
                const response = await verifyEmail(token);
                if (response.success) {
                    if (response.status === "already") {
                        navigate("/email-verified?status=already", { replace: true });
                    } else {
                        navigate("/email-verified", { replace: true });
                    }
                } else {
                    navigate("/email-verification-failed", { replace: true });
                }
            } catch (error) {
                console.error("Verification API call error:", error);
                navigate("/email-verification-failed", { replace: true });
            }
        };

        // Add a small delay for premium loading feel
        const timeoutId = setTimeout(() => {
            runVerification();
        }, 1500);

        return () => clearTimeout(timeoutId);
    }, [token, navigate]);

    return (
        <section className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100 sm:px-6 lg:px-8">
            <div className="mx-auto flex min-h-[85vh] w-full max-w-5xl items-center justify-center">
                <div className="w-full max-w-md rounded-2xl border border-[#31b8c6]/40 bg-zinc-900/70 p-8 text-center shadow-2xl shadow-black/50 backdrop-blur">
                    
                    {/* LOADING SPINNER */}
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#31b8c6]/10 text-[#31b8c6] ring-8 ring-[#31b8c6]/5">
                        <svg className="h-10 w-10 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>

                    {/* TITLE */}
                    <h1 className="mt-6 text-2xl font-bold text-[#31b8c6]">
                        Verifying your email
                    </h1>

                    {/* MESSAGE */}
                    <p className="mt-3 text-sm text-zinc-300 leading-relaxed font-normal">
                        Please wait a moment while we verify your account credentials.
                    </p>
                </div>
            </div>
        </section>
    );
};

export default VerifyEmail;
