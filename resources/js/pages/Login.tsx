import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { api, setAuthToken, setStoredUser } from '@/lib/api';

export default function Login() {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (mode === 'login') {
                const res = await api.login({ email, password });
                setAuthToken(res.token);
                setStoredUser(res.user);
                window.location.assign('/dashboard');
                return;
            }

            if (password !== passwordConfirmation) {
                throw new Error('Passwords do not match.');
            }

            const res = await api.register({
                name,
                email,
                password,
                password_confirmation: passwordConfirmation,
            });

            setAuthToken(res.token);
            setStoredUser(res.user);
            window.location.assign('/dashboard');
        } catch (submitError: any) {
            setError(
                submitError?.message ||
                    'Authentication failed. Please try again.',
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="theme-page min-h-screen px-4 py-10 sm:px-6 lg:px-8">
            <Head title="Login — Nexora Search" />

            <div className="mx-auto max-w-6xl">
                <div className="mb-8 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#10201e] text-lg font-bold text-[#e8c36a] dark:bg-[#e8c36a] dark:text-[#10201e]">
                            N
                        </span>
                        <span className="text-lg font-semibold tracking-[-0.04em]">
                            Nexora Search
                        </span>
                    </Link>
                    <Link
                        href="/"
                        className="text-sm font-semibold text-[#52615e] transition hover:text-[#10201e] dark:text-[#a8b9b4] dark:hover:text-white"
                    >
                        Back to home
                    </Link>
                </div>

                <div className="theme-surface theme-border grid overflow-hidden rounded-[var(--nx-radius)] border shadow-[0_30px_90px_rgba(16,32,30,0.08)] lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="relative hidden overflow-hidden bg-[#10201e] p-10 text-white lg:flex lg:flex-col lg:justify-between">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(126,226,206,0.2),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(232,195,106,0.2),_transparent_35%)]" />
                        <div className="relative z-10">
                            <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-bold tracking-[0.2em] text-[#7ee2ce] uppercase">
                                Welcome back
                            </span>
                            <h1 className="mt-8 max-w-md text-4xl leading-tight font-semibold tracking-[-0.06em]">
                                Start with the right place, then make the plan.
                            </h1>
                            <p className="mt-5 max-w-sm text-sm leading-7 text-[#d4e0dd]">
                                Search for places, save results, and keep a
                                personal shortlist tied to your preferences.
                            </p>
                        </div>

                        <div className="relative z-10 rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                            <p className="text-[10px] font-bold tracking-[0.2em] text-[#7ee2ce] uppercase">
                                Nexora works best when signed in
                            </p>
                            <div className="mt-4 space-y-3 text-sm text-[#e6efeb]">
                                <div className="flex items-center gap-3">
                                    <span className="h-2 w-2 rounded-full bg-[#e8c36a]" />
                                    Saved places
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="h-2 w-2 rounded-full bg-[#7ee2ce]" />
                                    Search history
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="h-2 w-2 rounded-full bg-[#b9cff5]" />
                                    Personalized results
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 sm:p-8 lg:p-10">
                        <div className="mx-auto max-w-md">
                            <div className="mb-7 flex rounded-2xl border border-[#10201e]/10 bg-[#f7f8f5] p-1 dark:border-white/10 dark:bg-[#0b1111]">
                                <button
                                    type="button"
                                    onClick={() => setMode('login')}
                                    className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                                        mode === 'login'
                                            ? 'bg-[#10201e] text-white dark:bg-[#e8c36a] dark:text-[#10201e]'
                                            : 'text-[#52615e] dark:text-[#a8b9b4]'
                                    }`}
                                >
                                    Sign in
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode('register')}
                                    className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                                        mode === 'register'
                                            ? 'bg-[#10201e] text-white dark:bg-[#e8c36a] dark:text-[#10201e]'
                                            : 'text-[#52615e] dark:text-[#a8b9b4]'
                                    }`}
                                >
                                    Register
                                </button>
                            </div>

                            <h2 className="text-3xl font-semibold tracking-[-0.05em] text-[#10201e] dark:text-white">
                                {mode === 'login'
                                    ? 'Welcome back'
                                    : 'Create your account'}
                            </h2>
                            <p className="mt-2 text-sm text-[#687873] dark:text-[#a8b9b4]">
                                {mode === 'login'
                                    ? 'Use your email and password to continue.'
                                    : 'Create a free account to save locations and preferences.'}
                            </p>

                            {error && (
                                <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
                                    {error}
                                </div>
                            )}

                            <form
                                onSubmit={handleSubmit}
                                className="mt-6 space-y-4"
                            >
                                {mode === 'register' && (
                                    <label className="block text-xs font-semibold tracking-[0.18em] text-[#52615e] uppercase dark:text-[#b7c7c1]">
                                        Full name
                                        <input
                                            id="login-name"
                                            name="name"
                                            type="text"
                                            value={name}
                                            onChange={(event) =>
                                                setName(event.target.value)
                                            }
                                            required
                                            placeholder="Alex Morgan"
                                            className="mt-2 w-full rounded-2xl border border-[#10201e]/10 bg-[#f7f8f5] px-3.5 py-3 text-sm text-[#10201e] transition outline-none focus:border-[#087f6b] focus:ring-4 focus:ring-[#087f6b]/10 dark:border-white/10 dark:bg-[#0b1111] dark:text-[#edf5f1]"
                                        />
                                    </label>
                                )}

                                <label className="block text-xs font-semibold tracking-[0.18em] text-[#52615e] uppercase dark:text-[#b7c7c1]">
                                    Email
                                    <input
                                        id="login-email"
                                        name="email"
                                        type="email"
                                        value={email}
                                        onChange={(event) =>
                                            setEmail(event.target.value)
                                        }
                                        required
                                        placeholder="you@example.com"
                                        className="mt-2 w-full rounded-2xl border border-[#10201e]/10 bg-[#f7f8f5] px-3.5 py-3 text-sm text-[#10201e] transition outline-none focus:border-[#087f6b] focus:ring-4 focus:ring-[#087f6b]/10 dark:border-white/10 dark:bg-[#0b1111] dark:text-[#edf5f1]"
                                    />
                                </label>

                                <label className="block text-xs font-semibold tracking-[0.18em] text-[#52615e] uppercase dark:text-[#b7c7c1]">
                                    Password
                                    <input
                                        id="login-password"
                                        name="password"
                                        type="password"
                                        value={password}
                                        onChange={(event) =>
                                            setPassword(event.target.value)
                                        }
                                        required
                                        placeholder="••••••••"
                                        className="mt-2 w-full rounded-2xl border border-[#10201e]/10 bg-[#f7f8f5] px-3.5 py-3 text-sm text-[#10201e] transition outline-none focus:border-[#087f6b] focus:ring-4 focus:ring-[#087f6b]/10 dark:border-white/10 dark:bg-[#0b1111] dark:text-[#edf5f1]"
                                    />
                                </label>

                                {mode === 'register' && (
                                    <label className="block text-xs font-semibold tracking-[0.18em] text-[#52615e] uppercase dark:text-[#b7c7c1]">
                                        Confirm password
                                        <input
                                            id="login-password-confirmation"
                                            name="password_confirmation"
                                            type="password"
                                            value={passwordConfirmation}
                                            onChange={(event) =>
                                                setPasswordConfirmation(
                                                    event.target.value,
                                                )
                                            }
                                            required
                                            placeholder="••••••••"
                                            className="mt-2 w-full rounded-2xl border border-[#10201e]/10 bg-[#f7f8f5] px-3.5 py-3 text-sm text-[#10201e] transition outline-none focus:border-[#087f6b] focus:ring-4 focus:ring-[#087f6b]/10 dark:border-white/10 dark:bg-[#0b1111] dark:text-[#edf5f1]"
                                        />
                                    </label>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full rounded-2xl bg-[#087f6b] px-4 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isLoading
                                        ? 'Please wait...'
                                        : mode === 'login'
                                          ? 'Sign in to Nexora'
                                          : 'Create account'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
