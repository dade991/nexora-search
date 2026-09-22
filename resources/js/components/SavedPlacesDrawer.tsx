import React from 'react';
import { LocationItem } from '@/types';

interface SavedPlacesDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    savedPlaces: LocationItem[];
    onSelectPlace: (place: LocationItem) => void;
    onRemoveSaved: (place: LocationItem) => void;
}

export const SavedPlacesDrawer: React.FC<SavedPlacesDrawerProps> = ({
    isOpen,
    onClose,
    savedPlaces,
    onSelectPlace,
    onRemoveSaved,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <svg className="h-5 w-5 text-rose-500 fill-rose-500" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            Saved Places ({savedPlaces.length})
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* List Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                    {savedPlaces.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 mb-3">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">No saved places yet</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                                Click the heart icon on any venue card to bookmark it for fast reference.
                            </p>
                        </div>
                    ) : (
                        savedPlaces.map((place) => (
                            <div
                                key={place.id}
                                className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-3 hover:bg-white hover:border-blue-500/40 hover:shadow-md transition dark:border-slate-800 dark:bg-slate-800/60 dark:hover:bg-slate-800"
                            >
                                <div
                                    onClick={() => {
                                        onSelectPlace(place);
                                        onClose();
                                    }}
                                    className="flex items-center gap-3 truncate cursor-pointer flex-1"
                                >
                                    {place.photos && place.photos[0] && (
                                        <img
                                            src={place.photos[0]}
                                            alt={place.name}
                                            className="h-14 w-14 rounded-xl object-cover flex-shrink-0"
                                        />
                                    )}
                                    <div className="truncate">
                                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                            {place.name}
                                        </h4>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                            {place.address}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1 text-[10px]">
                                            <span className="font-semibold text-amber-500">★ {place.rating}</span>
                                            <span className="capitalize text-slate-400">• {place.category}</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => onRemoveSaved(place)}
                                    className="p-1.5 text-slate-400 hover:text-rose-500 transition"
                                    title="Remove"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
