import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Head } from '@inertiajs/react';
import { LocationItem, SearchHistoryItem } from '@/types';
import { api, getStoredUser, setStoredUser, setAuthToken } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { LocationSearch } from '@/components/LocationSearch';
import { PlaceCard } from '@/components/PlaceCard';
import { InteractiveMap } from '@/components/InteractiveMap';
import { PlaceDetailModal } from '@/components/PlaceDetailModal';
import { FeatureErrorBoundary } from '@/components/FeatureErrorBoundary';
import { applyTheme, readLocalTheme, storeLocalTheme } from '@/lib/themes';
import type { SearchLayout, ThemePreference, User } from '@/types/auth';
import { SavedPlacesDrawer } from '@/components/SavedPlacesDrawer';
import { SearchHistoryDrawer } from '@/components/SearchHistoryDrawer';
import { AuthModal } from '@/components/AuthModal';
import { OnboardingModal } from '@/components/OnboardingModal';

interface DashboardProps {
    initialLocations?: LocationItem[];
    categories?: string[];
    stats?: {
        total_locations: number;
        total_categories: number;
        total_requests: number;
    };
}

export default function Dashboard({
    initialLocations = [],
    categories = [],
}: DashboardProps) {
    // Use server-provided locations directly (no mock fallback)
    const baseLocations: LocationItem[] = initialLocations;
    const initialSearchQuery =
        typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('search') || ''
            : '';

    useEffect(() => {
        if (
            typeof window !== 'undefined' &&
            !localStorage.getItem('nexora_token')
        ) {
            window.location.assign('/login');
        }
    }, []);

    // UI & Navigation State
    const [darkMode, setDarkMode] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'split' | 'list'>(
        'split',
    );
    const [searchLayout] = useState<SearchLayout>(
        () => getStoredUser()?.preferences?.search?.layout ?? 'compact',
    );

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
    const [activeCategory, setActiveCategory] = useState('all');
    const [radiusKm, setRadiusKm] = useState(10);
    const [isSearching, setIsSearching] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    const [searchError, setSearchError] = useState<string | null>(null);
    const [searchNotice, setSearchNotice] = useState<string | null>(null);
    const [resultQuery, setResultQuery] = useState('');
    const [resultProvider, setResultProvider] = useState('');
    const [searchCoordinates, setSearchCoordinates] = useState<{
        latitude: number;
        longitude: number;
    } | null>(() => {
        const storedUser = getStoredUser();
        const latitude = Number(storedUser?.latitude);
        const longitude = Number(storedUser?.longitude);

        return Number.isFinite(latitude) && Number.isFinite(longitude)
            ? { latitude, longitude }
            : null;
    });
    const searchSequence = useRef(0);
    const initialSearchStarted = useRef(false);
    const savingPlaces = useRef(new Set<string | number>());

    // Locations & Selections
    const [displayedLocations, setDisplayedLocations] = useState<
        LocationItem[]
    >([]);
    const [selectedPlace, setSelectedPlace] = useState<LocationItem | null>(
        null,
    );
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // Modal & Drawer Visibility
    const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false);
    const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

    // User & Collections State
    const [user, setUser] = useState<User | null>(null);
    const [savedPlaces, setSavedPlaces] = useState<LocationItem[]>([]);
    const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

    // AI Assistant State
    const [aiAssistantInput, setAiAssistantInput] = useState('');
    const [aiChatMessages, setAiChatMessages] = useState<
        Array<{ role: 'user' | 'assistant'; content: string }>
    >([]);
    const [isAiAssistantLoading, setIsAiAssistantLoading] = useState(false);
    const [aiAssistantError, setAiAssistantError] = useState<string | null>(
        null,
    );
    const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);

    // Initialize Theme, User, Saved Places & History
    useEffect(() => {
        // Auth
        const stored = getStoredUser();
        const theme = stored?.preferences?.theme ?? readLocalTheme();
        applyTheme(theme);
        setDarkMode(document.documentElement.classList.contains('dark'));
        if (stored) {
            setUser(stored);
            setIsOnboardingOpen(!stored.preferences?.onboarding_completed);
            setViewMode(stored.preferences?.search?.view ?? 'split');
            setRadiusKm(
                Math.min(
                    (stored.preferences?.search?.radius ?? 10000) / 1000,
                    50,
                ),
            );
        }

        if (localStorage.getItem('nexora_token')) {
            api.favorites()
                .then((res) =>
                    setSavedPlaces(
                        res.data.map(
                            (item: { location: LocationItem }) => item.location,
                        ),
                    ),
                )
                .catch(() =>
                    setSearchError(
                        'Your saved places could not be loaded. Please sign in again or retry.',
                    ),
                );
            api.history()
                .then((res) => setSearchHistory(res.data))
                .catch(() =>
                    setSearchError('Your search history could not be loaded.'),
                );
        }
    }, []);

    const handleThemeToggle = (enabled: boolean): void => {
        const theme: ThemePreference = { preset: enabled ? 'dark' : 'light' };
        applyTheme(theme);
        storeLocalTheme(theme);
        setDarkMode(enabled);
        if (user) {
            const updatedUser: User = {
                ...user,
                preferences: { ...user.preferences, theme },
            };
            setUser(updatedUser);
            setStoredUser(updatedUser);
            void api.updateProfile({ preferences: { theme } }).catch(() => {});
        }
    };

    // Keyboard Shortcuts (Cmd+K / Ctrl+K, Esc)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.querySelector(
                    'input[type="text"]',
                ) as HTMLInputElement;
                if (searchInput) searchInput.focus();
            }
            if (e.key === 'Escape') {
                setIsDetailOpen(false);
                setIsSavedDrawerOpen(false);
                setIsHistoryDrawerOpen(false);
                setIsAuthModalOpen(false);
                setIsAiAssistantOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Suggestions only use the stored catalogue; stale requests cannot replace newer suggestions.
    useEffect(() => {
        let current = true;
        setSuggestions([]);
        if (searchQuery.trim().length < 2) return;
        const timer = setTimeout(() => {
            api.suggestions(searchQuery)
                .then((res) => {
                    if (current) setSuggestions(res.suggestions);
                })
                .catch(() => {});
        }, 250);
        return () => {
            current = false;
            clearTimeout(timer);
        };
    }, [searchQuery]);

    const runSearch = async (
        query: string,
        coordinates = searchCoordinates,
        nearby = false,
    ) => {
        if (!query.trim()) return;
        const sequence = ++searchSequence.current;
        setHasSearched(true);
        setIsSearching(true);
        setSearchError(null);
        setSearchNotice(null);
        setSelectedPlace(null);
        setIsDetailOpen(false);
        setSuggestions([]);
        setAiChatMessages([]);
        try {
            let center = coordinates;
            if (radiusKm < 1000 && !center) {
                if (!navigator.geolocation)
                    throw new Error(
                        'Location is unavailable in this browser. Choose Global or use another browser.',
                    );
                const position = await new Promise<GeolocationPosition>(
                    (resolve, reject) =>
                        navigator.geolocation.getCurrentPosition(
                            resolve,
                            (error) => {
                                const message =
                                    error.code === error.PERMISSION_DENIED
                                        ? 'Allow location access to search nearby, or choose Global search.'
                                        : error.code === error.TIMEOUT
                                          ? 'Getting your location took too long. Try again or choose Global search.'
                                          : 'Your location could not be determined. Try again or choose Global search.';
                                reject(new Error(message));
                            },
                            { timeout: 15000, maximumAge: 60000 },
                        ),
                );
                center = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                };
                setSearchCoordinates(center);
            }
            const res = await api.search(query.trim(), {
                category: activeCategory !== 'all' ? activeCategory : undefined,
                ...((nearby || radiusKm < 1000) && center ? center : {}),
                radius:
                    radiusKm < 1000
                        ? Math.min(radiusKm * 1000, 50000)
                        : undefined,
            });
            if (sequence !== searchSequence.current) return;
            if (res.results.length > 0 || displayedLocations.length === 0) {
                setDisplayedLocations(res.results);
                setResultQuery(query.trim());
            }
            setResultProvider(res.provider);
            setSearchNotice(
                res.status === 'degraded' || res.status === 'cached'
                    ? res.results.length === 0 && displayedLocations.length > 0
                        ? `${res.message ?? 'Live search is unavailable.'} Keeping your previous results visible.`
                        : res.message
                    : null,
            );
            api.history()
                .then((history) => setSearchHistory(history.data))
                .catch(() =>
                    setSearchError(
                        'Search completed, but history could not be refreshed.',
                    ),
                );
        } catch (error) {
            if (sequence !== searchSequence.current) return;
            setSearchError(
                error instanceof Error
                    ? error.message
                    : 'Search could not complete. Check location permission and try again.',
            );
        } finally {
            if (sequence === searchSequence.current) setIsSearching(false);
        }
    };

    useEffect(() => {
        if (
            initialSearchQuery &&
            !initialSearchStarted.current &&
            localStorage.getItem('nexora_token')
        ) {
            initialSearchStarted.current = true;
            void runSearch(initialSearchQuery);
        }
    }, [initialSearchQuery]);

    const handleSearchSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        void runSearch(searchQuery);
    };

    const handleNearMe = () => {
        if (!navigator.geolocation) {
            setSearchError('Location is unavailable in this browser.');
            return;
        }
        setIsSearching(true);
        setSearchError(null);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const center = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                };
                setSearchCoordinates(center);
                const query =
                    searchQuery.trim() ||
                    (activeCategory === 'all' ? 'places' : activeCategory);
                setSearchQuery(query);
                void runSearch(query, center, true);
            },
            () => {
                setIsSearching(false);
                setSearchError(
                    'Allow location access to find nearby places, or search by city name.',
                );
            },
            { timeout: 10000, maximumAge: 60000 },
        );
    };

    const handleToggleSave = async (place: LocationItem) => {
        if (savingPlaces.current.has(place.id)) return;
        savingPlaces.current.add(place.id);
        try {
            if (savedPlaces.some((item) => item.id === place.id)) {
                await api.removeFavorite(place.id);
                setSavedPlaces((items) =>
                    items.filter((item) => item.id !== place.id),
                );
            } else {
                await api.addFavorite(place.id);
                setSavedPlaces((items) => [place, ...items]);
            }
        } catch (error) {
            setSearchError(
                error instanceof Error
                    ? error.message
                    : 'Your saved places could not be updated.',
            );
        } finally {
            savingPlaces.current.delete(place.id);
        }
    };

    // Open Place Details
    const handleSelectPlace = (place: LocationItem) => {
        setSelectedPlace(place);
        setIsDetailOpen(true);
    };

    // Distinct Categories Available
    const allCategories = useMemo(() => {
        const set = new Set<string>();
        baseLocations.forEach((l) => {
            if (l.category) set.add(l.category.toLowerCase());
        });
        if (categories && categories.length > 0) {
            categories.forEach((c) => set.add(c.toLowerCase()));
        }
        return Array.from(set);
    }, [baseLocations, categories]);

    const handleAskNexora = async () => {
        const question = aiAssistantInput.trim();
        if (!question) {
            return;
        }

        const resultContext =
            displayedLocations
                .slice(0, 5)
                .map((place) => {
                    const rating = place.rating
                        ? `, rating ${place.rating}`
                        : '';
                    return `${place.name} (${place.category}${rating})`;
                })
                .join('; ') || 'No current results yet.';

        const preferences =
            user?.preferences?.ai?.use_preferences !== false &&
            user?.preferences?.likes?.length
                ? user.preferences.likes.join(', ')
                : 'No saved preferences yet.';

        const context = `Optional Nexora context — search query: "${searchQuery || 'none'}"; saved preference hints: ${preferences}; current result set: ${resultContext}. These are optional context. Do not treat preferences as filters and do not invent facts.`;

        const userMessage = { role: 'user' as const, content: question };

        setAiChatMessages((current) => [...current, userMessage]);
        setAiAssistantInput('');
        setAiAssistantError(null);

        setIsAiAssistantLoading(true);

        try {
            const response = await api.aiChat([
                { role: 'system', content: context },
                ...aiChatMessages.map((message) => ({
                    role: message.role,
                    content: message.content,
                })),
                { role: 'user', content: question },
            ]);

            const assistantMessage =
                response?.message?.content || 'No answer returned.';
            setAiChatMessages((current) => [
                ...current,
                { role: 'assistant', content: assistantMessage },
            ]);
        } catch (error: any) {
            setAiAssistantError(
                error?.message ||
                    'Nexora could not reach the AI service right now.',
            );
        } finally {
            setIsAiAssistantLoading(false);
        }
    };

    return (
        <div className="theme-page flex min-h-screen flex-col transition-colors selection:bg-[var(--nx-accent)] selection:text-[var(--nx-on-accent)]">
            <Head title="Dashboard — Nexora Search" />

            {/* Top Navigation */}
            <Navbar
                darkMode={darkMode}
                setDarkMode={handleThemeToggle}
                savedCount={savedPlaces.length}
                onOpenSaved={() => setIsSavedDrawerOpen(true)}
                onOpenHistory={() => setIsHistoryDrawerOpen(true)}
                user={user}
                onOpenAuth={() => setIsAuthModalOpen(true)}
                onLogout={() => {
                    api.logout().catch(() => {});
                    setAuthToken(null);
                    setStoredUser(null);
                    setUser(null);
                    window.location.assign('/login');
                }}
            />

            <LocationSearch
                layout={searchLayout}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                categories={allCategories}
                radiusKm={radiusKm}
                setRadiusKm={setRadiusKm}
                viewMode={viewMode}
                setViewMode={setViewMode}
                suggestions={suggestions}
                onSelectSuggestion={(item) => {
                    setSearchQuery(item.name);
                    void runSearch(item.name);
                }}
                onSearchSubmit={handleSearchSubmit}
                isSearching={isSearching}
                totalResults={displayedLocations.length}
                onNearMe={handleNearMe}
            />

            {/* Main Content Explorer Area */}
            <main className="relative mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:px-8 lg:py-14">
                {searchError && (
                    <p
                        role="alert"
                        className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
                    >
                        {searchError}
                    </p>
                )}
                {searchNotice && (
                    <p
                        role="status"
                        className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
                    >
                        {searchNotice}
                    </p>
                )}
                {isSearching && (
                    <p role="status" className="mb-6 text-sm text-[#087f6b]">
                        Searching places…
                    </p>
                )}
                {hasSearched &&
                    !isSearching &&
                    !searchError &&
                    resultProvider !== 'unavailable' &&
                    displayedLocations.length === 0 && (
                        <p
                            role="status"
                            className="mb-6 rounded-2xl border border-[#10201e]/10 p-6"
                        >
                            No places found. Try another city, category, or a
                            wider radius.
                        </p>
                    )}
                {!hasSearched ? (
                    <div className="grid gap-6 py-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-stretch">
                        <div className="rounded-[30px] border border-[#10201e]/10 bg-white/75 p-8 shadow-[0_20px_60px_rgba(16,32,30,0.07)] backdrop-blur-sm dark:border-white/10 dark:bg-[#101a18]/75">
                            <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[#10201e] dark:text-white">
                                Your next search starts here
                            </h3>
                            <p className="mt-3 mb-6 text-sm leading-6 text-[#687873] dark:text-[#a8b9b4]">
                                Search for a place or use your location when you
                                want nearby results. Nexora will only show
                                places returned by the connected services.
                            </p>
                            <button
                                type="button"
                                onClick={handleNearMe}
                                disabled={isSearching}
                                className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#10201e] px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 disabled:opacity-60 dark:bg-[#e8c36a] dark:text-[#10201e]"
                            >
                                <span aria-hidden="true">⌖</span>
                                Show places within{' '}
                                {radiusKm >= 1000 ? 10 : radiusKm} km
                            </button>
                            <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-[#52615e] dark:text-[#b7c7c1]">
                                <span className="rounded-full bg-[#e7f6f2] px-3 py-2 text-[#087f6b] dark:bg-[#123b37] dark:text-[#7ee2ce]">
                                    Live search
                                </span>
                                <span className="rounded-full bg-[#fff1df] px-3 py-2 text-[#b96112] dark:bg-[#3c2918] dark:text-[#ffc27c]">
                                    Nearby places
                                </span>
                                <span className="rounded-full bg-[#e9effc] px-3 py-2 text-[#315db5] dark:bg-[#1b2d51] dark:text-[#9fbcff]">
                                    Saved results
                                </span>
                            </div>
                        </div>
                        <div className="min-h-[460px]">
                            <InteractiveMap
                                places={baseLocations}
                                selectedPlace={null}
                                onSelectPlace={handleSelectPlace}
                            />
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="mb-6 flex items-center justify-between border-b border-slate-200/80 pb-3 dark:border-slate-800/80">
                            <div>
                                <p className="text-xs font-bold tracking-[0.22em] text-[#087f6b] uppercase">
                                    Explore results
                                </p>
                                <h3 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[#10201e] dark:text-white">
                                    Search Results{' '}
                                    {resultQuery ? `for "${resultQuery}"` : ''}
                                </h3>
                                <p className="mt-2 text-sm text-[#687873] dark:text-[#a8b9b4]">
                                    {isSearching
                                        ? 'Searching…'
                                        : resultProvider === 'unavailable'
                                          ? 'Live search unavailable'
                                          : `${displayedLocations.length} places found`}{' '}
                                    {resultProvider === 'searchapi_google_maps'
                                        ? '· SearchApi Google Maps results'
                                        : resultProvider === 'openstreetmap'
                                          ? '· OpenStreetMap'
                                          : resultProvider === 'database'
                                            ? '· Saved locations'
                                            : ''}
                                </p>
                            </div>
                            <button
                                onClick={() => setHasSearched(false)}
                                className="rounded-full border border-[#10201e]/15 px-4 py-2 text-xs font-semibold text-[#52615e] transition hover:border-[#087f6b] hover:text-[#087f6b] dark:border-white/15 dark:text-[#b7c7c1]"
                            >
                                Back to search
                            </button>
                        </div>

                        {viewMode === 'split' ? (
                            /* SPLIT VIEW: Map on Left / Cards on Right */
                            <div className="grid h-[750px] grid-cols-1 gap-6 lg:grid-cols-12">
                                <div className="h-full lg:col-span-7">
                                    <InteractiveMap
                                        places={displayedLocations}
                                        selectedPlace={selectedPlace}
                                        onSelectPlace={handleSelectPlace}
                                    />
                                </div>
                                <div className="h-full scrollbar-thin space-y-4 overflow-y-auto pr-1 lg:col-span-5">
                                    {displayedLocations.map((place) => (
                                        <PlaceCard
                                            key={place.id}
                                            place={place}
                                            isSaved={savedPlaces.some(
                                                (p) => p.id === place.id,
                                            )}
                                            onToggleSave={handleToggleSave}
                                            onSelect={handleSelectPlace}
                                            viewMode="list"
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : viewMode === 'list' ? (
                            /* COMPACT LIST VIEW */
                            <div className="mx-auto max-w-4xl space-y-3">
                                {displayedLocations.map((place) => (
                                    <PlaceCard
                                        key={place.id}
                                        place={place}
                                        isSaved={savedPlaces.some(
                                            (p) => p.id === place.id,
                                        )}
                                        onToggleSave={handleToggleSave}
                                        onSelect={handleSelectPlace}
                                        viewMode="list"
                                    />
                                ))}
                            </div>
                        ) : (
                            /* CARDS GRID VIEW */
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {displayedLocations.map((place) => (
                                    <PlaceCard
                                        key={place.id}
                                        place={place}
                                        isSaved={savedPlaces.some(
                                            (p) => p.id === place.id,
                                        )}
                                        onToggleSave={handleToggleSave}
                                        onSelect={handleSelectPlace}
                                        viewMode="grid"
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

            <section className="border-t border-[#10201e]/10 bg-white py-16 dark:border-white/10 dark:bg-[#101a18]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-8 max-w-xl">
                        <p className="text-xs font-bold tracking-[0.22em] text-[#087f6b] uppercase">
                            A calmer way to explore
                        </p>
                        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em]">
                            The tools stay close to the decision.
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e7f6f2] text-[#087f6b] dark:bg-[#123b37] dark:text-[#7ee2ce]">
                                <svg
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 002 2v2M7 7h10"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-[#10201e] dark:text-white">
                                    Search with live data
                                </h4>
                                <p className="mt-1 text-xs leading-relaxed text-[#687873] dark:text-[#a8b9b4]">
                                    Search results come from the connected
                                    location services and stored catalogue.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fff1df] text-[#b96112] dark:bg-[#3c2918] dark:text-[#ffc27c]">
                                <svg
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-[#10201e] dark:text-white">
                                    Map the result
                                </h4>
                                <p className="mt-1 text-xs leading-relaxed text-[#687873] dark:text-[#a8b9b4]">
                                    Open the real coordinates returned for a
                                    place and inspect nearby results.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e9effc] text-[#315db5] dark:bg-[#1b2d51] dark:text-[#9fbcff]">
                                <svg
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-[#10201e] dark:text-white">
                                    Keep a shortlist
                                </h4>
                                <p className="mt-1 text-xs leading-relaxed text-[#687873] dark:text-[#a8b9b4]">
                                    Save actual results and revisit searches
                                    when you are signed in.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="border-t border-white/10 bg-[#10201e] py-8 text-[#b7c7c1]">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e8c36a] text-xs font-bold text-[#10201e]">
                            N
                        </div>
                        <span className="text-xs font-bold text-white">
                            Nexora Search
                        </span>
                        <span className="text-[11px] text-[#8fa19b]">
                            Location search, organized for the way you work.
                        </span>
                    </div>

                    <span className="text-xs text-[#8fa19b]">
                        SearchApi · MapLibre · OpenStreetMap
                    </span>
                </div>
            </footer>

            <div className="fixed right-5 bottom-5 z-50 flex flex-col items-end gap-3 sm:right-7 sm:bottom-7">
                {isAiAssistantOpen && (
                    <section
                        aria-label="Nexora AI assistant"
                        className="flex h-[min(560px,calc(100vh-7rem))] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[26px] border border-[#10201e]/10 bg-white shadow-[0_24px_80px_rgba(16,32,30,0.24)] dark:border-white/10 dark:bg-[#101a18]"
                    >
                        <header className="flex items-center justify-between border-b border-[#10201e]/10 px-5 py-4 dark:border-white/10">
                            <div>
                                <p className="text-[10px] font-bold tracking-[0.2em] text-[#087f6b] uppercase">
                                    Nexora AI
                                </p>
                                <h2 className="mt-1 text-base font-semibold text-[#10201e] dark:text-white">
                                    Ask about your places
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAiAssistantOpen(false)}
                                aria-label="Close Nexora AI"
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#10201e]/10 text-lg text-[#52615e] transition hover:bg-[#f0f3ef] dark:border-white/10 dark:text-[#b7c7c1] dark:hover:bg-white/10"
                            >
                                ×
                            </button>
                        </header>

                        <div className="flex-1 space-y-3 overflow-y-auto bg-[#f7f8f5] p-4 dark:bg-[#0b1111]">
                            {aiChatMessages.length === 0 && (
                                <div className="rounded-2xl border border-[#10201e]/10 bg-white p-4 text-sm leading-6 text-[#687873] dark:border-white/10 dark:bg-[#101a18] dark:text-[#a8b9b4]">
                                    Ask for recommendations, comparisons,
                                    routes, or the best nearby option. Answers
                                    use your current results and saved
                                    preferences.
                                </div>
                            )}
                            {aiChatMessages.map((message, index) => {
                                const isUser = message.role === 'user';

                                return (
                                    <div
                                        key={`${message.role}-${index}`}
                                        className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${isUser ? 'bg-[#10201e] text-white dark:bg-[#e8c36a] dark:text-[#10201e]' : 'border border-[#10201e]/10 bg-white text-[#10201e] dark:border-white/10 dark:bg-[#123b37] dark:text-[#edf5f1]'}`}
                                        >
                                            <p className="whitespace-pre-line">
                                                {message.content}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            {isAiAssistantLoading && (
                                <p
                                    role="status"
                                    className="text-xs font-semibold text-[#087f6b]"
                                >
                                    Nexora is thinking…
                                </p>
                            )}
                            {aiAssistantError && (
                                <p
                                    role="alert"
                                    className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
                                >
                                    {aiAssistantError}
                                </p>
                            )}
                        </div>

                        <div className="border-t border-[#10201e]/10 p-3 dark:border-white/10">
                            <div className="flex items-end gap-2 rounded-2xl border border-[#10201e]/10 bg-[#f7f8f5] p-2 dark:border-white/10 dark:bg-[#0b1111]">
                                <textarea
                                    value={aiAssistantInput}
                                    onChange={(event) =>
                                        setAiAssistantInput(event.target.value)
                                    }
                                    onKeyDown={(event) => {
                                        if (
                                            event.key === 'Enter' &&
                                            !event.shiftKey
                                        ) {
                                            event.preventDefault();
                                            void handleAskNexora();
                                        }
                                    }}
                                    rows={2}
                                    placeholder="Ask Nexora…"
                                    className="min-h-11 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm text-[#10201e] outline-none dark:text-[#edf5f1]"
                                />
                                <button
                                    type="button"
                                    onClick={() => void handleAskNexora()}
                                    disabled={
                                        isAiAssistantLoading ||
                                        !aiAssistantInput.trim()
                                    }
                                    className="rounded-xl bg-[#087f6b] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    </section>
                )}

                <button
                    type="button"
                    onClick={() => setIsAiAssistantOpen((open) => !open)}
                    aria-label={
                        isAiAssistantOpen ? 'Close Nexora AI' : 'Open Nexora AI'
                    }
                    aria-expanded={isAiAssistantOpen}
                    className="flex h-15 items-center gap-2 rounded-full bg-[#10201e] px-5 text-sm font-bold text-white shadow-[0_14px_40px_rgba(16,32,30,0.28)] transition hover:-translate-y-0.5 dark:bg-[#e8c36a] dark:text-[#10201e]"
                >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/12 text-base dark:bg-[#10201e]/10">
                        N
                    </span>
                    Ask Nexora
                </button>
            </div>

            {/* Modals & Slide-Over Drawers */}
            <FeatureErrorBoundary
                featureName="Place details"
                onReset={() => {
                    setIsDetailOpen(false);
                    setSelectedPlace(null);
                }}
            >
                <PlaceDetailModal
                    place={selectedPlace}
                    isOpen={isDetailOpen}
                    onClose={() => setIsDetailOpen(false)}
                    isSaved={
                        selectedPlace
                            ? savedPlaces.some((p) => p.id === selectedPlace.id)
                            : false
                    }
                    onToggleSave={handleToggleSave}
                />
            </FeatureErrorBoundary>

            <SavedPlacesDrawer
                isOpen={isSavedDrawerOpen}
                onClose={() => setIsSavedDrawerOpen(false)}
                savedPlaces={savedPlaces}
                onSelectPlace={handleSelectPlace}
                onRemoveSaved={handleToggleSave}
            />

            <SearchHistoryDrawer
                isOpen={isHistoryDrawerOpen}
                onClose={() => setIsHistoryDrawerOpen(false)}
                history={searchHistory}
                onSelectQuery={(q) => {
                    setSearchQuery(q);
                    void runSearch(q);
                }}
                onClearHistory={() => {
                    api.clearHistory()
                        .then(() => setSearchHistory([]))
                        .catch(() =>
                            setSearchError(
                                'Search history could not be cleared. Please try again.',
                            ),
                        );
                }}
            />

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                onAuthSuccess={(u) => {
                    setUser(u);
                    setIsOnboardingOpen(!u.preferences?.onboarding_completed);
                }}
            />

            {user && isOnboardingOpen && (
                <OnboardingModal
                    user={user}
                    onComplete={(updatedUser) => {
                        setUser(updatedUser);
                        setStoredUser(updatedUser);
                        setIsOnboardingOpen(false);
                    }}
                />
            )}
        </div>
    );
}
