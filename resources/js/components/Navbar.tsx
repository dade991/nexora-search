import React from 'react';

interface NavbarProps {
    currentTab: 'explore' | 'ai' | 'admin';
    setCurrentTab: (tab: 'explore' | 'ai' | 'admin') => void;
    darkMode: boolean;
    setDarkMode: (val: boolean) => void;
    savedCount: number;
    onOpenSaved: () => void;
    onOpenHistory: () => void;
    user: any | null;
    onOpenAuth: () => void;
    onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
    currentTab,
    setCurrentTab,
    darkMode,
    setDarkMode,
    savedCount,
    onOpenSaved,
    onOpenHistory,
    user,
    onOpenAuth,
    onLogout,
}) => {
    return (
        <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-[#0b0f19]/80 transition-colors">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Brand Logo & Title */}
                <div
                    onClick={() => setCurrentTab('explore')}
                    className="flex items-center gap-3 cursor-pointer group"
                >
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-500 shadow-md shadow-blue-500/20 ring-1 ring-white/20 transition-transform group-hover:scale-105">
                        {/* Abstract N Logo with Navigation & Connection Motif */}
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            className="h-6 w-6 text-white stroke-[2.2]"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 19V5l12 14V5"
                            />
                            <circle cx="6" cy="5" r="1.5" fill="currentColor" />
                            <circle cx="18" cy="19" r="1.5" fill="currentColor" />
                        </svg>
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0b0f19]"></span>
                        </span>
                    </div>

                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                                Nexora
                            </span>
                            <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 dark:bg-blue-950/80 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
                                RESTful OS
                            </span>
                        </div>
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hidden sm:inline">
                            Unified Location & Multimodal Discovery
                        </span>
                    </div>
                </div>

                {/* Center Navigation Tabs */}
                <nav className="hidden md:flex items-center gap-1 rounded-xl bg-slate-100/80 p-1 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/60">
                    <button
                        onClick={() => setCurrentTab('explore')}
                        className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                            currentTab === 'explore'
                                ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-400'
                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                        }`}
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Search & Explore
                    </button>

                    <button
                        onClick={() => setCurrentTab('admin')}
                        className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                            currentTab === 'admin'
                                ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-400'
                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                        }`}
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        API Telemetry
                    </button>
                </nav>

                {/* Right Actions */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Search History Button */}
                    <button
                        onClick={onOpenHistory}
                        title="Search History"
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>

                    {/* Saved Places Counter Button */}
                    <button
                        onClick={onOpenSaved}
                        title="Saved Places"
                        className="relative flex h-9 items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition"
                    >
                        <svg className="h-4 w-4 text-rose-500 fill-rose-500" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                        <span className="hidden sm:inline">Saved</span>
                        <span className="rounded-full bg-rose-100 px-1.5 py-0.2 text-[10px] font-bold text-rose-600 dark:bg-rose-950/80 dark:text-rose-400">
                            {savedCount}
                        </span>
                    </button>

                    {/* Theme Toggle */}
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                    >
                        {darkMode ? (
                            <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 9h-1m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        ) : (
                            <svg className="h-4 w-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        )}
                    </button>

                    {/* User Auth State */}
                    {user ? (
                        <div className="relative group">
                            <button className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50 p-1.5 pr-2.5 text-xs font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600 font-bold text-white text-[11px]">
                                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <span className="max-w-[100px] truncate hidden sm:inline">{user.name}</span>
                            </button>
                            {/* Dropdown Menu on hover/focus */}
                            <div className="absolute right-0 top-full mt-1 hidden w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 group-hover:block z-50">
                                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user.name}</p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                                </div>
                                <button
                                    onClick={onLogout}
                                    className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={onOpenAuth}
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition active:scale-95"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                            <span>Sign In</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile Tab Row */}
            <div className="flex md:hidden border-t border-slate-200/60 dark:border-slate-800/60 px-4 py-2 gap-1 overflow-x-auto">
                <button
                    onClick={() => setCurrentTab('explore')}
                    className={`flex-1 rounded-md py-1 text-center text-xs font-semibold whitespace-nowrap px-2 ${
                        currentTab === 'explore'
                            ? 'bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400'
                            : 'text-slate-600 dark:text-slate-400'
                    }`}
                >
                    Explore
                </button>
                <button
                    onClick={() => setCurrentTab('ai')}
                    className={`flex-1 rounded-md py-1 text-center text-xs font-semibold whitespace-nowrap px-2 ${
                        currentTab === 'ai'
                            ? 'bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400'
                            : 'text-slate-600 dark:text-slate-400'
                    }`}
                >
                    AI Studio
                </button>
                <button
                    onClick={() => setCurrentTab('admin')}
                    className={`flex-1 rounded-md py-1 text-center text-xs font-semibold whitespace-nowrap px-2 ${
                        currentTab === 'admin'
                            ? 'bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400'
                            : 'text-slate-600 dark:text-slate-400'
                    }`}
                >
                    Telemetry
                </button>
            </div>
        </header>
    );
};
