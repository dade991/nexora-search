import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { LocationItem } from '@/types';
import type { SearchLayout } from '@/types/auth';

type ResultsView = 'grid' | 'split' | 'list';

interface LocationSearchProps {
    layout: SearchLayout;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    activeCategory: string;
    setActiveCategory: (category: string) => void;
    categories: string[];
    radiusKm: number;
    setRadiusKm: (radius: number) => void;
    viewMode: ResultsView;
    setViewMode: (mode: ResultsView) => void;
    suggestions: LocationItem[];
    onSelectSuggestion: (item: LocationItem) => void;
    onSearchSubmit: (event: React.FormEvent) => void;
    isSearching: boolean;
    totalResults: number;
    onNearMe: () => void;
}

const radiusOptions = [
    { label: '5 km', value: 5 },
    { label: '10 km', value: 10 },
    { label: '25 km', value: 25 },
    { label: '50 km', value: 50 },
    { label: 'Anywhere', value: 50000 },
];

const layoutClasses: Record<SearchLayout, string> = {
    compact: 'relative z-30 mx-auto w-full max-w-7xl px-5 pt-6 sm:px-8',
    floating:
        'relative z-30 mx-auto -mb-10 w-full max-w-6xl px-4 pt-4 sm:-mb-12 sm:px-8',
    hero: 'relative z-30 mx-auto w-full max-w-7xl px-5 py-9 sm:px-8 sm:py-12',
};

export function LocationSearch({
    layout,
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
}: LocationSearchProps) {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const searchRoot = useRef<HTMLDivElement>(null);
    const mobileFilterButton = useRef<HTMLButtonElement>(null);

    const closeMobileFilters = useCallback(() => {
        setShowMobileFilters(false);
        window.requestAnimationFrame(() => mobileFilterButton.current?.focus());
    }, []);

    useEffect(() => {
        const closeOnOutsideClick = (event: MouseEvent) => {
            if (!searchRoot.current?.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && showMobileFilters) {
                setShowSuggestions(false);
                closeMobileFilters();
            }
        };

        document.addEventListener('mousedown', closeOnOutsideClick);
        document.addEventListener('keydown', closeOnEscape);

        return () => {
            document.removeEventListener('mousedown', closeOnOutsideClick);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [closeMobileFilters, showMobileFilters]);

    const filters = (
        <SearchFilters
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            categories={categories}
            radiusKm={radiusKm}
            setRadiusKm={setRadiusKm}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onNearMe={onNearMe}
            totalResults={totalResults}
        />
    );

    return (
        <section className={layoutClasses[layout]} aria-label="Location search">
            {layout === 'hero' && (
                <div className="mx-auto mb-7 max-w-3xl text-center sm:mb-9">
                    <h1 className="text-3xl font-semibold tracking-[-0.045em] text-[var(--nx-text)] sm:text-5xl">
                        Where do you want to explore?
                    </h1>
                    <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[var(--nx-text-muted)] sm:text-base">
                        Search a city, address, landmark, or venue. Nexora keeps
                        the results and map in sync.
                    </p>
                </div>
            )}

            <div
                ref={searchRoot}
                className={`theme-surface theme-border relative border shadow-[0_16px_48px_rgba(16,32,30,0.12)] ${
                    layout === 'floating'
                        ? 'rounded-[24px] bg-[color:var(--nx-surface)]/96 p-3 backdrop-blur-xl sm:p-4'
                        : layout === 'hero'
                          ? 'rounded-[28px] p-3 sm:p-5'
                          : 'rounded-[22px] p-3 sm:p-4'
                }`}
            >
                {layout === 'compact' && (
                    <div className="mb-3 hidden items-center justify-between gap-4 px-1 sm:flex">
                        <p className="text-sm font-semibold text-[var(--nx-text)]">
                            Find a place
                        </p>
                        <p className="text-xs text-[var(--nx-text-muted)]">
                            {totalResults} results on this view
                        </p>
                    </div>
                )}

                <form
                    onSubmit={onSearchSubmit}
                    className="flex items-center gap-2"
                >
                    <div className="relative flex min-w-0 flex-1 items-center rounded-2xl border border-[var(--nx-border)] bg-[var(--nx-page)] px-3 transition focus-within:border-[var(--nx-brand)] focus-within:ring-4 focus-within:ring-[color:var(--nx-brand)]/15 sm:px-4">
                        <SearchIcon />
                        <label htmlFor="location-search" className="sr-only">
                            Search locations
                        </label>
                        <input
                            id="location-search"
                            name="location_search"
                            type="search"
                            autoComplete="off"
                            value={searchQuery}
                            onChange={(event) => {
                                setSearchQuery(event.target.value);
                                setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            placeholder="City, address, landmark, or venue"
                            className="min-w-0 flex-1 border-0 bg-transparent px-3 py-3.5 text-sm font-medium text-[var(--nx-text)] outline-none placeholder:text-[var(--nx-text-muted)] sm:text-base"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('');
                                    setShowSuggestions(false);
                                }}
                                aria-label="Clear search"
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--nx-text-muted)] hover:bg-[var(--nx-surface-elevated)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nx-brand)]"
                            >
                                <CloseIcon />
                            </button>
                        )}
                    </div>

                    <button
                        ref={mobileFilterButton}
                        type="button"
                        onClick={() => setShowMobileFilters(true)}
                        aria-label="Open search filters"
                        className="theme-elevated theme-border flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border sm:hidden"
                    >
                        <FilterIcon />
                    </button>
                    <button
                        type="submit"
                        disabled={isSearching || !searchQuery.trim()}
                        className="theme-brand flex h-12 shrink-0 items-center justify-center rounded-2xl px-4 text-sm font-semibold shadow-sm transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nx-brand)] disabled:cursor-not-allowed disabled:opacity-50 sm:px-6"
                    >
                        {isSearching ? (
                            <Spinner />
                        ) : (
                            <>
                                <span className="hidden sm:inline">
                                    Search places
                                </span>
                                <span className="sm:hidden">Go</span>
                            </>
                        )}
                    </button>
                </form>

                {showSuggestions && suggestions.length > 0 && (
                    <div
                        className="theme-surface theme-border absolute right-3 left-3 z-50 mt-2 overflow-hidden rounded-2xl border p-1.5 shadow-2xl sm:right-4 sm:left-4"
                        role="listbox"
                        aria-label="Location suggestions"
                    >
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={suggestion.id ?? index}
                                type="button"
                                role="option"
                                onClick={() => {
                                    onSelectSuggestion(suggestion);
                                    setShowSuggestions(false);
                                }}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-[var(--nx-surface-elevated)] focus-visible:outline-2 focus-visible:outline-[var(--nx-brand)]"
                            >
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--nx-brand)]/12 text-[var(--nx-brand)]">
                                    <PinIcon />
                                </span>
                                <span className="min-w-0">
                                    <span className="block truncate text-sm font-semibold text-[var(--nx-text)]">
                                        {suggestion.name}
                                    </span>
                                    <span className="block truncate text-xs text-[var(--nx-text-muted)]">
                                        {suggestion.address ??
                                            'View this place'}
                                    </span>
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                <div className="mt-4 hidden border-t border-[var(--nx-border)] pt-4 sm:block">
                    {filters}
                </div>
            </div>

            {showMobileFilters && (
                <div
                    className="fixed inset-0 z-[100] flex items-end bg-black/45 p-3 sm:hidden"
                    role="presentation"
                    onMouseDown={closeMobileFilters}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="mobile-search-filters-title"
                        onMouseDown={(event) => event.stopPropagation()}
                        className="theme-surface theme-border max-h-[82vh] w-full overflow-y-auto rounded-[26px] border p-5 shadow-2xl"
                    >
                        <div className="mb-5 flex items-center justify-between">
                            <h2
                                id="mobile-search-filters-title"
                                className="text-lg font-semibold"
                            >
                                Search filters
                            </h2>
                            <button
                                autoFocus
                                type="button"
                                onClick={closeMobileFilters}
                                aria-label="Close search filters"
                                className="theme-elevated flex h-9 w-9 items-center justify-center rounded-full"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        {filters}
                        <button
                            type="button"
                            onClick={closeMobileFilters}
                            className="theme-brand mt-6 w-full rounded-2xl px-4 py-3 text-sm font-semibold"
                        >
                            Apply filters
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}

function SearchFilters({
    activeCategory,
    setActiveCategory,
    categories,
    radiusKm,
    setRadiusKm,
    viewMode,
    setViewMode,
    onNearMe,
    totalResults,
}: {
    activeCategory: string;
    setActiveCategory: (category: string) => void;
    categories: string[];
    radiusKm: number;
    setRadiusKm: (radius: number) => void;
    viewMode: ResultsView;
    setViewMode: (mode: ResultsView) => void;
    onNearMe: () => void;
    totalResults: number;
}) {
    return (
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="min-w-0">
                <p className="mb-2 text-xs font-semibold text-[var(--nx-text-muted)] sm:hidden">
                    Category
                </p>
                <div className="flex scrollbar-none gap-2 overflow-x-auto pb-1">
                    {[
                        'all',
                        ...categories.filter((category) => category !== 'all'),
                    ].map((category) => (
                        <button
                            key={category}
                            type="button"
                            onClick={() => setActiveCategory(category)}
                            aria-pressed={activeCategory === category}
                            className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nx-brand)] ${activeCategory === category ? 'theme-brand' : 'theme-elevated text-[var(--nx-text-muted)] hover:text-[var(--nx-text)]'}`}
                        >
                            {category === 'all'
                                ? 'All places'
                                : category.charAt(0).toUpperCase() +
                                  category.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid shrink-0 grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-2">
                <label className="text-xs font-semibold text-[var(--nx-text-muted)]">
                    <span className="mb-1.5 block sm:sr-only">Radius</span>
                    <select
                        id="search-radius"
                        name="search_radius"
                        value={radiusKm}
                        onChange={(event) =>
                            setRadiusKm(Number(event.target.value))
                        }
                        className="theme-elevated theme-border h-10 w-full rounded-xl border px-3 text-xs font-semibold outline-none focus:border-[var(--nx-brand)] sm:w-auto"
                    >
                        {radiusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>
                <button
                    type="button"
                    onClick={onNearMe}
                    className="theme-elevated theme-border mt-[22px] flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-semibold text-[var(--nx-text)] hover:border-[var(--nx-brand)] sm:mt-0"
                    title="Search near my location"
                >
                    <LocateIcon /> Near me
                </button>
                <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1">
                    <span className="text-xs text-[var(--nx-text-muted)] sm:hidden">
                        {totalResults} results
                    </span>
                    <div
                        className="theme-elevated flex rounded-xl p-1"
                        aria-label="Results view"
                    >
                        {(['split', 'grid', 'list'] as ResultsView[]).map(
                            (mode) => (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => setViewMode(mode)}
                                    aria-label={`${mode} results view`}
                                    aria-pressed={viewMode === mode}
                                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold capitalize ${viewMode === mode ? 'bg-[var(--nx-surface)] text-[var(--nx-brand)] shadow-sm' : 'text-[var(--nx-text-muted)]'}`}
                                >
                                    {mode}
                                </button>
                            ),
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

const SearchIcon = () => (
    <svg
        className="h-5 w-5 shrink-0 text-[var(--nx-text-muted)]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
    >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
    </svg>
);
const CloseIcon = () => (
    <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
    >
        <path d="m6 6 12 12M18 6 6 18" />
    </svg>
);
const FilterIcon = () => (
    <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
    >
        <path d="M4 7h16M7 12h10M10 17h4" />
    </svg>
);
const PinIcon = () => (
    <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
    >
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
    </svg>
);
const LocateIcon = () => (
    <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
    >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
);
const Spinner = () => (
    <svg
        className="h-5 w-5 animate-spin"
        viewBox="0 0 24 24"
        fill="none"
        aria-label="Searching"
    >
        <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="3"
        />
        <path
            className="opacity-80"
            d="M21 12a9 9 0 0 0-9-9"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
        />
    </svg>
);
