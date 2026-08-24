import React from "react";
import { Link } from "react-router-dom";
import { XCircle } from "lucide-react";

const EmailVerificationFailed = () => {
    return (
        <section className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100 sm:px-6 lg:px-8">
            <div className="mx-auto flex min-h-[85vh] w-full max-w-5xl items-center justify-center">
                <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-zinc-900/70 p-8 text-center shadow-2xl shadow-black/50 backdrop-blur">
                    
                    {/* FAILED ICON */}
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-400 ring-8 ring-red-500/5">
                        <XCircle className="h-10 w-10 animate-pulse" />
                    </div>

                    {/* TITLE */}
                    <h1 className="mt-6 text-3xl font-bold text-red-400">
                        Verification Failed
                    </h1>

                    {/* MESSAGE */}
                    <p className="mt-4 text-sm text-zinc-300 leading-relaxed">
                        The verification link is invalid, expired, or has already been used. 
                        Verification links expire after <strong>15 minutes</strong> for security reasons.
                    </p>

                    {/* ACTIONS */}
                    <div className="mt-8 space-y-3">
                        <Link
                            to="/register"
                            className="inline-block w-full rounded-lg bg-red-500/20 border border-red-500/30 px-4 py-3 font-semibold text-red-300 transition hover:bg-red-500/35 focus:outline-none focus:shadow-[0_0_0_3px_rgba(239,68,68,0.25)]"
                        >
                            Register again
                        </Link>
                        
                        <Link
                            to="/login"
                            className="inline-block w-full text-sm font-medium text-zinc-400 transition hover:text-zinc-200"
                        >
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default EmailVerificationFailed;
