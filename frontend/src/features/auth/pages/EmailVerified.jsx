import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle } from "lucide-react";

const EmailVerified = () => {
    const [searchParams] = useSearchParams();
    const status = searchParams.get("status");

    return (
        <section className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100 sm:px-6 lg:px-8">
            <div className="mx-auto flex min-h-[85vh] w-full max-w-5xl items-center justify-center">
                <div className="w-full max-w-md rounded-2xl border border-[#31b8c6]/40 bg-zinc-900/70 p-8 text-center shadow-2xl shadow-black/50 backdrop-blur">
                    
                    {/* SUCCESS ICON */}
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 ring-8 ring-emerald-500/5">
                        <CheckCircle className="h-10 w-10 animate-bounce" />
                    </div>

                    {/* TITLE */}
                    <h1 className="mt-6 text-3xl font-bold text-[#31b8c6]">
                        {status === "already" ? "Already Verified" : "Email Verified!"}
                    </h1>

                    {/* MESSAGE */}
                    <p className="mt-4 text-sm text-zinc-300 leading-relaxed">
                        {status === "already"
                            ? "Your email address has already been verified. You can proceed to log in."
                            : "Thank you! Your email address has been successfully verified. Your account is now active."}
                    </p>

                    {/* LOGIN BUTTON */}
                    <div className="mt-8">
                        <Link
                            to="/login"
                            className="inline-block w-full rounded-lg bg-[#31b8c6] px-4 py-3 font-semibold text-zinc-950 transition hover:bg-[#45c7d4] focus:outline-none focus:shadow-[0_0_0_3px_rgba(49,184,198,0.35)]"
                        >
                            Log in to your account
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default EmailVerified;
