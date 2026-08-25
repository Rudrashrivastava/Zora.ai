import React, { useState } from 'react';
import { Check, X, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [registerError, setRegisterError] = useState('');
    const [loading, setLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState('');
    const [passwordCriteria, setPasswordCriteria] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        digit: false,
        special: false,
    });

    const { handleRegister } = useAuth();
    const navigate = useNavigate();

    const handlePasswordChange = (val) => {
        setPassword(val);
        const criteria = {
            length: val.length >= 8,
            uppercase: /[A-Z]/.test(val),
            lowercase: /[a-z]/.test(val),
            digit: /[0-9]/.test(val),
            special: /[^A-Za-z0-9]/.test(val),
        };
        setPasswordCriteria(criteria);

        const count = Object.values(criteria).filter(Boolean).length;
        if (val.length === 0) setPasswordStrength('');
        else if (count <= 2) setPasswordStrength('Weak');
        else if (count <= 4) setPasswordStrength('Medium');
        else setPasswordStrength('Strong');
    };

    const submitForm = async (event) => {
        event.preventDefault();
        setRegisterError('');

        if (!username.trim() || !email.trim() || !password) {
            setRegisterError('All fields are required');
            return;
        }

        try {
            setLoading(true);
            const result = await handleRegister({
                username: username.trim(),
                email: email.trim(),
                password,
            });

            if (result?.success) {
                setIsRegistered(true);
            }
        } catch (err) {
            setRegisterError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (isRegistered) {
        return (
            <section className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100 sm:px-6 lg:px-8">
                <div className="mx-auto flex min-h-[85vh] w-full max-w-5xl items-center justify-center">
                    <div className="w-full max-w-md rounded-2xl border border-[#31b8c6]/40 bg-zinc-900/70 p-8 text-center shadow-2xl shadow-black/50 backdrop-blur">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#31b8c6]/10 text-[#31b8c6] ring-8 ring-[#31b8c6]/5">
                            <svg className="h-10 w-10 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5" />
                            </svg>
                        </div>
                        <h1 className="mt-6 text-3xl font-bold text-[#31b8c6]">Verify your email</h1>
                        <p className="mt-4 text-sm text-zinc-300 leading-relaxed font-normal">
                            We have sent a verification link to <strong className="text-zinc-100">{email}</strong>. 
                            Please check your email and click the link to activate your account.
                        </p>
                        <div className="mt-8">
                            <Link to="/login" className="inline-block w-full rounded-lg bg-[#31b8c6] px-4 py-3 font-semibold text-zinc-950 transition hover:bg-[#45c7d4]">
                                Back to Login
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100 sm:px-6 lg:px-8">
            <div className="mx-auto flex min-h-[85vh] w-full max-w-5xl items-center justify-center">
                <div className="w-full max-w-md rounded-2xl border border-[#31b8c6]/40 bg-zinc-900/70 p-8 shadow-2xl shadow-black/50 backdrop-blur">
                    <h1 className="text-3xl font-bold text-[#31b8c6]">Create Account</h1>
                    <p className="mt-2 text-sm text-zinc-300">
                        Register with your username, email, and password.
                    </p>

                    {registerError && (
                        <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5">
                            <p className="text-xs leading-5 text-red-300">{registerError}</p>
                            {registerError.toLowerCase().includes('already') && (
                                <Link to="/login" className="mt-1.5 inline-block text-xs font-semibold text-[#31b8c6] hover:underline">
                                    Login to your existing account →
                                </Link>
                            )}
                        </div>
                    )}

                    <form onSubmit={submitForm} className="mt-6 space-y-4">
                        <div>
                            <label htmlFor="username" className="mb-1.5 block text-xs font-medium text-zinc-200">
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(event) => {
                                    setUsername(event.target.value);
                                    if (registerError) setRegisterError('');
                                }}
                                placeholder="Choose a username"
                                required
                                className="w-full rounded-lg border border-zinc-700 bg-zinc-950/80 px-3.5 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-[#31b8c6] focus:shadow-[0_0_0_3px_rgba(49,184,198,0.25)]"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-zinc-200">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(event) => {
                                    setEmail(event.target.value);
                                    if (registerError) setRegisterError('');
                                }}
                                placeholder="you@example.com"
                                required
                                className="w-full rounded-lg border border-zinc-700 bg-zinc-950/80 px-3.5 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-[#31b8c6] focus:shadow-[0_0_0_3px_rgba(49,184,198,0.25)]"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-zinc-200">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(event) => {
                                        handlePasswordChange(event.target.value);
                                        if (registerError) setRegisterError('');
                                    }}
                                    placeholder="Create a password (min. 6 chars)"
                                    required
                                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950/80 px-3.5 py-2.5 pr-10 text-sm text-zinc-100 outline-none transition focus:border-[#31b8c6] focus:shadow-[0_0_0_3px_rgba(49,184,198,0.25)]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 focus:outline-none"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>

                            {password && (
                                <div className="mt-2.5 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] text-zinc-400">Password Strength:</span>
                                        <span className={`text-[11px] font-semibold uppercase ${
                                            passwordStrength === 'Weak' ? 'text-red-400' :
                                            passwordStrength === 'Medium' ? 'text-yellow-400' : 'text-emerald-400'
                                        }`}>
                                            {passwordStrength}
                                        </span>
                                    </div>
                                    <div className="h-1 w-full rounded-full bg-zinc-800 overflow-hidden">
                                        <div className={`h-full rounded-full transition-all duration-300 ${
                                            passwordStrength === 'Weak' ? 'w-1/3 bg-red-500' :
                                            passwordStrength === 'Medium' ? 'w-2/3 bg-yellow-500' : 'w-full bg-emerald-500'
                                        }`} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-1.5 text-[11px] text-zinc-400 bg-zinc-900/40 p-2.5 rounded-lg border border-zinc-800/50">
                                        <div className="flex items-center gap-1.5">
                                            {passwordCriteria.length ? (
                                                <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                                            ) : (
                                                <X className="h-3 w-3 text-zinc-600 shrink-0" />
                                            )}
                                            <span className={passwordCriteria.length ? 'text-zinc-300' : ''}>min. 8 characters</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {passwordCriteria.uppercase ? (
                                                <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                                            ) : (
                                                <X className="h-3 w-3 text-zinc-600 shrink-0" />
                                            )}
                                            <span className={passwordCriteria.uppercase ? 'text-zinc-300' : ''}>one uppercase (A-Z)</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {passwordCriteria.lowercase ? (
                                                <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                                            ) : (
                                                <X className="h-3 w-3 text-zinc-600 shrink-0" />
                                            )}
                                            <span className={passwordCriteria.lowercase ? 'text-zinc-300' : ''}>one lowercase (a-z)</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {passwordCriteria.digit ? (
                                                <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                                            ) : (
                                                <X className="h-3 w-3 text-zinc-600 shrink-0" />
                                            )}
                                            <span className={passwordCriteria.digit ? 'text-zinc-300' : ''}>one number (0-9)</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-[#31b8c6] px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-[#45c7d4] focus:outline-none focus:shadow-[0_0_0_3px_rgba(49,184,198,0.35)] disabled:opacity-50"
                        >
                            {loading ? 'Creating Account...' : 'Register'}
                        </button>
                    </form>

                    <p className="mt-5 text-center text-xs text-zinc-300">
                        Already have an account?{' '}
                        <Link to="/login" className="font-semibold text-[#31b8c6] transition hover:text-[#45c7d4]">
                            Login
                        </Link>
                    </p>
                </div>
            </div>
        </section>
    );
};

export default Register;