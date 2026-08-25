import React, { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useSelector } from "react-redux";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState("");

    const user = useSelector(
        (state) => state.auth.user
    );

    const loading = useSelector(
        (state) => state.auth.loading
    );

    const { handleLogin } = useAuth();

    const navigate = useNavigate();


    const submitForm = async (event) => {

    event.preventDefault();
    event.stopPropagation();

    setLoginError("");

    try {

        await handleLogin({
            email: email.trim(),
            password,
        });

        // ONLY SUCCESS COMES HERE

        navigate("/", {
            replace: true,
        });

    } catch (error) {

        // LOGIN FAILED
        // NO NAVIGATION

        console.log(
            "Login failed on page:",
            error
        );

        setLoginError(
            error.message ||
            "Login failed. Please try again."
        );

    }
};


    if (!loading && user) {
        return <Navigate to="/" replace />;
    }


    return (
        <section className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100 sm:px-6 lg:px-8">

            <div className="mx-auto flex min-h-[85vh] w-full max-w-5xl items-center justify-center">

                <div className="w-full max-w-md rounded-2xl border border-[#31b8c6]/40 bg-zinc-900/70 p-8 shadow-2xl shadow-black/50 backdrop-blur">

                    {/* TITLE */}

                    <h1 className="text-3xl font-bold text-[#31b8c6]">
                        Welcome Back
                    </h1>

                    <p className="mt-2 text-sm text-zinc-300">
                        Sign in with your email and password.
                    </p>


                    {/* =============================== */}
                    {/* LOGIN ERROR */}
                    {/* =============================== */}

                    {loginError && (
                    <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4">

                        <p className="text-sm leading-6 text-red-300">
                            {loginError}
                        </p>

                        {loginError.includes("account") && (
                            <Link
                                to="/register"
                                className="mt-2 inline-block text-sm font-semibold text-[#31b8c6] hover:text-[#45c7d4]"
                            >
                                Create an account →
                            </Link>
                        )}

                    </div>
                )}



                    {/* FORM */}

                    <form
                        onSubmit={submitForm}
                        className="mt-8 space-y-5"
                    >

                        {/* EMAIL */}

                        <div>

                            <label
                                htmlFor="email"
                                className="mb-2 block text-sm font-medium text-zinc-200"
                            >
                                Email
                            </label>

                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={email}
                                onChange={(event) => {
                                    setEmail(event.target.value);

                                    if (loginError) {
                                        setLoginError("");
                                    }
                                }}
                                placeholder="you@example.com"
                                autoComplete="email"
                                required
                                className="w-full rounded-lg border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-zinc-100 outline-none transition focus:border-[#31b8c6] focus:shadow-[0_0_0_3px_rgba(49,184,198,0.25)]"
                            />

                        </div>


                        {/* PASSWORD */}

                        <div>

                            <label
                                htmlFor="password"
                                className="mb-2 block text-sm font-medium text-zinc-200"
                            >
                                Password
                            </label>

                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(event) => {
                                        setPassword(event.target.value);

                                        if (loginError) {
                                            setLoginError("");
                                        }
                                    }}
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    required
                                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950/80 px-4 py-3 pr-11 text-zinc-100 outline-none transition focus:border-[#31b8c6] focus:shadow-[0_0_0_3px_rgba(49,184,198,0.25)]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 focus:outline-none"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>

                        </div>


                        {/* LOGIN */}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-[#31b8c6] px-4 py-3 font-semibold text-zinc-950 transition hover:bg-[#45c7d4] focus:outline-none focus:shadow-[0_0_0_3px_rgba(49,184,198,0.35)] disabled:cursor-not-allowed disabled:opacity-60"
                        >

                            {loading
                                ? "Logging in..."
                                : "Login"}

                        </button>

                    </form>


                    {/* REGISTER */}

                    <p className="mt-6 text-center text-sm text-zinc-300">

                        Don't have an account?{" "}

                        <Link
                            to="/register"
                            className="font-semibold text-[#31b8c6] transition hover:text-[#45c7d4]"
                        >
                            Register
                        </Link>

                    </p>

                </div>

            </div>

        </section>
    );
};

export default Login;