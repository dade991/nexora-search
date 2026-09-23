import React from 'react';
import { LocationItem } from '@/types';

interface PlaceCardProps {
    place: LocationItem;
    isSaved: boolean;
    onToggleSave: (place: LocationItem) => void;
    onSelect: (place: LocationItem) => void;
    viewMode?: 'grid' | 'split' | 'list';
}

export const PlaceCard: React.FC<PlaceCardProps> = ({
    place,
    isSaved,
    onToggleSave,
    onSelect,
    viewMode = 'grid',
}) => {
    const photoUrl = place.photos && place.photos.length > 0 ? place.photos[0] : null;
    const numericRating = (() => {
        if (place.rating === null || place.rating === undefined || place.rating === '') {
            return null;
        }

        if (typeof place.rating === 'number') {
            return place.rating;
        }

        const parsed = Number.parseFloat(place.rating);
        return Number.isFinite(parsed) ? parsed : null;
    })();

    if (viewMode === 'list') {
        return (
            <div className="group relative flex items-center justify-between gap-4 rounded-2xl border border-[#10201e]/10 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#087f6b]/40 hover:shadow-lg dark:border-white/10 dark:bg-[#101a18]">
                <div
                    onClick={() => onSelect(place)}
                    className="flex items-center gap-4 flex-1 cursor-pointer truncate"
                >
                    {photoUrl ? (
                        <img
                            src={photoUrl}
                            alt={place.name}
                            className="h-16 w-20 rounded-xl object-cover flex-shrink-0 group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                        />
                    ) : (
                        <div className="flex h-16 w-20 items-center justify-center rounded-xl bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            {place.category || 'Place'}
                        </div>
                    )}
                    <div className="truncate">
                        <div className="flex items-center gap-2">
                            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:bg-blue-950/80 dark:text-blue-400">
                                {place.category}
                            </span>
                            {numericRating !== null ? (
                                <span className="flex items-center gap-1 text-xs font-semibold text-amber-500">
                                    ★ {numericRating.toFixed(1)}
                                </span>
                            ) : (
                                <span className="text-[11px] text-slate-400">No rating</span>
                            )}
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
                        onClick={() => onSelect(place)}
                        title="View details"
                        className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
                    >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 0c0 5-5 9-9 9s-9-4-9-9 5-9 9-9 9 4 9 9z" />
                        </svg>
                        <span className="hidden sm:inline">Details</span>
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
        <div className="group relative flex flex-col overflow-hidden rounded-[26px] border border-[#10201e]/10 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#087f6b]/40 hover:shadow-[0_18px_45px_rgba(16,32,30,0.1)] dark:border-white/10 dark:bg-[#101a18]">
            {/* Visual Header */}
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer" onClick={() => onSelect(place)}>
                {photoUrl ? (
                    <img
                        src={photoUrl}
                        alt={place.name}
                        className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 text-sm font-bold uppercase tracking-[0.2em] text-slate-500 dark:from-slate-700 dark:to-slate-800 dark:text-slate-300">
                        {place.category || 'Place'}
                    </div>
                )}
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
                        {numericRating !== null ? (
                            <span className="flex items-center gap-1 rounded-lg bg-amber-500/90 backdrop-blur-md px-2 py-0.5 text-xs font-bold text-slate-950 shadow-sm">
                                ★ {numericRating.toFixed(1)}
                            </span>
                        ) : (
                            <span className="rounded-lg bg-slate-800/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-200">
                                No rating
                            </span>
                        )}
                        {typeof place.review_count === 'number' && place.review_count > 0 && (
                            <span className="text-[11px] font-medium text-slate-200">
                                ({place.review_count >= 1000 ? `${Math.round(place.review_count / 1000)}k` : place.review_count})
                            </span>
                        )}
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
                        {place.address || 'Address unavailable'}
                    </p>

                    {/* Distance / Subcategory Pills */}
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                        {place.subcategory && (
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                                {place.subcategory}
                            </span>
                        )}
                        {place.distance_km && (
                            <span className="rounded-md bg-[#e7f6f2] px-2 py-0.5 font-medium text-[#087f6b] dark:bg-[#123b37] dark:text-[#7ee2ce]">
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
                        onClick={() => onSelect(place)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition"
                    >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 0c0 5-5 9-9 9s-9-4-9-9 5-9 9-9 9 4 9 9z" />
                        </svg>
                        <span>View</span>
                    </button>

                    <button
                        onClick={() => onSelect(place)}
                        className="flex items-center gap-1 rounded-xl bg-[#10201e] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#087f6b] dark:bg-[#e8c36a] dark:text-[#10201e] dark:hover:bg-[#f2d98f]"
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
