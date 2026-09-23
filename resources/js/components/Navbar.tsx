import React, { useEffect, useRef, useState } from 'react';
import { Link } from '@inertiajs/react';
import { settings } from '@/routes';

interface NavbarProps {
    darkMode: boolean;
    setDarkMode: (val: boolean) => void;
    savedCount: number;
    onOpenSaved: () => void;
    onOpenHistory: () => void;
    user: User | null;
    onOpenAuth: () => void;
    onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
    darkMode,
    setDarkMode,
    savedCount,
    onOpenSaved,
    onOpenHistory,
    user,
    onOpenAuth,
    onLogout,
}) => {
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const closeOnOutsideClick = (event: MouseEvent) => {
            if (!profileMenuRef.current?.contains(event.target as Node))
                setIsProfileMenuOpen(false);
        };
        document.addEventListener('mousedown', closeOnOutsideClick);
        return () =>
            document.removeEventListener('mousedown', closeOnOutsideClick);
    }, []);

    return (
        <header className="theme-surface theme-border sticky top-0 z-40 w-full border-b backdrop-blur-xl transition-colors">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Brand Logo & Title */}
                <div className="group flex cursor-pointer items-center gap-3">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#10201e] text-[#e8c36a] shadow-md ring-1 shadow-[#10201e]/15 ring-white/20 transition-transform group-hover:scale-105 dark:bg-[#e8c36a] dark:text-[#10201e]">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            className="h-6 w-6 stroke-[2.2] text-white"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 19V5l12 14V5"
                            />
                            <circle cx="6" cy="5" r="1.5" fill="currentColor" />
                            <circle
                                cx="18"
                                cy="19"
                                r="1.5"
                                fill="currentColor"
                            />
                        </svg>
                        <span className="absolute -right-0.5 -bottom-0.5 flex h-2.5 w-2.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0b0f19]"></span>
                        </span>
                    </div>

                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold tracking-tight text-[#10201e] dark:text-white">
                                Nexora Search
                            </span>
                        </div>
                        <span className="hidden text-[11px] font-medium text-[#71807b] sm:inline dark:text-[#a8b9b4]">
                            Location search, organized for the way you work
                        </span>
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Search History Button */}
                    <button
                        onClick={onOpenHistory}
                        title="Search History"
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#10201e]/10 bg-white/60 text-[#52615e] transition hover:-translate-y-0.5 hover:border-[#087f6b] dark:border-white/10 dark:bg-white/5 dark:text-[#b7c7c1]"
                    >
                        <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </button>

                    {/* Saved Places Counter Button */}
                    <button
                        onClick={onOpenSaved}
                        title="Saved Places"
                        className="relative flex h-9 items-center gap-1.5 rounded-xl border border-[#10201e]/10 bg-white/60 px-2.5 text-xs font-semibold text-[#52615e] transition hover:-translate-y-0.5 hover:border-[#087f6b] dark:border-white/10 dark:bg-white/5 dark:text-[#b7c7c1]"
                    >
                        <svg
                            className="h-4 w-4 fill-[#087f6b] text-[#087f6b]"
                            viewBox="0 0 24 24"
                        >
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                        <span className="hidden sm:inline">Saved</span>
                        <span className="py-0.2 rounded-full bg-[#e7f6f2] px-1.5 text-[10px] font-bold text-[#087f6b] dark:bg-[#123b37] dark:text-[#7ee2ce]">
                            {savedCount}
                        </span>
                    </button>

                    {/* Theme Toggle */}
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        title={
                            darkMode
                                ? 'Switch to Light Mode'
                                : 'Switch to Dark Mode'
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#10201e]/10 bg-white/60 text-[#52615e] transition hover:-translate-y-0.5 hover:border-[#e8c36a] dark:border-white/10 dark:bg-white/5 dark:text-[#b7c7c1]"
                    >
                        {darkMode ? (
                            <svg
                                className="h-4 w-4 text-amber-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 3v1m0 16v1m9-9h-1M4 9h-1m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                                />
                            </svg>
                        ) : (
                            <svg
                                className="h-4 w-4 text-slate-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                                />
                            </svg>
                        )}
                    </button>

                    {/* User Auth State */}
                    {user ? (
                        <div ref={profileMenuRef} className="relative">
                            <button
                                type="button"
                                aria-haspopup="menu"
                                aria-expanded={isProfileMenuOpen}
                                onClick={() =>
                                    setIsProfileMenuOpen((open) => !open)
                                }
                                className="theme-elevated theme-border flex items-center gap-2 rounded-lg border p-1.5 pr-2.5 text-xs font-semibold transition"
                            >
                                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#e8c36a] text-[11px] font-bold text-[#10201e]">
                                    {user.name
                                        ? user.name.charAt(0).toUpperCase()
                                        : 'U'}
                                </div>
                                <span className="hidden max-w-[100px] truncate sm:inline">
                                    {user.name}
                                </span>
                            </button>
                            {isProfileMenuOpen && (
                                <div
                                    role="menu"
                                    className="theme-surface theme-border absolute top-full right-0 z-50 mt-2 w-52 rounded-xl border p-2 shadow-xl"
                                >
                                    <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                                        <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                                            {user.name}
                                        </p>
                                        <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                                            {user.email}
                                        </p>
                                    </div>
                                    <Link
                                        href={settings.url()}
                                        role="menuitem"
                                        onClick={() =>
                                            setIsProfileMenuOpen(false)
                                        }
                                        className="theme-muted mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium hover:bg-[var(--nx-surface-elevated)] hover:text-[var(--nx-text)]"
                                    >
                                        <span aria-hidden="true">⚙</span>
                                        Settings
                                    </Link>
                                    <button
                                        onClick={onLogout}
                                        role="menuitem"
                                        className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                    >
                                        <svg
                                            className="h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                            />
                                        </svg>
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={onOpenAuth}
                            className="flex items-center gap-2 rounded-xl bg-[#10201e] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#1c3631] active:scale-95 dark:bg-[#e8c36a] dark:text-[#10201e]"
                        >
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                                />
                            </svg>
                            <span>Sign In</span>
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};
import type { User } from '@/types/auth';
