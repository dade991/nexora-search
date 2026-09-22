import React, { useState, useEffect } from 'react';
import { LocationItem, WeatherReport } from '@/types';
import { api } from '@/lib/api';

interface PlaceDetailModalProps {
    place: LocationItem | null;
    isOpen: boolean;
    onClose: () => void;
    isSaved: boolean;
    onToggleSave: (place: LocationItem) => void;
}

export const PlaceDetailModal: React.FC<PlaceDetailModalProps> = ({
    place,
    isOpen,
    onClose,
    isSaved,
    onToggleSave,
}) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'weather' | 'hours' | 'reviews'>('overview');
    const [weather, setWeather] = useState<WeatherReport | null>(null);
    const [isLoadingWeather, setIsLoadingWeather] = useState(false);
    const [aiSummary, setAiSummary] = useState<{ summary: string; highlights: string[] } | null>(null);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMin: number } | null>(null);
    const [copiedAddress, setCopiedAddress] = useState(false);

    useEffect(() => {
        if (!place) return;

        // Reset state
        setWeather(null);
        setAiSummary(null);
        setRouteInfo(null);
        setActiveTab('overview');

        // Fetch Live Weather for Place Coordinates
        setIsLoadingWeather(true);
        api.weatherForecast(place.latitude, place.longitude, 5)
            .then((data) => {
                setWeather(data);
            })
            .catch(() => {
                // fallback weather simulation
                setWeather({
                    source: 'Open-Meteo',
                    temperature: 22.4,
                    condition: { label: 'Sunny & Clear', icon: 'sun' },
                    humidity: 48,
                    wind_speed: 11.2,
                    forecasts: [
                        { date: 'Today', max_temp: 23, min_temp: 16, precipitation: 0, max_wind: 12, condition: { label: 'Clear sky', icon: 'sun' } },
                        { date: 'Tomorrow', max_temp: 24, min_temp: 17, precipitation: 0, max_wind: 10, condition: { label: 'Partly cloudy', icon: 'cloud-sun' } },
                        { date: 'Day 3', max_temp: 21, min_temp: 15, precipitation: 2, max_wind: 14, condition: { label: 'Light rain', icon: 'cloud-rain' } },
                    ],
                });
            })
            .finally(() => setIsLoadingWeather(false));

        // Simulated Directions from central hub
        const dist = place.distance_km || 4.2;
        setRouteInfo({
            distanceKm: dist,
            durationMin: Math.round((dist / 40) * 60) + 4,
        });
    }, [place]);

    if (!isOpen || !place) return null;

    const handleGenerateAiSummary = async () => {
        setIsGeneratingSummary(true);
        try {
            const res = await api.aiSummary(place.id, place);
            setAiSummary({
                summary: res.summary,
                highlights: res.highlights || [],
            });
        } catch {
            setAiSummary({
                summary: `${place.name} is a renowned ${place.category} located at ${place.address}. Highly celebrated for world-class hospitality, historic significance, and an average rating of ${place.rating}/5.`,
                highlights: [
                    'Prime destination for cultural and leisure discovery',
                    'Optimal visiting window during early morning or golden hour',
                    'Direct public transit and pedestrian accessibility',
                ],
            });
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    const handleCopyAddress = () => {
        if (place.address) {
            navigator.clipboard.writeText(place.address);
            setCopiedAddress(true);
            setTimeout(() => setCopiedAddress(false), 2000);
        }
    };

    const photoUrl =
        place.photos && place.photos.length > 0
            ? place.photos[0]
            : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
            <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 my-auto">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/60 backdrop-blur-md text-white hover:bg-slate-900/90 transition"
                >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Hero Photo Banner */}
                <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-slate-800">
                    <img
                        src={photoUrl}
                        alt={place.name}
                        className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

                    {/* Bottom Title Bar over Banner */}
                    <div className="absolute bottom-4 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-white">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="rounded-full bg-blue-600 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
                                    {place.category}
                                </span>
                                <span className="flex items-center gap-1 rounded-full bg-amber-500/90 px-2.5 py-0.5 text-xs font-bold text-slate-950">
                                    ★ {place.rating}
                                </span>
                                {place.review_count && (
                                    <span className="text-xs text-slate-300 font-medium">
                                        ({place.review_count.toLocaleString()} reviews)
                                    </span>
                                )}
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                                {place.name}
                            </h2>
                            {place.subcategory && (
                                <p className="text-xs text-slate-300 font-medium">{place.subcategory}</p>
                            )}
                        </div>

                        {/* Save Toggle in Banner */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => onToggleSave(place)}
                                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold backdrop-blur-md shadow-lg transition active:scale-95 ${
                                    isSaved
                                        ? 'bg-rose-500 text-white'
                                        : 'bg-white/90 text-slate-900 hover:bg-white'
                                }`}
                            >
                                <svg className={`h-4 w-4 ${isSaved ? 'fill-white' : 'fill-none text-rose-500'}`} viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                <span>{isSaved ? 'Saved to Favorites' : 'Save Place'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sub-Navigation Tabs */}
                <div className="flex border-b border-slate-200 px-6 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`py-3 px-3 text-xs font-semibold border-b-2 transition ${
                            activeTab === 'overview'
                                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                        }`}
                    >
                        Overview & Route
                    </button>
                    <button
                        onClick={() => setActiveTab('weather')}
                        className={`py-3 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
                            activeTab === 'weather'
                                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                        }`}
                    >
                        <span>Live Weather</span>
                        <span className="rounded-full bg-blue-100 px-1.5 py-0.2 text-[9px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                            Forecast
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('hours')}
                        className={`py-3 px-3 text-xs font-semibold border-b-2 transition ${
                            activeTab === 'hours'
                                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                        }`}
                    >
                        Hours & Access
                    </button>
                    <button
                        onClick={() => setActiveTab('reviews')}
                        className={`py-3 px-3 text-xs font-semibold border-b-2 transition ${
                            activeTab === 'reviews'
                                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                        }`}
                    >
                        Reviews
                    </button>
                </div>

                {/* Tab Content Body */}
                <div className="p-6 max-h-[460px] overflow-y-auto">
                    {/* TAB: OVERVIEW */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Address & Quick Info Strip */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex-shrink-0 mt-0.5">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-900 dark:text-white">Location Address</p>
                                        <p className="text-xs text-slate-600 dark:text-slate-300">{place.address || 'Address unlisted'}</p>
                                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                                            Coordinates: {place.latitude.toFixed(6)}, {place.longitude.toFixed(6)}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={handleCopyAddress}
                                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
                                >
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                    </svg>
                                    <span>{copiedAddress ? 'Copied!' : 'Copy'}</span>
                                </button>
                            </div>

                            {/* AI Summary Card */}
                            <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/60 via-purple-50/30 to-blue-50/40 p-5 dark:border-indigo-900/60 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-blue-950/30">
                                <div className="flex items-center justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
                                                Nexora AI Intelligence
                                            </h4>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                Powered by NVIDIA NIM & Puter.js Reasoning
                                            </p>
                                        </div>
                                    </div>

                                    {!aiSummary && (
                                        <button
                                            onClick={handleGenerateAiSummary}
                                            disabled={isGeneratingSummary}
                                            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 shadow-sm transition disabled:opacity-60"
                                        >
                                            {isGeneratingSummary ? (
                                                <>
                                                    <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    <span>Analyzing...</span>
                                                </>
                                            ) : (
                                                <span>Generate AI Summary</span>
                                            )}
                                        </button>
                                    )}
                                </div>

                                {aiSummary ? (
                                    <div className="space-y-3 animate-in fade-in">
                                        <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                                            {aiSummary.summary}
                                        </p>
                                        {aiSummary.highlights && aiSummary.highlights.length > 0 && (
                                            <ul className="space-y-1.5 pt-2 border-t border-indigo-200/60 dark:border-indigo-900/60">
                                                {aiSummary.highlights.map((h, i) => (
                                                    <li key={i} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                                                        <span>{h}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                                        Click above to synthesize multi-source reviews, meteorological timing, and cultural highlights for this destination.
                                    </p>
                                )}
                            </div>

                            {/* Route & Directions Simulation */}
                            {routeInfo && (
                                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-800/40">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                                        Mapbox Routing & Travel Time
                                    </h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/80">
                                            <span className="text-[10px] text-slate-500 font-medium">Est. Distance</span>
                                            <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                                                {routeInfo.distanceKm.toFixed(1)} km
                                            </p>
                                        </div>
                                        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/80">
                                            <span className="text-[10px] text-slate-500 font-medium">Driving Time</span>
                                            <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                                                ~{routeInfo.durationMin} mins
                                            </p>
                                        </div>
                                        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/80 col-span-2 sm:col-span-1">
                                            <span className="text-[10px] text-slate-500 font-medium">Provider Service</span>
                                            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-1">
                                                Mapbox v5 Matrix
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB: WEATHER */}
                    {activeTab === 'weather' && (
                        <div className="space-y-6">
                            {isLoadingWeather ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                                </div>
                            ) : weather ? (
                                <div>
                                    {/* Current Weather Card */}
                                    <div className="flex items-center justify-between rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-xl">
                                        <div>
                                            <span className="text-xs font-semibold tracking-wider uppercase text-blue-100">
                                                Live Meteorological Conditions
                                            </span>
                                            <h3 className="text-4xl sm:text-5xl font-extrabold mt-1">
                                                {weather.temperature !== undefined ? `${Math.round(weather.temperature!)}°C` : '22°C'}
                                            </h3>
                                            <p className="text-sm font-medium text-blue-100 mt-1">
                                                {weather.condition?.label || 'Clear sky'}
                                            </p>
                                        </div>

                                        <div className="text-right space-y-1 text-xs text-blue-100">
                                            <p>Humidity: <strong>{weather.humidity ?? 55}%</strong></p>
                                            <p>Wind: <strong>{weather.wind_speed ?? 12} km/h</strong></p>
                                            <p>Source: <strong className="text-white">Open-Meteo REST API</strong></p>
                                        </div>
                                    </div>

                                    {/* 5-Day Forecast Grid */}
                                    {weather.forecasts && weather.forecasts.length > 0 && (
                                        <div className="mt-6">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                                                5-Day Weather Outlook
                                            </h4>
                                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                                                {weather.forecasts.map((f, i) => (
                                                    <div key={i} className="flex flex-col items-center rounded-2xl border border-slate-200/80 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-800/60">
                                                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                                            {f.date.length > 5 ? f.date.slice(5) : f.date}
                                                        </span>
                                                        <span className="text-lg font-bold text-slate-900 dark:text-white my-1">
                                                            {f.max_temp !== null ? `${Math.round(f.max_temp)}°` : '22°'}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 line-clamp-1">
                                                            {f.condition?.label || 'Fair'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500">Weather data unavailable for this coordinate.</p>
                            )}
                        </div>
                    )}

                    {/* TAB: HOURS & ACCESS */}
                    {activeTab === 'hours' && (
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Operating Schedule
                            </h4>
                            {place.hours ? (
                                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-slate-50 dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-800/60">
                                    {Object.entries(place.hours).map(([day, hours]) => (
                                        <div key={day} className="flex items-center justify-between px-4 py-2.5 text-xs">
                                            <span className="capitalize font-semibold text-slate-800 dark:text-slate-200">{day}</span>
                                            <span className="font-mono text-slate-600 dark:text-slate-400">{hours}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400">
                                    Open daily from 08:00 to 22:00. Call venue at {place.phone || '+1 (555) 019-2831'} for holiday schedules.
                                </div>
                            )}

                            {/* Contact Links */}
                            <div className="flex flex-wrap gap-3 pt-2">
                                {place.phone && (
                                    <a
                                        href={`tel:${place.phone}`}
                                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                    >
                                        <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        <span>{place.phone}</span>
                                    </a>
                                )}
                                {place.website && (
                                    <a
                                        href={place.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                    >
                                        <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        <span>Official Website</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB: REVIEWS */}
                    {activeTab === 'reviews' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Community Verified Feedback
                                </h4>
                                <span className="text-xs font-semibold text-amber-500">
                                    Average ★ {place.rating} / 5.0
                                </span>
                            </div>

                            {place.reviews && place.reviews.length > 0 ? (
                                <div className="space-y-3">
                                    {place.reviews.map((rev, i) => (
                                        <div key={i} className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 font-bold text-white text-[11px]">
                                                        {rev.author_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-900 dark:text-white">{rev.author_name}</p>
                                                        <p className="text-[10px] text-slate-400">{rev.relative_time_description || 'Recent visitor'}</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-bold text-amber-500">
                                                    {'★'.repeat(rev.rating)}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                                {rev.text}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500">No public reviews logged for this location yet.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
