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
    const [activeTab, setActiveTab] = useState<
        'overview' | 'weather' | 'hours' | 'reviews'
    >('overview');
    const [weather, setWeather] = useState<WeatherReport | null>(null);
    const [weatherNotice, setWeatherNotice] = useState<string | null>(null);
    const [isLoadingWeather, setIsLoadingWeather] = useState(false);
    const [copiedAddress, setCopiedAddress] = useState(false);

    useEffect(() => {
        if (!place) return;

        // Reset state
        setWeather(null);
        setWeatherNotice(null);
        setActiveTab('overview');

        // Fetch live weather for the place coordinates.
        setIsLoadingWeather(true);
        api.weatherForecast(place.latitude, place.longitude, 5)
            .then((data) => {
                if (data.status === 'degraded') {
                    setWeatherNotice(
                        data.message ??
                            'Live weather is temporarily unavailable.',
                    );
                    setWeather(null);
                    return;
                }

                setWeather(data);
            })
            .catch(() => {
                setWeather(null);
                setWeatherNotice('Live weather is temporarily unavailable.');
            })
            .finally(() => setIsLoadingWeather(false));
    }, [place]);

    if (!isOpen || !place) return null;

    const latitude = Number(place.latitude);
    const longitude = Number(place.longitude);
    const formattedCoordinates =
        Number.isFinite(latitude) && Number.isFinite(longitude)
            ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            : 'Coordinates unavailable';

    const handleCopyAddress = () => {
        if (place.address) {
            void navigator.clipboard.writeText(place.address);
            setCopiedAddress(true);
            setTimeout(() => setCopiedAddress(false), 2000);
        }
    };

    const photoUrl =
        place.photos && place.photos.length > 0 ? place.photos[0] : null;

    return (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-md duration-200 sm:p-6">
            <div className="relative my-auto w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/60 text-white backdrop-blur-md transition hover:bg-slate-900/90"
                >
                    <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>

                {/* Hero Photo Banner */}
                <div className="relative h-64 w-full overflow-hidden bg-slate-800 sm:h-72">
                    {photoUrl ? (
                        <img
                            src={photoUrl}
                            alt={place.name}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 text-lg font-bold tracking-[0.2em] text-slate-300 uppercase">
                            {place.category || 'Place'}
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

                    {/* Bottom Title Bar over Banner */}
                    <div className="absolute right-6 bottom-4 left-6 flex flex-col justify-between gap-3 text-white sm:flex-row sm:items-end">
                        <div>
                            <div className="mb-1 flex items-center gap-2">
                                <span className="rounded-full bg-blue-600 px-3 py-0.5 text-[11px] font-bold tracking-wider text-white uppercase">
                                    {place.category}
                                </span>
                                {place.rating !== null &&
                                place.rating !== undefined &&
                                place.rating !== '' ? (
                                    <span className="flex items-center gap-1 rounded-full bg-amber-500/90 px-2.5 py-0.5 text-xs font-bold text-slate-950">
                                        ★ {place.rating}
                                    </span>
                                ) : null}
                                {typeof place.review_count === 'number' &&
                                    place.review_count > 0 && (
                                        <span className="text-xs font-medium text-slate-300">
                                            (
                                            {place.review_count.toLocaleString()}{' '}
                                            reviews)
                                        </span>
                                    )}
                            </div>
                            <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                                {place.name}
                            </h2>
                            {place.subcategory && (
                                <p className="text-xs font-medium text-slate-300">
                                    {place.subcategory}
                                </p>
                            )}
                        </div>

                        {/* Save Toggle in Banner */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => onToggleSave(place)}
                                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold shadow-lg backdrop-blur-md transition active:scale-95 ${
                                    isSaved
                                        ? 'bg-rose-500 text-white'
                                        : 'bg-white/90 text-slate-900 hover:bg-white'
                                }`}
                            >
                                <svg
                                    className={`h-4 w-4 ${isSaved ? 'fill-white' : 'fill-none text-rose-500'}`}
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                    />
                                </svg>
                                <span>
                                    {isSaved
                                        ? 'Saved to Favorites'
                                        : 'Save Place'}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sub-Navigation Tabs */}
                <div className="flex border-b border-slate-200 bg-slate-50/50 px-6 dark:border-slate-800 dark:bg-slate-900/50">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`border-b-2 px-3 py-3 text-xs font-semibold transition ${
                            activeTab === 'overview'
                                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                        }`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('weather')}
                        className={`flex items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-semibold transition ${
                            activeTab === 'weather'
                                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                        }`}
                    >
                        <span>Live Weather</span>
                        <span className="py-0.2 rounded-full bg-blue-100 px-1.5 text-[9px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                            Forecast
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('hours')}
                        className={`border-b-2 px-3 py-3 text-xs font-semibold transition ${
                            activeTab === 'hours'
                                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                        }`}
                    >
                        Hours & Access
                    </button>
                    <button
                        onClick={() => setActiveTab('reviews')}
                        className={`border-b-2 px-3 py-3 text-xs font-semibold transition ${
                            activeTab === 'reviews'
                                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                        }`}
                    >
                        Reviews
                    </button>
                </div>

                {/* Tab Content Body */}
                <div className="max-h-[460px] overflow-y-auto p-6">
                    {/* TAB: OVERVIEW */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Address & Quick Info Strip */}
                            <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-4 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-800/60">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                                        <svg
                                            className="h-5 w-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                                            Location Address
                                        </p>
                                        <p className="text-xs text-slate-600 dark:text-slate-300">
                                            {place.address ||
                                                'Address unlisted'}
                                        </p>
                                        <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                                            Coordinates: {formattedCoordinates}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={handleCopyAddress}
                                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                >
                                    <svg
                                        className="h-3.5 w-3.5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                                        />
                                    </svg>
                                    <span>
                                        {copiedAddress ? 'Copied!' : 'Copy'}
                                    </span>
                                </button>
                            </div>
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
                                            <span className="text-xs font-semibold tracking-wider text-blue-100 uppercase">
                                                Live Meteorological Conditions
                                            </span>
                                            <h3 className="mt-1 text-4xl font-extrabold sm:text-5xl">
                                                {weather.temperature !==
                                                undefined
                                                    ? `${Math.round(weather.temperature!)}°C`
                                                    : 'Unavailable'}
                                            </h3>
                                            <p className="mt-1 text-sm font-medium text-blue-100">
                                                {weather.condition?.label ||
                                                    'Condition unavailable'}
                                            </p>
                                        </div>

                                        <div className="space-y-1 text-right text-xs text-blue-100">
                                            <p>
                                                Humidity:{' '}
                                                <strong>
                                                    {weather.humidity !==
                                                    undefined
                                                        ? `${weather.humidity}%`
                                                        : 'Unavailable'}
                                                </strong>
                                            </p>
                                            <p>
                                                Wind:{' '}
                                                <strong>
                                                    {weather.wind_speed !==
                                                    undefined
                                                        ? `${weather.wind_speed} km/h`
                                                        : 'Unavailable'}
                                                </strong>
                                            </p>
                                            <p>
                                                Source:{' '}
                                                <strong className="text-white">
                                                    Open-Meteo REST API
                                                </strong>
                                            </p>
                                        </div>
                                    </div>

                                    {/* 5-Day Forecast Grid */}
                                    {weather.forecasts &&
                                        weather.forecasts.length > 0 && (
                                            <div className="mt-6">
                                                <h4 className="mb-3 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                                    5-Day Weather Outlook
                                                </h4>
                                                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
                                                    {weather.forecasts.map(
                                                        (f, i) => (
                                                            <div
                                                                key={i}
                                                                className="flex flex-col items-center rounded-2xl border border-slate-200/80 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-800/60"
                                                            >
                                                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                                                    {f.date
                                                                        .length >
                                                                    5
                                                                        ? f.date.slice(
                                                                              5,
                                                                          )
                                                                        : f.date}
                                                                </span>
                                                                <span className="my-1 text-lg font-bold text-slate-900 dark:text-white">
                                                                    {f.max_temp !==
                                                                    null
                                                                        ? `${Math.round(f.max_temp)}°`
                                                                        : '22°'}
                                                                </span>
                                                                <span className="line-clamp-1 text-[10px] text-slate-400">
                                                                    {f.condition
                                                                        ?.label ||
                                                                        'Fair'}
                                                                </span>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500">
                                    {weatherNotice ??
                                        'Weather data unavailable for this coordinate.'}
                                </p>
                            )}
                        </div>
                    )}

                    {/* TAB: HOURS & ACCESS */}
                    {activeTab === 'hours' && (
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                                Operating Schedule
                            </h4>
                            {place.hours ? (
                                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-slate-50 dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-800/60">
                                    {Object.entries(place.hours).map(
                                        ([day, hours]) => (
                                            <div
                                                key={day}
                                                className="flex items-center justify-between px-4 py-2.5 text-xs"
                                            >
                                                <span className="font-semibold text-slate-800 capitalize dark:text-slate-200">
                                                    {day}
                                                </span>
                                                <span className="font-mono text-slate-600 dark:text-slate-400">
                                                    {hours}
                                                </span>
                                            </div>
                                        ),
                                    )}
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400">
                                    Hours are not available for this location.
                                </div>
                            )}

                            {/* Contact Links */}
                            <div className="flex flex-wrap gap-3 pt-2">
                                {place.phone && (
                                    <a
                                        href={`tel:${place.phone}`}
                                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                    >
                                        <svg
                                            className="h-4 w-4 text-blue-500"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                            />
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
                                        <svg
                                            className="h-4 w-4 text-indigo-500"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                            />
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
                                <h4 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                                    Community Verified Feedback
                                </h4>
                                {place.rating !== null &&
                                    place.rating !== undefined &&
                                    place.rating !== '' && (
                                        <span className="text-xs font-semibold text-amber-500">
                                            Average ★ {place.rating} / 5.0
                                        </span>
                                    )}
                            </div>

                            {place.reviews && place.reviews.length > 0 ? (
                                <div className="space-y-3">
                                    {place.reviews.map((rev, i) => (
                                        <div
                                            key={i}
                                            className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60"
                                        >
                                            <div className="mb-1.5 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                                                        {rev.author_name.charAt(
                                                            0,
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                                                            {rev.author_name}
                                                        </p>
                                                        {rev.relative_time_description && (
                                                            <p className="text-[10px] text-slate-400">
                                                                {
                                                                    rev.relative_time_description
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="text-xs font-bold text-amber-500">
                                                    {'★'.repeat(rev.rating)}
                                                </span>
                                            </div>
                                            <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                                                {rev.text}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500">
                                    No public reviews logged for this location
                                    yet.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
