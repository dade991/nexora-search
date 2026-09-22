import React, { useState } from 'react';
import { api, setAuthToken, setStoredUser } from '@/lib/api';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAuthSuccess: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
    isOpen,
    onClose,
    onAuthSuccess,
}) => {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (mode === 'login') {
                const res = await api.login({ email, password });
                setAuthToken(res.token);
                setStoredUser(res.user);
                onAuthSuccess(res.user);
                onClose();
            } else {
                const res = await api.register({
                    name,
                    email,
                    password,
                    password_confirmation: passwordConfirmation,
                });
                setAuthToken(res.token);
                setStoredUser(res.user);
                onAuthSuccess(res.user);
                onClose();
            }
        } catch (err: any) {
            setError(err.message || 'Authentication failed. Please check credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickFill = () => {
        setEmail('test@example.com');
        setPassword('password123');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Brand Header */}
                <div className="mb-6 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
                        <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 stroke-[2.2]" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 19V5l12 14V5" />
                            <circle cx="6" cy="5" r="1.5" fill="currentColor" />
                            <circle cx="18" cy="19" r="1.5" fill="currentColor" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {mode === 'login' ? 'Welcome to Nexora' : 'Create an Account'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Sanctum Token Authentication & Sync
                    </p>
                </div>

                {/* Mode Tabs */}
                <div className="mb-6 flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                    <button
                        onClick={() => {
                            setMode('login');
                            setError(null);
                        }}
                        className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                            mode === 'login'
                                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                        }`}
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => {
                            setMode('register');
                            setError(null);
                        }}
                        className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                            mode === 'register'
                                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                        }`}
                    >
                        Register
                    </button>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'register' && (
                        <div>
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                Full Name
                            </label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Alexander Hamilton"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                            />
                        </div>
                    )}

                    <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            Email Address
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="user@example.com"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                        />
                    </div>

                    {mode === 'register' && (
                        <div>
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                required
                                value={passwordConfirmation}
                                onChange={(e) => setPasswordConfirmation(e.target.value)}
                                placeholder="••••••••"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 active:scale-98 transition disabled:opacity-60"
                    >
                        {isLoading ? 'Authenticating...' : mode === 'login' ? 'Sign In to Nexora' : 'Create Free Account'}
                    </button>

                    {/* Quick Demo Fill Button */}
                    <div className="pt-2 text-center">
                        <button
                            type="button"
                            onClick={handleQuickFill}
                            className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            Autofill Demo Credentials (test@example.com)
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
