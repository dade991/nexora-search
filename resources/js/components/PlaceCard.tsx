import React from 'react';
import { LocationItem } from '@/types';

interface PlaceCardProps {
    place: LocationItem;
    isSaved: boolean;
    onToggleSave: (place: LocationItem) => void;
    onSelect: (place: LocationItem) => void;
    onQuickAiSummary: (place: LocationItem) => void;
    viewMode?: 'grid' | 'split' | 'list';
}

export const PlaceCard: React.FC<PlaceCardProps> = ({
    place,
    isSaved,
    onToggleSave,
    onSelect,
    onQuickAiSummary,
    viewMode = 'grid',
}) => {
    const photoUrl =
        place.photos && place.photos.length > 0
            ? place.photos[0]
            : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80';

    const numericRating = typeof place.rating === 'number' ? place.rating : parseFloat(place.rating || '4.5');

    if (viewMode === 'list') {
        return (
            <div className="group relative flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm hover:shadow-md transition-all hover:border-blue-500/40 dark:border-slate-800/80 dark:bg-slate-900">
                <div
                    onClick={() => onSelect(place)}
                    className="flex items-center gap-4 flex-1 cursor-pointer truncate"
                >
                    <img
                        src={photoUrl}
                        alt={place.name}
                        className="h-16 w-20 rounded-xl object-cover flex-shrink-0 group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                    />
                    <div className="truncate">
                        <div className="flex items-center gap-2">
                            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:bg-blue-950/80 dark:text-blue-400">
                                {place.category}
                            </span>
                            <span className="flex items-center gap-1 text-xs font-semibold text-amber-500">
                                ★ {numericRating.toFixed(1)}
                            </span>
                            {place.distance_km && (
                                <span className="text-[11px] text-slate-400">
                                    • {place.distance_km.toFixed(1)} km away
                                </span>
                            )}
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                            {place.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {place.address || 'Address unavailable'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        onClick={() => onQuickAiSummary(place)}
                        title="AI Executive Summary"
                        className="flex items-center gap-1 rounded-lg border border-indigo-200/80 bg-indigo-50/50 px-2.5 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300 transition"
                    >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="hidden sm:inline">AI Insight</span>
                    </button>

                    <button
                        onClick={() => onToggleSave(place)}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                            isSaved
                                ? 'border-rose-300 bg-rose-50 text-rose-600 dark:border-rose-900/60 dark:bg-rose-950/60 dark:text-rose-400'
                                : 'border-slate-200 bg-white text-slate-400 hover:text-rose-500 dark:border-slate-800 dark:bg-slate-800'
                        }`}
                    >
                        <svg className={`h-4 w-4 ${isSaved ? 'fill-rose-500 text-rose-500' : 'fill-none'}`} viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 dark:border-slate-800/80 dark:bg-slate-900">
            {/* Visual Header */}
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer" onClick={() => onSelect(place)}>
                <img
                    src={photoUrl}
                    alt={place.name}
                    className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                />
                {/* Gradient Shadow Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent"></div>

                {/* Top Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="rounded-full bg-slate-900/70 backdrop-blur-md px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white border border-white/15">
                        {place.category}
                    </span>

                    {/* Bookmark Toggle */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleSave(place);
                        }}
                        className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-transform active:scale-90 ${
                            isSaved
                                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                                : 'bg-slate-900/60 text-white hover:bg-slate-900/90 border border-white/20'
                        }`}
                        title={isSaved ? 'Remove from Saved' : 'Save to Favorites'}
                    >
                        <svg className={`h-4 w-4 ${isSaved ? 'fill-white' : 'fill-none'}`} viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </button>
                </div>

                {/* Bottom Overlay Info */}
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                    <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 rounded-lg bg-amber-500/90 backdrop-blur-md px-2 py-0.5 text-xs font-bold text-slate-950 shadow-sm">
                            ★ {numericRating.toFixed(1)}
                        </span>
                        {place.review_count && (
                            <span className="text-[11px] font-medium text-slate-200">
                                ({place.review_count >= 1000 ? `${Math.round(place.review_count / 1000)}k` : place.review_count})
                            </span>
                        )}
                    </div>

                    {/* Open Status Indicator */}
                    <div className="flex items-center gap-1.5 rounded-full bg-slate-900/80 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Open Today
                    </div>
                </div>
            </div>

            {/* Content Body */}
            <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                <div>
                    <div className="flex items-start justify-between gap-2">
                        <h3
                            onClick={() => onSelect(place)}
                            className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition cursor-pointer line-clamp-1"
                        >
                            {place.name}
                        </h3>
                    </div>

                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {place.address || 'Global coordinates registered in Nexora database'}
                    </p>

                    {/* Distance / Subcategory Pills */}
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                        {place.subcategory && (
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                                {place.subcategory}
                            </span>
                        )}
                        {place.distance_km && (
                            <span className="rounded-md bg-blue-50 px-2 py-0.5 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-medium">
                                {place.distance_km.toFixed(1)} km away
                            </span>
                        )}
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 dark:bg-slate-800 text-slate-400 font-mono text-[10px]">
                            {isNaN(Number(place.latitude)) ? 'N/A' : Number(place.latitude).toFixed(2)}°, {isNaN(Number(place.longitude)) ? 'N/A' : Number(place.longitude).toFixed(2)}°
                        </span>
                    </div>
                </div>

                {/* Card Action Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                        onClick={() => onQuickAiSummary(place)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition"
                    >
                        <svg className="h-3.5 w-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>AI Summary</span>
                    </button>

                    <button
                        onClick={() => onSelect(place)}
                        className="flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 dark:bg-slate-800 dark:hover:bg-blue-600 transition"
                    >
                        <span>Explore</span>
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};
