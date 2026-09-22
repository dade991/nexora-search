import React, { useState, useEffect, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import { LocationItem, SearchHistoryItem } from '@/types';
import { FALLBACK_LOCATIONS } from '@/lib/fallbackData';
import { api, getStoredUser, setStoredUser, setAuthToken } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { HeroSearch } from '@/components/HeroSearch';
import { PlaceCard } from '@/components/PlaceCard';
import { InteractiveMap } from '@/components/InteractiveMap';
import { PlaceDetailModal } from '@/components/PlaceDetailModal';
import { NexAiWidget } from '@/components/NexAiWidget';
import { AdminTelemetryModal } from '@/components/AdminTelemetryModal';
import { SavedPlacesDrawer } from '@/components/SavedPlacesDrawer';
import { SearchHistoryDrawer } from '@/components/SearchHistoryDrawer';
import { AuthModal } from '@/components/AuthModal';

interface WelcomeProps {
    initialLocations?: LocationItem[];
    categories?: string[];
    stats?: {
        total_locations: number;
        total_categories: number;
        total_requests: number;
    };
}

export default function Welcome({
    initialLocations = [],
    categories = [],
}: WelcomeProps) {
    // Merge server-provided locations with our rich global catalog
    const baseLocations: LocationItem[] = useMemo(() => {
        if (initialLocations && initialLocations.length > 0) {
            const serverIds = new Set(initialLocations.map((l) => l.name.toLowerCase()));
            const complementary = FALLBACK_LOCATIONS.filter((l) => !serverIds.has(l.name.toLowerCase()));
            return [...initialLocations, ...complementary];
        }
        return FALLBACK_LOCATIONS;
    }, [initialLocations]);

    // UI & Navigation State
    const [currentTab, setCurrentTab] = useState<'explore' | 'ai' | 'admin'>('explore');
    const [darkMode, setDarkMode] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'split' | 'list'>('grid');

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [radiusKm, setRadiusKm] = useState(50000); // default global
    const [isSearching, setIsSearching] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    // Locations & Selections
    const [displayedLocations, setDisplayedLocations] = useState<LocationItem[]>(baseLocations);
    const [selectedPlace, setSelectedPlace] = useState<LocationItem | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // Modal & Drawer Visibility
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false);
    const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    // User & Collections State
    const [user, setUser] = useState<any | null>(null);
    const [savedPlaces, setSavedPlaces] = useState<LocationItem[]>([]);
    const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

    // Initialize Theme, User, Saved Places & History
    useEffect(() => {
        // Theme
        const storedTheme = localStorage.getItem('nexora_theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const shouldBeDark = storedTheme ? storedTheme === 'dark' : prefersDark || true;
        setDarkMode(shouldBeDark);
        if (shouldBeDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        // Auth
        const stored = getStoredUser();
        if (stored) setUser(stored);

        // Saved Places
        try {
            const rawSaved = localStorage.getItem('nexora_saved_places');
            if (rawSaved) {
                setSavedPlaces(JSON.parse(rawSaved));
            } else {
                setSavedPlaces([baseLocations[0], baseLocations[1]]);
            }
        } catch {
            setSavedPlaces([baseLocations[0]]);
        }

        // History
        try {
            const rawHist = localStorage.getItem('nexora_search_history');
            if (rawHist) {
                setSearchHistory(JSON.parse(rawHist));
            } else {
                setSearchHistory([
                    { id: 1, query: 'Eiffel Tower Paris', created_at: new Date().toISOString() },
                    { id: 2, query: 'Central Park Manhattan', created_at: new Date().toISOString() },
                ]);
            }
        } catch {
            // silent
        }
    }, [baseLocations]);

    // Handle Theme Toggle
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('nexora_theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('nexora_theme', 'light');
        }
    }, [darkMode]);

    // Synchronize Top Tab Selection
    useEffect(() => {
        if (currentTab === 'ai') {
            setIsAiModalOpen(true);
        } else if (currentTab === 'admin') {
            setIsAdminModalOpen(true);
        }
    }, [currentTab]);

    // Keyboard Shortcuts (Cmd+K / Ctrl+K, Esc)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
                if (searchInput) searchInput.focus();
            }
            if (e.key === 'Escape') {
                setIsDetailOpen(false);
                setIsAiModalOpen(false);
                setIsAdminModalOpen(false);
                setIsSavedDrawerOpen(false);
                setIsHistoryDrawerOpen(false);
                setIsAuthModalOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Live Suggestions Fetch on Typing
    useEffect(() => {
        if (searchQuery.trim().length >= 2) {
            const timer = setTimeout(() => {
                api.suggestions(searchQuery)
                    .then((res) => setSuggestions(res.suggestions || []))
                    .catch(() => {
                        const localMatches = baseLocations
                            .filter((l) => l.name.toLowerCase().includes(searchQuery.toLowerCase()))
                            .slice(0, 4);
                        setSuggestions(localMatches);
                    });
            }, 250);
            return () => clearTimeout(timer);
        } else {
            setSuggestions([]);
        }
    }, [searchQuery, baseLocations]);

    // Filter locations when Category or Query changes locally
    useEffect(() => {
        let filtered = baseLocations;

        if (activeCategory !== 'all') {
            filtered = filtered.filter(
                (l) => l.category?.toLowerCase() === activeCategory.toLowerCase()
            );
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (l) =>
                    l.name.toLowerCase().includes(q) ||
                    (l.address && l.address.toLowerCase().includes(q)) ||
                    (l.subcategory && l.subcategory.toLowerCase().includes(q))
            );
        }

        setDisplayedLocations(filtered);
    }, [activeCategory, searchQuery, baseLocations]);

    // Search Form Submit Handler
    const handleSearchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setHasSearched(true);
        setIsSearching(true);

        // Record Search in History
        const newHistItem: SearchHistoryItem = {
            id: Date.now(),
            query: searchQuery.trim(),
            created_at: new Date().toISOString(),
        };
        const updatedHistory = [newHistItem, ...searchHistory.slice(0, 19)];
        setSearchHistory(updatedHistory);
        localStorage.setItem('nexora_search_history', JSON.stringify(updatedHistory));

        try {
            const res = await api.search(searchQuery, {
                category: activeCategory !== 'all' ? activeCategory : undefined,
                radius: radiusKm < 1000 ? radiusKm * 1000 : undefined,
            });

            if (res.results && res.results.length > 0) {
                setDisplayedLocations(res.results);
            }
        } catch {
            // Client side filter fallback
            const q = searchQuery.toLowerCase();
            const results = baseLocations.filter(
                (l) =>
                    l.name.toLowerCase().includes(q) ||
                    (l.address && l.address.toLowerCase().includes(q))
            );
            setDisplayedLocations(results.length > 0 ? results : baseLocations);
        } finally {
            setIsSearching(false);
        }
    };

    // Locate Near Me Coordinates Handler
    const handleNearMe = () => {
        if (navigator.geolocation) {
            setIsSearching(true);
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    api.nearby(lat, lng, 25, activeCategory !== 'all' ? activeCategory : undefined)
                        .then((res) => {
                            if (res.data && res.data.length > 0) {
                                setDisplayedLocations(res.data);
                            }
                        })
                        .catch(() => {
                            // Calculate local distances
                            const calculated = baseLocations.map((l) => ({
                                ...l,
                                distance_km: Math.round(Math.hypot(l.latitude - lat, l.longitude - lng) * 111),
                            })).sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));
                            setDisplayedLocations(calculated);
                        })
                        .finally(() => setIsSearching(false));
                },
                () => {
                    setIsSearching(false);
                }
            );
        }
    };

    // Toggle Save / Bookmark
    const handleToggleSave = (place: LocationItem) => {
        const exists = savedPlaces.some((p) => p.id === place.id);
        let updated: LocationItem[];
        if (exists) {
            updated = savedPlaces.filter((p) => p.id !== place.id);
            if (user) {
                api.removeFavorite(place.id).catch(() => {});
            }
        } else {
            updated = [place, ...savedPlaces];
            if (user) {
                api.addFavorite(place.id).catch(() => {});
            }
        }
        setSavedPlaces(updated);
        localStorage.setItem('nexora_saved_places', JSON.stringify(updated));
    };

    // Open Place Details
    const handleSelectPlace = (place: LocationItem) => {
        setSelectedPlace(place);
        setIsDetailOpen(true);
    };

    // Quick AI Summary
    const handleQuickAiSummary = (place: LocationItem) => {
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

    return (
        <div className="min-h-screen bg-[#FDFDFC] text-slate-900 dark:bg-[#07090e] dark:text-[#EDEDEC] transition-colors flex flex-col selection:bg-blue-500 selection:text-white">
            <Head title="Nexora Search — Unified Discovery & Multimodal REST Platform" />

            {/* Top Navigation */}
            <Navbar
                currentTab={currentTab}
                setCurrentTab={(tab) => {
                    setCurrentTab(tab);
                    if (tab === 'ai') setIsAiModalOpen(true);
                    if (tab === 'admin') setIsAdminModalOpen(true);
                }}
                darkMode={darkMode}
                setDarkMode={setDarkMode}
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
                }}
            />

            {/* Hero Search Section */}
            <HeroSearch
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
                    setSelectedPlace(item);
                    setIsDetailOpen(true);
                }}
                onSearchSubmit={handleSearchSubmit}
                isSearching={isSearching}
                totalResults={displayedLocations.length}
                onNearMe={handleNearMe}
            />

            {/* Main Content Explorer Area */}
            <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
                {!hasSearched ? (
                    <div className="py-12 text-center max-w-2xl mx-auto">
                        <div className="p-8 rounded-3xl bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-sm shadow-xl">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                Discover Global Destinations & Local Insights
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                                Enter a destination above to search live places, or click below to browse all available location results.
                            </p>
                            <button
                                onClick={() => setHasSearched(true)}
                                className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                            >
                                Explore All Places ({displayedLocations.length})
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Search Results {searchQuery ? `for "${searchQuery}"` : ''}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Found {displayedLocations.length} locations matching your search
                                </p>
                            </div>
                            <button
                                onClick={() => setHasSearched(false)}
                                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg border border-slate-200 dark:border-slate-800 transition"
                            >
                                ← Back to Search Landing
                            </button>
                        </div>

                        {viewMode === 'split' ? (
                            /* SPLIT VIEW: Map on Left / Cards on Right */
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[750px]">
                                <div className="lg:col-span-7 h-full">
                                    <InteractiveMap
                                        places={displayedLocations}
                                        selectedPlace={selectedPlace}
                                        onSelectPlace={handleSelectPlace}
                                    />
                                </div>
                                <div className="lg:col-span-5 h-full overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                                    {displayedLocations.map((place) => (
                                        <PlaceCard
                                            key={place.id}
                                            place={place}
                                            isSaved={savedPlaces.some((p) => p.id === place.id)}
                                            onToggleSave={handleToggleSave}
                                            onSelect={handleSelectPlace}
                                            onQuickAiSummary={handleQuickAiSummary}
                                            viewMode="list"
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : viewMode === 'list' ? (
                            /* COMPACT LIST VIEW */
                            <div className="space-y-3 max-w-4xl mx-auto">
                                {displayedLocations.map((place) => (
                                    <PlaceCard
                                        key={place.id}
                                        place={place}
                                        isSaved={savedPlaces.some((p) => p.id === place.id)}
                                        onToggleSave={handleToggleSave}
                                        onSelect={handleSelectPlace}
                                        onQuickAiSummary={handleQuickAiSummary}
                                        viewMode="list"
                                    />
                                ))}
                            </div>
                        ) : (
                            /* CARDS GRID VIEW */
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {displayedLocations.map((place) => (
                                    <PlaceCard
                                        key={place.id}
                                        place={place}
                                        isSaved={savedPlaces.some((p) => p.id === place.id)}
                                        onToggleSave={handleToggleSave}
                                        onSelect={handleSelectPlace}
                                        onQuickAiSummary={handleQuickAiSummary}
                                        viewMode="grid"
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Platform Feature Highlight Strip */}
            <section className="border-t border-slate-200/80 bg-slate-50/50 py-12 dark:border-slate-800/80 dark:bg-slate-900/30 mt-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex-shrink-0">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Heterogeneous Service Aggregation
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                    Normalizes Google Places, Mapbox Matrix, Open-Meteo, and GitHub endpoints into a unified RESTful contract.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 flex-shrink-0">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                    NVIDIA NIM + Puter.js AI
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                    Multimodal vision reasoning, automated executive place summaries, and semantic natural-language itinerary curation.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex-shrink-0">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Observability & Sanctum Security
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                    Complete audit telemetry recording latency, error rate tracking in MySQL/SQLite, and Sanctum bearer tokens.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-white py-8 dark:border-slate-800 dark:bg-[#07090e]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs">
                            N
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Nexora Search</span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">• Unified RESTful Architecture</span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <span>React 19</span>
                        <span>•</span>
                        <span>Laravel 13</span>
                        <span>•</span>
                        <span>NVIDIA NIM</span>
                        <span>•</span>
                        <span>Open-Meteo</span>
                        <span>•</span>
                        <span>Mapbox</span>
                    </div>
                </div>
            </footer>

            {/* Modals & Slide-Over Drawers */}
            <PlaceDetailModal
                place={selectedPlace}
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                isSaved={selectedPlace ? savedPlaces.some((p) => p.id === selectedPlace.id) : false}
                onToggleSave={handleToggleSave}
            />

            <NexAiWidget
                searchHistory={searchHistory}
                onSelectSuggestion={(q) => {
                    setSearchQuery(q);
                    setHasSearched(true);
                }}
            />

            <AdminTelemetryModal
                isOpen={isAdminModalOpen}
                onClose={() => {
                    setIsAdminModalOpen(false);
                    setCurrentTab('explore');
                }}
            />

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
                }}
                onClearHistory={() => {
                    setSearchHistory([]);
                    localStorage.removeItem('nexora_search_history');
                    api.clearHistory().catch(() => {});
                }}
            />

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                onAuthSuccess={(u) => setUser(u)}
            />
        </div>
    );
}
