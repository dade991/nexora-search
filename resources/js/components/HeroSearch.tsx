import React, { useState, useEffect, useRef } from 'react';

interface HeroSearchProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    activeCategory: string;
    setActiveCategory: (cat: string) => void;
    categories: string[];
    radiusKm: number;
    setRadiusKm: (radius: number) => void;
    viewMode: 'grid' | 'split' | 'list';
    setViewMode: (mode: 'grid' | 'split' | 'list') => void;
    suggestions: any[];
    onSelectSuggestion: (item: any) => void;
    onSearchSubmit: (e: React.FormEvent) => void;
    isSearching: boolean;
    totalResults: number;
    onNearMe: () => void;
}

export const HeroSearch: React.FC<HeroSearchProps> = ({
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    categories,
    radiusKm,
    setRadiusKm,
    viewMode,
    setViewMode,
    suggestions,
    onSelectSuggestion,
    onSearchSubmit,
    isSearching,
    totalResults,
    onNearMe,
}) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showRadiusMenu, setShowRadiusMenu] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
                setShowRadiusMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const radiusOptions = [
        { label: 'Within 5 km', value: 5 },
        { label: 'Within 10 km', value: 10 },
        { label: 'Within 25 km', value: 25 },
        { label: 'Within 50 km', value: 50 },
        { label: 'Global / Any', value: 50000 },
    ];

    const categoryIcons: Record<string, React.ReactNode> = {
        all: (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
        ),
        landmark: (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        ),
        restaurant: (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
        ),
        park: (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
        ),
        museum: (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
        ),
        cafe: (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 8a3 3 0 013 3v1a3 3 0 01-3 3h-1v-7h1zm-5-3H6a2 2 0 00-2 2v7a5 5 0 005 5h2a5 5 0 005-5V7a2 2 0 00-2-2zm0 0V3m-4 2V3" />
            </svg>
        ),
        hotel: (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
    };

    return (
        <section className="relative w-full pt-8 pb-4">
            {/* Subtle Gradient Backdrop */}
            <div className="absolute inset-0 -top-24 -z-10 overflow-hidden">
                <div className="absolute left-1/2 top-0 h-[380px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-blue-500/10 via-indigo-500/10 to-transparent blur-3xl dark:from-blue-600/15 dark:via-indigo-600/10 dark:to-transparent pointer-events-none"></div>
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Headline */}
                <div className="mb-6 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/80 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900/80 dark:bg-blue-950/40 dark:text-blue-300 backdrop-blur-sm mb-3">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400"></span>
                        Unified RESTful Platform + NVIDIA Multimodal AI
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-2xl mx-auto leading-tight">
                        Discover extraordinary places, across the world.
                    </h1>
                    <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
                        Global geocoding, live meteorological forecasts, and visual AI intelligence synthesized through one REST API.
                    </p>
                </div>

                {/* Primary Search Bar */}
                <div ref={searchRef} className="relative mx-auto max-w-3xl">
                    <form onSubmit={onSearchSubmit} className="relative flex items-center shadow-xl shadow-blue-500/5">
                        <div className="relative flex-1 flex items-center rounded-2xl border border-slate-300/80 bg-white/95 backdrop-blur-md p-1.5 pl-4 ring-1 ring-slate-900/5 transition-all focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/15 dark:border-slate-700/80 dark:bg-slate-900/95 dark:ring-white/10 dark:focus-within:border-blue-400">
                            {/* Search Icon */}
                            <svg className="h-5 w-5 text-slate-400 dark:text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>

                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                placeholder="Search by city, landmark, venue, or address (e.g. Paris, Central Park, Tsukiji)..."
                                className="w-full border-none bg-transparent px-3 py-2 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0 dark:text-white dark:placeholder-slate-500"
                            />

                            {/* Clear Button */}
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setShowSuggestions(false);
                                    }}
                                    className="mr-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}

                            {/* Proximity Radius Filter Pill */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowRadiusMenu(!showRadiusMenu)}
                                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
                                >
                                    <svg className="h-3.5 w-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    </svg>
                                    <span>{radiusKm >= 1000 ? 'Global' : `${radiusKm} km`}</span>
                                    <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {showRadiusMenu && (
                                    <div className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50">
                                        <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Search Radius</p>
                                        {radiusOptions.map((opt) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => {
                                                    setRadiusKm(opt.value);
                                                    setShowRadiusMenu(false);
                                                }}
                                                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                                                    radiusKm === opt.value
                                                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-semibold'
                                                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                                                }`}
                                            >
                                                <span>{opt.label}</span>
                                                {radiusKm === opt.value && (
                                                    <svg className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Near Me Geo Button */}
                            <button
                                type="button"
                                onClick={onNearMe}
                                title="Locate places near my coordinates"
                                className="ml-1 flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.071-7.071l-1.414 1.414M8.343 15.657l-1.414 1.414m12.728 0l-1.414-1.414M8.343 8.343L6.929 6.929M12 8a4 4 0 100 8 4 4 0 000-8z" />
                                </svg>
                            </button>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSearching}
                                className="ml-1 flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/25 hover:bg-blue-700 active:scale-95 transition disabled:opacity-60"
                            >
                                {isSearching ? (
                                    <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <span>Search</span>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Instant Suggestions Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 z-50">
                            <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                Matching Suggestions
                            </p>
                            <div className="space-y-1">
                                {suggestions.map((sug, idx) => (
                                    <div
                                        key={sug.id || idx}
                                        onClick={() => {
                                            onSelectSuggestion(sug);
                                            setShowSuggestions(false);
                                        }}
                                        className="flex items-center justify-between rounded-xl px-3 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-800/80 transition"
                                    >
                                        <div className="flex items-center gap-2.5 truncate">
                                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400 flex-shrink-0">
                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                </svg>
                                            </div>
                                            <div className="truncate">
                                                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                                    {sug.name}
                                                </p>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                                    {sug.address || `${sug.latitude}, ${sug.longitude}`}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 pl-2">
                                            Select →
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Category Carousel Chips & View Switcher */}
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200/60 pb-4 dark:border-slate-800/60">
                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
                        {['all', ...categories].map((cat) => {
                            const isSelected = activeCategory.toLowerCase() === cat.toLowerCase();
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                                        isSelected
                                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700/80'
                                    }`}
                                >
                                    {categoryIcons[cat.toLowerCase()] || categoryIcons.all}
                                    <span className="capitalize">{cat}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* View Controls & Result Count */}
                    <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            Showing <strong className="text-slate-900 dark:text-white font-semibold">{totalResults}</strong> venues
                        </span>

                        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700/60">
                            <button
                                onClick={() => setViewMode('grid')}
                                title="Grid View"
                                className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
                                    viewMode === 'grid'
                                        ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400'
                                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                                }`}
                            >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                            </button>

                            <button
                                onClick={() => setViewMode('split')}
                                title="Split Map View"
                                className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
                                    viewMode === 'split'
                                        ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400'
                                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                                }`}
                            >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                </svg>
                            </button>

                            <button
                                onClick={() => setViewMode('list')}
                                title="Compact List View"
                                className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
                                    viewMode === 'list'
                                        ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400'
                                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                                }`}
                            >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
